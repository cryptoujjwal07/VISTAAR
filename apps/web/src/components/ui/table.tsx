import React from "react";
import { cn } from "@/lib/utils";

export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-vistaar-border bg-white shadow-2xs">
      <table className={cn("w-full text-left text-sm text-vistaar-text", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={cn("bg-vistaar-bg text-xs font-semibold text-vistaar-muted uppercase border-b border-vistaar-border", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tbody className={cn("divide-y divide-vistaar-border", className)}>{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn("hover:bg-slate-50/70 transition-colors", className)}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-sm", className)}>{children}</td>;
}
