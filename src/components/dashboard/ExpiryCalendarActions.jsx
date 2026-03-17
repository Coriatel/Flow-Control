import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trash2,
  Package,
  Truck,
  Settings,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useExpiryActions } from "@/hooks/useExpiryActions";

function getStatusBadge(daysUntilExpiry) {
  if (daysUntilExpiry <= 0)
    return (
      <Badge variant="destructive" className="text-[10px]">
        פג תוקף
      </Badge>
    );
  if (daysUntilExpiry <= 2)
    return (
      <Badge className="bg-orange-500 text-white text-[10px]">
        {daysUntilExpiry} ימים
      </Badge>
    );
  if (daysUntilExpiry <= 7)
    return (
      <Badge className="bg-yellow-500 text-white text-[10px]">
        {daysUntilExpiry} ימים
      </Badge>
    );
  return (
    <Badge className="bg-green-500 text-white text-[10px]">
      {daysUntilExpiry} ימים
    </Badge>
  );
}

export default function ExpiryCalendarActions({
  batches = [],
  selectedDate,
  onRefresh,
}) {
  const navigate = useNavigate();
  const {
    confirmAction,
    setConfirmAction,
    loading,
    handleDestroy,
    handleDispense,
    handleWithdraw,
  } = useExpiryActions(onRefresh);

  const [quantity, setQuantity] = useState("");

  const openConfirm = (action, batch) => {
    setQuantity(String(batch.currentQuantity));
    setConfirmAction({ action, batch });
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { action, batch } = confirmAction;
    const qty = parseInt(quantity) || batch.currentQuantity;

    switch (action) {
      case "destroy":
        handleDestroy(batch.id);
        break;
      case "dispense":
        handleDispense(batch.reagentId, batch.id, qty);
        break;
      case "withdraw":
        handleWithdraw(batch.id, qty, "");
        break;
    }
  };

  const actionLabels = {
    destroy: "השמדה",
    dispense: "הוצאה לשימוש",
    withdraw: "הוצאה למשלוח",
  };

  return (
    <>
      <div className="border rounded-lg p-3 space-y-2">
        <div className="text-sm font-semibold border-b pb-2 text-slate-800">
          {batches.length} אצוות ב-{selectedDate}
        </div>
        <ScrollArea className="max-h-48">
          <div className="space-y-1.5">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {batch.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-mono">
                      {batch.batchNumber}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {batch.currentQuantity} יח'
                    </Badge>
                    {getStatusBadge(batch.daysUntilExpiry)}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuItem
                      onClick={() => openConfirm("destroy", batch)}
                    >
                      <Trash2 className="h-4 w-4 me-2 text-red-500" />
                      השמדה
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openConfirm("dispense", batch)}
                    >
                      <Package className="h-4 w-4 me-2 text-emerald-500" />
                      הוצאה לשימוש
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openConfirm("withdraw", batch)}
                    >
                      <Truck className="h-4 w-4 me-2 text-blue-500" />
                      הוצאה למשלוח
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(
                          createPageUrl(`EditReagentBatch?id=${batch.id}`)
                        )
                      }
                    >
                      <Settings className="h-4 w-4 me-2 text-slate-500" />
                      ניהול
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {confirmAction ? actionLabels[confirmAction.action] : ""}
            </DialogTitle>
          </DialogHeader>
          {confirmAction && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {confirmAction.batch.name} - אצווה{" "}
                {confirmAction.batch.batchNumber}
              </p>
              {confirmAction.action !== "destroy" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    כמות
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min={1}
                    max={confirmAction.batch.currentQuantity}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    זמין: {confirmAction.batch.currentQuantity} יח'
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={loading}
            >
              ביטול
            </Button>
            <Button
              variant={
                confirmAction?.action === "destroy" ? "destructive" : "default"
              }
              onClick={executeAction}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              אישור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
