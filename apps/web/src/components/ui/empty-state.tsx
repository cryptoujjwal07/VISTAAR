import React from "react";
import { FolderSearch } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderSearch,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`p-10 text-center rounded-xl border border-dashed border-vistaar-border bg-white ${className}`}>
      <div className="w-12 h-12 rounded-full bg-vistaar-bg text-vistaar-primary mx-auto flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-vistaar-text">{title}</h3>
      <p className="mt-1 text-sm text-vistaar-muted max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
