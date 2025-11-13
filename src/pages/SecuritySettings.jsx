
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Smartphone, 
  Eye, 
  EyeOff,
  Lock,
  RefreshCw,
  CheckCircle,
  Clock,
  User as UserIcon,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default function SecuritySettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    security_level: "high",
    auto_logout: true,
    prevent_screenshots: true,
    blur_on_background: true,
    block_developer_tools: true
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userData = await User.me();
        setUser(userData);
        
        // Initialize settings from user data if available
        if (userData) {
          setSecuritySettings(prev => ({
            ...prev,
            security_level: userData.security_level || "high"
          }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("אירעה שגיאה בטעינת נתוני המשתמש. נא לנסות שוב.");
        
        // Check if we should retry
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prevCount => prevCount + 1);
          }, 2000); // Wait 2 seconds before retrying
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [retryCount]); // Refetch when retry count changes

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Update user settings in database
      await User.updateMyUserData({
        security_level: securitySettings.security_level,
        last_security_check: new Date().toISOString()
      });
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reload user data
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error saving security settings:", error);
      setError("אירעה שגיאה בשמירת ההגדרות. נא לנסות שוב.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDeviceFingerprint = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({
        device_fingerprint: null
      });
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reload user data
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error resetting device fingerprint:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">הגדרות אבטחה</h1>
        <div className="flex items-center">
          <ShieldCheck className="h-5 w-5 text-green-500 ml-2" />
          <span className="text-sm text-green-700">רמת אבטחה גבוהה</span>
        </div>
      </div>
      
      {showSuccess && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 ml-2" />
          <AlertDescription>ההגדרות נשמרו בהצלחה</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 ml-2" />
          <AlertDescription>
            {error}
            <Button variant="link" onClick={() => setRetryCount(0)} className="p-0 h-auto text-white underline mr-2">
              נסה שוב
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
            <div className="text-gray-500">טוען נתונים...</div>
            {retryCount > 0 && <div className="text-xs text-gray-500 mt-2">ניסיון {retryCount} מתוך 3...</div>}
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 ml-2" />
                הגדרות אבטחה כלליות
              </CardTitle>
              <CardDescription>
                הגדר את רמת האבטחה והגדרות פרטיות נוספות
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="security-level">רמת אבטחה</Label>
                  <Select 
                    value={securitySettings.security_level}
                    onValueChange={(value) => setSecuritySettings({...securitySettings, security_level: value})}
                  >
                    <SelectTrigger id="security-level">
                      <SelectValue placeholder="בחר רמת אבטחה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">רגילה</SelectItem>
                      <SelectItem value="high">גבוהה (מומלץ)</SelectItem>
                      <SelectItem value="maximum">מקסימלית</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {securitySettings.security_level === "maximum" && "כולל נעילת צילומי מסך, התנתקות אוטומטית מהירה, וחסימת העתקת תוכן"}
                    {securitySettings.security_level === "high" && "כולל התנתקות אוטומטית וטשטוש מידע בעת מעבר לאפליקציה אחרת"}
                    {securitySettings.security_level === "standard" && "אבטחה בסיסית בלבד"}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-logout">התנתקות אוטומטית</Label>
                    <p className="text-xs text-gray-500">התנתק אוטומטית אחרי 15 דקות ללא פעילות</p>
                  </div>
                  <Switch 
                    id="auto-logout" 
                    checked={securitySettings.auto_logout}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auto_logout: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="prevent-screenshots">מניעת צילומי מסך</Label>
                    <p className="text-xs text-gray-500">חסום אפשרות לצילום מסך במכשירים ניידים</p>
                  </div>
                  <Switch 
                    id="prevent-screenshots" 
                    checked={securitySettings.prevent_screenshots}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, prevent_screenshots: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="blur-background">טשטוש במעבר לרקע</Label>
                    <p className="text-xs text-gray-500">טשטש מידע רגיש בעת מעבר לאפליקציה אחרת</p>
                  </div>
                  <Switch 
                    id="blur-background" 
                    checked={securitySettings.blur_on_background}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, blur_on_background: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="block-devtools">חסימת כלי פיתוח</Label>
                    <p className="text-xs text-gray-500">זהה וחסום שימוש בכלי פיתוח בדפדפן</p>
                  </div>
                  <Switch 
                    id="block-devtools" 
                    checked={securitySettings.block_developer_tools}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, block_developer_tools: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 ml-2" />
                אבטחת מכשירים
              </CardTitle>
              <CardDescription>
                נהל את המכשירים המורשים לגשת למערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">המכשיר הנוכחי</div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">מאושר</div>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  {user?.device_fingerprint ? (
                    <>
                      <div>המכשיר הנוכחי מזוהה ומאושר במערכת.</div>
                      <div className="mt-1">
                        בדיקת אבטחה אחרונה: {user?.last_security_check ? 
                          format(new Date(user.last_security_check), "dd/MM/yyyy HH:mm") : 
                          "לא בוצעה"}
                      </div>
                    </>
                  ) : (
                    <div>טרם בוצע רישום של מכשיר זה במערכת. לחץ על "רשום מכשיר זה" כדי לשפר את האבטחה.</div>
                  )}
                </div>
                
                <Button 
                  variant={user?.device_fingerprint ? "outline" : "default"}
                  onClick={handleResetDeviceFingerprint}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      מעבד...
                    </>
                  ) : user?.device_fingerprint ? (
                    <>
                      <RefreshCw className="h-4 w-4 ml-2" />
                      אפס זיהוי מכשיר
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 ml-2" />
                      רשום מכשיר זה
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שומר הגדרות...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 ml-2" />
                  שמור הגדרות אבטחה
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
