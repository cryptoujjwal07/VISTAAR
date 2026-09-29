import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-vistaar-text mb-1">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-md border border-vistaar-border bg-white px-3 py-2 text-sm text-vistaar-text placeholder:text-vistaar-muted/60 focus:border-vistaar-primary focus:outline-none focus:ring-1 focus:ring-vistaar-primary transition-all disabled:opacity-50 disabled:bg-slate-50",
            error && "border-vistaar-danger focus:border-vistaar-danger focus:ring-vistaar-danger",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-vistaar-danger font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-vistaar-text mb-1">
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-md border border-vistaar-border bg-white px-3 py-2 text-sm text-vistaar-text placeholder:text-vistaar-muted/60 focus:border-vistaar-primary focus:outline-none focus:ring-1 focus:ring-vistaar-primary transition-all disabled:opacity-50",
            error && "border-vistaar-danger focus:border-vistaar-danger focus:ring-vistaar-danger",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-vistaar-danger font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, options, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-vistaar-text mb-1">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-md border border-vistaar-border bg-white px-3 py-2 text-sm text-vistaar-text focus:border-vistaar-primary focus:outline-none focus:ring-1 focus:ring-vistaar-primary transition-all",
            error && "border-vistaar-danger",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-vistaar-danger font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
