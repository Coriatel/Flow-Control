import React, { useState } from "react";
import { ScanLine, Keyboard, QrCode, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DateField from "@/components/ui/DateField";
import { cn } from "@/lib/utils";

export default function ScanOrTypeField({
  value,
  onChange,
  onScanRequest,
  onScanBothRequest,
  type = "text",
  label,
  placeholder,
  className,
  error,
}) {
  const [mode, setMode] = useState("scan");

  if (mode === "scan") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 p-2 border rounded-md bg-blue-50/50 border-blue-200",
          error && "border-2 border-red-500 bg-red-50/30",
          className,
        )}
      >
        {/* Barcode scan button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1 bg-white hover:bg-blue-50 border-blue-300 text-blue-700 text-xs px-2"
          onClick={() => onScanRequest("barcode")}
          title="סרוק ברקוד"
        >
          <ScanLine className="h-3.5 w-3.5" />
          {value ? value : "ברקוד"}
        </Button>

        {/* QR scan button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 bg-white hover:bg-purple-50 border-purple-300 text-purple-700 text-xs px-2 shrink-0"
          onClick={() => onScanRequest("qr")}
          title="סרוק QR"
        >
          <QrCode className="h-3.5 w-3.5" />
          QR
        </Button>

        {/* Scan both fields button (only when callback provided) */}
        {onScanBothRequest && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 bg-white hover:bg-green-50 border-green-300 text-green-700 text-xs px-2 shrink-0"
            onClick={onScanBothRequest}
            title="סרוק אצווה + תפוגה"
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Manual input toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-700"
          onClick={() => setMode("type")}
          title="הקלד ידנית"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1">
        {type === "date" ? (
          <DateField
            value={value || ""}
            onChange={onChange}
            className={error ? "border-2 border-red-500" : ""}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "text-right placeholder:text-right",
              error && "border-2 border-red-500",
            )}
          />
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-blue-500 hover:text-blue-700"
        onClick={() => setMode("scan")}
        title="סרוק ברקוד"
      >
        <ScanLine className="h-4 w-4" />
      </Button>
    </div>
  );
}
