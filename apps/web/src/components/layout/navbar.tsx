"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Globe2,
  LogIn,
  LogOut,
  ChevronDown,
  ArrowRight,
  Shield,
  FlaskConical,
  Compass,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { getRolePortalRoute, getRolePortalLabel } from "@/components/layout/AuthGate";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi">("en");

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Check if current route is inside one of the 5 role portals
  const isPortalRoute =
    pathname.startsWith("/scientist") ||
    pathname.startsWith("/researcher") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/admin");

  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    checkCurrentUser();
    const onAuthChange = () => checkCurrentUser();
    window.addEventListener("vistaar-auth-changed", onAuthChange);
    window.addEventListener("storage", onAuthChange);
    return () => {
      window.removeEventListener("vistaar-auth-changed", onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#user-menu-container")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function checkCurrentUser() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("vistaar_token") : null;
      if (!token) {
        setCurrentUser(null);
        return;
      }
      const u = await fetchApi("/auth/me", { bypassCache: true });
      setCurrentUser(u);
    } catch {
      setCurrentUser(null);
    }
  }

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
      setSearchOpen(false);
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const openAuthModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("vistaar-open-auth-modal"));
    }
  };

  async function handleLogout() {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vistaar_token");
        localStorage.removeItem("vistaar_refresh_token");
        localStorage.removeItem("vistaar_user");
      }
      clearClientApiCache();
      setCurrentUser(null);
      setUserMenuOpen(false);
      window.dispatchEvent(new Event("vistaar-auth-changed"));
      router.push("/");
    }
  }

  const roleBadgeStyle = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return { bg: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500", label: "Admin" };
      case "SCIENTIST":
      case "FIELD_SCIENTIST":
        return { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-600", label: "Scientist" };
      case "RESEARCHER":
      case "JOURNALIST":
        return { bg: "bg-indigo-50 text-indigo-800 border-indigo-200", dot: "bg-indigo-600", label: "Researcher" };
      case "TEACHER":
        return { bg: "bg-amber-50 text-amber-900 border-amber-200", dot: "bg-amber-600", label: "Teacher" };
      case "STUDENT":
      default:
        return { bg: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500", label: "Student" };
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full transition-all">
        {/* Top Ice Institutional Ribbon */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-sky-200/80 text-slate-800 px-3 sm:px-5 lg:px-8 py-1 text-[11px] font-medium">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="flex items-center space-x-0.5 shadow-2xs" title="Government of India">
                <span className="w-1.5 h-3 rounded-l-xs bg-[#FF9933]"></span>
                <span className="w-1.5 h-3 bg-white border-y border-slate-200"></span>
                <span className="w-1.5 h-3 rounded-r-xs bg-[#138808]"></span>
              </span>
              <span className="font-bold tracking-tight text-slate-900 text-xs truncate max-w-[210px] sm:max-w-none">
                National Centre for Polar and Ocean Research (NCPOR)
              </span>
              <span className="text-sky-400 hidden lg:inline">•</span>
              <span className="text-slate-500 hidden lg:inline text-xs">
                Ministry of Earth Sciences, Govt. of India
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* Live Telemetry Status */}
              <div className="hidden md:flex items-center space-x-1.5 bg-sky-50/90 border border-sky-200/90 px-2.5 py-0.5 rounded-full text-[10px] text-sky-950 font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                </span>
                <span className="font-semibold">Maitri • Bharati • Himadri • Himansh</span>
              </div>

              {/* Bhashini Multilingual Toggle: EN / हिंदी */}
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === "en" ? "hi" : "en")}
                className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-white border border-sky-200/90 hover:bg-sky-50 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                title="Digital India Bhashini Language Engine"
              >
                <Globe2 className="w-3 h-3 text-sky-600" />
                <span>{selectedLanguage === "en" ? "EN / हिंदी" : "हिंदी / EN"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Frosted Glass Navigation Bar */}
        <div className="ice-glass border-b border-sky-200/80">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-3">
            {/* Left: VISTAAR Logo */}
            <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
              <MountainLogo size="md" className="group-hover:scale-105 transition-transform drop-shadow-xs" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 leading-none">
                    VISTAAR
                  </span>
                  <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-black px-1.5 py-0.2 rounded font-mono">
                    विस्तार
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5 hidden sm:block">
                  Polar Science & Knowledge Portal
                </span>
              </div>
            </Link>

            {/* Portal Context Indicator if navigated inside a role workspace */}
            {isPortalRoute && currentUser && (
              <div className="hidden md:flex items-center space-x-2">
                <div
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5",
                    roleBadgeStyle(currentUser.role).bg
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", roleBadgeStyle(currentUser.role).dot)} />
                  <span>{getRolePortalLabel(currentUser.role)}</span>
                </div>
                <Link
                  href="/"
                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <span>← Public Home</span>
                </Link>
              </div>
            )}

            {/* Right: Clean Action Controls (Language, Search & Sign In) */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Universal Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-sky-200/90 bg-white/90 hover:bg-white text-xs text-slate-700 font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
                title="Search Polar Science & Records (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden md:inline text-[10px] bg-sky-50 border border-sky-200 px-1 py-0.2 rounded text-sky-800 font-mono font-bold">
                  ⌘K
                </kbd>
              </button>

              {/* If Logged In: Role Badge + Go to Portal + User Menu */}
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <Link
                    href={getRolePortalRoute(currentUser.role)}
                    className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-extrabold text-xs shadow-xs transition-all"
                  >
                    <span>My Role Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="relative shrink-0" id="user-menu-container">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-sky-200 bg-white/95 hover:bg-white shadow-2xs text-xs font-bold text-slate-900 transition-all cursor-pointer shrink-0"
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", roleBadgeStyle(currentUser.role).dot)} />
                      <span className="max-w-[70px] sm:max-w-[100px] truncate">
                        {currentUser.name || currentUser.email}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200 font-extrabold hidden lg:inline">
                        {roleBadgeStyle(currentUser.role).label}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-72 rounded-2xl ice-glass-strong p-4 z-50 space-y-3 shadow-xl border border-white">
                        <div className="border-b border-sky-200/80 pb-2.5">
                          <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                          <p className="text-xs text-slate-500 font-mono truncate">{currentUser.email}</p>
                          <span
                            className={cn(
                              "inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full border",
                              roleBadgeStyle(currentUser.role).bg
                            )}
                          >
                            {roleBadgeStyle(currentUser.role).label} Portal
                          </span>
                        </div>

                        <div className="space-y-1">
                          <Link
                            href={getRolePortalRoute(currentUser.role)}
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-900 flex items-center justify-between"
                          >
                            <span>Open {getRolePortalLabel(currentUser.role)}</span>
                            <span>→</span>
                          </Link>
                        </div>

                        <div className="border-t border-sky-200/80 pt-2 flex items-center justify-between">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold cursor-pointer transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Unauthenticated: Primary Clean Sign In Button */
                <button
                  onClick={openAuthModal}
                  className="px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-black text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-1.5 rounded-xl border border-sky-200 bg-white/90 text-slate-800 hover:bg-white transition-colors shrink-0"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Minimal Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden ice-glass-strong border-b border-sky-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl bg-white text-slate-800 font-bold border border-sky-200"
            >
              <Search className="w-5 h-5 text-sky-600" />
              <span>Search Polar Science & Records</span>
            </button>

            {currentUser ? (
              <div className="space-y-2">
                <Link
                  href={getRolePortalRoute(currentUser.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold"
                >
                  <span>Open {getRolePortalLabel(currentUser.role)}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-red-50 text-red-700 font-bold text-sm border border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal();
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 text-white font-black text-sm shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to VISTAAR</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Quick Search Modal (Ctrl+K or Header Search Click) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl ice-glass-strong rounded-3xl p-5 shadow-2xl border-2 border-white/95 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-200/80 pb-3">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-sky-600" />
                <span className="font-black text-slate-900 text-base">Search VISTAAR Polar Repository</span>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sky-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search polar science, research, stations, expeditions, datasets and stories..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-sky-200 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:border-sky-500"
                  autoFocus
                />
              </div>
            </form>

            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Filters & Categorized Search:
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {["Antarctica", "Arctic", "Himalayas", "Stations", "Expeditions", "Datasets"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/explore?filter=${encodeURIComponent(filter.toLowerCase())}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 font-semibold text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
