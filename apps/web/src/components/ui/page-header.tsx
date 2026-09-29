import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "./breadcrumbs";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`border-b border-vistaar-border bg-white px-4 sm:px-6 lg:px-8 py-6 mb-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-3">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-vistaar-text">
                {title}
              </h1>
              {badge && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-vistaar-primary border border-blue-200">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-vistaar-muted max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
