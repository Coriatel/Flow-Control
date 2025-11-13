
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Lock, Database, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";

// Context לניהול מצב הנעילה בכל האפליקציה
const SystemLockContext = createContext();

export const SystemLockProvider = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [lockProgress, setLockProgress] = useState(0);
  const [lockDetails, setLockDetails] = useState({
    currentStep: '',
    affectedScreens: [],
    estimatedTimeRemaining: 0,
    startTime: null
  });

  // בדיקה אם המערכת נעולה כבר מתהליך קודם (לטעינה מחדש של הדף)
  useEffect(() => {
    const checkExistingLock = () => {
      const savedLock = localStorage.getItem('system_lock_state');
      if (savedLock) {
        try {
          const lockState = JSON.parse(savedLock);
          if (lockState.isLocked && lockState.startTime) {
            const elapsed = Date.now() - lockState.startTime;
            // אם יותר מ-10 דקות עברו, נבטל את הנעילה
            if (elapsed > 10 * 60 * 1000) {
              clearSystemLock();
            } else {
              // שחזור מצב הנעילה
              setIsLocked(true);
              setLockReason(lockState.reason || 'תהליך רקע פעיל');
              setLockProgress(lockState.progress || 0);
              setLockDetails(lockState.details || {});
            }
          }
        } catch (error) {
          console.warn('Error parsing saved lock state:', error);
          clearSystemLock();
        }
      }
    };

    checkExistingLock();
  }, []);

  // שמירת מצב הנעילה ב-localStorage
  useEffect(() => {
    if (isLocked) {
      const lockState = {
        isLocked,
        reason: lockReason,
        progress: lockProgress,
        details: lockDetails,
        startTime: lockDetails.startTime || Date.now()
      };
      localStorage.setItem('system_lock_state', JSON.stringify(lockState));
    } else {
      localStorage.removeItem('system_lock_state');
    }
  }, [isLocked, lockReason, lockProgress, lockDetails]);

  const lockSystem = (reason, affectedScreens = [], estimatedTime = 0) => {
    const startTime = Date.now();
    setIsLocked(true);
    setLockReason(reason);
    setLockProgress(0);
    setLockDetails({
      currentStep: 'מתחיל...',
      affectedScreens,
      estimatedTimeRemaining: estimatedTime,
      startTime
    });
  };

  const updateLockProgress = (progress, currentStep = '', estimatedTimeRemaining = 0) => {
    setLockProgress(Math.min(100, Math.max(0, progress)));
    setLockDetails(prev => ({
      ...prev,
      currentStep,
      estimatedTimeRemaining,
    }));
  };

  const clearSystemLock = () => {
    setIsLocked(false);
    setLockReason('');
    setLockProgress(0);
    setLockDetails({
      currentStep: '',
      affectedScreens: [],
      estimatedTimeRemaining: 0,
      startTime: null
    });
    localStorage.removeItem('system_lock_state');
  };

  return (
    <SystemLockContext.Provider value={{
      isLocked,
      lockReason,
      lockProgress,
      lockDetails,
      lockSystem,
      updateLockProgress,
      clearSystemLock
    }}>
      {children}
      {isLocked && <SystemLockOverlay />}
    </SystemLockContext.Provider>
  );
};

export const useSystemLock = () => {
  const context = useContext(SystemLockContext);
  if (!context) {
    throw new Error('useSystemLock must be used within SystemLockProvider');
  }
  return context;
};

// רכיב האוברליי שמציג את מצב הנעילה
const SystemLockOverlay = () => {
  const { lockReason, lockProgress, lockDetails, clearSystemLock } = useSystemLock();
  const [elapsedTime, setElapsedTime] = useState(0);

  // עדכון זמן שחלף
  useEffect(() => {
    if (!lockDetails.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lockDetails.startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [lockDetails.startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedRemaining = () => {
    if (lockProgress === 0) return lockDetails.estimatedTimeRemaining;
    const remainingProgress = 100 - lockProgress;
    const avgTimePerPercent = elapsedTime / lockProgress;
    return Math.ceil(remainingProgress * avgTimePerPercent);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-2xl mx-auto bg-white shadow-2xl">
        <CardContent className="p-8">
          {/* כותרת וסטטוס */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Lock className="h-12 w-12 text-blue-600" />
                <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">מערכת נעולה זמנית</h2>
            <p className="text-lg text-gray-600">{lockReason}</p>
          </div>

          {/* מד התקדמות מתקדם */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">התקדמות כללית</span>
              <span className="text-sm font-bold text-blue-600">{Math.round(lockProgress)}%</span>
            </div>
            <Progress value={lockProgress} className="h-3 mb-4" />
            
            {/* צעד נוכחי */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin ml-3" />
                <div>
                  <div className="font-medium text-blue-900">פעולה נוכחית:</div>
                  <div className="text-blue-700">{lockDetails.currentStep || 'מעבד נתונים...'}</div>
                </div>
              </div>
            </div>

            {/* מידע על זמנים */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-600 ml-2" />
                  <div>
                    <div className="font-medium text-gray-700">זמן שחלף</div>
                    <div className="text-gray-900 font-mono">{formatTime(elapsedTime)}</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-orange-600 ml-2" />
                  <div>
                    <div className="font-medium text-gray-700">זמן נותר (משוער)</div>
                    <div className="text-gray-900 font-mono">
                      {lockProgress > 0 ? formatTime(getEstimatedRemaining()) : 'מחשב...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* מסכים מושפעים */}
          {lockDetails.affectedScreens.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Database className="h-5 w-5 ml-2" />
                מסכים המתעדכנים:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {lockDetails.affectedScreens.map((screen, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-yellow-600 inline ml-1" />
                    {screen}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* הנחיות למשתמש */}
          <div className="border-t pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">נא להמתין:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• אל תסגור את הדפדפן או הלשונית</li>
                <li>• המערכת מעדכנת נתונים חשובים</li>
                <li>• בסיום התהליך המערכת תיפתח אוטומטית</li>
                <li>• במקרה של בעיה, צור קשר עם התמיכה</li>
              </ul>
            </div>
          </div>

          {/* Emergency cancel button - now appears after 60 seconds instead of 300 */}
          {elapsedTime > 60 && (
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  if (window.confirm('האם אתה בטוח שברצונך לבטל את התהליך? זה עלול להשאיר נתונים לא מעודכנים.')) {
                    clearSystemLock();
                    window.location.reload(); // Force reload to reset state
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                ביטול חירום (התהליך תקוע מעל דקה)
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
