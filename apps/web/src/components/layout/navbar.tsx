"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Database,
  CloudSun,
  GraduationCap,
  Image as ImageIcon,
  Shield,
  User,
  Globe2,
  FileSearch,
  Search,
  Menu,
  X,
  Radio,
  Building2,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explorations", icon: Compass },
  { href: "/stations", label: "Stations", icon: Building2 },
  { href: "/datasets", label: "NPDC Data", icon: Database },
  { href: "/weather", label: "Live Weather", icon: CloudSun },
  { href: "/education", label: "Classroom", icon: GraduationCap },
  { href: "/media", label: "Media & Press", icon: ImageIcon },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi">("en");

  // Handle Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/datasets?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full shadow-xs">
        {/* Top Institutional Strip */}
        <div className="bg-slate-900 border-b border-slate-800 text-slate-300 px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Ministry & Centre Identity with National Tricolor Accent */}
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center space-x-0.5" title="Government of India">
                <span className="w-1.5 h-3 rounded-l-xs bg-[#FF9933]"></span>
                <span className="w-1.5 h-3 bg-white"></span>
                <span className="w-1.5 h-3 rounded-r-xs bg-[#138808]"></span>
              </span>
              <span className="text-slate-200 font-semibold tracking-wide">
                National Centre for Polar and Ocean Research (NCPOR)
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">Ministry of Earth Sciences, Govt. of India</span>
            </div>

            {/* Right: Station Telemetry Indicator & Utilities */}
            <div className="flex items-center space-x-4">
              {/* Live Telemetry Ping */}
              <div className="hidden md:flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-full text-[10px] text-emerald-400 font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Telemetry Online: Maitri • Bharati • Himansh • Himadri</span>
              </div>

              {/* Bhashini Multilingual Toggle */}
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === "en" ? "hi" : "en")}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Digital India Bhashini Language Engine"
              >
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{selectedLanguage === "en" ? "English / हिंदी" : "हिंदी / English"}</span>
              </button>

              {/* Direct Admin Access */}
              <Link
                href="/admin"
                className="hidden sm:flex items-center space-x-1 text-slate-400 hover:text-amber-300 transition-colors"
                title="Administrative Console"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Clean Taskbar */}
        <div className="bg-white/95 backdrop-blur-md border-b border-vistaar-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Left: Brand Monogram & Title */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-700 text-white flex items-center justify-center font-bold text-xl shadow-sm border border-blue-500/20 group-hover:shadow-md transition-all">
                वि
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                    VISTAAR
                  </span>
                  <span className="bg-sky-50 text-sky-700 border border-sky-200/80 text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-wide font-mono">
                    विस्तार
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">
                  Integrated Polar Science Knowledge Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1.5 px-3 py-1.5 text-[13px] rounded-lg transition-all",
                      isActive
                        ? "bg-blue-50/90 text-blue-700 font-semibold border border-blue-200/60 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-blue-600" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-2.5">
              {/* Quick Search Shortcut Pill */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 text-xs text-slate-400 transition-all cursor-pointer shadow-2xs"
                title="Search Datasets & Science Records (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Search portal...</span>
                <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs text-slate-400 font-mono font-medium">
                  ⌘K
                </kbd>
              </button>

              {/* Review Studio Badge Button */}
              <Link
                href="/workspace"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300/80 bg-amber-50/60 hover:bg-amber-100 text-amber-900 transition-all shadow-2xs"
                title="Editorial & Scientific Review Workspace"
              >
                <FileSearch className="w-3.5 h-3.5 text-amber-600" />
                <span>Review Studio</span>
              </Link>

              {/* Sign In Primary Button */}
              <Link
                href="/admin"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-vistaar-border px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center space-x-2">
              <Link
                href="/workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 inline-flex justify-center items-center space-x-1 px-3 py-2 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-900"
              >
                <FileSearch className="w-3.5 h-3.5 text-amber-600" />
                <span>Review Studio</span>
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 inline-flex justify-center items-center space-x-1 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Interactive Search Modal (⌘K Command Palette) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0"
            onClick={() => setSearchOpen(false)}
          ></div>
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-150">
            <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="Search NPDC datasets, research stations, telemetry parameters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs"
              >
                ESC
              </button>
            </form>
            <div className="p-3 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
              <span>Quick links:</span>
              <div className="flex items-center space-x-2">
                <Link
                  href="/datasets"
                  onClick={() => setSearchOpen(false)}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:border-blue-400 transition-colors"
                >
                  NPDC Datasets
                </Link>
                <Link
                  href="/weather"
                  onClick={() => setSearchOpen(false)}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:border-blue-400 transition-colors"
                >
                  Live Weather
                </Link>
                <Link
                  href="/stations"
                  onClick={() => setSearchOpen(false)}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:border-blue-400 transition-colors"
                >
                  Stations
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
