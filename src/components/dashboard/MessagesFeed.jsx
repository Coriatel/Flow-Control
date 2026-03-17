import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Bell,
  Send,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import SendMessageDialog from "./SendMessageDialog";

const priorityColors = {
  LOW: "border-slate-300",
  NORMAL: "border-blue-400",
  HIGH: "border-orange-500",
  URGENT: "border-red-500",
};

const priorityDots = {
  LOW: "bg-slate-400",
  NORMAL: "bg-blue-400",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export default function MessagesFeed() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
  const isManager = user?.role === "MANAGER" || user?.role === "manager";
  const canSend = isAdmin || isManager;

  const fetchMessages = useCallback(async () => {
    try {
      const [msgRes, countRes] = await Promise.all([
        apiClient.get("/messages?limit=5"),
        apiClient.get("/messages/unread-count"),
      ]);
      setMessages(msgRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markAsRead = async (messageId) => {
    try {
      await apiClient.post(`/messages/${messageId}/read`);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error("שגיאה בסימון הודעה כנקראה");
    }
  };

  const dismissMessage = async (messageId) => {
    try {
      await apiClient.post(`/messages/${messageId}/dismiss`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("ההודעה הוסתרה");
    } catch {
      toast.error("שגיאה בהסתרת הודעה");
    }
  };

  return (
    <>
      <Card className="bg-white shadow-sm border border-gray-200 rounded-xl h-full">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="flex items-center text-base font-semibold text-slate-800">
            <Bell className="h-5 w-5 text-amber-600 me-2" />
            הודעות
            {unreadCount > 0 && (
              <Badge className="ms-2 bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {canSend && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSendDialogOpen(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Send className="h-4 w-4 me-1" />
                <span className="hidden sm:inline text-sm">שלח</span>
              </Button>
            )}
            <Link
              to={createPageUrl("Messages")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
            >
              הצג הכל <ArrowLeft className="h-4 w-4 ms-1" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2 text-right">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.recipientId || msg.id}
                      className={`border-e-4 ${priorityColors[msg.priority] || priorityColors.NORMAL} ${
                        msg.isRead ? "bg-slate-50" : "bg-blue-50"
                      } p-2 rounded-e-lg group relative`}
                      onClick={() => !msg.isRead && markAsRead(msg.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${priorityDots[msg.priority] || priorityDots.NORMAL}`}
                            />
                            <p className="font-medium text-slate-800 text-sm truncate">
                              {msg.title}
                            </p>
                          </div>
                          <p className="text-slate-600 text-xs line-clamp-2 mt-0.5">
                            {msg.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDistanceToNow(new Date(msg.createdAt), {
                                addSuffix: true,
                                locale: he,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!msg.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(msg.id);
                              }}
                              title="סמן כנקראה"
                            >
                              <Check className="h-3 w-3 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissMessage(msg.id);
                            }}
                            title="הסתר"
                          >
                            <X className="h-3 w-3 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500">אין הודעות חדשות.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <SendMessageDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onSent={fetchMessages}
      />
    </>
  );
}
