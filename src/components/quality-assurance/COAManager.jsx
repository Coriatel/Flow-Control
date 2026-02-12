import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Eye, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { ReagentBatch, User } from '@/api/entities';

export default function COAManager({
  batch,
  batchId,
  batchNumber,
  reagentName,
  currentCOA,
  uploadDate,
  uploadedBy,
  onCOAUpdate,
  onUploadSuccess
}) {
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const effectiveBatchId = batch?.id || batchId;
  const effectiveBatchNumber = batch?.batch_number || batchNumber;
  const effectiveReagentName = batch?.reagent_name || reagentName;
  const coaUrl = batch?.coa_document_url || currentCOA || null;
  const hasCOA = Boolean(coaUrl);
  const notifyUploadSuccess = onUploadSuccess || onCOAUpdate;

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "סוג קובץ לא נתמך",
          description: "יש להעלות קובץ PDF או תמונה (JPG/PNG)",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "קובץ גדול מדי",
          description: "גודל הקובץ לא יכול לעלות על 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!effectiveBatchId) {
      toast({
        title: "לא ניתן להעלות COA",
        description: "מזהה האצווה חסר. יש לרענן את הדף ולנסות שוב.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "לא נבחר קובץ",
        description: "יש לבחור קובץ להעלאה",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadResult = await UploadFile({ file: selectedFile });
      const fileUrl = uploadResult?.file_url || uploadResult?.data?.path;

      if (!fileUrl) {
        throw new Error('לא התקבל קישור לקובץ שהועלה');
      }

      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch (userError) {
        console.warn('Could not resolve current user for COA upload:', userError);
      }

      await ReagentBatch.update(effectiveBatchId, {
        coa_document_url: fileUrl,
        coa_upload_date: new Date().toISOString(),
        coa_uploaded_by: currentUser?.email || uploadedBy || 'system'
      });

      toast({
        title: "COA הועלה בהצלחה",
        description: "תעודת האנליזה נשמרה במערכת",
      });

      if (notifyUploadSuccess) {
        notifyUploadSuccess();
      }

      setShowUploadDialog(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('COA upload error:', error);
      toast({
        title: "שגיאה בהעלאת COA",
        description: error.message || "אירעה שגיאה בהעלאת התעודה",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = () => {
    if (coaUrl) {
      window.open(coaUrl, '_blank');
    } else {
      toast({
        title: "COA לא זמין",
        description: "לא נמצאה תעודת אנליזה עבור אצווה זו",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* COA Status Display */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowUploadDialog(true)}
          title="העלה/עדכן COA"
        >
          <Upload className="h-4 w-4 text-blue-500" />
        </Button>
        {hasCOA && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleView}
            title="צפה ב-COA"
          >
            <Eye className="h-4 w-4 text-green-600" />
          </Button>
        )}
        
        {/* Status Indicator */}
        <div className="ms-1">
          {hasCOA ? (
            <CheckCircle className="h-3 w-3 text-green-500" title="COA קיים" />
          ) : (
            <AlertTriangle className="h-3 w-3 text-amber-500" title="COA חסר" />
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              העלאת תעודת אנליזה (COA)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              העלה קובץ תעודת אנליזה עבור האצווה הנבחרת.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-slate-700">פרטי אצווה:</div>
              <div className="text-xs text-slate-600 mt-1">
                <div>ריאגנט: {effectiveReagentName || 'לא ידוע'}</div>
                <div>אצווה: {effectiveBatchNumber || 'לא ידוע'}</div>
              </div>
            </div>

            {hasCOA && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-sm text-green-800 font-medium">COA קיים</div>
                <div className="text-xs text-green-700 mt-1">
                  העלאת קובץ חדש תחליף את התעודה הקיימת
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="coa-file">בחר קובץ COA</Label>
              <Input
                id="coa-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                סוגי קבצים נתמכים: PDF, JPG, PNG (עד 10MB)
              </div>
            </div>

            {selectedFile && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-800 font-medium">קובץ נבחר:</div>
                <div className="text-xs text-blue-700">{selectedFile.name}</div>
                <div className="text-xs text-blue-600">
                  גודל: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={isUploading}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex-1"
              >
                {isUploading ? 'מעלה...' : 'העלה COA'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
