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

const PRIMARY_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/stations", label: "Stations", icon: Building2 },
  { href: "/weather", label: "Live Weather", icon: CloudSun },
  { href: "/expeditions", label: "Expeditions", icon: Compass },
  { href: "/research", label: "Research", icon: BookOpen },
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

  // Auth State
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
        <div className="bg-white/85 backdrop-blur-xl border-b border-sky-200/80 text-slate-800 px-4 sm:px-6 lg:px-12 py-1.5 text-xs font-medium">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center space-x-0.5 shadow-2xs" title="Government of India">
                <span className="w-1.5 h-3 rounded-l-xs bg-[#FF9933]"></span>
                <span className="w-1.5 h-3 bg-white border-y border-slate-200"></span>
                <span className="w-1.5 h-3 rounded-r-xs bg-[#138808]"></span>
              </span>
              <span className="font-bold tracking-tight text-slate-900 text-xs sm:text-sm">
                National Centre for Polar and Ocean Research (NCPOR)
              </span>
              <span className="text-sky-400 hidden md:inline">•</span>
              <span className="text-slate-500 hidden md:inline text-xs">
                Ministry of Earth Sciences, Govt. of India
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Live Telemetry Ping */}
              <div className="hidden lg:flex items-center space-x-2 bg-sky-50/90 border border-sky-200/90 px-3 py-0.5 rounded-full text-xs text-sky-950 font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="font-semibold">Maitri • Bharati • Himadri • Himansh</span>
              </div>

              {/* Bhashini Multilingual Toggle */}
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === "en" ? "hi" : "en")}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/90 border border-sky-200/80 hover:bg-sky-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                title="Digital India Bhashini Language Engine"
              >
                <Globe2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{selectedLanguage === "en" ? "EN / हिंदी" : "हिंदी / EN"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Ice-Mountain Frosted Glass Navigation Bar */}
        <div className="ice-glass border-b border-sky-200/80">
          <div className="w-full px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between gap-4">
            {/* Brand Mountain Logo & Title (Big, bold font) */}
            <Link href="/" className="flex items-center space-x-3 group shrink-0">
              <MountainLogo size="lg" className="group-hover:scale-105 transition-transform drop-shadow-sm" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 leading-none">
                    VISTAAR
                  </span>
                  <span className="bg-sky-100 text-sky-900 border border-sky-300 text-xs font-black px-2 py-0.5 rounded-md font-mono">
                    विस्तार
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1 hidden sm:block">
                  Polar Science & Knowledge Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — Big, Clear, Easy to Navigate */}
            <nav
              className="hidden lg:flex items-center space-x-1.5 xl:space-x-2"
              aria-label="Primary Navigation"
            >
              {PRIMARY_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm sm:text-base font-bold transition-all whitespace-nowrap",
                      isActive
                        ? "bg-white text-sky-700 shadow-sm border border-sky-200"
                        : "text-slate-700 hover:text-sky-700 hover:bg-white/60"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-sky-600" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Special Workspace Links for authenticated roles */}
              {currentUser && (
                <>
                  {["SUPER_ADMIN", "ADMIN"].includes(currentUser.role) && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </Link>
                  )}
                  {["SCIENTIST", "FIELD_SCIENTIST"].includes(currentUser.role) && (
                    <Link
                      href="/scientist"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Scientist</span>
                    </Link>
                  )}
                  {["RESEARCHER", "JOURNALIST"].includes(currentUser.role) && (
                    <Link
                      href="/researcher"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Researcher</span>
                    </Link>
                  )}
                  {currentUser.role === "TEACHER" && (
                    <Link
                      href="/teacher"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Teacher Studio</span>
                    </Link>
                  )}
                  {["STUDENT", "PUBLIC_USER"].includes(currentUser.role) && (
                    <Link
                      href="/student"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Student Hub</span>
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Right Action Controls: Search & Sign In / User Profile */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Quick Search Shortcut Pill */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden xl:flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-sky-200/80 bg-white/80 hover:bg-white text-xs sm:text-sm text-slate-500 font-medium transition-all cursor-pointer shadow-2xs"
                title="Search Portal (Ctrl+K)"
              >
                <Search className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Search Portal...</span>
                <kbd className="text-xs bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded text-sky-800 font-mono font-bold">
                  ⌘K
                </kbd>
              </button>

              {/* User Profile or Prominent Sign-In Button */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-2xl border border-sky-200 bg-white/95 hover:bg-white shadow-xs text-sm font-bold text-slate-900 transition-all cursor-pointer"
                  >
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        currentUser.role === "SUPER_ADMIN"
                          ? "bg-red-500"
                          : currentUser.role === "OUTREACH_EDITOR"
                          ? "bg-blue-600"
                          : currentUser.role === "FIELD_SCIENTIST"
                          ? "bg-emerald-600"
                          : "bg-sky-500"
                      )}
                    />
                    <span className="max-w-[130px] truncate">{currentUser.name || currentUser.email}</span>
                    <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-extrabold">
                      {currentUser.role}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
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
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-black text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-2xl border border-sky-200 bg-white/90 text-slate-800 hover:bg-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden ice-glass-strong border-b border-sky-200 px-4 pt-3 pb-6 space-y-2 shadow-xl">
            {PRIMARY_NAV_ITEMS.map((item) => {
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
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-black text-center shadow-md"
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
