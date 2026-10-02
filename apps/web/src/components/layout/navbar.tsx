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
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { ROLE_PORTAL_MAP, getRolePortalRoute } from "@/components/layout/AuthGate";

const CORE_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/stations", label: "Stations", icon: Building2 },
  { href: "/weather", label: "Live Weather", icon: CloudSun },
  { href: "/research", label: "Research", icon: BookOpen },
  { href: "/education", label: "Classroom", icon: GraduationCap },
];

const EXTENDED_NAV_ITEMS = [
  { href: "/expeditions", label: "Expeditions", icon: Compass },
  { href: "/media", label: "Media & Press", icon: ImageIcon },
];

const MORE_NAV_ITEMS = [
  { href: "/expeditions", label: "Expeditions", desc: "Antarctic, Arctic & Himalayan expeditions", icon: Compass },
  { href: "/media", label: "Media & Press", desc: "Scientific bulletins & press releases", icon: ImageIcon },
  { href: "/datasets", label: "NPDC Datasets", desc: "38,000+ scientific observation records", icon: Database },
  { href: "/about", label: "About VISTAAR", desc: "Institutional mandate and governance", icon: Shield },
];

const ALL_MOBILE_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/stations", label: "Stations", icon: Building2 },
  { href: "/weather", label: "Live Weather", icon: CloudSun },
  { href: "/expeditions", label: "Expeditions", icon: Compass },
  { href: "/research", label: "Research", icon: BookOpen },
  { href: "/education", label: "Classroom", icon: GraduationCap },
  { href: "/media", label: "Media & Press", icon: ImageIcon },
  { href: "/datasets", label: "NPDC Datasets", icon: Database },
  { href: "/about", label: "About VISTAAR", icon: Shield },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi">("en");

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMoreMenuOpen(false);
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
      if (!target.closest("#more-nav-container")) {
        setMoreMenuOpen(false);
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full transition-all">
        {/* Top Ice Institutional Ribbon */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-sky-200/80 text-slate-800 px-3 sm:px-5 lg:px-8 py-1 text-[11px] font-medium">
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
              {/* Live Telemetry Ping */}
              <div className="hidden md:flex items-center space-x-1.5 bg-sky-50/90 border border-sky-200/90 px-2.5 py-0.5 rounded-full text-[10px] text-sky-950 font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                </span>
                <span className="font-semibold">Maitri • Bharati • Himadri • Himansh</span>
              </div>

              {/* Bhashini Multilingual Toggle */}
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === "en" ? "hi" : "en")}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white border border-sky-200/90 hover:bg-sky-50 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                title="Digital India Bhashini Language Engine"
              >
                <Globe2 className="w-3 h-3 text-sky-600" />
                <span>{selectedLanguage === "en" ? "EN / हिंदी" : "हिंदी / EN"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Ice-Mountain Frosted Glass Navigation Bar */}
        <div className="ice-glass border-b border-sky-200/80">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 lg:gap-3">
            {/* Brand Mountain Logo & Title */}
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
                <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5 hidden 2xl:block">
                  Polar Science & Knowledge Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — Compact, Responsive, Never Overflowing */}
            <nav
              className="hidden lg:flex items-center space-x-1 xl:space-x-1.5"
              aria-label="Primary Navigation"
            >
              {/* Core Links: Overview, Stations, Weather, Research, Classroom */}
              {CORE_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1.5 px-2 xl:px-2.5 py-1.5 rounded-xl text-xs xl:text-xs 2xl:text-sm font-bold transition-all whitespace-nowrap",
                      isActive
                        ? "bg-white text-sky-700 shadow-2xs border border-sky-200"
                        : "text-slate-700 hover:text-sky-700 hover:bg-white/60"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5 shrink-0 hidden 2xl:inline-block", isActive ? "text-sky-600" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Extended Links: Expeditions, Media & Press (Visible directly on xl: 1280px+) */}
              {EXTENDED_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs 2xl:text-sm font-bold transition-all whitespace-nowrap",
                      isActive
                        ? "bg-white text-sky-700 shadow-2xs border border-sky-200"
                        : "text-slate-700 hover:text-sky-700 hover:bg-white/60"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5 shrink-0 hidden 2xl:inline-block", isActive ? "text-sky-600" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* "More ▾" Dropdown: On lg (1024-1279px) screens to guarantee zero horizontal overflow */}
              <div id="more-nav-container" className="relative hidden lg:block xl:hidden">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={cn(
                    "flex items-center space-x-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    moreMenuOpen || ["/expeditions", "/media", "/datasets", "/about"].some((p) => pathname.startsWith(p))
                      ? "bg-white text-sky-700 shadow-2xs border border-sky-200"
                      : "text-slate-700 hover:text-sky-700 hover:bg-white/60"
                  )}
                >
                  <span>More</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", moreMenuOpen && "rotate-180")} />
                </button>

                {moreMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl ice-glass-strong p-2.5 z-50 space-y-1 shadow-xl border border-white">
                    {MORE_NAV_ITEMS.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className={cn(
                            "flex items-start space-x-2.5 p-2 rounded-xl transition-all",
                            isActive
                              ? "bg-sky-50 text-sky-900 font-bold border border-sky-200"
                              : "hover:bg-white/80 text-slate-800"
                          )}
                        >
                          <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", isActive ? "text-sky-600" : "text-slate-500")} />
                          <div>
                            <div className="text-xs font-bold">{item.label}</div>
                            <div className="text-[10px] text-slate-500 leading-tight">{item.desc}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Special Workspace Links for authenticated roles */}
              {currentUser && (
                <>
                  {["SUPER_ADMIN", "ADMIN"].includes(currentUser.role) && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-extrabold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all whitespace-nowrap"
                    >
                      <Shield className="w-3 h-3 shrink-0" />
                      <span>Admin</span>
                    </Link>
                  )}
                  {["SCIENTIST", "FIELD_SCIENTIST"].includes(currentUser.role) && (
                    <Link
                      href="/scientist"
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all whitespace-nowrap"
                    >
                      <FlaskConical className="w-3 h-3 shrink-0" />
                      <span>Scientist</span>
                    </Link>
                  )}
                  {["RESEARCHER", "JOURNALIST"].includes(currentUser.role) && (
                    <Link
                      href="/researcher"
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all whitespace-nowrap"
                    >
                      <Compass className="w-3 h-3 shrink-0" />
                      <span>Researcher</span>
                    </Link>
                  )}
                  {currentUser.role === "TEACHER" && (
                    <Link
                      href="/teacher"
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all whitespace-nowrap"
                    >
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span>Teacher</span>
                    </Link>
                  )}
                  {["STUDENT", "PUBLIC_USER"].includes(currentUser.role) && (
                    <Link
                      href="/student"
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-extrabold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all whitespace-nowrap"
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Student</span>
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Right Action Controls: Search & Sign In (ALWAYS VISIBLE ACROSS ALL SCREENS!) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Quick Search Button — Always Visible Across All Screens */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-sky-200/90 bg-white/90 hover:bg-white text-xs text-slate-700 font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
                title="Search Portal (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden md:inline text-[10px] bg-sky-50 border border-sky-200 px-1 py-0.2 rounded text-sky-800 font-mono font-bold">
                  ⌘K
                </kbd>
              </button>

              {/* User Profile or Prominent Sign-In Button */}
              {currentUser ? (
                <div className="relative shrink-0" id="user-menu-container">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-sky-200 bg-white/95 hover:bg-white shadow-2xs text-xs font-bold text-slate-900 transition-all cursor-pointer shrink-0"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN"
                          ? "bg-red-500"
                          : currentUser.role === "SCIENTIST" || currentUser.role === "FIELD_SCIENTIST"
                          ? "bg-emerald-600"
                          : currentUser.role === "RESEARCHER"
                          ? "bg-indigo-600"
                          : currentUser.role === "TEACHER"
                          ? "bg-amber-600"
                          : "bg-sky-500"
                      )}
                    />
                    <span className="max-w-[70px] sm:max-w-[110px] truncate">{currentUser.name || currentUser.email}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200 font-extrabold hidden sm:inline">
                      {currentUser.role}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl ice-glass-strong p-4 z-50 space-y-3 shadow-xl border border-white">
                      <div className="border-b border-sky-200/80 pb-2.5">
                        <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 font-mono truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          {currentUser.role}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href={getRolePortalRoute(currentUser.role)}
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-900 flex items-center justify-between"
                        >
                          <span>Open Assigned Role Portal</span>
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
              ) : (
                <button
                  onClick={openAuthModal}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-black text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-xl border border-sky-200 bg-white/90 text-slate-800 hover:bg-white transition-colors shrink-0"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden ice-glass-strong border-b border-sky-200 px-4 pt-3 pb-6 space-y-2 shadow-xl">
            {ALL_MOBILE_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-2xl text-base font-bold transition-all",
                    isActive
                      ? "bg-white text-sky-700 shadow-sm border border-sky-200"
                      : "text-slate-800 hover:bg-white/60"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-sky-600" : "text-slate-500")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {!currentUser && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal();
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-black text-center shadow-md cursor-pointer"
                >
                  Sign In to VISTAAR
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Global Interactive Search Modal (⌘K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/40 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl ice-glass-strong overflow-hidden shadow-2xl border border-white">
            <form onSubmit={handleSearchSubmit} className="flex items-center px-5 py-4 border-b border-sky-200/80">
              <Search className="w-6 h-6 text-sky-600 mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search polar stations, expeditions, weather telemetry, NCERT lessons..."
                className="w-full text-base font-semibold bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
            <div className="p-4 bg-white/70 text-xs text-slate-500 flex items-center justify-between font-medium">
              <span>Press <kbd className="px-2 py-0.5 bg-white border border-sky-200 rounded font-mono font-bold">Enter</kbd> to search</span>
              <span><kbd className="px-2 py-0.5 bg-white border border-sky-200 rounded font-mono font-bold">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
