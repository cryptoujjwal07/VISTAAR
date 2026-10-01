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
  Compass,
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

  // Sign-Up State (Strictly Non-Admin: STUDENT, TEACHER, RESEARCHER, SCIENTIST)
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupOrg, setSignupOrg] = useState("");
  const [signupRole, setSignupRole] = useState<"STUDENT" | "TEACHER" | "RESEARCHER" | "SCIENTIST">("STUDENT");
  const [signupPersona, setSignupPersona] = useState<"STUDENT" | "TEACHER" | "RESEARCHER" | "SCIENTIST">("STUDENT");

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

  function handleSelectDemoRole(email: string, password: string, roleName: string) {
    // 1. Immediately auto-populate ID and password into input fields
    setLoginEmail(email);
    setLoginPassword(password);
    setError(null);
    setSuccessMsg(`Auto-fetched credentials for ${roleName}! Authenticating...`);
    // 2. Execute login
    handleLogin(email, password);
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
          role: signupRole,
          persona: signupPersona,
          organization: signupOrg.trim() || "National Polar Research / Education Network",
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
    <div className="w-full min-h-[calc(100dvh-4.75rem)] lg:h-[calc(100dvh-4.75rem)] px-3 sm:px-5 lg:px-8 py-2 lg:py-3 flex items-center justify-center overflow-y-auto lg:overflow-hidden">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-stretch lg:h-[min(640px,calc(100dvh-5.5rem))]">
        {/* LEFT COLUMN (7 cols): Big Polar Bear & Ice-Mountain Showcase */}
        <div className="lg:col-span-7 rounded-2xl lg:rounded-3xl overflow-hidden relative flex flex-col justify-between p-4 sm:p-5 lg:p-6 text-white shadow-xl border border-white/70 min-h-[300px] lg:min-h-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url('${POLAR_BEAR_HERO_IMG}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061527]/95 via-[#08223E]/60 to-[#08223E]/35" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <MountainLogo size="md" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-200 font-bold block">
                  NCPOR • MINISTRY OF EARTH SCIENCES
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                  VISTAAR <span className="text-sky-300 font-normal">(विस्तार)</span> Portal Gate
                </h1>
              </div>
            </div>
            <Badge variant="scientific" className="bg-white/90 text-sky-900 border-white text-[10px] py-0.5 px-2">
              Arctic • Antarctic • Himalayas
            </Badge>
          </div>

          {/* Bottom Polar Sentinel Callout & Direct Role Badges */}
          <div className="relative z-10 space-y-2 pt-3">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-mono text-sky-100">
              <Sparkles className="w-3 h-3 text-sky-300" />
              <span>Sentinel of the Cryosphere • Direct Role Portals</span>
            </div>

            <h2 className="text-lg sm:text-xl lg:text-2xl font-black leading-snug text-white">
              One Unified Polar Gateway. Instant Role-Based Workspace Launch.
            </h2>

            <p className="text-[11px] sm:text-xs text-sky-100/90 leading-relaxed max-w-xl">
              Sign in with institutional credentials or click any demo role to auto-fetch credentials and enter its workspace instantly.
            </p>

            <div className="grid grid-cols-5 gap-1.5 pt-1 text-[11px]">
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <span className="font-mono text-[9px] text-emerald-300 block font-bold">SCIENTIST</span>
                <span className="font-semibold text-white block text-[10px] truncate">/scientist</span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <span className="font-mono text-[9px] text-indigo-300 block font-bold">RESEARCHER</span>
                <span className="font-semibold text-white block text-[10px] truncate">/researcher</span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <span className="font-mono text-[9px] text-amber-300 block font-bold">TEACHER</span>
                <span className="font-semibold text-white block text-[10px] truncate">/teacher</span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <span className="font-mono text-[9px] text-sky-300 block font-bold">STUDENT</span>
                <span className="font-semibold text-white block text-[10px] truncate">/student</span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <span className="font-mono text-[9px] text-red-300 block font-bold">ADMIN</span>
                <span className="font-semibold text-white block text-[10px] truncate">/admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Ice-Mountain Glassmorphic Sign In & User Sign Up Card */}
        <div className="lg:col-span-5 rounded-2xl lg:rounded-3xl ice-glass-strong p-4 sm:p-5 flex flex-col justify-between shadow-xl border border-white/70 overflow-y-auto">
          <div className="space-y-3">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-sky-100/80 border border-sky-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-xs"
                    : "text-vistaar-text hover:bg-white/60"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In to Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-xs"
                    : "text-vistaar-text hover:bg-white/60"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up (User)</span>
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === "login" ? (
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                  className="space-y-2.5 text-xs"
                >
                  <div>
                    <label className="font-bold text-vistaar-text block mb-0.5 text-[11px]">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-vistaar-muted absolute left-3 top-2" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="user@vistaar.ncpor.res.in"
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-vistaar-text block mb-0.5 text-[11px]">
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-vistaar-muted absolute left-3 top-2" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-xs"
                  >
                    <span>{loading ? "Authenticating..." : "Sign In & Open My Portal"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* 1-Click Instant Role Demo Buttons with Direct Credential Fetch */}
                <div className="pt-2.5 border-t border-sky-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-vistaar-scientific">
                      1-Click Demo Logins (Auto-Fills ID/Password)
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-200">
                      Live
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectDemoRole("scientist@vistaar.ncpor.res.in", "Scientist@Vistaar2026!", "Scientist")}
                      className="p-2 rounded-xl border border-sky-200 bg-white/90 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <span>Scientist</span>
                        </span>
                        <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100/70 px-1 rounded-xs">/scientist</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block truncate mt-0.5">
                        scientist@vistaar...
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectDemoRole("researcher@vistaar.ncpor.res.in", "Researcher@Vistaar2026!", "Researcher")}
                      className="p-2 rounded-xl border border-sky-200 bg-white/90 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                          <Compass className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                          <span>Researcher</span>
                        </span>
                        <span className="text-[9px] font-mono text-indigo-700 bg-indigo-100/70 px-1 rounded-xs">/researcher</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block truncate mt-0.5">
                        researcher@vistaar...
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectDemoRole("teacher@vistaar.ncpor.res.in", "Teacher@Vistaar2026!", "Teacher")}
                      className="p-2 rounded-xl border border-sky-200 bg-white/90 hover:bg-amber-50 hover:border-amber-300 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                          <span>Teacher</span>
                        </span>
                        <span className="text-[9px] font-mono text-amber-700 bg-amber-100/70 px-1 rounded-xs">/teacher</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block truncate mt-0.5">
                        teacher@vistaar...
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectDemoRole("student@vistaar.ncpor.res.in", "Student@Vistaar2026!", "Student")}
                      className="p-2 rounded-xl border border-sky-200 bg-white/90 hover:bg-sky-50 hover:border-sky-300 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
                          <span>Student</span>
                        </span>
                        <span className="text-[9px] font-mono text-sky-700 bg-sky-100/70 px-1 rounded-xs">/student</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block truncate mt-0.5">
                        student@vistaar...
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectDemoRole("admin@vistaar.ncpor.res.in", "VistaarAdmin@2026!", "Super Admin")}
                      className="p-2 rounded-xl border border-sky-200 bg-white/90 hover:bg-red-50 hover:border-red-300 text-left transition-all cursor-pointer col-span-2 group shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                          <Shield className="w-3.5 h-3.5 text-red-600 group-hover:scale-110 transition-transform" />
                          <span>Super Admin (NCPOR Governance)</span>
                        </span>
                        <span className="text-[9px] font-mono text-red-700 bg-red-100/70 px-1 rounded-xs">/admin</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block truncate mt-0.5">
                        admin@vistaar.ncpor.res.in • Full Access & Verification
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-vistaar-text">
                    Create User Account
                  </h3>
                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] py-0 px-1.5">
                    User Role
                  </Badge>
                </div>

                <form onSubmit={handleSignup} className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-vistaar-text block mb-0.5 text-[10px]">Full Name</label>
                      <div className="relative">
                        <User className="w-3 h-3 text-vistaar-muted absolute left-2.5 top-2" />
                        <input
                          type="text"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="Aarav Sharma"
                          className="w-full pl-7 pr-2 py-1.5 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          required
                          minLength={2}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-vistaar-text block mb-0.5 text-[10px]">Institution</label>
                      <div className="relative">
                        <Building2 className="w-3 h-3 text-vistaar-muted absolute left-2.5 top-2" />
                        <input
                          type="text"
                          value={signupOrg}
                          onChange={(e) => setSignupOrg(e.target.value)}
                          placeholder="School / University"
                          className="w-full pl-7 pr-2 py-1.5 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-vistaar-text block mb-0.5 text-[10px]">Email Address</label>
                    <div className="relative">
                      <Mail className="w-3 h-3 text-vistaar-muted absolute left-2.5 top-2" />
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="user@ncpor.res.in"
                        className="w-full pl-7 pr-2 py-1.5 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-vistaar-text block mb-0.5 text-[10px]">Password (min 8 chars)</label>
                    <div className="relative">
                      <KeyRound className="w-3 h-3 text-vistaar-muted absolute left-2.5 top-2" />
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-7 pr-2 py-1.5 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-vistaar-text block mb-0.5 text-[10px]">Select Role</label>
                      <select
                        value={signupRole}
                        onChange={(e) => {
                          const r = e.target.value as "STUDENT" | "TEACHER" | "RESEARCHER" | "SCIENTIST";
                          setSignupRole(r);
                          setSignupPersona(r);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                      >
                        <option value="STUDENT">Student (/student)</option>
                        <option value="TEACHER">Teacher (/teacher)</option>
                        <option value="RESEARCHER">Researcher (/researcher)</option>
                        <option value="SCIENTIST">Scientist (/scientist)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-vistaar-text block mb-0.5 text-[10px]">Domain Track</label>
                      <select
                        value={signupPersona}
                        onChange={(e) =>
                          setSignupPersona(
                            e.target.value as "STUDENT" | "TEACHER" | "RESEARCHER" | "SCIENTIST"
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-xl border border-sky-200 bg-white/90 text-vistaar-text font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                      >
                        <option value="STUDENT">Student (NCERT)</option>
                        <option value="TEACHER">Educator / Teacher</option>
                        <option value="RESEARCHER">Polar Researcher</option>
                        <option value="SCIENTIST">Field Scientist</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-xl bg-sky-50/90 border border-sky-200/80 text-[10px] text-vistaar-muted flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-vistaar-scientific shrink-0" />
                    <span>Admin accounts require direct institutional provision.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{loading ? "Creating..." : "Sign Up & Open Portal"}</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="pt-2 mt-2 border-t border-sky-200/70 flex items-center justify-between text-xs">
            <Link href="/" className="font-bold text-vistaar-scientific hover:underline text-[11px]">
              ← Polar Bear Landing
            </Link>
            <span className="font-mono text-[9px] text-vistaar-muted">
              JWT • RBAC Enforced
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
