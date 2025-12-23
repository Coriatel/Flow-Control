import { useState, useEffect, useCallback } from 'react';

// --- Module-level state and Pub/Sub ---
// This is the single source of truth for toasts.
const toastState = {
  toasts: [], // Currently visible toasts
  history: [], // Full history of all toasts
};
const listeners = new Set();
const toastTimers = new Map(); // Track auto-dismiss timers

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// --- Dismiss function (module level for use in toast()) ---
const dismissToast = (id) => {
  // Clear any existing timer
  if (toastTimers.has(id)) {
    clearTimeout(toastTimers.get(id));
    toastTimers.delete(id);
  }
  toastState.toasts = toastState.toasts.filter(t => t.id !== id);
  emitChange();
};

// --- Public toast function ---
// This can be called from anywhere in the app to create a toast.
export function toast({ title, description, variant = 'default', duration = 3500 }) {
  const now = Date.now();

  // Stricter duplicate check on recent history
  const isDuplicate = toastState.history.slice(0, 5).some(t =>
    t.title === title && t.description === description && (now - t.timestamp) < 2000
  );

  if (isDuplicate) {
    console.log('Duplicate toast prevented:', { title, description });
    return;
  }

  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, title, description, variant, duration, timestamp: now, createdAt: new Date().toISOString() };

  toastState.toasts = [newToast, ...toastState.toasts].slice(0, 3); // Keep only 3 visible
  toastState.history.unshift(newToast); // Add to history
  if (toastState.history.length > 50) toastState.history.pop(); // Limit history size

  emitChange(); // Notify all subscribed components

  // Auto-dismiss after duration
  if (duration > 0) {
    const timerId = setTimeout(() => {
      dismissToast(id);
    }, duration);
    toastTimers.set(id, timerId);
  }

  // Return dismiss function for manual dismissal
  return { id, dismiss: () => dismissToast(id) };
}

// --- Hook for components to use toasts ---
// Components use this hook to get toast data and re-render on changes.
export function useToast() {
  const [localState, setLocalState] = useState({
    toasts: [...toastState.toasts],
    history: [...toastState.history]
  });

  useEffect(() => {
    const listener = () => setLocalState({
      toasts: [...toastState.toasts],
      history: [...toastState.history]
    });
    const unsubscribe = subscribe(listener);
    return unsubscribe;
  }, []);

  // Use the module-level dismissToast function
  const dismiss = useCallback((id) => {
    dismissToast(id);
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    toastState.toasts.forEach(t => dismissToast(t.id));
  }, []);

  return {
    toasts: localState.toasts || [],
    dismiss,
    dismissAll,
    toast, // Export toast function for convenience
    history: localState.history || []
  };
}