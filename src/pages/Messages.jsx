import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  X,
  Search,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import BackButton from "@/components/ui/BackButton";
import SendMessageDialog from "@/components/dashboard/SendMessageDialog";

const priorityColors = {
  LOW: "border-e-slate-300",
  NORMAL: "border-e-blue-400",
  HIGH: "border-e-orange-500",
  URGENT: "border-e-red-500",
};

const priorityLabels = {
  LOW: "נמוך",
  NORMAL: "רגיל",
  HIGH: "גבוה",
  URGENT: "דחוף",
};

const typeLabels = {
  MESSAGE: "הודעה",
  ALERT: "התראה",
  NOTIFICATION: "עדכון",
};

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const limit = 20;

  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
  const isManager = user?.role === "MANAGER" || user?.role === "manager";
  const canSend = isAdmin || isManager;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (tab === "unread") params.set("unreadOnly", "true");

      const res = await apiClient.get(`/messages?${params}`);
      let msgs = res.data || [];

      // Client-side tab filtering for alerts
      if (tab === "alerts") {
        msgs = msgs.filter(
          (m) => m.messageType === "ALERT" || m.priority === "URGENT"
        );
      }

      // Client-side search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        msgs = msgs.filter(
          (m) =>
            m.title?.toLowerCase().includes(term) ||
            m.content?.toLowerCase().includes(term) ||
            m.senderName?.toLowerCase().includes(term)
        );
      }

      setMessages(msgs);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      toast.error("שגיאה בטעינת הודעות", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, tab, searchTerm]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markAsRead = async (id) => {
    try {
      await apiClient.post(`/messages/${id}/read`);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
      );
    } catch {
      toast.error("שגיאה");
    }
  };

  const dismiss = async (id) => {
    try {
      await apiClient.post(`/messages/${id}/dismiss`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("ההודעה הוסתרה");
    } catch {
      toast.error("שגיאה");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">הודעות</h1>
              <p className="text-sm text-slate-500">
                ניהול הודעות והתראות מערכת
              </p>
            </div>
          </div>
          {canSend && (
            <Button onClick={() => setSendDialogOpen(true)}>
              <Send className="h-4 w-4 me-2" />
              שלח הודעה חדשה
            </Button>
          )}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">כל ההודעות</TabsTrigger>
              <TabsTrigger value="unread">לא נקראו</TabsTrigger>
              <TabsTrigger value="alerts">התראות</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="חיפוש הודעות..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="ps-9"
            />
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">אין הודעות להצגה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <Card
                key={msg.recipientId || msg.id}
                className={`border-e-4 ${priorityColors[msg.priority] || priorityColors.NORMAL} ${
                  msg.isRead ? "bg-white" : "bg-blue-50/50"
                } transition-colors`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm ${msg.isRead ? "text-slate-700" : "text-slate-900 font-semibold"}`}
                        >
                          {msg.title}
                        </h3>
                        <Badge variant="outline" className="text-[10px]">
                          {typeLabels[msg.messageType] || msg.messageType}
                        </Badge>
                        {msg.priority !== "NORMAL" && (
                          <Badge
                            className={`text-[10px] ${
                              msg.priority === "URGENT"
                                ? "bg-red-100 text-red-700"
                                : msg.priority === "HIGH"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {priorityLabels[msg.priority]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {msg.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>{msg.senderName}</span>
                        <span>
                          {format(new Date(msg.createdAt), "dd/MM/yy HH:mm", {
                            locale: he,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!msg.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(msg.id)}
                          title="סמן כנקראה"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismiss(msg.id)}
                        title="הסתר"
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">
              עמוד {page} מתוך {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <SendMessageDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onSent={fetchMessages}
      />
    </div>
  );
}
