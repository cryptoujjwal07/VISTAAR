"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className = "" }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (val: string) => {
    if (value === undefined) setInternalTab(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1 p-1 bg-vistaar-bg border border-vistaar-border rounded-lg", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = ""
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used inside Tabs");
  const isActive = ctx.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => ctx.setActiveTab(value)}
      className={cn(
        "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
        isActive
          ? "bg-white text-vistaar-primary shadow-xs border border-vistaar-border/60"
          : "text-vistaar-muted hover:text-vistaar-text hover:bg-white/50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = ""
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used inside Tabs");
  if (ctx.activeTab !== value) return null;

  return <div className={cn("mt-4", className)}>{children}</div>;
}
