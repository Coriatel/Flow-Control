import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SendMessageDialog({ open, onOpenChange, onSent }) {
  const [recipientType, setRecipientType] = useState("ALL");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [messageType, setMessageType] = useState("MESSAGE");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open && recipientType !== "ALL") {
      setLoadingUsers(true);
      apiClient
        .get("/users?isActive=true")
        .then((res) => setUsers(res.data || []))
        .catch(() => toast.error("שגיאה בטעינת משתמשים"))
        .finally(() => setLoadingUsers(false));
    }
  }, [open, recipientType]);

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("נא למלא כותרת ותוכן");
      return;
    }
    if (recipientType !== "ALL" && selectedUsers.length === 0) {
      toast.error("נא לבחור נמענים");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/messages", {
        recipientType,
        recipientIds: recipientType === "ALL" ? [] : selectedUsers,
        title: title.trim(),
        content: content.trim(),
        messageType,
        priority,
      });
      toast.success("ההודעה נשלחה בהצלחה");
      onSent?.();
      onOpenChange(false);
      // Reset form
      setTitle("");
      setContent("");
      setPriority("NORMAL");
      setMessageType("MESSAGE");
      setRecipientType("ALL");
      setSelectedUsers([]);
    } catch (err) {
      toast.error("שגיאה בשליחת הודעה", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>שליחת הודעה חדשה</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Recipients */}
          <div>
            <Label>נמענים</Label>
            <div className="flex gap-3 mt-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recipientType"
                  checked={recipientType === "ALL"}
                  onChange={() => setRecipientType("ALL")}
                  className="accent-primary"
                />
                <span className="text-sm">כל המשתמשים</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recipientType"
                  checked={recipientType === "SELECTED"}
                  onChange={() => setRecipientType("SELECTED")}
                  className="accent-primary"
                />
                <span className="text-sm">משתמשים נבחרים</span>
              </label>
            </div>
          </div>

          {/* User picker */}
          {recipientType !== "ALL" && (
            <div>
              {loadingUsers ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-32 border rounded-md p-2">
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 py-1.5 px-1 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={() => toggleUser(u.id)}
                      />
                      <span className="text-sm">{u.name}</span>
                      <span className="text-xs text-slate-400">{u.email}</span>
                    </label>
                  ))}
                </ScrollArea>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <Label>כותרת</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת ההודעה"
              maxLength={200}
              className="mt-1"
            />
          </div>

          {/* Content */}
          <div>
            <Label>תוכן</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="תוכן ההודעה..."
              rows={3}
              maxLength={5000}
              className="mt-1"
            />
          </div>

          {/* Priority & Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>דחיפות</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">נמוך</SelectItem>
                  <SelectItem value="NORMAL">רגיל</SelectItem>
                  <SelectItem value="HIGH">גבוה</SelectItem>
                  <SelectItem value="URGENT">דחוף</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סוג</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MESSAGE">הודעה</SelectItem>
                  <SelectItem value="ALERT">התראה</SelectItem>
                  <SelectItem value="NOTIFICATION">עדכון</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            שלח הודעה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
