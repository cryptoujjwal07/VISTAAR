import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "scientific" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-vistaar-border/60 text-vistaar-text",
    success: "bg-green-100 text-vistaar-success border border-green-200",
    warning: "bg-amber-100 text-vistaar-warning border border-amber-200",
    danger: "bg-red-100 text-vistaar-danger border border-red-200",
    scientific: "bg-cyan-100 text-vistaar-scientific border border-cyan-200",
    outline: "border border-vistaar-border text-vistaar-muted bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
