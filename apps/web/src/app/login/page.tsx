"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Lock,
  UserPlus,
  LogIn,
  ArrowRight,
  Sparkles,
  Edit3,
  FlaskConical,
  GraduationCap,
  CheckCircle2,
  Building2,
  User,
  Mail,
  KeyRound,
} from "lucide-react";
import { MountainLogo } from "@/components/ui/MountainLogo";
import { Badge } from "@/components/ui/badge";
import { fetchApi, clearClientApiCache } from "@/lib/api";
import { getRolePortalLabel, getRolePortalRoute } from "@/components/layout/AuthGate";

const POLAR_BEAR_HERO_IMG =
  "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=1800&q=85";

function LoginSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign-Up State (Strictly Non-Admin: PUBLIC_USER or FIELD_SCIENTIST)
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupOrg, setSignupOrg] = useState("");
  const [signupRole, setSignupRole] = useState<"PUBLIC_USER" | "FIELD_SCIENTIST">("PUBLIC_USER");
  const [signupPersona, setSignupPersona] = useState<"STUDENT" | "TEACHER" | "JOURNALIST" | "SCIENTIST">("STUDENT");

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup") setMode("signup");
    else if (m === "login") setMode("login");
  }, [searchParams]);

  function completeAuthSession(res: any, label: string) {
    if (res?.access_token && typeof window !== "undefined") {
      localStorage.setItem("vistaar_token", res.access_token);
      if (res.refresh_token) {
        localStorage.setItem("vistaar_refresh_token", res.refresh_token);
      }
      if (res.user) {
        localStorage.setItem("vistaar_user", JSON.stringify(res.user));
      }
      clearClientApiCache();
      window.dispatchEvent(new Event("vistaar-auth-changed"));
      const targetPortal = getRolePortalRoute(res.user?.role);
      setSuccessMsg(`${label} Redirecting to ${getRolePortalLabel(res.user?.role)} (${targetPortal})...`);
      router.push(targetPortal);
    }
  }

  async function handleLogin(emailOverride?: string, passwordOverride?: string) {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const email = (emailOverride ?? loginEmail).trim();
      const password = passwordOverride ?? loginPassword;
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      completeAuthSession(res, "Authenticated successfully!");
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
          role: signupRole, // Strictly PUBLIC_USER or FIELD_SCIENTIST (never SUPER_ADMIN)
          persona: signupPersona,
          organization: signupOrg.trim() || "Public Citizen / Academic Portal",
        }),
      });
      completeAuthSession(res, "User account created!");
    } catch (err: any) {
      setError(err?.message || "Registration failed. This email may already be registered.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] px-4 sm:px-6 lg:px-10 py-5 flex items-center justify-center overflow-x-hidden">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN (7 cols): Big Polar Bear & Ice-Mountain Showcase */}
        <div className="lg:col-span-7 rounded-3xl overflow-hidden relative min-h-[480px] flex flex-col justify-between p-6 sm:p-10 text-white shadow-xl border-2 border-white/80">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url('${POLAR_BEAR_HERO_IMG}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061527]/95 via-[#08223E]/55 to-[#08223E]/30" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <MountainLogo size="lg" />
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-sky-200 font-bold block">
                  NCPOR • MINISTRY OF EARTH SCIENCES
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  VISTAAR <span className="text-sky-300">(विस्तार)</span> Portal Gate
                </h1>
              </div>
            </div>
            <Badge variant="scientific" className="bg-white/90 text-sky-900 border-white">
              Arctic • Antarctic • Himalayas
            </Badge>
          </div>

          {/* Bottom Polar Bear Sentinel Callout & Role Routing Guide */}
          <div className="relative z-10 space-y-4 max-w-2xl pt-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-xs font-mono text-sky-100">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>Sentinel of the Cryosphere • Direct Role Portal Routing</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-white">
              One Unified Polar Gateway. Instant Role-Based Workspace Launch.
            </h2>

            <p className="text-xs sm:text-sm text-sky-100/95 leading-relaxed">
              Sign in with your institutional credentials or register a new **User Account** (Student, Educator, Journalist, or Field Scientist). Immediately upon authentication, your designated Role Portal opens directly.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25">
                <span className="font-mono text-[10px] text-sky-200 block">SUPER_ADMIN</span>
                <span className="font-bold text-white block truncate">Opens /admin</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25">
                <span className="font-mono text-[10px] text-sky-200 block">OUTREACH_EDITOR</span>
                <span className="font-bold text-white block truncate">Opens /workspace</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25">
                <span className="font-mono text-[10px] text-sky-200 block">FIELD_SCIENTIST</span>
                <span className="font-bold text-white block truncate">Opens /documents</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25">
                <span className="font-mono text-[10px] text-sky-200 block">PUBLIC_USER</span>
                <span className="font-bold text-white block truncate">Opens /education</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Ice-Mountain Glassmorphic Sign In & User Sign Up Card */}
        <div className="lg:col-span-5 rounded-3xl ice-glass-strong p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-sky-100/80 border border-sky-200/80">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-sm"
                    : "text-vistaar-text hover:bg-white/60"
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-sm"
                    : "text-vistaar-text hover:bg-white/60"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up (User Only)</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === "login" ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-vistaar-text">
                    Institutional & User Sign In
                  </h2>
                  <p className="text-xs text-vistaar-muted mt-0.5">
                    Enter your registered email and password to open your Role Portal directly.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="font-bold text-vistaar-text block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-vistaar-muted absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="user@vistaar.ncpor.res.in"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>{loading ? "Opening Role Portal..." : "Sign In & Open My Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* 1-Click Instant Role Demo Buttons */}
                <div className="pt-4 border-t border-sky-200/80 space-y-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-vistaar-scientific block">
                    1-Click Role Portal Demo Access (Opens Directly)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleLogin("student@vistaar.ncpor.res.in", "Student@Vistaar2026!")}
                      className="p-2.5 rounded-xl border border-sky-200 bg-white/85 hover:bg-white text-left transition-all cursor-pointer"
                    >
                      <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Student User</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-muted block mt-0.5">
                        Opens /education
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLogin("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!")}
                      className="p-2.5 rounded-xl border border-sky-200 bg-white/85 hover:bg-white text-left transition-all cursor-pointer"
                    >
                      <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Field Scientist</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-muted block mt-0.5">
                        Opens /documents
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLogin("editor@vistaar.ncpor.res.in", "Editor@Vistaar2026!")}
                      className="p-2.5 rounded-xl border border-sky-200 bg-white/85 hover:bg-white text-left transition-all cursor-pointer"
                    >
                      <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Outreach Editor</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-muted block mt-0.5">
                        Opens /workspace
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLogin("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!")}
                      className="p-2.5 rounded-xl border border-sky-200 bg-white/85 hover:bg-white text-left transition-all cursor-pointer"
                    >
                      <span className="font-bold text-vistaar-text flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-red-600" />
                        <span>Super Admin</span>
                      </span>
                      <span className="text-[10px] font-mono text-vistaar-muted block mt-0.5">
                        Opens /admin
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold text-vistaar-text">
                      Create User Account (Non-Admin)
                    </h2>
                    <p className="text-xs text-vistaar-muted mt-0.5">
                      Register as a Public User (Student / Educator / Journalist) or Field Scientist.
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 shrink-0">
                    No Admin Sign-Up
                  </Badge>
                </div>

                <form onSubmit={handleSignup} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-vistaar-text block mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-vistaar-muted absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="Aarav Sharma"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                        placeholder="aarav@student.edu.in"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-vistaar-text block mb-1">
                      Password (minimum 8 characters)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-vistaar-muted absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-vistaar-text block mb-1">
                        User Role (Non-Admin Only)
                      </label>
                      <select
                        value={signupRole}
                        onChange={(e) => {
                          const r = e.target.value as "PUBLIC_USER" | "FIELD_SCIENTIST";
                          setSignupRole(r);
                          if (r === "FIELD_SCIENTIST") setSignupPersona("SCIENTIST");
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="PUBLIC_USER">Public User (Opens /education)</option>
                        <option value="FIELD_SCIENTIST">Field Scientist (Opens /documents)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-vistaar-text block mb-1">
                        Primary Persona
                      </label>
                      <select
                        value={signupPersona}
                        onChange={(e) =>
                          setSignupPersona(
                            e.target.value as "STUDENT" | "TEACHER" | "JOURNALIST" | "SCIENTIST"
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="STUDENT">Student (NCERT 8–12)</option>
                        <option value="TEACHER">Teacher / Educator</option>
                        <option value="JOURNALIST">Accredited Journalist</option>
                        <option value="SCIENTIST">Polar Researcher</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-50/90 border border-sky-200/80 text-[11px] text-vistaar-muted flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-vistaar-scientific shrink-0" />
                    <span>
                      Privilege Escalation Guard: Self-registration for <code>SUPER_ADMIN</code> is strictly blocked.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{loading ? "Creating Account & Opening Portal..." : "Sign Up & Open My User Portal"}</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-sky-200/70 flex items-center justify-between text-xs">
            <Link href="/" className="font-bold text-vistaar-scientific hover:underline">
              ← Back to Polar Bear Landing Page
            </Link>
            <span className="font-mono text-[10px] text-vistaar-muted">
              JWT + RBAC Enforced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center text-xs font-mono text-vistaar-scientific">
          Loading VISTAAR Authentication Gateway...
        </div>
      }
    >
      <LoginSignupContent />
    </Suspense>
  );
}
