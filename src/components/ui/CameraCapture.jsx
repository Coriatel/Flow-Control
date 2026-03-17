import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, RotateCcw, Check, X } from "lucide-react";

export default function CameraCapture({
  open,
  onCapture,
  onClose,
  facingMode: initialFacingMode = "environment",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState(initialFacingMode);
  const [captured, setCaptured] = useState(null); // data URL
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setError(null);
    setCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      setError("לא ניתן לגשת למצלמה. אנא אשר הרשאת מצלמה בדפדפן.");
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopStream();
      setCaptured(null);
      setError(null);
    }
    return stopStream;
  }, [open, startCamera, stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);
    stopStream();
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    setCaptured(null);
    startCamera();
  }, [startCamera]);

  const handleConfirm = useCallback(() => {
    if (!captured) return;
    // Convert data URL to File
    const arr = captured.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    const file = new File([u8arr], `capture_${Date.now()}.jpg`, { type: mime });
    onCapture(file);
    onClose();
  }, [captured, onCapture, onClose]);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) =>
      prev === "environment" ? "user" : "environment",
    );
  }, []);

  // Restart camera when facingMode changes while open
  useEffect(() => {
    if (open && !captured) {
      startCamera();
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            צלם תמונה
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black aspect-[4/3] w-full">
          {/* Live video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${captured ? "hidden" : ""}`}
          />

          {/* Captured image preview */}
          {captured && (
            <img
              src={captured}
              alt="captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm p-4 text-center">
              {error}
            </div>
          )}

          {/* Camera flip button (only when streaming) */}
          {!captured && !error && cameraReady && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
              onClick={flipCamera}
              title="החלף מצלמה"
            >
              <SwitchCamera className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex justify-center gap-3">
          {!captured && !error && (
            <Button
              onClick={handleCapture}
              disabled={!cameraReady}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Camera className="h-5 w-5" />
              צלם
            </Button>
          )}

          {captured && (
            <>
              <Button
                onClick={handleRetake}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <RotateCcw className="h-4 w-4" />
                צלם שוב
              </Button>
              <Button
                onClick={handleConfirm}
                className="gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Check className="h-4 w-4" />
                אשר
              </Button>
            </>
          )}

          {error && (
            <Button onClick={onClose} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              סגור
            </Button>
          )}
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
