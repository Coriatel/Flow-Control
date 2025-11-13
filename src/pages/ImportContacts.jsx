import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowLeft,
  Loader2,
  Users,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";
import { uploadContactsFile } from '@/api/functions';

export default function ImportContactsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [step, setStep] = useState('upload'); // upload, validate, import, complete

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "פורמט קובץ לא נתמך",
          description: "אנא בחר קובץ CSV בלבד",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setValidationResults(null);
      setImportResults(null);
      setStep('upload');
    }
  };

  const handleValidation = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'validate');

      const response = await uploadContactsFile(formData);
      
      if (response.data && response.data.success) {
        setValidationResults(response.data.results);
        setStep('validate');
      } else {
        throw new Error(response.data?.error || 'שגיאה בולידציה');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "שגיאה בולידציה",
        description: error.message || "אירעה שגיאה בבדיקת הקובץ",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'import');

      const response = await uploadContactsFile(formData);
      
      if (response.data && response.data.success) {
        setImportResults(response.data.results);
        setStep('complete');
        
        toast({
          title: "ייבוא הושלם בהצלחה",
          description: `נוספו ${response.data.results.imported} אנשי קשר חדשים`,
          variant: "default"
        });
      } else {
        throw new Error(response.data?.error || 'שגיאה בייבוא');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "שגיאה בייבוא",
        description: error.message || "אירעה שגיאה בייבוא הקובץ",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetProcess = () => {
    setFile(null);
    setValidationResults(null);
    setImportResults(null);
    setStep('upload');
  };

  const downloadTemplate = () => {
    const csvContent = `שם איש קשר,שם הספק,תפקיד,מספר טלפון,כתובת מייל,קטגוריה
יוני,איילקס,מכירות,054-8156962,,ספק חיצוני
יעל שרף,אלדן,הזמנות,052-2538900,YaelS@eldan.biz,ספק חיצוני
מלי עומר,ביוראד,מנהלת מכירות,03-9636000,mali_omer@bio-rad.com,ספק חיצוני`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'תבנית_אנשי_קשר.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(createPageUrl('Contacts'))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">קליטת אנשי קשר מקובץ</h1>
            <p className="text-gray-600">ייבוא רשימת אנשי קשר מקובץ CSV</p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          הורד תבנית
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { key: 'upload', label: 'העלאת קובץ', icon: Upload },
            { key: 'validate', label: 'בדיקה', icon: Eye },
            { key: 'import', label: 'ייבוא', icon: Users },
            { key: 'complete', label: 'הושלם', icon: CheckCircle }
          ].map((stepItem, index) => {
            const isActive = step === stepItem.key;
            const isCompleted = ['upload', 'validate', 'import', 'complete'].indexOf(step) > index;
            const Icon = stepItem.icon;
            
            return (
              <div key={stepItem.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive ? 'border-blue-600 bg-blue-600 text-white' :
                  isCompleted ? 'border-green-600 bg-green-600 text-white' :
                  'border-gray-300 bg-gray-100 text-gray-400'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`mr-2 text-sm ${
                  isActive ? 'text-blue-600 font-medium' :
                  isCompleted ? 'text-green-600' :
                  'text-gray-400'
                }`}>
                  {stepItem.label}
                </span>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              העלאת קובץ CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                קובץ ה-CSV צריך לכלול את העמודות הבאות: שם איש קשר, שם הספק, תפקיד, מספר טלפון, כתובת מייל, קטגוריה
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="file">בחר קובץ CSV</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>

            {file && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetProcess}>
                איפוס
              </Button>
              <Button 
                onClick={handleValidation} 
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    בודק...
                  </>
                ) : (
                  'המשך לבדיקה'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Validation Results */}
      {step === 'validate' && validationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              תוצאות בדיקה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {validationResults.valid?.length || 0}
                </div>
                <div className="text-sm text-gray-600">אנשי קשר תקינים</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {validationResults.invalid?.length || 0}
                </div>
                <div className="text-sm text-gray-600">שורות עם שגיאות</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Users className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {validationResults.duplicates?.length || 0}
                </div>
                <div className="text-sm text-gray-600">כפילויות</div>
              </div>
            </div>

            {validationResults.invalid && validationResults.invalid.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-600 mb-2">שגיאות שנמצאו:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {validationResults.invalid.slice(0, 10).map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded text-sm">
                      <span className="font-medium">שורה {error.row}:</span> {error.errors.join(', ')}
                    </div>
                  ))}
                  {validationResults.invalid.length > 10 && (
                    <p className="text-sm text-gray-600 text-center">
                      ועוד {validationResults.invalid.length - 10} שגיאות...
                    </p>
                  )}
                </div>
              </div>
            )}

            {validationResults.duplicates && validationResults.duplicates.length > 0 && (
              <div>
                <h3 className="font-semibold text-yellow-600 mb-2">כפילויות שנמצאו:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {validationResults.duplicates.slice(0, 5).map((dup, index) => (
                    <div key={index} className="p-2 bg-yellow-50 rounded text-sm">
                      {dup.name} - {dup.supplier} (יעודכן במידת הצורך)
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('upload')}>
                חזור
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={uploading || (validationResults.valid?.length || 0) === 0}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    מייבא...
                  </>
                ) : (
                  `ייבא ${validationResults.valid?.length || 0} אנשי קשר`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Import Complete */}
      {step === 'complete' && importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              ייבוא הושלם בהצלחה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">
                הייבוא הושלם בהצלחה!
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>נוספו {importResults.imported} אנשי קשר חדשים</p>
                <p>עודכנו {importResults.updated} אנשי קשר קיימים</p>
                {importResults.skipped > 0 && (
                  <p>דולגו על {importResults.skipped} רשומות</p>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={resetProcess}>
                ייבא קובץ נוסף
              </Button>
              <Button onClick={() => navigate(createPageUrl('Contacts'))}>
                <Users className="h-4 w-4 mr-2" />
                עבור לרשימת אנשי קשר
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>הוראות פורמט הקובץ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">עמודות נדרשות בקובץ CSV:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><strong>שם איש קשר:</strong> שם מלא (חובה)</li>
              <li><strong>שם הספק:</strong> שם הספק או החברה (חובה)</li>
              <li><strong>תפקיד:</strong> תפקיד איש הקשר (אופציונלי)</li>
              <li><strong>מספר טלפון:</strong> טלפון או נייד (אופציונלי)</li>
              <li><strong>כתובת מייל:</strong> כתובת אימייל (אופציונלי)</li>
              <li><strong>קטגוריה:</strong> ספק חיצוני/פנימי (אופציונלי)</li>
            </ul>
          </div>
          
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>טיפ:</strong> השתמש בכפתור "הורד תבנית" כדי לקבל קובץ דוגמה מוכן לעריכה
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}