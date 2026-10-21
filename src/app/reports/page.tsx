"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, empRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/employees"),
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
      if (empRes.ok) {
        const eData = await empRes.json();
        setEmployees(eData.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  // Support staff workload metrics
  const agents = employees.filter((e) => e.role === "IT_SUPPORT_AGENT" || e.role === "IT_MANAGER");

  const categoryChartData = stats?.categoryDistribution || [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header and Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Operational Reports &amp; SLA Analytics
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Workload distribution, mean time to resolution (MTTR), and service desk throughput.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-xs w-36"
              options={[
                { value: "7", label: "Past 7 Days" },
                { value: "30", label: "Past 30 Days" },
                { value: "90", label: "Past Quarter" },
                { value: "365", label: "Year to Date" },
              ]}
            />
            <Button variant="secondary" size="sm" onClick={fetchData}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Operational KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-medium text-slate-400">Total Volume</span>
            <div className="text-2xl font-bold text-white mt-1 tabular-nums">
              {loading ? <Skeleton className="h-7 w-12" /> : (stats?.metrics?.totalTickets ?? 0)}
            </div>
            <span className="text-[10px] text-slate-500">Tickets in database</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-medium text-slate-400">Mean Time to Resolve</span>
            <div className="text-2xl font-bold text-white mt-1 tabular-nums">
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                `${stats?.metrics?.avgResolutionHours ?? 0} Hours`
              )}
            </div>
            <span className="text-[10px] text-emerald-400">Target &lt; 8.0h</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-medium text-slate-400">SLA Success Rate</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
              {loading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                `${stats?.metrics?.slaComplianceRate ?? 100}%`
              )}
            </div>
            <span className="text-[10px] text-slate-500">Resolution commitment</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-medium text-slate-400">Active Fleet Devices</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1 tabular-nums">
              {loading ? <Skeleton className="h-7 w-12" /> : (stats?.assetStats?.TOTAL ?? 0)}
            </div>
            <span className="text-[10px] text-slate-500">Hardware assets tracked</span>
          </Card>
        </div>

        {/* Category Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Incident Intake by Departmental Category
            </CardTitle>
            <CardDescription>
              Volume of tickets submitted per technological subsystem
            </CardDescription>
          </CardHeader>
          <div className="h-72 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Agent Performance Table */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              IT Support Specialist Workload &amp; Assignment Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current queue allocation among technical support specialists.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Specialist Name</th>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Tickets</th>
                  <th className="py-3 px-4">Assigned Hardware</th>
                  <th className="py-3 px-4">Queue Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{ag.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{ag.jobTitle || ag.role}</td>
                    <td className="py-3.5 px-4 text-slate-400">{ag.department?.name || "IT"}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400 tabular-nums">
                      {ag._count?.assignedTickets || 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400 tabular-nums">
                      {ag.assignedAssets?.length || 0} devices
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active On Duty
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
