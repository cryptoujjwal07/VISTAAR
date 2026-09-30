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
  Building2,
  Home,
  LogOut,
  ChevronDown,
  CheckCircle,
  FlaskConical,
  BookOpen,
  Edit3,
  Sparkles,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { getRolePortalRoute } from "@/components/layout/AuthGate";

const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/stations", label: "Stations", icon: Building2 },
  { href: "/research", label: "Research", icon: BookOpen },
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/education", label: "Classroom", icon: GraduationCap },
  { href: "/media", label: "Media & Press", icon: ImageIcon },
];

const INTERNAL_SCIENTIST_EDITOR_ITEMS = [
  { href: "/datasets", label: "NPDC Data", icon: Database, roles: ["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"] },
  { href: "/documents", label: "Document AI", icon: FileSearch, roles: ["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"] },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi">("en");

  // Auth & RBAC State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    checkCurrentUser();
    const onAuthChange = () => checkCurrentUser();
    window.addEventListener("vistaar-auth-changed", onAuthChange);
    return () => window.removeEventListener("vistaar-auth-changed", onAuthChange);
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
        setAuthModalOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  async function handleLogin(emailToUse?: string, passwordToUse?: string) {
    const email = emailToUse || loginEmail;
    const password = passwordToUse || loginPassword;
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("vistaar_token", res.access_token);
        localStorage.setItem("vistaar_refresh_token", res.refresh_token);
      }
      clearClientApiCache();
      setCurrentUser(res.user);
      setAuthModalOpen(false);
      setUserMenuOpen(false);
      window.dispatchEvent(new Event("vistaar-auth-changed"));
      // Directly open the user's designated Role Portal upon login
      const targetPortal = getRolePortalRoute(res.user?.role);
      router.push(targetPortal);
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
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
      }
      clearClientApiCache();
      setCurrentUser(null);
      setUserMenuOpen(false);
      window.dispatchEvent(new Event("vistaar-auth-changed"));
      router.push("/");
    }
  }

  const visibleNavItems = [
    ...PUBLIC_NAV_ITEMS,
    ...(currentUser
      ? INTERNAL_SCIENTIST_EDITOR_ITEMS.filter((item) => item.roles.includes(currentUser.role))
      : []),
  ];

  const canAccessWorkspace =
    currentUser && ["SUPER_ADMIN", "OUTREACH_EDITOR", "FIELD_SCIENTIST"].includes(currentUser.role);
  const canAccessAdmin = currentUser && currentUser.role === "SUPER_ADMIN";

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        {/* Top Ice-Mountain Glassmorphic Institutional Strip */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-sky-200/70 text-vistaar-text px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
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

              {/* Public vs Authenticated Mode Badge */}
              {currentUser ? (
                <Link
                  href={getRolePortalRoute(currentUser.role)}
                  className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Portal Active: {currentUser.role}</span>
                </Link>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold cursor-pointer hover:bg-amber-100"
                >
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>Public Read-Only • Sign In for Full Portal</span>
                </button>
              )}

              {/* Bhashini Multilingual Toggle */}
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === "en" ? "hi" : "en")}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white/80 border border-sky-200/70 hover:bg-sky-50 text-vistaar-text transition-colors cursor-pointer"
                title="Digital India Bhashini Language Engine"
              >
                <Globe2 className="w-3.5 h-3.5 text-vistaar-scientific" />
                <span>{selectedLanguage === "en" ? "EN / हिंदी" : "हिंदी / EN"}</span>
              </button>

              {/* Direct Admin Access (Only visible when logged in as SUPER_ADMIN) */}
              {canAccessAdmin && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center space-x-1 text-blue-700 font-bold hover:text-blue-900 transition-colors"
                  title="Administrative Console"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Ice-Mountain Frosted Glass Navigation Bar */}
        <div className="ice-glass border-b border-sky-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Left: Brand Monogram & Title */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-700 text-white flex items-center justify-center font-bold text-xl shadow-sm border border-white/50 group-hover:shadow-md transition-all">
                वि
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-vistaar-text leading-none">
                    VISTAAR
                  </span>
                  <span className="bg-sky-50/90 text-sky-800 border border-sky-200 text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-wide font-mono">
                    विस्तार
                  </span>
                </div>
                <span className="text-[11px] text-vistaar-muted font-medium tracking-tight mt-0.5">
                  Polar Science Knowledge & Outreach Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Strictly Public when logged out; includes Authorized Portals when logged in) */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Primary Navigation">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1.5 px-3 py-1.5 text-[13px] rounded-xl transition-all",
                      isActive
                        ? "bg-white/90 text-blue-700 font-bold border border-sky-200 shadow-xs"
                        : "text-vistaar-text/80 hover:text-vistaar-text hover:bg-white/60 font-medium"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-blue-600" : "text-vistaar-scientific")} />
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
                className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-sky-200/80 bg-white/75 hover:bg-white text-xs text-vistaar-muted transition-all cursor-pointer shadow-2xs"
                title="Search Portal (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-vistaar-scientific" />
                <span className="font-medium">Search...</span>
                <kbd className="text-[10px] bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded text-sky-800 font-mono font-medium">
                  ⌘K
                </kbd>
              </button>

              {/* Review Studio Button — ONLY visible to authenticated Scientist / Editor / Admin */}
              {canAccessWorkspace && (
                <Link
                  href="/workspace"
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-sky-300 bg-sky-50/85 hover:bg-sky-100 text-sky-900 transition-all shadow-2xs"
                  title="Editorial & Scientific Review Workspace"
                >
                  <FileSearch className="w-3.5 h-3.5 text-blue-600" />
                  <span>Review Studio</span>
                </Link>
              )}

              {/* User Authentication Badge / Sign In Trigger */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-sky-200 bg-white/90 hover:bg-white shadow-xs text-xs font-bold text-vistaar-text transition-all cursor-pointer"
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
                    <span className="max-w-[110px] truncate">{currentUser.name?.split(" ")[0] || "Officer"}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                      {currentUser.role?.replace("_", " ")}
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
                            href={getRolePortalRoute(currentUser.role)}
                            onClick={() => setUserMenuOpen(false)}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            Open My Portal →
                          </Link>
                        </div>
                      </div>

                      {/* Fast Role Switcher (Opens each User Portal Directly) */}
                      <div className="space-y-1 mb-3">
                        <p className="text-[10px] font-bold text-vistaar-muted uppercase tracking-wider">
                          Switch Role Portal (Direct Open)
                        </p>
                        <button
                          onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-sky-50 text-vistaar-text flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center space-x-1.5 font-semibold">
                            <Shield className="w-3.5 h-3.5 text-red-600" />
                            <span>Super Admin (/admin)</span>
                          </span>
                          {currentUser.role === "SUPER_ADMIN" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-sky-50 text-vistaar-text flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center space-x-1.5 font-semibold">
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Outreach Editor (/workspace)</span>
                          </span>
                          {currentUser.role === "OUTREACH_EDITOR" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-sky-50 text-vistaar-text flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center space-x-1.5 font-semibold">
                            <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Field Scientist (/documents)</span>
                          </span>
                          {currentUser.role === "FIELD_SCIENTIST" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-sky-50 text-vistaar-text flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center space-x-1.5 font-semibold">
                            <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                            <span>Student Portal (/education)</span>
                          </span>
                          {currentUser.role === "PUBLIC_USER" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      </div>

                      <div className="border-t border-sky-200/70 pt-2.5 flex items-center justify-between text-xs">
                        <Link
                          href={getRolePortalRoute(currentUser.role)}
                          onClick={() => setUserMenuOpen(false)}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Go to Portal
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
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In to Portal</span>
                </button>
              )}

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
              const Icon = item.icon;
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

      {/* Institutional Ice-Mountain Glass Sign-In & Role Portal Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17202A]/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl ice-glass-strong overflow-hidden">
            <div className="p-6 border-b border-sky-200/70 bg-white/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-700 text-white flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-vistaar-text leading-tight">
                    Sign In to VISTAAR Portal
                  </h3>
                  <p className="text-xs text-vistaar-muted">
                    Opens your designated User Portal directly after login
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="p-1 text-vistaar-muted hover:text-vistaar-text rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {authError}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-vistaar-text block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="scientist@vistaar.ncpor.res.in"
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-vistaar-text block mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                >
                  {authLoading ? "Opening User Portal..." : "Sign In & Open My Portal"}
                </button>
              </form>

              <div className="pt-3 border-t border-sky-200/70">
                <p className="text-[11px] font-bold text-vistaar-scientific uppercase tracking-wide mb-2.5">
                  1-Click Role Portals (Opens Directly)
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                    className="p-2.5 rounded-xl border border-sky-200 bg-white/80 hover:bg-white text-left transition-all cursor-pointer"
                  >
                    <p className="font-bold text-vistaar-text flex items-center space-x-1">
                      <Shield className="w-3.5 h-3.5 text-red-600" />
                      <span>Super Admin</span>
                    </p>
                    <p className="text-[10px] text-vistaar-muted mt-0.5">Opens /admin</p>
                  </button>

                  <button
                    onClick={() => handleLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                    className="p-2.5 rounded-xl border border-sky-200 bg-white/80 hover:bg-white text-left transition-all cursor-pointer"
                  >
                    <p className="font-bold text-vistaar-text flex items-center space-x-1">
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Outreach Editor</span>
                    </p>
                    <p className="text-[10px] text-vistaar-muted mt-0.5">Opens /workspace</p>
                  </button>

                  <button
                    onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                    className="p-2.5 rounded-xl border border-sky-200 bg-white/80 hover:bg-white text-left transition-all cursor-pointer"
                  >
                    <p className="font-bold text-vistaar-text flex items-center space-x-1">
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Field Scientist</span>
                    </p>
                    <p className="text-[10px] text-vistaar-muted mt-0.5">Opens /documents</p>
                  </button>

                  <button
                    onClick={() => handleLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                    className="p-2.5 rounded-xl border border-sky-200 bg-white/80 hover:bg-white text-left transition-all cursor-pointer"
                  >
                    <p className="font-bold text-vistaar-text flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                      <span>Student Portal</span>
                    </p>
                    <p className="text-[10px] text-vistaar-muted mt-0.5">Opens /education</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
