import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Users, Lock } from "lucide-react";

export default function AdminPanel() {
  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">🔧 פאנל ניהול מתקדם</h1>
      
      <Card className="max-w-4xl border-yellow-500 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Shield className="h-10 w-10 text-yellow-500" />
            <div>
              <CardTitle className="text-yellow-700">ניהול אבטחה והרשאות</CardTitle>
              <CardDescription>
                אזור זה מיועד לניהול משתמשים, הרשאות והגדרות אבטחה מתקדמות של המערכת.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center text-base">
                        <Users className="ml-2 h-5 w-5"/>
                        ניהול משתמשים
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600">הוספה, הסרה ועריכה של משתמשים והרשאות גישה.</p>
                </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center text-base">
                        <Lock className="ml-2 h-5 w-5"/>
                        הגדרות אבטחה
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-gray-600">קביעת מדיניות סיסמאות, אימות דו-שלבי והגדרות נוספות.</p>
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}