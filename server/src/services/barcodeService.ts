import prisma from "../utils/prisma";

// GS1 Application Identifiers
const GS1_AIS: Record<
  string,
  { name: string; length?: number; variable?: boolean }
> = {
  "01": { name: "gtin", length: 14 },
  "10": { name: "lotNumber", variable: true },
  "17": { name: "expiryDate", length: 6 },
  "21": { name: "serialNumber", variable: true },
  "30": { name: "quantity", variable: true },
  "37": { name: "quantity", variable: true },
};

const GS_CHAR = String.fromCharCode(29); // Group Separator

export interface ParsedBarcodeData {
  lotNumber?: string;
  expiryDate?: Date;
  catalogNumber?: string;
  quantity?: number;
  serialNumber?: string;
  gtin?: string;
  formatId?: string;
  formatName?: string;
  raw: string;
}

export const barcodeService = {
  /**
   * Parse raw barcode/QR scan data
   * If formatId provided, use that specific format
   * Otherwise try GS1 built-in, then custom formats
   */
  async parseBarcodeData(
    rawData: string,
    formatId?: string,
  ): Promise<ParsedBarcodeData> {
    const trimmed = rawData.trim();

    // If specific format requested, use it
    if (formatId) {
      const format = await prisma.barcodeFormat.findUnique({
        where: { id: formatId },
      });
      if (!format) throw new Error("פורמט ברקוד לא נמצא");
      return this.parseWithFormat(trimmed, format);
    }

    // Try GS1 parsing first (most common in medical/lab supplies)
    const gs1Result = this.parseGS1(trimmed);
    if (gs1Result.lotNumber || gs1Result.gtin) {
      return gs1Result;
    }

    // Try custom formats from DB
    const customResult = await this.findMatchingFormat(trimmed);
    if (customResult) return customResult;

    // No match - return raw data
    return { raw: trimmed };
  },

  /**
   * Parse GS1-128 / GS1 DataMatrix barcode data
   * Supports both parenthesized format (01)GTIN(10)LOT and FNC1/GS separator format
   */
  parseGS1(rawData: string): ParsedBarcodeData {
    const result: ParsedBarcodeData = { raw: rawData, formatName: "GS1" };
    const isParenthesized = /\(\d{2}\)/.test(rawData);

    if (isParenthesized) {
      // Parenthesized format: (01)12345678901234(10)LOT123(17)260301
      const aiRegex = /\((\d{2})\)([^(]*)/g;
      let match;
      while ((match = aiRegex.exec(rawData)) !== null) {
        const ai = match[1];
        const value = match[2];
        this.applyAIValue(result, ai, value);
      }
    } else {
      // FNC1/GS separator format: 011234567890123410LOT123<GS>1726030121SER456
      let pos = 0;
      while (pos < rawData.length) {
        // Try to match a 2-digit AI
        if (pos + 2 > rawData.length) break;
        const ai = rawData.substring(pos, pos + 2);
        const aiDef = GS1_AIS[ai];

        if (!aiDef) {
          // Unknown AI, can't parse further
          break;
        }

        pos += 2; // skip AI

        if (aiDef.variable) {
          // Variable length - read until GS separator or end of string.
          // Do NOT greedily scan for AI-like digit patterns within the value,
          // as lot numbers can contain sequences like "10", "17", "21".
          // The GS1 standard uses Group Separator (GS, ASCII 29) to delimit
          // variable-length fields. Only the last variable-length field can
          // omit the GS separator.
          const gsPos = rawData.indexOf(GS_CHAR, pos);
          let endPos: number;

          if (gsPos !== -1) {
            // GS separator found - use it as the delimiter
            endPos = gsPos;
          } else {
            // No GS separator - this is the last field, consume rest of string.
            // However, check if there's a fixed-length AI that could follow.
            // Only recognize AIs at positions after the minimum variable field length (1 char).
            endPos = rawData.length;
            // For safety, look for a known fixed-length AI only after at least 1 char of value
            for (let i = pos + 1; i <= rawData.length - 2; i++) {
              const potentialAI = rawData.substring(i, i + 2);
              const potentialDef = GS1_AIS[potentialAI];
              // Only split on fixed-length AIs (like '01' with 14 digits, '17' with 6 digits)
              // Variable-length AIs without GS separator cannot be reliably detected
              if (potentialDef && !potentialDef.variable) {
                // Verify this looks like a real AI by checking if enough data follows
                const remainingAfterAI = rawData.length - i - 2;
                if (
                  potentialDef.length &&
                  remainingAfterAI >= potentialDef.length
                ) {
                  endPos = i;
                  break;
                }
              }
            }
          }

          const value = rawData.substring(pos, endPos);
          this.applyAIValue(result, ai, value);
          pos = endPos + (gsPos === endPos ? 1 : 0); // skip GS if present
        } else {
          // Fixed length
          const value = rawData.substring(pos, pos + aiDef.length!);
          this.applyAIValue(result, ai, value);
          pos += aiDef.length!;
        }
      }
    }

    return result;
  },

  /**
   * Apply a parsed AI value to the result
   */
  applyAIValue(result: ParsedBarcodeData, ai: string, value: string) {
    switch (ai) {
      case "01":
        result.gtin = value;
        result.catalogNumber = value;
        break;
      case "10":
        result.lotNumber = value;
        break;
      case "17":
        result.expiryDate = this.parseDateYYMMDD(value);
        break;
      case "21":
        result.serialNumber = value;
        break;
      case "30":
      case "37":
        result.quantity = parseInt(value, 10);
        break;
    }
  },

  /**
   * Parse date in YYMMDD format
   */
  parseDateYYMMDD(dateStr: string): Date | undefined {
    if (dateStr.length !== 6) return undefined;
    const year = 2000 + parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10) - 1;
    const day = parseInt(dateStr.substring(4, 6), 10) || 1; // day=00 means end of month in GS1
    return new Date(year, month, day);
  },

  /**
   * Parse date according to a custom format string
   */
  parseDate(dateStr: string, format: string): Date | undefined {
    switch (format) {
      case "YYMMDD":
        return this.parseDateYYMMDD(dateStr);
      case "DDMMYY": {
        if (dateStr.length !== 6) return undefined;
        const day = parseInt(dateStr.substring(0, 2), 10);
        const month = parseInt(dateStr.substring(2, 4), 10) - 1;
        const year = 2000 + parseInt(dateStr.substring(4, 6), 10);
        return new Date(year, month, day);
      }
      case "YYYYMMDD": {
        if (dateStr.length !== 8) return undefined;
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1;
        const day = parseInt(dateStr.substring(6, 8), 10);
        return new Date(year, month, day);
      }
      default:
        return this.parseDateYYMMDD(dateStr);
    }
  },

  /**
   * Parse barcode using a specific BarcodeFormat from DB
   */
  parseWithFormat(rawData: string, format: any): ParsedBarcodeData {
    const result: ParsedBarcodeData = {
      raw: rawData,
      formatId: format.id,
      formatName: format.name,
    };

    try {
      const regex = new RegExp(format.parsePattern);
      const match = rawData.match(regex);
      if (!match) return result;

      const mapping = JSON.parse(format.fieldMapping) as Record<string, number>;

      if (mapping.lotNumber && match[mapping.lotNumber]) {
        result.lotNumber = match[mapping.lotNumber];
      }
      if (mapping.expiryDate && match[mapping.expiryDate]) {
        result.expiryDate = this.parseDate(
          match[mapping.expiryDate],
          format.dateFormat,
        );
      }
      if (mapping.catalogNumber && match[mapping.catalogNumber]) {
        result.catalogNumber = match[mapping.catalogNumber];
      }
      if (mapping.quantity && match[mapping.quantity]) {
        result.quantity = parseFloat(match[mapping.quantity]);
      }
    } catch {
      // Pattern failed - return raw
    }

    return result;
  },

  /**
   * Try all active custom formats against raw data and return first match
   */
  async findMatchingFormat(rawData: string): Promise<ParsedBarcodeData | null> {
    const formats = await prisma.barcodeFormat.findMany({
      where: { isActive: true },
    });

    for (const format of formats) {
      const result = this.parseWithFormat(rawData, format);
      if (result.lotNumber || result.catalogNumber) {
        return result;
      }
    }

    return null;
  },

  /**
   * Test a pattern against sample data (for admin configuration)
   */
  testPattern(
    pattern: string,
    fieldMapping: string,
    dateFormat: string,
    sampleData: string,
  ): ParsedBarcodeData {
    const mockFormat = {
      id: "test",
      name: "Test",
      parsePattern: pattern,
      fieldMapping,
      dateFormat,
    };
    return this.parseWithFormat(sampleData, mockFormat);
  },
};
