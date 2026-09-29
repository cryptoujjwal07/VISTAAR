"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(({ type, title, message }: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
            info: <Info className="w-4 h-4 text-blue-600 shrink-0" />
          };

          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg bg-white border border-vistaar-border shadow-lg animate-in slide-in-from-bottom-2 duration-150"
            >
              {icons[t.type]}
              <div className="flex-1">
                <p className="text-xs font-bold text-vistaar-text">{t.title}</p>
                {t.message && <p className="text-xs text-vistaar-muted mt-0.5">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-vistaar-muted hover:text-vistaar-text p-0.5"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
