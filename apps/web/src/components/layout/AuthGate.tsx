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
  SUPER_ADMIN: {
    route: "/admin",
    title: "Super Admin Governance & Security Portal",
    subtitle: "Full RBAC Governance, Role Verification Queue & Immutable Audit Logs",
    badgeColor: "bg-red-50 text-red-800 border-red-200",
    allowedRoutes: ["/", "/admin", "/workspace", "/documents", "/datasets", "/research", "/weather", "/stations", "/education", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/admin", label: "Admin Governance" },
      { href: "/workspace", label: "Review Studio" },
      { href: "/documents", label: "Document AI" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Weather" },
      { href: "/stations", label: "Stations" },
    ],
  },
  ADMIN: {
    route: "/admin",
    title: "Admin Governance Portal",
    subtitle: "Role Verification Queue, Datasets & Security Audit",
    badgeColor: "bg-red-50 text-red-800 border-red-200",
    allowedRoutes: ["/", "/admin", "/workspace", "/documents", "/datasets", "/research", "/weather", "/stations", "/education", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/admin", label: "Admin Governance" },
      { href: "/workspace", label: "Review Studio" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Weather" },
    ],
  },
  OUTREACH_EDITOR: {
    route: "/workspace",
    title: "Outreach Editor Studio",
    subtitle: "AI Outreach Generation, Fact Verification & PIB Dissemination",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    allowedRoutes: ["/", "/workspace", "/documents", "/research", "/media", "/explore", "/stations", "/weather", "/expeditions", "/education"],
    navLinks: [
      { href: "/workspace", label: "Editorial Studio" },
      { href: "/documents", label: "Evidence Docs" },
      { href: "/research", label: "Publications" },
      { href: "/media", label: "Media Assets" },
    ],
  },
  FIELD_SCIENTIST: {
    route: "/documents",
    title: "Field Scientist Workspace",
    subtitle: "Document AI Parsing, Field Submissions & NPDC Ingestion",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    allowedRoutes: ["/", "/documents", "/datasets", "/weather", "/stations", "/explore", "/expeditions", "/research", "/education", "/media"],
    navLinks: [
      { href: "/documents", label: "Document AI" },
      { href: "/datasets", label: "Datasets" },
      { href: "/weather", label: "Telemetry" },
      { href: "/stations", label: "Observatories" },
    ],
  },
  SCIENTIST: {
    route: "/documents",
    title: "Polar Scientist Workspace",
    subtitle: "Field Research, Datasets & Telemetry",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    allowedRoutes: ["/", "/documents", "/datasets", "/weather", "/stations", "/explore", "/expeditions", "/media", "/research", "/education"],
    navLinks: [
      { href: "/documents", label: "Research Uploads" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Weather" },
      { href: "/expeditions", label: "Expeditions" },
    ],
  },
  RESEARCHER: {
    route: "/explore",
    title: "Polar Researcher Knowledge Portal",
    subtitle: "Semantic RAG, NPDC Datasets & Scientific Reports",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    allowedRoutes: ["/", "/explore", "/datasets", "/documents", "/research", "/weather", "/stations", "/expeditions", "/education", "/media"],
    navLinks: [
      { href: "/explore", label: "Knowledge Search" },
      { href: "/datasets", label: "NPDC Datasets" },
      { href: "/weather", label: "Station Data" },
    ],
  },
  JOURNALIST: {
    route: "/media",
    title: "Journalist Press Portal",
    subtitle: "Verified PIB Bulletins, Media Kits & Station Facts",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    allowedRoutes: ["/", "/media", "/research", "/stations", "/expeditions", "/weather", "/explore", "/education"],
    navLinks: [
      { href: "/media", label: "Media Assets" },
      { href: "/research", label: "Verified Stories" },
      { href: "/stations", label: "Stations" },
    ],
  },
  TEACHER: {
    route: "/education",
    title: "Educator Classroom Portal",
    subtitle: "NCERT Polar Curriculum, Lesson Planning & Quizzes",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    allowedRoutes: ["/", "/education", "/weather", "/stations", "/research", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/education", label: "Teacher Classroom" },
      { href: "/stations", label: "Stations" },
      { href: "/weather", label: "Live Weather" },
    ],
  },
  STUDENT: {
    route: "/education",
    title: "Student Polar Explorer",
    subtitle: "Interactive Lessons, Badges, Quizzes & Polar Weather",
    badgeColor: "bg-sky-50 text-sky-900 border-sky-200",
    allowedRoutes: ["/", "/education", "/weather", "/stations", "/research", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/education", label: "Classroom" },
      { href: "/stations", label: "Stations" },
      { href: "/weather", label: "Weather" },
    ],
  },
  PUBLIC_USER: {
    route: "/education",
    title: "Citizen Polar Science Portal",
    subtitle: "Live Polar Weather, Observatories & Published Research",
    badgeColor: "bg-sky-50 text-sky-900 border-sky-200",
    allowedRoutes: ["/", "/education", "/weather", "/stations", "/research", "/media", "/explore", "/expeditions"],
    navLinks: [
      { href: "/", label: "Overview" },
      { href: "/stations", label: "Stations" },
      { href: "/weather", label: "Weather" },
      { href: "/education", label: "Classroom" },
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
      <div className="min-h-[85vh] w-full flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-lg w-full ice-glass-strong rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl border border-white/90">
          <div className="w-16 h-16 rounded-2xl bg-sky-100/80 border border-sky-300 text-sky-800 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8 text-sky-700" />
          </div>

          <div className="space-y-2">
            <Badge variant="scientific" className="text-xs px-3 py-1">
              Role-Protected Workspace
            </Badge>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Sign In to Enter Workspace
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Route <code className="font-mono bg-sky-100/60 px-2 py-0.5 rounded text-sky-900">{pathname}</code> requires an authenticated institutional role. Choose a 1-click role below or sign in.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
              className="w-full p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-sky-200 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">Super Admin Portal</div>
                  <div className="text-xs text-slate-500">Security Governance & Audit Queue</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
              className="w-full p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-sky-200 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <FlaskConical className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">Field Scientist Workspace</div>
                  <div className="text-xs text-slate-500">Document AI & NPDC Data Uploads</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => handleLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
              className="w-full p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-sky-200 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <Edit3 className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">Outreach Editor Studio</div>
                  <div className="text-xs text-slate-500">Claim Verification & PIB Publications</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
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
                    Or Instant 1-Click Role Login:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-emerald-700 transition-all shadow-2xs"
                    >
                      🔬 Field Scientist
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-blue-700 transition-all shadow-2xs"
                    >
                      ✍️ Outreach Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-amber-700 transition-all shadow-2xs"
                    >
                      🎓 Student / Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-sky-200 text-left font-bold text-slate-800 hover:text-red-700 transition-all shadow-2xs"
                    >
                      🛡️ Super Admin
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
                  <label className="font-bold text-slate-800 block mb-1">Account Role</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white/90 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="PUBLIC_USER">Citizen / Student Explorer</option>
                    <option value="FIELD_SCIENTIST">Field Scientist (Uploads)</option>
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
