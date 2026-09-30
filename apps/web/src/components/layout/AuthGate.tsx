"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { MountainLogo } from "@/components/ui/MountainLogo";

export const ROLE_PORTAL_MAP: Record<
  string,
  {
    route: string;
    title: string;
    subtitle: string;
    allowedInternalRoutes: string[];
  }
> = {
  SUPER_ADMIN: {
    route: "/admin",
    title: "Super Admin Governance & Command Portal",
    subtitle: "Full RBAC, Audit Trail, System Config, DR Snapshots & Publishing Governance",
    allowedInternalRoutes: ["/admin", "/workspace", "/documents", "/datasets"],
  },
  OUTREACH_EDITOR: {
    route: "/workspace",
    title: "Outreach Editor & Claim Verification Studio",
    subtitle: "4-Track AI Outreach Studio, Deterministic Claim Verification & PIB Publishing",
    allowedInternalRoutes: ["/workspace", "/documents", "/datasets"],
  },
  FIELD_SCIENTIST: {
    route: "/documents",
    title: "Field Scientist Document AI & Telemetry Portal",
    subtitle: "Scientific PDF Parsing, Bounding-Box Provenance & NPDC Dataset Ingestion",
    allowedInternalRoutes: ["/documents", "/datasets", "/workspace"],
  },
  PUBLIC_USER: {
    route: "/education",
    title: "Student & Citizen Polar Science Portal",
    subtitle: "NCERT Class 8–12 Interactive Modules, Quizzes, Weather & Published Research",
    allowedInternalRoutes: [],
  },
};

const PROTECTED_INTERNAL_ROUTES = ["/admin", "/workspace", "/documents", "/datasets"];

export function getRolePortalRoute(role?: string): string {
  if (!role) return "/";
  return ROLE_PORTAL_MAP[role]?.route || "/education";
}

export function getRolePortalLabel(role?: string): string {
  if (!role) return "Role Portal";
  return ROLE_PORTAL_MAP[role]?.title || "User Portal";
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isProtectedRoute = PROTECTED_INTERNAL_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

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
    } catch {
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
  }, [pathname]);

  async function handleGateLogin(loginEmail?: string, loginPass?: string) {
    const targetEmail = loginEmail || email;
    const targetPass = loginPass || password;
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("vistaar_token", res.access_token);
        localStorage.setItem("vistaar_refresh_token", res.refresh_token);
      }
      clearClientApiCache();
      setUser(res.user);
      window.dispatchEvent(new Event("vistaar-auth-changed"));
      const destination = getRolePortalRoute(res.user?.role);
      router.push(destination);
    } catch (err: any) {
      setAuthError(err?.message || "Invalid credentials. Please verify your NCPOR email and password.");
    } finally {
      setSubmitting(false);
    }
  }

  // Check if a logged-in user has role permission for a protected internal route
  const roleSpec = user?.role ? ROLE_PORTAL_MAP[user.role] : null;
  const isRoleAuthorizedForRoute =
    !isProtectedRoute ||
    (user &&
      roleSpec &&
      roleSpec.allowedInternalRoutes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      ));

  if (!checking && isProtectedRoute && (!user || !isRoleAuthorizedForRoute)) {
    return (
      <div className="min-h-[82vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Ice-Mountain Ambient Frost Glow */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200/35 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-2xl rounded-3xl ice-glass-strong p-8 sm:p-10 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-sky-200/70 pb-5">
            <div className="flex items-center space-x-3.5">
              <MountainLogo size="lg" />
              <div>
                <span className="inline-flex items-center space-x-1 text-[11px] font-mono uppercase tracking-widest font-bold text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-600" />
                  Restricted NCPOR / MoES Portal
                </span>
                <h1 className="text-2xl font-extrabold text-vistaar-text mt-1">
                  {user
                    ? `Insufficient Role Clearance (${user.role})`
                    : "Sign In Required to Access Internal Scientific Portal"}
                </h1>
                <p className="text-xs text-vistaar-muted mt-0.5">
                  {user
                    ? `Route "${pathname}" requires elevated clearance. Switch to an authorized role or open your designated portal.`
                    : `Without login, only verified public outreach pages are visible. Authenticate below to open your User Portal directly.`}
                </p>
              </div>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs font-semibold">
              {authError}
            </div>
          )}

          {/* Direct Credentials Login Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGateLogin();
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-white/65 p-4 rounded-2xl border border-sky-200/70"
          >
            <div>
              <label className="text-[11px] font-bold text-vistaar-text block mb-1">
                Official NCPOR / MoES Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@vistaar.ncpor.res.in"
                className="w-full px-3 py-2 text-xs rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-vistaar-text block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              {submitting ? "Opening Portal..." : "Sign In & Open Portal"}
            </button>
          </form>

          {/* 1-Click Direct Role Portal Launchers */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-mono uppercase tracking-wider font-bold text-vistaar-scientific">
              1-Click Institutional Role Login (Opens User Portal Directly)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleGateLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                className="p-3.5 rounded-2xl border border-sky-200/80 bg-white/75 hover:bg-white text-left transition-all shadow-2xs hover:shadow-md group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-vistaar-text flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Super Admin Portal</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-vistaar-muted mt-1">
                  Opens <code className="text-blue-700 font-mono">/admin</code> directly (Full Governance)
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleGateLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                className="p-3.5 rounded-2xl border border-sky-200/80 bg-white/75 hover:bg-white text-left transition-all shadow-2xs hover:shadow-md group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-vistaar-text flex items-center space-x-1.5">
                    <Edit3 className="w-4 h-4 text-cyan-700" />
                    <span>Outreach Editor Studio</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-700 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-vistaar-muted mt-1">
                  Opens <code className="text-cyan-800 font-mono">/workspace</code> directly (Review & Publish)
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleGateLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                className="p-3.5 rounded-2xl border border-sky-200/80 bg-white/75 hover:bg-white text-left transition-all shadow-2xs hover:shadow-md group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-vistaar-text flex items-center space-x-1.5">
                    <FlaskConical className="w-4 h-4 text-emerald-700" />
                    <span>Field Scientist Portal</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-vistaar-muted mt-1">
                  Opens <code className="text-emerald-800 font-mono">/documents</code> directly (PDF & NPDC Data)
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleGateLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                className="p-3.5 rounded-2xl border border-sky-200/80 bg-white/75 hover:bg-white text-left transition-all shadow-2xs hover:shadow-md group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-vistaar-text flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-slate-700" />
                    <span>Student Classroom Portal</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-vistaar-muted mt-1">
                  Opens <code className="text-slate-800 font-mono">/education</code> directly (NCERT Modules)
                </p>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-sky-200/60 flex items-center justify-between text-xs">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-blue-700 font-semibold hover:underline"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Public Dissemination Portal</span>
            </Link>
            {user && (
              <Link
                href={getRolePortalRoute(user.role)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold"
              >
                <span>Open My Authorized Portal ({getRolePortalRoute(user.role)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Active Role Portal Command Bar when authenticated */}
      {user && roleSpec && (
        <div className="bg-white/65 backdrop-blur-xl border-b border-sky-200/70 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-vistaar-text">{roleSpec.title}</span>
              <span className="hidden md:inline text-vistaar-muted">• {roleSpec.subtitle}</span>
            </div>
            <div className="flex items-center space-x-2">
              {roleSpec.allowedInternalRoutes.includes("/datasets") && (
                <Link
                  href="/datasets"
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all ${
                    pathname.startsWith("/datasets")
                      ? "bg-blue-600 text-white"
                      : "bg-white/80 text-vistaar-text border border-sky-200/80 hover:bg-white"
                  }`}
                >
                  <Database className="w-3 h-3" />
                  <span>NPDC Data</span>
                </Link>
              )}
              {roleSpec.allowedInternalRoutes.includes("/documents") && (
                <Link
                  href="/documents"
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all ${
                    pathname.startsWith("/documents")
                      ? "bg-blue-600 text-white"
                      : "bg-white/80 text-vistaar-text border border-sky-200/80 hover:bg-white"
                  }`}
                >
                  <FileSearch className="w-3 h-3" />
                  <span>Document AI</span>
                </Link>
              )}
              {roleSpec.allowedInternalRoutes.includes("/workspace") && (
                <Link
                  href="/workspace"
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all ${
                    pathname.startsWith("/workspace")
                      ? "bg-blue-600 text-white"
                      : "bg-white/80 text-vistaar-text border border-sky-200/80 hover:bg-white"
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Review Studio</span>
                </Link>
              )}
              {roleSpec.allowedInternalRoutes.includes("/admin") && (
                <Link
                  href="/admin"
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all ${
                    pathname.startsWith("/admin")
                      ? "bg-blue-600 text-white"
                      : "bg-white/80 text-vistaar-text border border-sky-200/80 hover:bg-white"
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Admin Console</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
