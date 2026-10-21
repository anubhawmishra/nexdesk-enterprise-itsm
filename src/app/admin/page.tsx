"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Users,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"settings" | "users">("settings");
  const [settings, setSettings] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, usersRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/users"),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettings(sData.settings);
        setPolicies(sData.policies || []);
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load administrative configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setSuccessMsg("System configuration updated successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update user role");
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setSuccessMsg("Role updated successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Platform Administration &amp; System Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Service desk organization parameters, business hours, and role assignments.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "settings"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building className="w-4 h-4" />
            General Parameters &amp; Hours
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "users"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            User Roles &amp; Permissions ({users.length})
          </button>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: System Settings Form */}
        {activeTab === "settings" && (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Enterprise Organization Settings
              </CardTitle>
              <CardDescription>
                Define default enterprise operational boundaries and automated routing parameters.
              </CardDescription>
            </CardHeader>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <Input
                  label="Organization / Company Name"
                  value={settings?.organizationName || ""}
                  onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                  required
                />

                <Input
                  label="Central IT Support Email"
                  type="email"
                  value={settings?.supportEmail || ""}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Default Organization Timezone"
                    value={settings?.defaultTimezone || "UTC"}
                    onChange={(e) => setSettings({ ...settings, defaultTimezone: e.target.value })}
                    options={[
                      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                      { value: "America/New_York", label: "Eastern Time (US & Canada)" },
                      { value: "America/Chicago", label: "Central Time (US & Canada)" },
                      { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
                      { value: "Asia/Kolkata", label: "IST (India Standard Time)" },
                    ]}
                  />

                  <Input
                    label="SLA Warning Threshold (Minutes Before Breach)"
                    type="number"
                    value={settings?.slaWarningThreshold || 30}
                    onChange={(e) =>
                      setSettings({ ...settings, slaWarningThreshold: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Support Hours Start"
                    type="time"
                    value={settings?.businessHoursStart || "08:00"}
                    onChange={(e) =>
                      setSettings({ ...settings, businessHoursStart: e.target.value })
                    }
                  />
                  <Input
                    label="Support Hours End"
                    type="time"
                    value={settings?.businessHoursEnd || "18:00"}
                    onChange={(e) => setSettings({ ...settings, businessHoursEnd: e.target.value })}
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.enableAutoAssignment || false}
                      onChange={(e) =>
                        setSettings({ ...settings, enableAutoAssignment: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Enable Automatic Ticket Dispatch to Support Specialists</span>
                  </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <Button type="submit" isLoading={saving} className="gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    Save Settings
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Tab 2: User Role Permissions */}
        {activeTab === "users" && (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">
                User Accounts &amp; Privilege Delegation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign administrative, manager, or support technician roles. Self-demotion is
                restricted for security.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Job Title</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Change Privilege</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{u.name}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{u.jobTitle || "Staff"}</td>
                      <td className="py-3.5 px-4 text-slate-400">{u.department?.name || "N/A"}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="IT_SUPPORT_AGENT">IT_SUPPORT_AGENT</option>
                          <option value="IT_MANAGER">IT_MANAGER</option>
                          <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
