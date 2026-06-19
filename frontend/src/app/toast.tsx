"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastInput = {
  message: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef(new Map<number, number>());

  const removeToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, variant = "info" }: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, variant }]);
    const timer = window.setTimeout(() => removeToast(id), 4200);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-20 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 rounded-md border bg-white px-4 py-3 text-sm shadow-lg",
              toast.variant === "success" && "border-green-200 text-green-800",
              toast.variant === "error" && "border-red-200 text-red-800",
              toast.variant === "info" && "border-border text-foreground",
            )}
            role="status"
          >
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                toast.variant === "success" && "bg-green-600",
                toast.variant === "error" && "bg-red-600",
                toast.variant === "info" && "bg-primary",
              )}
            />
            <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
            <button
              type="button"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
              onClick={() => removeToast(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
