"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Edit3,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Database,
  FileSearch,
  Home,
  UserPlus,
  LogIn,
  GraduationCap,
  User,
  Mail,
  KeyRound,
  Building2,
  CloudSun,
  Compass,
  Image as ImageIcon,
  LogOut,
} from "lucide-react";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { Badge } from "@/components/ui/badge";

const POLAR_BEAR_LANDING_IMAGE =
  "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=1800&q=85";

export interface RolePortalSpec {
  route: string;
  title: string;
  subtitle: string;
  badgeColor: string;
  allowedRoutes: string[];
  navLinks: { href: string; label: string }[];
}

export const ROLE_PORTAL_MAP: Record<string, RolePortalSpec> = {
  SUPER_ADMIN: {
    route: "/admin",
    title: "Super Admin Governance & Security Portal",
    subtitle: "Full RBAC Governance, User Role Assignment, Account Suspension & Immutable Audit Logs",
    badgeColor: "bg-red-50 text-red-800 border-red-200",
    allowedRoutes: [
      "/",
      "/admin",
      "/workspace",
      "/documents",
      "/datasets",
      "/research",
      "/weather",
      "/stations",
      "/education",
      "/media",
      "/explore",
      "/expeditions",
      "/about",
    ],
    navLinks: [
      { href: "/admin", label: "Admin Governance" },
      { href: "/workspace", label: "Review Studio" },
      { href: "/documents", label: "Document AI" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Weather" },
      { href: "/research", label: "Published" },
      { href: "/education", label: "Classroom" },
    ],
  },
  OUTREACH_EDITOR: {
    route: "/workspace",
    title: "Outreach Editor & Claim Verification Studio",
    subtitle: "4-Track AI Outreach Generation, Deterministic Claim Verification & PIB Publication",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    allowedRoutes: ["/", "/workspace", "/documents", "/research", "/media", "/explore"],
    navLinks: [
      { href: "/workspace", label: "Editorial Review Studio" },
      { href: "/documents", label: "Evidence Documents" },
      { href: "/research", label: "Published Bulletins" },
      { href: "/media", label: "Press Kits & Media" },
      { href: "/explore", label: "Knowledge Search" },
    ],
  },
  FIELD_SCIENTIST: {
    route: "/documents",
    title: "Field Scientist Document AI & NPDC Telemetry Portal",
    subtitle: "Scientific PDF BBox Parsing, Field Observation Submissions & NPDC Dataset Ingestion",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    allowedRoutes: ["/", "/documents", "/datasets", "/weather", "/stations", "/explore", "/expeditions"],
    navLinks: [
      { href: "/documents", label: "Document AI & Submissions" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Station Telemetry" },
      { href: "/stations", label: "Observatories" },
      { href: "/explore", label: "Scientific RAG" },
    ],
  },
  PUBLIC_USER: {
    route: "/education",
    title: "Student, Educator & Citizen Polar Science Portal",
    subtitle: "NCERT Class 8–12 Interactive Classroom, Quizzes, Live Polar Weather & Approved Research",
    badgeColor: "bg-sky-50 text-sky-900 border-sky-200",
    allowedRoutes: ["/", "/education", "/weather", "/stations", "/research", "/media", "/explore", "/expeditions", "/about"],
    navLinks: [
      { href: "/education", label: "Polar Classroom" },
      { href: "/weather", label: "Live Weather" },
      { href: "/stations", label: "4 Observatories" },
      { href: "/research", label: "Published Research" },
      { href: "/media", label: "Media & Press" },
      { href: "/explore", label: "Explore & Search" },
    ],
  },
};

export function getRolePortalRoute(role?: string): string {
  if (!role) return "/";
  return ROLE_PORTAL_MAP[role]?.route || "/education";
}

export function getRolePortalLabel(role?: string): string {
  if (!role) return "Role Portal";
  return ROLE_PORTAL_MAP[role]?.title || "User Portal";
}

export function isRouteAllowedForRole(pathname: string, role?: string): boolean {
  if (!role) return false;
  const spec = ROLE_PORTAL_MAP[role];
  if (!spec) return false;
  return spec.allowedRoutes.some(
    (allowed) => pathname === allowed || (allowed !== "/" && pathname.startsWith(`${allowed}/`))
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const signupNameRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-Up Form State (Strictly Non-Admin: PUBLIC_USER or FIELD_SCIENTIST)
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupOrg, setSignupOrg] = useState("");
  const [signupRole, setSignupRole] = useState<"PUBLIC_USER" | "FIELD_SCIENTIST">("PUBLIC_USER");
  const [signupPersona, setSignupPersona] = useState<"STUDENT" | "TEACHER" | "JOURNALIST" | "SCIENTIST">("STUDENT");

  async function syncAuthState() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("vistaar_token") : null;
      if (!token) {
        setUser(null);
        setChecking(false);
        return;
      }
      const me = await fetchApi("/auth/me", { bypassCache: true });
      setUser(me);
      if (typeof window !== "undefined") {
        localStorage.setItem("vistaar_user", JSON.stringify(me));
      }
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vistaar_token");
        localStorage.removeItem("vistaar_refresh_token");
        localStorage.removeItem("vistaar_user");
      }
      setUser(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    syncAuthState();
    const handler = () => {
      syncAuthState();
    };
    window.addEventListener("vistaar-auth-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("vistaar-auth-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  function completeSessionAndRedirect(res: any) {
    if (res?.access_token && typeof window !== "undefined") {
      localStorage.setItem("vistaar_token", res.access_token);
      if (res.refresh_token) {
        localStorage.setItem("vistaar_refresh_token", res.refresh_token);
      }
      if (res.user) {
        localStorage.setItem("vistaar_user", JSON.stringify(res.user));
      }
      clearClientApiCache();
      setUser(res.user);
      window.dispatchEvent(new Event("vistaar-auth-changed"));
      const targetPortal = getRolePortalRoute(res.user?.role);
      router.push(targetPortal);
    }
  }

  async function handleGateLogin(loginEmail?: string, loginPass?: string) {
    setAuthError(null);
    setSubmitting(true);
    try {
      const targetEmail = (loginEmail ?? email).trim();
      const targetPass = loginPass ?? password;
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });
      completeSessionAndRedirect(res);
    } catch (err: any) {
      setAuthError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGateSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    if (signupPassword.length < 8) {
      setAuthError("Password must be at least 8 characters long.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
          role: signupRole, // Strictly PUBLIC_USER or FIELD_SCIENTIST (Never Admin)
          persona: signupPersona,
          organization: signupOrg.trim() || "VISTAAR User Portal",
        }),
      });
      completeSessionAndRedirect(res);
    } catch (err: any) {
      setAuthError(err?.message || "Could not create user account. Email may already be registered.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vistaar_token");
        localStorage.removeItem("vistaar_refresh_token");
        localStorage.removeItem("vistaar_user");
      }
      clearClientApiCache();
      setUser(null);
      window.dispatchEvent(new Event("vistaar-auth-changed"));
      router.push("/");
    }
  }

  const focusAuthPanel = (modeToOpen: "login" | "signup") => {
    setAuthMode(modeToOpen);
    setAuthError(null);
    setTimeout(() => {
      if (modeToOpen === "login") {
        emailInputRef.current?.focus();
      } else {
        signupNameRef.current?.focus();
      }
    }, 50);
  };

  if (checking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-8">
        <div className="ice-glass-strong rounded-3xl px-8 py-6 flex items-center space-x-3">
          <MountainLogo size="md" />
          <div className="text-xs font-mono text-vistaar-scientific font-bold">
            Initializing VISTAAR Polar Portal & Verifying Session...
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 1. BEFORE LOGIN: PURE FULL-SCREEN LANDING PAGE (Portal Name + Mountain Logo + Big Polar Bear + Sign In / Sign Up)
  // Entire site is locked until the user signs in or registers!
  // ============================================================================
  if (!user) {
    return (
      <div className="min-h-screen w-full px-4 sm:px-6 lg:px-10 py-4 flex flex-col justify-between overflow-x-hidden">
        {/* Top Minimal Landing Header Bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-200/80">
          <div className="flex items-center space-x-3">
            <MountainLogo size="lg" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-vistaar-text">
                  VISTAAR
                </span>
                <span className="bg-sky-100 text-sky-900 border border-sky-300 text-xs font-bold px-2 py-0.5 rounded font-mono">
                  विस्तार
                </span>
                <Badge variant="scientific">SIH 26063 • NCPOR / MoES</Badge>
              </div>
              <p className="text-xs text-vistaar-muted font-medium">
                National Polar Science Outreach, Knowledge Repository & Media Dissemination Portal
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => focusAuthPanel("login")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-sm"
                  : "bg-white/85 text-vistaar-text border border-sky-200 hover:bg-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => focusAuthPanel("signup")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                authMode === "signup"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-sm"
                  : "bg-white/85 text-vistaar-primary border border-sky-300 hover:bg-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up (User)</span>
            </button>
          </div>
        </div>

        {/* Center Full-Screen Grid: Big Polar Bear Image (Left 7 cols) + Login/Signup Box (Right 5 cols) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch py-4">
          {/* Left 7 Cols: Big Polar Bear Image (Clicking Redirects/Focuses Login) */}
          <div
            onClick={() => focusAuthPanel("login")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") focusAuthPanel("login");
            }}
            aria-label="Click Polar Bear Showcase to Sign In to VISTAAR Portal"
            className="lg:col-span-7 rounded-3xl overflow-hidden relative min-h-[480px] flex flex-col justify-between p-6 sm:p-10 text-white shadow-2xl border-2 border-white/90 cursor-pointer group"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${POLAR_BEAR_LANDING_IMAGE}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#041222]/95 via-[#07203B]/45 to-[#07203B]/20" />

            {/* Top Overlay Badge on Polar Bear Image */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 text-sky-950 text-xs font-extrabold shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>OFFICIAL LANDING GATEWAY • LOGIN REQUIRED TO ENTER PORTAL</span>
              </span>
              <span className="text-xs font-mono bg-sky-950/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/25 text-sky-100">
                Maitri • Bharati • Himadri • Himansh
              </span>
            </div>

            {/* Bottom Overlay Headline & CTAs on Big Polar Bear Image */}
            <div className="relative z-10 space-y-4 max-w-2xl pt-12">
              <div className="flex items-center space-x-3">
                <MountainLogo size="lg" />
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-sky-300 font-bold block">
                    MINISTRY OF EARTH SCIENCES • GOVT. OF INDIA
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-none mt-0.5">
                    VISTAAR <span className="text-sky-300">(विस्तार)</span>
                  </h1>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-sky-50 leading-snug">
                Integrated Polar Science Outreach, Knowledge Repository & Role-Based Dissemination Portal
              </h2>

              <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
                Welcome to the VISTAAR Landing Page. Every module in this portal is strictly **Role-Based and Login-Protected**. Click this Polar Bear showcase or use the authentication panel to **Sign In** or **Sign Up as a User** to directly open your dedicated workspace.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => focusAuthPanel("login")}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs sm:text-sm font-extrabold shadow-lg border border-white/40 flex items-center space-x-2 cursor-pointer transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Open Portal →</span>
                </button>

                <button
                  type="button"
                  onClick={() => focusAuthPanel("signup")}
                  className="px-5 py-3 rounded-xl bg-white/95 hover:bg-white text-vistaar-primary text-xs sm:text-sm font-extrabold shadow-md border border-white flex items-center space-x-2 cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Sign Up as New User (Not Admin)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Ice-Mountain Glassmorphic Sign In & User Sign-Up Card */}
          <div className="lg:col-span-5 rounded-3xl ice-glass-strong p-6 sm:p-7 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-sky-100/80 border border-sky-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    authMode === "login"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-sm"
                      : "text-vistaar-text hover:bg-white/60"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In (Existing User)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    authMode === "signup"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-sm"
                      : "text-vistaar-text hover:bg-white/60"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up (User Only)</span>
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {authError}
                </div>
              )}

              {authMode === "login" ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-vistaar-text">
                      Sign In to Unlock VISTAAR Portal
                    </h2>
                    <p className="text-xs text-vistaar-muted mt-0.5">
                      After login, your assigned Role Portal opens directly with only the tools authorized for your role.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGateLogin();
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="font-bold text-vistaar-text block mb-1">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-vistaar-muted absolute left-3 top-2.5" />
                        <input
                          ref={emailInputRef}
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="scientist@vistaar.ncpor.res.in"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-vistaar-text block mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-vistaar-muted absolute left-3 top-2.5" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <span>{submitting ? "Signing In & Opening Role Portal..." : "Sign In & Open My Role Portal"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* 1-Click Role-Based Portal Launchers */}
                  <div className="pt-3 border-t border-sky-200/80 space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-vistaar-scientific block">
                      1-Click Role Login (Each User Opens Their Own Dedicated Page):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleGateLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                        className="p-3 rounded-xl border border-sky-200 bg-white/85 hover:bg-white text-left transition-all shadow-2xs hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Public / Student User</span>
                          </span>
                          <span className="text-[10px] font-mono text-vistaar-scientific">/education</span>
                        </div>
                        <p className="text-[11px] text-vistaar-muted mt-1">
                          Classroom, Quizzes, Weather & Published Research
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGateLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                        className="p-3 rounded-xl border border-sky-200 bg-white/85 hover:bg-white text-left transition-all shadow-2xs hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                            <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Field Scientist</span>
                          </span>
                          <span className="text-[10px] font-mono text-vistaar-scientific">/documents</span>
                        </div>
                        <p className="text-[11px] text-vistaar-muted mt-1">
                          Document AI BBox, Field Submissions & NPDC Data
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGateLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                        className="p-3 rounded-xl border border-sky-200 bg-white/85 hover:bg-white text-left transition-all shadow-2xs hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                            <Edit3 className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Outreach Editor</span>
                          </span>
                          <span className="text-[10px] font-mono text-vistaar-scientific">/workspace</span>
                        </div>
                        <p className="text-[11px] text-vistaar-muted mt-1">
                          4-Track AI Studio, Claim Verification & PIB Publish
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGateLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                        className="p-3 rounded-xl border border-sky-200 bg-white/85 hover:bg-white text-left transition-all shadow-2xs hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-red-600 shrink-0" />
                            <span>Super Admin</span>
                          </span>
                          <span className="text-[10px] font-mono text-vistaar-scientific">/admin</span>
                        </div>
                        <p className="text-[11px] text-vistaar-muted mt-1">
                          RBAC Role Management, Audit Logs & System Governance
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-extrabold text-vistaar-text">
                        Sign Up as New User (Not Admin)
                      </h2>
                      <p className="text-xs text-vistaar-muted mt-0.5">
                        Create a User or Field Scientist account. Admin registration is strictly disabled.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 shrink-0">
                      User Role Only
                    </Badge>
                  </div>

                  <form onSubmit={handleGateSignup} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold text-vistaar-text block mb-1">Full Name</label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-vistaar-muted absolute left-3 top-2.5" />
                          <input
                            ref={signupNameRef}
                            type="text"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            placeholder="Aarav Sharma"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                            minLength={2}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-vistaar-text block mb-1">Institution / School</label>
                        <div className="relative">
                          <Building2 className="w-3.5 h-3.5 text-vistaar-muted absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={signupOrg}
                            onChange={(e) => setSignupOrg(e.target.value)}
                            placeholder="NCERT / University"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-vistaar-text block mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-vistaar-muted absolute left-3 top-2.5" />
                        <input
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="user@student.edu.in"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-vistaar-text block mb-1">
                        Password (min 8 characters)
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-vistaar-muted absolute left-3 top-2.5" />
                        <input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold text-vistaar-text block mb-1">
                          Select User Role (No Admin)
                        </label>
                        <select
                          value={signupRole}
                          onChange={(e) => {
                            const r = e.target.value as "PUBLIC_USER" | "FIELD_SCIENTIST";
                            setSignupRole(r);
                            if (r === "FIELD_SCIENTIST") setSignupPersona("SCIENTIST");
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="PUBLIC_USER">Public User (Opens /education)</option>
                          <option value="FIELD_SCIENTIST">Field Scientist (Opens /documents)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-vistaar-text block mb-1">
                          User Persona
                        </label>
                        <select
                          value={signupPersona}
                          onChange={(e) =>
                            setSignupPersona(
                              e.target.value as "STUDENT" | "TEACHER" | "JOURNALIST" | "SCIENTIST"
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/95 text-vistaar-text font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="STUDENT">Student (NCERT 8–12)</option>
                          <option value="TEACHER">Teacher / Educator</option>
                          <option value="JOURNALIST">Journalist / Media</option>
                          <option value="SCIENTIST">Polar Researcher</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{submitting ? "Creating Account & Opening Portal..." : "Create User Account & Open Portal"}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-sky-200/70 flex items-center justify-between text-[11px] font-mono text-vistaar-muted">
              <span>Strict Role-Based Access Control (RBAC)</span>
              <span>NCPOR • MoES</span>
            </div>
          </div>
        </div>

        {/* Bottom Minimal Landing Footer Strip */}
        <div className="w-full pt-2 border-t border-sky-200/70 flex flex-wrap items-center justify-between text-[11px] text-vistaar-muted">
          <span>© 2026 VISTAAR (विस्तार) • National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences</span>
          <span className="font-mono text-vistaar-scientific font-bold">
            Authentication Mandatory • Role-Based Workspace Isolation Active
          </span>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. AFTER LOGIN: STRICT ROLE-BASED ROUTE ACCESS ENFORCEMENT
  // Each role can ONLY view the routes in their `allowedRoutes` list!
  // ============================================================================
  const roleSpec = ROLE_PORTAL_MAP[user.role] || ROLE_PORTAL_MAP.PUBLIC_USER;
  const isAllowed = isRouteAllowedForRole(pathname, user.role);

  if (!isAllowed) {
    return (
      <div className="min-h-[80vh] w-full px-4 sm:px-6 lg:px-10 py-12 flex items-center justify-center">
        <div className="max-w-xl w-full rounded-3xl ice-glass-strong p-8 space-y-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              RBAC Access Restricted • Role: {user.role}
            </Badge>
            <h1 className="text-2xl font-extrabold text-vistaar-text">
              This Workspace is Not Assigned to Your Role
            </h1>
            <p className="text-xs text-vistaar-muted leading-relaxed">
              You are signed in as <strong>{user.name || user.email}</strong> (<code>{user.role}</code>). Route{" "}
              <code>{pathname}</code> is restricted to other institutional roles. Below are the modules assigned to your role:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {roleSpec.navLinks.map((lnk) => (
              <Link
                key={lnk.href}
                href={lnk.href}
                className="px-3.5 py-2 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-xs font-bold text-vistaar-primary shadow-2xs"
              >
                {lnk.label} ({lnk.href})
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-sky-200/70 flex items-center justify-center gap-3">
            <Link
              href={roleSpec.route}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 text-white text-xs font-extrabold shadow-sm inline-flex items-center space-x-1.5"
            >
              <span>Return to My Primary Role Portal ({roleSpec.route})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Active Role Portal Command Strip (Shows User Name, Role, Allowed Role Workspaces, and Logout) */}
      <div className="bg-white/75 backdrop-blur-xl border-b border-sky-200/80 px-4 sm:px-6 lg:px-10 py-2">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-extrabold text-vistaar-text">{roleSpec.title}</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${roleSpec.badgeColor}`}>
              {user.role} • {user.name || user.email}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-vistaar-muted mr-1 hidden xl:inline">
              Your Assigned Modules:
            </span>
            {roleSpec.navLinks.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-2xs"
                      : "bg-white/85 text-vistaar-text border border-sky-200/80 hover:bg-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold flex items-center space-x-1 cursor-pointer"
              title="Sign Out and Return to Landing Page"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
