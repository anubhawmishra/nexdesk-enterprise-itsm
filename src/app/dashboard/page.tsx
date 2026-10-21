"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  ClockAlert,
  CheckCircle2,
  Users,
  Laptop,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  MEDIUM: "#3b82f6",
  LOW: "#10b981",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "#a855f7",
  TRIAGED: "#6366f1",
  IN_PROGRESS: "#3b82f6",
  PENDING_USER: "#f59e0b",
  RESOLVED: "#10b981",
  CLOSED: "#64748b",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const priorityData = stats?.priorityBreakdown
    ? Object.entries(stats.priorityBreakdown).map(([name, count]) => ({
        name,
        count,
        color: PRIORITY_COLORS[name] || "#3b82f6",
      }))
    : [];

  const statusData = stats?.statusBreakdown
    ? Object.entries(stats.statusBreakdown).map(([name, count]) => ({
        name: name.replace(/_/g, " "),
        rawName: name,
        count,
        color: STATUS_COLORS[name] || "#3b82f6",
      }))
    : [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">IT Operations Dashboard</h2>
            <p className="text-xs text-slate-400 mt-1">
              Live enterprise support metrics, service level agreement health, and hardware
              inventory status.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={fetchStats} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/tickets">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                Submit Ticket
              </Button>
            </Link>
          </div>
        </div>

        {/* Primary Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Card className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Open Incidents</span>
              <AlertOctagon className="w-4 h-4 text-blue-400" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-white">
                {stats?.metrics?.openIncidents ?? 0}
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">Active in queue</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Awaiting Triage</span>
              <ClockAlert className="w-4 h-4 text-purple-400" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-purple-400">
                {stats?.metrics?.awaitingAssignment ?? 0}
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">Unassigned tickets</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">SLA Compliance</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-emerald-400">
                {stats?.metrics?.slaComplianceRate ?? 100}%
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">Target &gt; 95%</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Breached / Overdue</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-red-400">
                {stats?.metrics?.breachedCount ?? 0}
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">Requires escalation</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Avg Resolution</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-white">
                {stats?.metrics?.avgResolutionHours ?? 0}h
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">Across closed records</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Active Devices</span>
              <Laptop className="w-4 h-4 text-cyan-400" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-cyan-400">
                {stats?.assetStats?.IN_USE ?? 0}
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">Deployed in org</div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Priority Distribution Bar Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Incidents by Priority</CardTitle>
                <CardDescription>
                  Distribution across Critical (P1) to Low (P4) severity tiers
                </CardDescription>
              </div>
            </CardHeader>
            <div className="h-64 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorityData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [val, "Tickets"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Ticket Status Breakdown */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Tickets by Lifecycle Status</CardTitle>
                <CardDescription>
                  Current progression of recorded incidents and requests
                </CardDescription>
              </div>
            </CardHeader>
            <div className="h-64 w-full flex items-center justify-center">
              {loading ? (
                <Skeleton className="h-48 w-48 rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.filter((s: any) => Number(s.count) > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={4}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Two-Column Section: Urgent Attention Queue & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Urgent Attention Queue (2 cols) */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    High-Priority Incident Queue
                  </CardTitle>
                  <CardDescription>
                    Open Critical (P1) and High (P2) tickets requiring prompt action
                  </CardDescription>
                </div>
                <Link href="/tickets">
                  <span className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </CardHeader>

              <div className="space-y-2.5">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))
                ) : stats?.recentUrgentTickets?.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No open Critical or High priority tickets at this time.
                  </div>
                ) : (
                  stats?.recentUrgentTickets?.map((t: any) => (
                    <Link
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-colors"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold text-blue-400">
                            {t.ticketCode}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400 truncate">
                            {t.category?.name}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-200 truncate">{t.title}</p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                          <span>Requester: {t.requester?.name}</span>
                          <span>Assigned: {t.assignedAgent?.name || "Unassigned"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={t.priority.toLowerCase() as any}>{t.priority}</Badge>
                        <Badge variant={t.status.toLowerCase() as any}>
                          {t.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Incident Category Distribution (1 col) */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-400" />
                    Category Volumes
                  </CardTitle>
                  <CardDescription>Breakdown by operational domain</CardDescription>
                </div>
              </CardHeader>

              <div className="space-y-3">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))
                  : stats?.categoryDistribution?.map((cat: any) => (
                      <div
                        key={cat.code}
                        className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-200">{cat.name}</span>
                          <span className="font-mono text-slate-400 font-semibold">
                            {cat.count}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(5, (cat.count / (stats?.metrics?.totalTickets || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
