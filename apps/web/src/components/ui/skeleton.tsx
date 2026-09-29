import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-vistaar-border/60", className)}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3 p-4 bg-white rounded-lg border border-vistaar-border">
      <Skeleton className="h-6 w-1/4" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 bg-white rounded-xl border border-vistaar-border space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
