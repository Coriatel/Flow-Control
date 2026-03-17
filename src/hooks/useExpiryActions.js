import { useState } from "react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";

export function useExpiryActions(onRefresh) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDestroy = async (batchId) => {
    setLoading(true);
    try {
      await apiClient.post(`/batches/${batchId}/destroy`);
      toast.success("האצווה הושמדה בהצלחה");
      onRefresh?.();
    } catch (err) {
      toast.error("שגיאה בהשמדת האצווה", { description: err.message });
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDispense = async (reagentId, batchId, quantity) => {
    setLoading(true);
    try {
      await apiClient.post("/dispense", {
        reagentId,
        batchId,
        quantity,
        scanMethod: "MANUAL",
      });
      toast.success("הפריט הוצא לשימוש בהצלחה");
      onRefresh?.();
    } catch (err) {
      toast.error("שגיאה בהוצאה לשימוש", { description: err.message });
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleWithdraw = async (batchId, quantity, notes) => {
    setLoading(true);
    try {
      await apiClient.post(`/batches/${batchId}/withdraw`, { quantity, notes });
      toast.success("הכמות נמשכה בהצלחה");
      onRefresh?.();
    } catch (err) {
      toast.error("שגיאה במשיכת כמות", { description: err.message });
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  return {
    confirmAction,
    setConfirmAction,
    loading,
    handleDestroy,
    handleDispense,
    handleWithdraw,
  };
}
