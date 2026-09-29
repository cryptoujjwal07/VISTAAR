"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  position?: "right" | "left";
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  position = "right",
  className = ""
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className={cn("fixed inset-y-0 max-w-full flex", position === "right" ? "right-0 pl-10" : "left-0 pr-10")}>
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-screen max-w-md bg-white border-l border-vistaar-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out",
            className
          )}
        >
          <div className="p-5 border-b border-vistaar-border flex items-center justify-between bg-vistaar-bg/50">
            <div>
              <h2 className="text-base font-bold text-vistaar-text">{title}</h2>
              {description && <p className="text-xs text-vistaar-muted mt-0.5">{description}</p>}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-vistaar-muted hover:text-vistaar-text hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
