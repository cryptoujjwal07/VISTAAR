import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-vistaar-muted font-medium ${className}`}>
      <Link href="/" className="hover:text-vistaar-primary transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 mx-2 text-vistaar-muted/60" />
            {isLast || !item.href ? (
              <span className="text-vistaar-text font-semibold">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-vistaar-primary transition-colors">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
