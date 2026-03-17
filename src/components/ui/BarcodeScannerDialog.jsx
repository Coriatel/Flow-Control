import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layers } from "lucide-react";
import BarcodeScanner from "@/components/ui/BarcodeScanner";

export default function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
  title = "סרוק ברקוד",
  scanType = "both",
  scanBothFields = false,
}) {
  const handleScan = (rawData) => {
    if (onScan) onScan(rawData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
          </DialogTitle>
        </DialogHeader>
        {scanBothFields && (
          <Alert className="bg-green-50 border-green-200">
            <Layers className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs">
              סריקה אחת תמלא את מס' האצווה ותאריך התפוגה יחד
            </AlertDescription>
          </Alert>
        )}
        {open && <BarcodeScanner onScan={handleScan} scanType={scanType} />}
      </DialogContent>
    </Dialog>
  );
}
