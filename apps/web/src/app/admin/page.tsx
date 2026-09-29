"use client";

import { useEffect, useState } from "react";
import { Shield, Lock, Server, Activity, Database, Users, History, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("admin@vistaar.ncpor.res.in");
  const [password, setPassword] = useState("VistaarAdmin@2026!");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check existing login
    async function checkAuth() {
      try {
        const u = await fetchApi("/auth/me");
        setUser(u);
        loadSystemHealth();
        loadAuditLogs();
      } catch {
        // Not logged in
      }
    }
    checkAuth();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("vistaar_token", res.access_token);
      }
      setUser(res.user);
      loadSystemHealth();
      loadAuditLogs();
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("vistaar_token");
    }
    setUser(null);
  }

  async function loadSystemHealth() {
    try {
      const res = await fetchApi("http://localhost:8000/health/ready");
      setHealthData(res);
    } catch (e: any) {
      setHealthData({ status: "error", error: e.message });
    }
  }

  async function loadAuditLogs() {
    try {
      const res = await fetchApi("/audit?limit=25");
      setAuditLogs(res.items || []);
    } catch (e) {
      console.error("Failed to load audit logs", e);
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <Card className="shadow-lg border-vistaar-border bg-white">
          <CardHeader className="text-center p-6 pb-2">
            <div className="w-12 h-12 rounded-xl bg-vistaar-primary text-white flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold">VISTAAR Security Console</CardTitle>
            <CardDescription className="text-xs text-vistaar-muted">
              Ministry of Earth Sciences / NCPOR Institutional Access
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {loginError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-vistaar-danger">
                  {loginError}
                </div>
              )}
              <div className="space-y-1">
                <label className="font-semibold text-vistaar-text block">Official Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-vistaar-border bg-vistaar-bg text-vistaar-text focus:outline-none focus:ring-2 focus:ring-vistaar-primary"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-vistaar-text block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-vistaar-border bg-vistaar-bg text-vistaar-text focus:outline-none focus:ring-2 focus:ring-vistaar-primary"
                  required
                />
              </div>
              <Button type="submit" size="md" className="w-full mt-2" disabled={loading}>
                {loading ? "Authenticating..." : "Sign In to Admin Console"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-vistaar-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-primary uppercase tracking-wide mb-1">
            <Shield className="w-4 h-4" />
            <span>Institutional Governance & Observability</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            Administration & Audit Console
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Signed in as <strong>{user.email}</strong> ({user.role})
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      {/* Subsystem Readiness Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="p-4 pb-2 border-b border-vistaar-border">
            <CardTitle className="text-xs uppercase font-bold text-vistaar-muted flex items-center space-x-2">
              <Database className="w-4 h-4 text-vistaar-primary" />
              <span>MongoDB Atlas Cluster</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-vistaar-muted">Status:</span>
              <Badge variant={healthData?.checks?.database?.status === "connected" ? "success" : "danger"}>
                {healthData?.checks?.database?.status || "Checking..."}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-vistaar-muted">Database:</span>
              <span className="font-semibold text-vistaar-text">{healthData?.checks?.database?.database_name || "vistaar_production"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-vistaar-muted">Roundtrip Latency:</span>
              <span className="font-semibold text-vistaar-scientific">
                {healthData?.checks?.database?.latency_ms !== undefined ? `${healthData.checks.database.latency_ms} ms` : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 border-b border-vistaar-border">
            <CardTitle className="text-xs uppercase font-bold text-vistaar-muted flex items-center space-x-2">
              <Activity className="w-4 h-4 text-vistaar-scientific" />
              <span>Worker Queue Subsystem</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-vistaar-muted">Queue Mode:</span>
              <Badge variant="scientific">{healthData?.checks?.queue?.mode || "in_memory"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-vistaar-muted">Status:</span>
              <Badge variant="success">ACTIVE</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 border-b border-vistaar-border">
            <CardTitle className="text-xs uppercase font-bold text-vistaar-muted flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-700" />
              <span>Storage Abstraction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-vistaar-muted">Storage Engine:</span>
              <Badge variant="success">{healthData?.checks?.storage?.status || "available"}</Badge>
            </div>
            <div className="text-[10px] text-vistaar-muted truncate pt-1">
              {healthData?.checks?.storage?.path}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Immutable Audit Log Table */}
      <Card>
        <CardHeader className="p-5 border-b border-vistaar-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <History className="w-4 h-4 text-vistaar-primary" />
              <span>Append-Only Institutional Audit Trail</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Every sensitive action (login, upload, verification, transition) is cryptographically recorded.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={loadAuditLogs}>
            Refresh Logs
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-vistaar-bg/80 border-b border-vistaar-border text-vistaar-muted uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Actor Email</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource Type</th>
                  <th className="p-3">Resource ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vistaar-border/60 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-vistaar-muted font-sans">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.event_id} className="hover:bg-vistaar-bg/40">
                      <td className="p-3 text-vistaar-muted">{log.timestamp?.replace("T", " ").slice(0, 19)}</td>
                      <td className="p-3 font-semibold text-vistaar-text">{log.actor_email}</td>
                      <td className="p-3">
                        <Badge variant="scientific">{log.action}</Badge>
                      </td>
                      <td className="p-3 text-vistaar-muted">{log.resource_type}</td>
                      <td className="p-3 text-[11px] text-vistaar-primary">{log.resource_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
