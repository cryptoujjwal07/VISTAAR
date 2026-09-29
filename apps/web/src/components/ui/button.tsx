import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "scientific" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vistaar-primary disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles = {
      primary: "bg-vistaar-primary text-white hover:bg-blue-700 shadow-sm",
      scientific: "bg-vistaar-scientific text-white hover:bg-cyan-800 shadow-sm",
      outline: "border border-vistaar-border bg-vistaar-surface text-vistaar-text hover:bg-vistaar-bg",
      ghost: "text-vistaar-text hover:bg-vistaar-border/40",
      danger: "bg-vistaar-danger text-white hover:bg-red-700 shadow-sm",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
