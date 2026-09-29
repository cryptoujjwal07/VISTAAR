"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Database, CloudSun, GraduationCap, Image as ImageIcon, Shield, User, Globe2, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Polar Explorations", icon: Compass },
  { href: "/stations", label: "Research Stations" },
  { href: "/datasets", label: "NPDC Datasets", icon: Database },
  { href: "/weather", label: "Weather Intelligence", icon: CloudSun },
  { href: "/education", label: "Classroom Studio", icon: GraduationCap },
  { href: "/media", label: "Media & Press", icon: ImageIcon },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-vistaar-border bg-vistaar-surface/95 backdrop-blur-sm shadow-sm">
      {/* Top Ministry Banner */}
      <div className="bg-vistaar-text text-white py-1 px-4 text-xs font-medium flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-vistaar-primary"></span>
          <span>National Centre for Polar and Ocean Research (NCPOR) • Ministry of Earth Sciences, Govt. of India</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1 cursor-pointer hover:underline">
            <Globe2 className="w-3.5 h-3.5 text-vistaar-scientific" />
            <span>English / हिंदी (Bhashini)</span>
          </span>
          <Link href="/workspace" className="text-vistaar-border hover:text-white flex items-center space-x-1">
            <FileSearch className="w-3 h-3 text-cyan-400" />
            <span>Review Workspace</span>
          </Link>
          <Link href="/admin" className="text-vistaar-border hover:text-white flex items-center space-x-1">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Admin Console</span>
          </Link>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-vistaar-primary text-white flex items-center justify-center font-bold text-xl shadow-sm tracking-wider">
            वि
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-vistaar-text block leading-none">
              VISTAAR <span className="text-xs font-normal text-vistaar-scientific font-mono uppercase">विस्तार</span>
            </span>
            <span className="text-xs text-vistaar-muted block mt-0.5">
              Integrated Polar Science Outreach & Knowledge Portal
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-vistaar-bg text-vistaar-primary font-semibold"
                    : "text-vistaar-text hover:bg-vistaar-bg hover:text-vistaar-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <Link
            href="/workspace"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-vistaar-border bg-vistaar-bg hover:bg-white text-vistaar-text transition-colors"
          >
            <span>Review Studio</span>
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-vistaar-primary text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
