"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSearch,
  Shield,
  Database,
  BarChart3,
  Layers,
  Settings,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  type: "workspace" | "admin";
  className?: string;
}

export function Sidebar({ type, className = "" }: SidebarProps) {
  const pathname = usePathname();

  const workspaceNav = [
    { href: "/workspace", label: "Review Studio", icon: FileSearch },
    { href: "/datasets", label: "Dataset Catalog", icon: Database },
    { href: "/weather", label: "Telemetry Verifier", icon: BarChart3 },
    { href: "/media", label: "Media Library", icon: Layers }
  ];

  const adminNav = [
    { href: "/admin", label: "Governance & Audit", icon: Shield },
    { href: "/workspace", label: "Editorial Studio", icon: FileSearch },
    { href: "/datasets", label: "Data Pipeline", icon: Database },
    { href: "/admin#health", label: "Cluster Telemetry", icon: Settings }
  ];

  const nav = type === "workspace" ? workspaceNav : adminNav;

  return (
    <aside className={cn("w-64 border-r border-vistaar-border bg-white flex flex-col justify-between p-4", className)}>
      <div className="space-y-4">
        <div className="px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-vistaar-muted">
            {type === "workspace" ? "Editorial Studio Shell" : "Administrative Console"}
          </span>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-vistaar-primary font-semibold border border-blue-200"
                    : "text-vistaar-text hover:bg-slate-50 hover:text-vistaar-primary"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-vistaar-primary" : "text-vistaar-muted")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-vistaar-border space-y-2">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-vistaar-muted hover:text-vistaar-text hover:bg-slate-50 transition-colors"
        >
          <span>Return to Public Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <div className="px-3 py-1 text-[11px] text-slate-400">
          NCPOR VISTAAR v1.0.0
        </div>
      </div>
    </aside>
  );
}
