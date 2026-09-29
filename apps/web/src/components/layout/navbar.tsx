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
  Home,
  LogOut,
  Key,
  ChevronDown,
  CheckCircle,
  FlaskConical,
  BookOpen,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explorations", icon: Compass },
  { href: "/stations", label: "Stations", icon: Building2 },
  { href: "/datasets", label: "NPDC Data", icon: Database },
  { href: "/documents", label: "Document AI", icon: FileSearch },
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

  // Auth & RBAC State (Prompt 07)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  async function checkCurrentUser() {
    try {
      const u = await fetchApi("/auth/me");
      setCurrentUser(u);
    } catch {
      setCurrentUser(null);
    }
  }

  // Handle Ctrl+K / Cmd+K shortcut
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
      router.push(`/datasets?search=${encodeURIComponent(searchQuery.trim())}`);
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
      setCurrentUser(res.user);
      setAuthModalOpen(false);
      router.refresh();
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
      setCurrentUser(null);
      setUserMenuOpen(false);
      router.push("/");
    }
  }

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

              {/* User Authentication Badge / Sign In Trigger (Prompt 07) */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 shadow-xs text-xs font-semibold text-slate-800 transition-all"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        currentUser.role === "SUPER_ADMIN"
                          ? "bg-red-500"
                          : currentUser.role === "OUTREACH_EDITOR"
                          ? "bg-blue-500"
                          : currentUser.role === "FIELD_SCIENTIST"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      )}
                    />
                    <span className="max-w-[100px] truncate">{currentUser.name?.split(" ")[0] || "User"}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {currentUser.role?.replace("_", " ")}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="border-b border-slate-100 pb-2 mb-2">
                        <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {currentUser.role}
                        </span>
                      </div>

                      {/* Fast Role Switcher for Demonstrations */}
                      <div className="space-y-1 mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Switch Role (Demo Persona)
                        </p>
                        <button
                          onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                          className="w-full text-left px-2 py-1 rounded text-[11px] hover:bg-red-50 text-slate-700 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-1.5">
                            <Shield className="w-3 h-3 text-red-600" />
                            <span>Super Administrator</span>
                          </span>
                          {currentUser.role === "SUPER_ADMIN" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                          className="w-full text-left px-2 py-1 rounded text-[11px] hover:bg-blue-50 text-slate-700 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-1.5">
                            <Edit3 className="w-3 h-3 text-blue-600" />
                            <span>Outreach Editor</span>
                          </span>
                          {currentUser.role === "OUTREACH_EDITOR" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                          className="w-full text-left px-2 py-1 rounded text-[11px] hover:bg-emerald-50 text-slate-700 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-1.5">
                            <FlaskConical className="w-3 h-3 text-emerald-600" />
                            <span>Field Scientist</span>
                          </span>
                          {currentUser.role === "FIELD_SCIENTIST" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                          className="w-full text-left px-2 py-1 rounded text-[11px] hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                        >
                          <span className="flex items-center space-x-1.5">
                            <BookOpen className="w-3 h-3 text-slate-600" />
                            <span>Public Student</span>
                          </span>
                          {currentUser.role === "PUBLIC_USER" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          Admin Console
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 font-semibold"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

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
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-amber-700 hover:underline flex items-center space-x-1"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Review Studio</span>
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center space-x-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Governance</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Interactive Search Modal (⌘K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NPDC datasets, research stations, expeditions, weather..."
                className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
            <div className="p-4 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono">Enter</kbd> to execute unified search</span>
              <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Sign-In & Role Selection Modal (Prompt 07) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-vistaar-border overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Institutional Sign-In</h3>
                  <p className="text-xs text-slate-500">VISTAAR Authentication & RBAC Layer</p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {authError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {authError}
                </div>
              )}

              {/* Standard Credentials Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. scientist@vistaar.ncpor.res.in"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-xs"
                >
                  {authLoading ? "Verifying..." : "Authenticate Session"}
                </button>
              </form>

              {/* Quick Persona Demo Logins */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">
                  1-Click Demonstrator Accounts (Prompt 07 Roles)
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                    className="p-2.5 rounded-lg border border-red-200 bg-red-50/40 hover:bg-red-50 text-left transition-colors"
                  >
                    <p className="font-bold text-red-800 flex items-center space-x-1">
                      <Shield className="w-3.5 h-3.5 text-red-600" />
                      <span>Super Admin</span>
                    </p>
                    <p className="text-[10px] text-red-600/80 mt-0.5">Full governance</p>
                  </button>

                  <button
                    onClick={() => handleLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                    className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-left transition-colors"
                  >
                    <p className="font-bold text-blue-800 flex items-center space-x-1">
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Outreach Editor</span>
                    </p>
                    <p className="text-[10px] text-blue-600/80 mt-0.5">Verify & publish</p>
                  </button>

                  <button
                    onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                    className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-colors"
                  >
                    <p className="font-bold text-emerald-800 flex items-center space-x-1">
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Field Scientist</span>
                    </p>
                    <p className="text-[10px] text-emerald-600/80 mt-0.5">Upload & drafts</p>
                  </button>

                  <button
                    onClick={() => handleLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                  >
                    <p className="font-bold text-slate-800 flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      <span>Public Student</span>
                    </p>
                    <p className="text-[10px] text-slate-600/80 mt-0.5">Learn & explore</p>
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
