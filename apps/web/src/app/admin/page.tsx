"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Lock,
  Server,
  Activity,
  Database,
  Users,
  History,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
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
  const [usersList, setUsersList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "audit" | "submissions">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const u = await fetchApi("/auth/me");
        setUser(u);
        loadData();
      } catch {
        // Not authenticated
      }
    }
    checkAuth();
  }, []);

  async function loadData() {
    await Promise.all([
      loadSystemHealth(),
      loadAuditLogs(),
      loadUsers(),
      loadSubmissions()
    ]);
  }

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
        localStorage.setItem("vistaar_refresh_token", res.refresh_token);
      }
      setUser(res.user);
      loadData();
    } catch (err: any) {
      setLoginError(err.message || "Authentication failed. Verify credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout network error
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vistaar_token");
        localStorage.removeItem("vistaar_refresh_token");
      }
      setUser(null);
    }
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
      const res = await fetchApi("/audit?limit=50");
      setAuditLogs(res.items || []);
    } catch (e) {
      console.error("Failed to load audit logs", e);
    }
  }

  async function loadUsers() {
    try {
      let query = "/auth/users?limit=50";
      if (userRoleFilter) query += `&role=${userRoleFilter}`;
      if (userSearch) query += `&search=${encodeURIComponent(userSearch)}`;
      const res = await fetchApi(query);
      setUsersList(res.items || []);
    } catch (e) {
      console.error("Failed to load users", e);
    }
  }

  async function loadSubmissions() {
    try {
      const res = await fetchApi("/auth/submissions");
      setSubmissionsList(res.items || []);
    } catch (e) {
      console.error("Failed to load submissions", e);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await fetchApi(`/auth/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole, reason: "Administrative governance re-assignment" })
      });
      showNotification(`Role updated to ${newRole}`);
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      showNotification(err.message || "Failed to update role", true);
    }
  }

  async function handleStatusToggle(userId: string, currentStatus: boolean) {
    try {
      await fetchApi(`/auth/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus, reason: "Account status toggle" })
      });
      showNotification(`User account ${!currentStatus ? "activated" : "suspended"}`);
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      showNotification(err.message || "Failed to toggle status", true);
    }
  }

  function showNotification(msg: string, isError = false) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
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
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-vistaar-danger flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
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
      {/* Toast / Notification */}
      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-blue-500 hover:text-blue-700">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-vistaar-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-vistaar-primary uppercase tracking-wide mb-1">
            <Shield className="w-4 h-4" />
            <span>Institutional Governance & Observability (Prompt 07)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-vistaar-text">
            Administration & Governance Console
          </h1>
          <p className="text-sm text-vistaar-muted mt-1">
            Signed in as <strong>{user.email}</strong> ({user.role})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-vistaar-border pb-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "overview"
              ? "bg-vistaar-primary text-white"
              : "text-vistaar-muted hover:text-vistaar-text hover:bg-white"
          }`}
        >
          Infrastructure & Health
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "users"
              ? "bg-vistaar-primary text-white"
              : "text-vistaar-muted hover:text-vistaar-text hover:bg-white"
          }`}
        >
          User Accounts & RBAC
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "audit"
              ? "bg-vistaar-primary text-white"
              : "text-vistaar-muted hover:text-vistaar-text hover:bg-white"
          }`}
        >
          Append-Only Audit Trail
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "submissions"
              ? "bg-vistaar-primary text-white"
              : "text-vistaar-muted hover:text-vistaar-text hover:bg-white"
          }`}
        >
          Scientist Submissions & IDOR
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
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
                  <span>Storage Engine</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-vistaar-muted">Status:</span>
                  <Badge variant="success">{healthData?.checks?.storage?.status || "available"}</Badge>
                </div>
                <div className="text-[10px] text-vistaar-muted truncate pt-1">
                  {healthData?.checks?.storage?.path}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick RBAC Matrix Card */}
          <Card>
            <CardHeader className="p-5 border-b border-vistaar-border">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <Shield className="w-4 h-4 text-vistaar-primary" />
                <span>VISTAAR Institutional RBAC Matrix (Prompt 07 Contract)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Guarantees least privilege, horizontal/vertical escalation prevention, and deterministic role segregation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-vistaar-bg border-b border-vistaar-border font-semibold text-vistaar-text">
                    <tr>
                      <th className="p-2.5">Platform Role</th>
                      <th className="p-2.5">Scope & Capabilities</th>
                      <th className="p-2.5">IDOR & Isolation Guard</th>
                      <th className="p-2.5">Public Personas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vistaar-border">
                    <tr>
                      <td className="p-2.5 font-bold text-red-700">SUPER_ADMIN</td>
                      <td className="p-2.5 text-vistaar-muted">Full administrative governance: user roles, audit trails, datasets, settings, system recovery.</td>
                      <td className="p-2.5"><Badge variant="default">Global Access</Badge></td>
                      <td className="p-2.5 text-vistaar-muted">N/A (Administrative Only)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-blue-700">OUTREACH_EDITOR</td>
                      <td className="p-2.5 text-vistaar-muted">Review, verify deterministic claims, approve, publish multi-track content, export press kits.</td>
                      <td className="p-2.5"><Badge variant="scientific">Editorial Override</Badge></td>
                      <td className="p-2.5 text-vistaar-muted">N/A (Editorial Only)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-emerald-700">FIELD_SCIENTIST</td>
                      <td className="p-2.5 text-vistaar-muted">Upload raw datasets & documents, create drafts, inspect own submissions. Cannot self-publish.</td>
                      <td className="p-2.5"><Badge variant="success">Strict Own Submissions</Badge></td>
                      <td className="p-2.5 text-vistaar-muted">N/A (Field Operations)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700">PUBLIC_USER</td>
                      <td className="p-2.5 text-vistaar-muted">Explore published datasets, search, classroom education modules, media library.</td>
                      <td className="p-2.5"><Badge variant="outline">Read-Only Public</Badge></td>
                      <td className="p-2.5 font-medium text-vistaar-primary">Student, Teacher, Journalist, Scientist</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: USERS & RBAC */}
      {activeTab === "users" && (
        <Card>
          <CardHeader className="p-5 border-b border-vistaar-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center space-x-2">
                  <Users className="w-4 h-4 text-vistaar-primary" />
                  <span>Institutional User Directory & RBAC Governance</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Inspect user accounts, assign roles, and toggle access permissions with real-time audit logging.
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search user or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded border border-vistaar-border bg-vistaar-bg text-vistaar-text focus:outline-none"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                  }}
                  className="px-3 py-1.5 text-xs rounded border border-vistaar-border bg-vistaar-bg text-vistaar-text focus:outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="OUTREACH_EDITOR">OUTREACH_EDITOR</option>
                  <option value="FIELD_SCIENTIST">FIELD_SCIENTIST</option>
                  <option value="PUBLIC_USER">PUBLIC_USER</option>
                </select>
                <Button size="sm" variant="outline" onClick={loadUsers}>
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-vistaar-bg border-b border-vistaar-border text-vistaar-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Public Persona</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vistaar-border/60">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-vistaar-muted font-sans">
                        No users found matching query.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u: any) => (
                      <tr key={u.id} className="hover:bg-vistaar-bg/40">
                        <td className="p-3 font-semibold text-vistaar-text">{u.name}</td>
                        <td className="p-3 font-mono text-vistaar-muted">{u.email}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              u.role === "SUPER_ADMIN"
                                ? "danger"
                                : u.role === "OUTREACH_EDITOR"
                                ? "scientific"
                                : u.role === "FIELD_SCIENTIST"
                                ? "success"
                                : "outline"
                            }
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3 text-vistaar-muted">
                          {u.persona || "—"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              u.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {u.is_active ? "ACTIVE" : "SUSPENDED"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center space-x-2">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="px-2 py-1 text-[11px] rounded border border-vistaar-border bg-white text-vistaar-text focus:outline-none"
                            >
                              <option value="PUBLIC_USER">PUBLIC_USER</option>
                              <option value="FIELD_SCIENTIST">FIELD_SCIENTIST</option>
                              <option value="OUTREACH_EDITOR">OUTREACH_EDITOR</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>

                            <button
                              onClick={() => handleStatusToggle(u.id, u.is_active)}
                              title={u.is_active ? "Suspend account" : "Activate account"}
                              className={`p-1 rounded border transition-colors ${
                                u.is_active
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <Card>
          <CardHeader className="p-5 border-b border-vistaar-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center space-x-2">
                <History className="w-4 h-4 text-vistaar-primary" />
                <span>Append-Only Institutional Audit Trail</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Every sensitive event (login, logout, upload, review, approval, role change) is immutably recorded.
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
                    <th className="p-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vistaar-border/60 font-mono">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-vistaar-muted font-sans">
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
                        <td className="p-3 text-[10px] text-vistaar-muted max-w-xs truncate">
                          {log.reason ? `Reason: ${log.reason}` : JSON.stringify(log.details || {})}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: SUBMISSIONS & IDOR */}
      {activeTab === "submissions" && (
        <Card>
          <CardHeader className="p-5 border-b border-vistaar-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Field Scientist Submissions & IDOR Protection Monitor</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Field Scientists can only inspect their own submissions. Outreach Editors and Super Admins oversee review pipelines.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={loadSubmissions}>
              Refresh Submissions
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-vistaar-bg/80 border-b border-vistaar-border text-vistaar-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Submission ID</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Station</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Author Email</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vistaar-border/60">
                  {submissionsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-vistaar-muted font-sans">
                        No draft submissions submitted yet.
                      </td>
                    </tr>
                  ) : (
                    submissionsList.map((sub: any) => (
                      <tr key={sub.submission_id} className="hover:bg-vistaar-bg/40 font-mono text-xs">
                        <td className="p-3 text-vistaar-primary font-bold">{sub.submission_id}</td>
                        <td className="p-3 font-sans font-semibold text-vistaar-text">{sub.title}</td>
                        <td className="p-3 uppercase">{sub.station_id}</td>
                        <td className="p-3"><Badge variant="outline">{sub.category}</Badge></td>
                        <td className="p-3 text-vistaar-muted">{sub.author_email}</td>
                        <td className="p-3"><Badge variant="scientific">{sub.status}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
