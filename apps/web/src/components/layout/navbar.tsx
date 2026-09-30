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
  Globe2,
  FileSearch,
  Search,
  Menu,
  X,
  Building2,
  Home,
  LogOut,
  ChevronDown,
  CheckCircle,
  FlaskConical,
  BookOpen,
  Edit3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { ROLE_PORTAL_MAP, getRolePortalRoute } from "@/components/layout/AuthGate";
import { MountainLogo } from "@/components/ui/MountainLogo";

const ICON_BY_HREF: Record<string, any> = {
  "/": Home,
  "/admin": Shield,
  "/workspace": Edit3,
  "/documents": FileSearch,
  "/datasets": Database,
  "/weather": CloudSun,
  "/stations": Building2,
  "/research": BookOpen,
  "/education": GraduationCap,
  "/media": ImageIcon,
  "/explore": Compass,
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi">("en");

  // Auth & RBAC State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  async function handleRoleSwitch(email: string, password: string) {
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res?.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("vistaar_token", res.access_token);
          if (res.refresh_token) {
            localStorage.setItem("vistaar_refresh_token", res.refresh_token);
          }
          if (res.user) {
            localStorage.setItem("vistaar_user", JSON.stringify(res.user));
          }
        }
        clearClientApiCache();
        setCurrentUser(res.user);
        setUserMenuOpen(false);
        window.dispatchEvent(new Event("vistaar-auth-changed"));
        router.push(getRolePortalRoute(res.user?.role));
      }
    } catch {
      // ignore
    }
  }

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

  // Before Sign-In, the Landing Page in AuthGate is shown without the main site Navbar!
  if (!currentUser) {
    return null;
  }

  const roleSpec = ROLE_PORTAL_MAP[currentUser.role] || ROLE_PORTAL_MAP.PUBLIC_USER;
  const visibleNavItems = [
    { href: "/", label: "My Role Hub" },
    ...roleSpec.navLinks,
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        {/* Top Ice-Mountain Glassmorphic Institutional Strip */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-sky-200/70 text-vistaar-text px-4 sm:px-6 lg:px-10 py-1.5 text-[11px] font-medium">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center space-x-0.5 shadow-2xs" title="Government of India">
                <span className="w-1.5 h-3 rounded-l-xs bg-[#FF9933]"></span>
                <span className="w-1.5 h-3 bg-white border-y border-slate-200"></span>
                <span className="w-1.5 h-3 rounded-r-xs bg-[#138808]"></span>
              </span>
              <span className="text-vistaar-text font-bold tracking-wide">
                National Centre for Polar and Ocean Research (NCPOR)
              </span>
              <span className="text-sky-400 hidden sm:inline">•</span>
              <span className="text-vistaar-muted hidden sm:inline">
                Ministry of Earth Sciences, Govt. of India
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Live Telemetry Ping */}
              <div className="hidden md:flex items-center space-x-1.5 bg-sky-50/90 border border-sky-200/80 px-2.5 py-0.5 rounded-full text-[10px] text-sky-900 font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                </span>
                <span>Maitri • Bharati • Himansh • Himadri</span>
              </div>

              <Link
                href={roleSpec.route}
                className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Active Role: {currentUser.role}</span>
              </Link>

              {/* Bhashini Multilingual Toggle */}
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === "en" ? "hi" : "en")}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white/80 border border-sky-200/70 hover:bg-sky-50 text-vistaar-text transition-colors cursor-pointer"
                title="Digital India Bhashini Language Engine"
              >
                <Globe2 className="w-3.5 h-3.5 text-vistaar-scientific" />
                <span>{selectedLanguage === "en" ? "EN / हिंदी" : "हिंदी / EN"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Ice-Mountain Frosted Glass Navigation Bar (Strictly Role-Filtered) */}
        <div className="ice-glass border-b border-sky-200/70">
          <div className="w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
            {/* Left: Brand Mountain Logo & Title */}
            <Link href={roleSpec.route} className="flex items-center space-x-2.5 group shrink-0">
              <MountainLogo size="md" className="group-hover:scale-105 transition-transform" />
              <div className="flex flex-col whitespace-nowrap">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-extrabold tracking-tight text-vistaar-text leading-none">
                    VISTAAR
                  </span>
                  <span className="bg-sky-50/90 text-sky-800 border border-sky-200 text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-wide font-mono">
                    विस्तार
                  </span>
                </div>
                <span className="text-[10px] text-vistaar-muted font-medium tracking-tight mt-0.5 hidden sm:block">
                  {roleSpec.title}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — ONLY shows pages allowed for currentUser.role */}
            <nav
              className="hidden lg:flex items-center space-x-1 overflow-x-auto no-scrollbar"
              aria-label="Role-Based Primary Navigation"
            >
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = ICON_BY_HREF[item.href] || Compass;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1.5 px-2.5 py-1.5 text-xs rounded-xl transition-all whitespace-nowrap shrink-0",
                      isActive
                        ? "bg-white/95 text-blue-700 font-bold border border-sky-200 shadow-xs"
                        : "text-vistaar-text/80 hover:text-vistaar-text hover:bg-white/60 font-medium"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-blue-600" : "text-vistaar-scientific")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Quick Search Shortcut Pill */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-sky-200/80 bg-white/75 hover:bg-white text-xs text-vistaar-muted transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                title="Search Portal (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-vistaar-scientific shrink-0" />
                <span className="font-medium">Search</span>
                <kbd className="text-[10px] bg-sky-50 border border-sky-200 px-1 py-0.5 rounded text-sky-800 font-mono font-medium">
                  ⌘K
                </kbd>
              </button>

              {/* Authenticated User Profile & Role Switcher Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-sky-200 bg-white/90 hover:bg-white shadow-xs text-xs font-bold text-vistaar-text transition-all cursor-pointer whitespace-nowrap"
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      currentUser.role === "SUPER_ADMIN"
                        ? "bg-red-500"
                        : currentUser.role === "OUTREACH_EDITOR"
                        ? "bg-blue-600"
                        : currentUser.role === "FIELD_SCIENTIST"
                        ? "bg-emerald-600"
                        : "bg-sky-500"
                    )}
                  />
                  <span className="max-w-[120px] truncate">{currentUser.name || currentUser.email}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                    {currentUser.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-vistaar-muted" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl ice-glass-strong p-3.5 z-50">
                    <div className="border-b border-sky-200/70 pb-2.5 mb-2.5">
                      <p className="text-xs font-bold text-vistaar-text">{currentUser.name}</p>
                      <p className="text-[11px] text-vistaar-muted font-mono truncate">{currentUser.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {currentUser.role}
                        </span>
                        <Link
                          href={roleSpec.route}
                          onClick={() => setUserMenuOpen(false)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Primary Workspace ({roleSpec.route}) →
                        </Link>
                      </div>
                    </div>

                    {/* Fast Role Switcher for Testing Different Role Portals */}
                    <div className="space-y-1 mb-3">
                      <p className="text-[10px] font-bold text-vistaar-muted uppercase tracking-wider">
                        Switch Active Role Portal
                      </p>
                      <button
                        onClick={() => handleRoleSwitch("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-sky-50 text-vistaar-text flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5 font-semibold">
                          <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                          <span>Public / Student (/education)</span>
                        </span>
                        {currentUser.role === "PUBLIC_USER" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-sky-50 text-vistaar-text flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5 font-semibold">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Field Scientist (/documents)</span>
                        </span>
                        {currentUser.role === "FIELD_SCIENTIST" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-sky-50 text-vistaar-text flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5 font-semibold">
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Outreach Editor (/workspace)</span>
                        </span>
                        {currentUser.role === "OUTREACH_EDITOR" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-sky-50 text-vistaar-text flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5 font-semibold">
                          <Shield className="w-3.5 h-3.5 text-red-600" />
                          <span>Super Admin (/admin)</span>
                        </span>
                        {currentUser.role === "SUPER_ADMIN" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    </div>

                    <div className="border-t border-sky-200/70 pt-2.5 flex items-center justify-between text-xs">
                      <Link
                        href="/"
                        onClick={() => setUserMenuOpen(false)}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        My Role Hub
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 font-bold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-xl border border-sky-200 bg-white/80 text-vistaar-text hover:bg-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden ice-glass-strong border-b border-sky-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = ICON_BY_HREF[item.href] || Compass;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-white text-blue-700 font-bold border border-sky-200"
                      : "text-vistaar-text hover:bg-white/60 font-medium"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-vistaar-scientific")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Global Interactive Search Modal (⌘K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[#17202A]/35 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl ice-glass-strong overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3.5 border-b border-sky-200/70">
              <Search className="w-5 h-5 text-vistaar-scientific mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search polar stations, expeditions, published research, classroom modules..."
                className="w-full text-sm font-medium bg-transparent text-vistaar-text placeholder-vistaar-muted focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-md text-vistaar-muted hover:text-vistaar-text"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
            <div className="p-3.5 bg-white/60 text-xs text-vistaar-muted flex items-center justify-between">
              <span>
                Press <kbd className="px-1.5 py-0.5 bg-white border border-sky-200 rounded font-mono">Enter</kbd> to search
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-sky-200 rounded font-mono">Esc</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
