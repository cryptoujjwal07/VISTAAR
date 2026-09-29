import React from "react";
import { cn } from "@/lib/utils";

export type StatusType = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, { dot: string; text: string; bg: string; border: string }> = {
  success: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200"
  },
  warning: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },
  danger: {
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200"
  },
  info: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200"
  },
  neutral: {
    dot: "bg-slate-400",
    text: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200"
  }
};

export function StatusIndicator({
  status,
  label,
  pulse = false,
  className = ""
}: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              config.dot
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.dot)} />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}
