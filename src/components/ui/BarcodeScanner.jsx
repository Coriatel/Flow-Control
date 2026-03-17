import React, { useEffect, useRef, useState, useCallback, useId } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  Keyboard,
  ScanLine,
  QrCode,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SCAN_TYPES = {
  BARCODE: "barcode",
  QR: "qr",
  BOTH: "both",
};

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

const QR_FORMATS = [Html5QrcodeSupportedFormats.QR_CODE];

const ALL_FORMATS = [...BARCODE_FORMATS, ...QR_FORMATS];

const SCAN_DEBOUNCE_MS = 1500;

export default function BarcodeScanner({
  onScan,
  onError,
  allowManual = true,
  scanType = SCAN_TYPES.BOTH,
  placeholder = "הזן נתוני ברקוד ידנית...",
  className,
  disabled = false,
}) {
  const reactId = useId();
  const containerId = useRef(
    `barcode-scanner-${reactId.replace(/:/g, "")}`,
  ).current;
  const [cameraActive, setCameraActive] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [lastScan, setLastScan] = useState(null);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  // Create beep sound
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioRef.current = audioCtx;
    } catch (e) {
      // Audio not supported
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.close();
      }
    };
  }, []);

  const playBeep = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    try {
      const ctx = audioRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 1200;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Beep failed silently
    }
  }, [soundEnabled]);

  const handleScanSuccess = useCallback(
    (decodedText) => {
      // Debounce: ignore scans within cooldown period
      const now = Date.now();
      if (now - lastScanTimeRef.current < SCAN_DEBOUNCE_MS) return;
      lastScanTimeRef.current = now;

      setLastScan(decodedText);
      setError(null);
      setScanning(true);
      playBeep();

      // Visual flash effect
      if (containerRef.current) {
        containerRef.current.classList.add("ring-2", "ring-green-500");
        setTimeout(() => {
          containerRef.current?.classList.remove("ring-2", "ring-green-500");
          setScanning(false);
        }, 1000);
      }

      if (onScan) onScan(decodedText);
    },
    [onScan, playBeep],
  );

  const handleScanError = useCallback((errorMessage) => {
    // Only report actual errors, not "no code found" messages
    if (errorMessage?.includes?.("No MultiFormat Readers")) return;
    if (errorMessage?.includes?.("NotFoundException")) return;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          /* ignore */
        }
      }

      const formatsToSupport =
        scanType === SCAN_TYPES.QR
          ? QR_FORMATS
          : scanType === SCAN_TYPES.BARCODE
            ? BARCODE_FORMATS
            : ALL_FORMATS;

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport,
        useBarCodeDetectorIfSupported: true,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          if (scanType === SCAN_TYPES.QR) {
            const size = Math.floor(minDim * 0.7);
            return { width: size, height: size };
          }
          return {
            width: Math.floor(viewfinderWidth * 0.8),
            height: Math.floor(viewfinderHeight * 0.4),
          };
        },
        aspectRatio: 1.5,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        handleScanError,
      );

      setCameraActive(true);
      setManualMode(false);
    } catch (err) {
      setError("לא ניתן לגשת למצלמה. אנא אשר הרשאת מצלמה בדפדפן");
      if (onError) onError(err);
    }
  }, [containerId, handleScanSuccess, handleScanError, onError, scanType]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanSuccess(manualInput.trim());
    setManualInput("");
  };

  const toggleManual = () => {
    if (cameraActive) stopCamera();
    setManualMode(!manualMode);
    setError(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-lg border bg-card transition-all duration-300",
        scanning && "ring-2 ring-green-500",
        className,
      )}
    >
      {/* Header controls */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {scanType === SCAN_TYPES.QR ? (
            <QrCode className="h-5 w-5 text-purple-600" />
          ) : (
            <ScanLine className="h-5 w-5 text-blue-600" />
          )}
          <span className="font-medium text-sm">
            {scanType === SCAN_TYPES.QR
              ? "סורק QR"
              : scanType === SCAN_TYPES.BARCODE
                ? "סורק ברקוד"
                : "סורק ברקוד / QR"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8 p-0"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          {allowManual && (
            <Button
              variant={manualMode ? "default" : "ghost"}
              size="sm"
              onClick={toggleManual}
              className="h-8 gap-1"
              disabled={disabled}
            >
              <Keyboard className="h-4 w-4" />
              <span className="text-xs">ידני</span>
            </Button>
          )}
          <Button
            variant={cameraActive ? "destructive" : "default"}
            size="sm"
            onClick={cameraActive ? stopCamera : startCamera}
            className="h-8 gap-1"
            disabled={disabled}
          >
            {cameraActive ? (
              <CameraOff className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <span className="text-xs">{cameraActive ? "כבה" : "סרוק"}</span>
          </Button>
        </div>
      </div>

      {/* Camera container - always rendered to avoid DOM race, hidden when inactive */}
      <div
        id={containerId}
        className="w-full min-h-[200px]"
        style={{ display: cameraActive && !manualMode ? "block" : "none" }}
      />

      {/* Manual input / camera active area */}
      <div className={cn("relative", !cameraActive && !manualMode && "hidden")}>
        {/* Manual input mode */}
        {manualMode && (
          <form onSubmit={handleManualSubmit} className="p-4">
            <div className="flex gap-2">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={placeholder}
                className="flex-1 text-right"
                dir="ltr"
                autoFocus
                disabled={disabled}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!manualInput.trim() || disabled}
              >
                שלח
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Last scan result */}
      {lastScan && (
        <div className="px-3 py-2 bg-green-50 border-t text-xs text-green-800 flex items-center justify-between">
          <span className="truncate font-mono" dir="ltr">
            {lastScan}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 mr-2"
            onClick={() => setLastScan(null)}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border-t text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Idle state */}
      {!cameraActive && !manualMode && !error && (
        <div className="p-6 text-center text-muted-foreground text-sm">
          <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>לחץ "סרוק" לפתיחת המצלמה או "ידני" להזנת ברקוד</p>
        </div>
      )}
    </div>
  );
}

BarcodeScanner.SCAN_TYPES = SCAN_TYPES;
