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
  LogIn,
  UserPlus,
  Mail,
  KeyRound,
  Building2,
  User,
  Compass,
  GraduationCap,
  LogOut,
  X,
} from "lucide-react";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { Badge } from "@/components/ui/badge";

export interface RolePortalSpec {
  route: string;
  title: string;
  subtitle: string;
  badgeColor: string;
  allowedRoutes: string[];
  navLinks: { href: string; label: string }[];
}

export const ROLE_PORTAL_MAP: Record<string, RolePortalSpec> = {
  SCIENTIST: {
    route: "/scientist",
    title: "Polar Scientist Portal",
    subtitle: "Field Research, Data Ingestion & Cryosphere Provenance",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    allowedRoutes: ["/", "/scientist", "/documents", "/datasets", "/weather", "/stations", "/explore", "/expeditions", "/media", "/research", "/education"],
    navLinks: [
      { href: "/scientist", label: "Scientist Studio" },
      { href: "/documents", label: "Research Uploads" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Weather Telemetry" },
      { href: "/stations", label: "Observatories" },
    ],
  },
  FIELD_SCIENTIST: {
    route: "/scientist",
    title: "Polar Scientist Portal",
    subtitle: "Field Research, Data Ingestion & Cryosphere Provenance",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    allowedRoutes: ["/", "/scientist", "/documents", "/datasets", "/weather", "/stations", "/explore", "/expeditions", "/media", "/research", "/education"],
    navLinks: [
      { href: "/scientist", label: "Scientist Studio" },
      { href: "/documents", label: "Research Uploads" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Weather Telemetry" },
    ],
  },
  RESEARCHER: {
    route: "/researcher",
    title: "Polar Researcher Knowledge Portal",
    subtitle: "Grounded RAG Intelligence, Finding Synthesis & Dataset Analysis",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    allowedRoutes: ["/", "/researcher", "/explore", "/datasets", "/documents", "/research", "/weather", "/stations", "/expeditions", "/education", "/media"],
    navLinks: [
      { href: "/researcher", label: "Researcher Studio" },
      { href: "/explore", label: "Semantic Search" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Station Data" },
    ],
  },
  JOURNALIST: {
    route: "/researcher",
    title: "Researcher Portal",
    subtitle: "Verified Science Findings & Media Kits",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    allowedRoutes: ["/", "/researcher", "/explore", "/media", "/research", "/stations", "/weather"],
    navLinks: [
      { href: "/researcher", label: "Researcher Studio" },
      { href: "/media", label: "Media Assets" },
      { href: "/research", label: "Verified Stories" },
    ],
  },
  TEACHER: {
    route: "/teacher",
    title: "Educator Classroom Studio",
    subtitle: "NCERT Polar Curriculum, AI Lesson Generation & Quizzes",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    allowedRoutes: ["/", "/teacher", "/education", "/weather", "/stations", "/research", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/teacher", label: "Teacher Studio" },
      { href: "/education", label: "Classroom" },
      { href: "/stations", label: "Stations" },
      { href: "/weather", label: "Live Weather" },
    ],
  },
  STUDENT: {
    route: "/student",
    title: "Student Polar Explorer",
    subtitle: "Interactive Lessons, Badges, Quizzes & Climate Telemetry",
    badgeColor: "bg-sky-50 text-sky-900 border-sky-200",
    allowedRoutes: ["/", "/student", "/education", "/weather", "/stations", "/research", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/student", label: "Student Hub" },
      { href: "/education", label: "Lessons & Quizzes" },
      { href: "/stations", label: "Stations" },
      { href: "/weather", label: "Weather" },
    ],
  },
  PUBLIC_USER: {
    route: "/student",
    title: "Citizen Polar Explorer",
    subtitle: "Live Polar Weather, Observatories & Published Research",
    badgeColor: "bg-sky-50 text-sky-900 border-sky-200",
    allowedRoutes: ["/", "/student", "/education", "/weather", "/stations", "/research", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/", label: "Overview" },
      { href: "/student", label: "Student Hub" },
      { href: "/stations", label: "Stations" },
      { href: "/weather", label: "Weather" },
    ],
  },
  ADMIN: {
    route: "/admin",
    title: "Admin Governance Portal",
    subtitle: "Role Verification Queue, Datasets & Security Audit",
    badgeColor: "bg-red-50 text-red-800 border-red-200",
    allowedRoutes: ["/", "/admin", "/scientist", "/researcher", "/teacher", "/student", "/workspace", "/documents", "/datasets", "/research", "/weather", "/stations", "/education", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/admin", label: "Admin Governance" },
      { href: "/scientist", label: "Scientist Portal" },
      { href: "/researcher", label: "Researcher Portal" },
      { href: "/teacher", label: "Teacher Studio" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Weather" },
    ],
  },
  SUPER_ADMIN: {
    route: "/admin",
    title: "Super Admin Governance & Security Portal",
    subtitle: "Full RBAC Governance, Role Verification Queue & Immutable Audit Logs",
    badgeColor: "bg-red-50 text-red-800 border-red-200",
    allowedRoutes: ["/", "/admin", "/scientist", "/researcher", "/teacher", "/student", "/workspace", "/documents", "/datasets", "/research", "/weather", "/stations", "/education", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/admin", label: "Admin Governance" },
      { href: "/scientist", label: "Scientist Portal" },
      { href: "/researcher", label: "Researcher Portal" },
      { href: "/teacher", label: "Teacher Studio" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Weather" },
    ],
  },
  OUTREACH_EDITOR: {
    route: "/admin",
    title: "Admin Governance",
    subtitle: "Governance and Editorial Oversight",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    allowedRoutes: ["/", "/admin", "/scientist", "/researcher", "/teacher", "/student", "/workspace", "/documents", "/research", "/media", "/explore", "/stations", "/weather", "/expeditions", "/education"],
    navLinks: [
      { href: "/admin", label: "Governance" },
      { href: "/documents", label: "Evidence Docs" },
      { href: "/research", label: "Publications" },
    ],
  },
};

export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  const publicPrefixes = [
    "/stations",
    "/weather",
    "/expeditions",
    "/research",
    "/education",
    "/media",
    "/explore",
    "/datasets",
    "/about",
  ];
  return publicPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function getRolePortalRoute(role?: string): string {
  if (!role) return "/";
  return ROLE_PORTAL_MAP[role]?.route || "/education";
}

export function getRolePortalLabel(role?: string): string {
  if (!role) return "Role Portal";
  return ROLE_PORTAL_MAP[role]?.title || "User Portal";
}

export function isRouteAllowedForRole(pathname: string, role?: string): boolean {
  if (isPublicRoute(pathname)) return true;
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

  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<"PUBLIC_USER" | "FIELD_SCIENTIST">("PUBLIC_USER");

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
    const handler = () => syncAuthState();
    const openModalHandler = () => {
      setAuthError(null);
      setModalOpen(true);
    };

    window.addEventListener("vistaar-auth-changed", handler);
    window.addEventListener("vistaar-open-auth-modal", openModalHandler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("vistaar-auth-changed", handler);
      window.removeEventListener("vistaar-open-auth-modal", openModalHandler);
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
      setModalOpen(false);
      window.dispatchEvent(new Event("vistaar-auth-changed"));
      const targetPortal = getRolePortalRoute(res.user?.role);
      router.push(targetPortal);
    }
  }

  async function handleLogin(targetEmail?: string, targetPass?: string) {
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: (targetEmail || email).trim(),
          password: targetPass || password,
        }),
      });
      completeSessionAndRedirect(res);
    } catch (err: any) {
      setAuthError(err?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
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
          role: signupRole,
          persona: signupRole === "FIELD_SCIENTIST" ? "SCIENTIST" : "STUDENT",
          organization: "VISTAAR Portal User",
        }),
      });
      completeSessionAndRedirect(res);
    } catch (err: any) {
      setAuthError(err?.message || "Could not register account. Email may already exist.");
    } finally {
      setSubmitting(false);
    }
  }

  const publicRoute = isPublicRoute(pathname);
  const routeAllowed = isRouteAllowedForRole(pathname, user?.role);

  // If visiting a strictly protected workspace and unauthenticated:
  if (!publicRoute && !user && !checking) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] w-full flex items-center justify-center px-3 sm:px-6 py-4">
        <div className="max-w-lg w-full ice-glass-strong rounded-3xl p-6 sm:p-7 text-center space-y-4 shadow-2xl border border-white/90">
          <div className="w-12 h-12 rounded-2xl bg-sky-100/80 border border-sky-300 text-sky-800 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6 text-sky-700" />
          </div>

          <div className="space-y-1.5">
            <Badge variant="scientific" className="text-xs px-2.5 py-0.5">
              Role-Protected Workspace
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In to Enter Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Route <code className="font-mono bg-sky-100/60 px-1.5 py-0.5 rounded text-sky-900">{pathname}</code> requires an authenticated role. Choose a 1-click role below or sign in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
            <button
              onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
              className="p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-sky-200 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <FlaskConical className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">Scientist Role</div>
                  <div className="text-[11px] text-slate-500">Opens /scientist</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
            </button>

            <button
              onClick={() => handleLogin("researcher@vistaar.ncpor.res.in", "Researcher@Vistaar2026!")}
              className="p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-sky-200 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <Compass className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">Researcher Role</div>
                  <div className="text-[11px] text-slate-500">Opens /researcher</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-all" />
            </button>

            <button
              onClick={() => handleLogin("teacher@vistaar.ncpor.res.in", "Teacher@Vistaar2026!")}
              className="p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-sky-200 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">Teacher Role</div>
                  <div className="text-[11px] text-slate-500">Opens /teacher</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-all" />
            </button>

            <button
              onClick={() => handleLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
              className="p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-sky-200 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">Student Role</div>
                  <div className="text-[11px] text-slate-500">Opens /student</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-all" />
            </button>

            <button
              onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
              className="p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-sky-200 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer group sm:col-span-2"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">Admin Governance</div>
                  <div className="text-[11px] text-slate-500">Opens /admin</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-all" />
            </button>
          </div>

          <div className="pt-4 border-t border-sky-200/80">
            <Link
              href="/"
              className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center space-x-1"
            >
              <span>← Return to Public Polar Explorer</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in but visiting a role route they aren't authorized for:
  if (!publicRoute && user && !routeAllowed) {
    const roleSpec = ROLE_PORTAL_MAP[user.role] || ROLE_PORTAL_MAP.PUBLIC_USER;
    return (
      <div className="min-h-[80vh] w-full flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-md w-full ice-glass-strong rounded-3xl p-8 text-center space-y-4 shadow-xl border border-white/90">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7 text-amber-700" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Workspace Restricted</h2>
          <p className="text-sm text-slate-600">
            Your role (<strong className="font-mono">{user.role}</strong>) does not have access to <code>{pathname}</code>.
          </p>
          <div className="pt-3">
            <Link
              href={roleSpec.route}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold text-sm shadow-md inline-flex items-center space-x-2"
            >
              <span>Go to My Role Workspace ({roleSpec.route})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      {/* Global Clean Sign-In Modal (Accessible from Navbar Sign-In Button) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg ice-glass-strong rounded-3xl p-7 sm:p-9 shadow-2xl border-2 border-white/95 relative space-y-5">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <MountainLogo size="md" />
              <div>
                <h3 className="text-2xl font-black text-slate-900">Sign In to VISTAAR</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Access authenticated polar researcher & governance tools
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-sky-100/70 border border-sky-200">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === "login"
                    ? "bg-white text-sky-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Existing Account
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === "signup"
                    ? "bg-white text-sky-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create User Account
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {authError}
              </div>
            )}

            {authMode === "login" ? (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scientist@vistaar.ncpor.res.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white/90 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white/90 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-extrabold text-sm shadow-md hover:from-sky-700 hover:to-cyan-700 transition-all cursor-pointer"
                  >
                    {submitting ? "Signing In..." : "Sign In →"}
                  </button>
                </form>

                <div className="pt-3 border-t border-sky-200/80 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Instant 1-Click Role Access (5 Roles):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-emerald-700 transition-all shadow-2xs cursor-pointer"
                    >
                      🔬 Scientist
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin("researcher@vistaar.ncpor.res.in", "Researcher@Vistaar2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-indigo-700 transition-all shadow-2xs cursor-pointer"
                    >
                      🧭 Researcher
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin("teacher@vistaar.ncpor.res.in", "Teacher@Vistaar2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-amber-700 transition-all shadow-2xs cursor-pointer"
                    >
                      📚 Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-sky-700 transition-all shadow-2xs cursor-pointer"
                    >
                      🐧 Student
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-red-700 transition-all shadow-2xs cursor-pointer col-span-2 sm:col-span-1"
                    >
                      🛡️ Admin
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Dr. Ananya Roy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white/90 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="user@university.edu.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white/90 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white/90 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Account Role (5 Primary Roles)</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white/90 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="STUDENT">Student / Citizen Learner</option>
                    <option value="TEACHER">School / University Educator</option>
                    <option value="RESEARCHER">Scientific Researcher (Analysis & Findings)</option>
                    <option value="SCIENTIST">Polar Scientist (Data Ingestion & Field Uploads)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-extrabold text-sm shadow-md hover:from-sky-700 hover:to-cyan-700 transition-all cursor-pointer"
                >
                  {submitting ? "Creating Account..." : "Create Account & Enter Portal"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
