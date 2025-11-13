import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Clock, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from "@/components/ui/use-toast";

const getIcon = (variant) => {
    switch (variant) {
        case 'destructive': return <AlertTriangle className="h-3 w-3 text-red-500" />;
        case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
        default: return <Info className="h-3 w-3 text-blue-500" />;
    }
};

const getVariantColor = (variant) => {
    switch (variant) {
        case 'destructive': return 'border-red-200 bg-red-50 text-red-800';
        case 'success': return 'border-green-200 bg-green-50 text-green-800';
        default: return 'border-blue-200 bg-blue-50 text-blue-800';
    }
};

export default function SidebarNotifications() {
    const { history = [] } = useToast(); // Safe destructuring with default

    // Safe access to history with fallback
    const safeHistory = Array.isArray(history) ? history : [];
    const latestNotification = safeHistory.length > 0 ? safeHistory[0] : null;

    if (!latestNotification) {
        return (
            <div className="px-2 py-3 border-t border-slate-700/50 mt-3">
                <div className="flex items-center gap-2 px-2 py-2 text-slate-400 text-sm">
                    <Bell className="h-4 w-4" />
                    <span>אין התראות</span>
                </div>
            </div>
        );
    }

    return (
        <div className="px-2 py-3 border-t border-slate-700/50 mt-3">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-right p-2 h-auto hover:bg-slate-700/50">
                        <div className="flex items-start gap-2 w-full">
                            <div className="flex-shrink-0 mt-1">
                                <Bell className="h-4 w-4 text-slate-300" />
                            </div>
                            <div className="flex-1 text-right text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                    {getIcon(latestNotification.variant)}
                                    <span className="text-slate-200 font-medium truncate">
                                        {latestNotification.title}
                                    </span>
                                </div>
                                {latestNotification.description && (
                                    <p className="text-slate-400 text-xs line-clamp-1 mb-1">
                                        {latestNotification.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-1 text-slate-500">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                        {latestNotification.createdAt && format(new Date(latestNotification.createdAt), 'HH:mm', { locale: he })}
                                    </span>
                                </div>
                            </div>
                            {safeHistory.length > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                    {safeHistory.length}
                                </Badge>
                            )}
                        </div>
                    </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            היסטוריית התראות
                        </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="h-96">
                        <div className="space-y-3 pr-4">
                            {safeHistory.map((notification, index) => (
                                <div 
                                    key={`${notification.id}-${index}`}
                                    className={`p-3 rounded-lg border ${getVariantColor(notification.variant)} ${
                                        index === 0 ? 'ring-2 ring-blue-200' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {getIcon(notification.variant)}
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm mb-1">
                                                {notification.title}
                                            </h4>
                                            {notification.description && (
                                                <p className="text-xs opacity-80 mb-2">
                                                    {notification.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 text-xs opacity-70">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {notification.createdAt && format(new Date(notification.createdAt), 'dd/MM HH:mm', { locale: he })}
                                                </span>
                                                {index === 0 && (
                                                    <Badge variant="outline" className="mr-2 text-xs">
                                                        אחרונה
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}