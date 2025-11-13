import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Truck, Package, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UploadCOA() {
  const navigate = useNavigate();

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">העלאת תעודות אנליזה</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Option 1: Upload by Delivery Document */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">העלאה לפי תעודת משלוח</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                בחר תעודת משלוח קיימת והעלה תעודות אנליזה עבור האצוות שהתקבלו במשלוח זה.
              </p>
              <p className="text-sm text-gray-500">
                מתאים כאשר קיבלת את כל תעודות האנליזה יחד (למשל במייל) לאחר קליטת המשלוח.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(createPageUrl('Deliveries'))}
              >
                <Truck className="h-4 w-4 mr-2" />
                בחר תעודת משלוח
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Upload by Batch Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-300">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                <Package className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">העלאה לפי ניהול אצוות</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                עבור ישירות למסך ניהול אצוות וחפש את האצווה הספציפית להעלאת התעודה.
              </p>
              <p className="text-sm text-gray-500">
                מתאים כאשר אתה מעלה תעודת אנליזה עבור אצווה ספציפית או כמה אצוות נפרדות.
              </p>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate(createPageUrl('BatchAndExpiryManagement'))}
              >
                <Package className="h-4 w-4 mr-2" />
                נהל אצוות
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-5 w-5 mr-2" />
              עזרה - איך להעלות תעודות אנליזה?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-700">
              <strong>דרך 1 - לפי תעודת משלוח:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1 mr-4">
                <li>לחץ על "בחר תעודת משלוח" למעלה</li>
                <li>מצא את תעודת המשלוח הרלוונטית ברשימה</li>
                <li>לחץ על "ערוך" או "הצג פרטים"</li>
                <li>ליד כל אצווה במשלוח יופיע כפתור העלאת תעודה</li>
                <li>לחץ עליו, בחר קובץ (או צלם במובייל) והעלה</li>
              </ol>
            </div>
            
            <div className="text-sm text-gray-700">
              <strong>דרך 2 - לפי ניהול אצוות:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1 mr-4">
                <li>לחץ על "נהל אצוות" למעלה</li>
                <li>חפש את האצווה הרצויה ברשימת האצוות</li>
                <li>לחץ על כפתור ההעלאה ליד האצווה</li>
                <li>בחר קובץ (או צלם במובייל) והעלה</li>
              </ol>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start">
                <Upload className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>טיפ למובייל:</strong> המערכת תומכת בצילום ישיר של תעודות אנליזה. 
                  פשוט לחץ על כפתור בחירת הקובץ והמצלמה תיפתח אוטומטית לצילום.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}