"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Flame,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRemainingTime } from "@/lib/sla/sla-engine";

export default function SLAEscalationsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, statsRes] = await Promise.all([
        fetch("/api/tickets?limit=50"),
        fetch("/api/dashboard/stats"),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const now = new Date();

  // Filter open tickets with SLA deadlines
  const activeTicketsWithSla = tickets
    .filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED" && t.resolutionDue)
    .map((t) => {
      const deadline = new Date(t.resolutionDue);
      const remaining = formatRemainingTime(deadline, now);
      return { ...t, remaining };
    })
    .sort((a, b) => a.remaining.minutes - b.remaining.minutes);

  const breachedTickets = activeTicketsWithSla.filter((t) => t.remaining.isOverdue);
  const approachingTickets = activeTicketsWithSla.filter(
    (t) => !t.remaining.isOverdue && t.remaining.minutes <= 120, // Within 2 hours
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              SLA Monitoring &amp; Escalation Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking of response targets, resolution deadlines, and breached operational
              queues.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchData} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Recalculate SLAs
          </Button>
        </div>

        {/* SLA Health Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-red-950/20 border-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-400">Currently Breached</span>
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400 tabular-nums">
              {loading ? <Skeleton className="h-7 w-12" /> : breachedTickets.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Resolution deadline expired</p>
          </Card>

          <Card className="p-4 bg-amber-950/20 border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400">
                Approaching Breach (&lt; 2h)
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 tabular-nums">
              {loading ? <Skeleton className="h-7 w-12" /> : approachingTickets.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Urgent intervention recommended</p>
          </Card>

          <Card className="p-4 bg-emerald-950/20 border-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400">Overall SLA Compliance</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 tabular-nums">
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                `${stats?.metrics?.slaComplianceRate ?? 100}%`
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Resolved within commitment</p>
          </Card>
        </div>

        {/* SLA Policy Standard Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Configured SLA Targets &amp; Policy Matrix
            </CardTitle>
            <CardDescription>
              Elapsed-time deadlines enforced upon ticket submission based on severity rating.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Priority Tier</th>
                  <th className="py-2.5 px-4">Initial Response Target</th>
                  <th className="py-2.5 px-4">Resolution Target</th>
                  <th className="py-2.5 px-4">Escalation Threshold</th>
                  <th className="py-2.5 px-4">Coverage Schedule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-3 px-4 font-bold text-red-400">CRITICAL (P1)</td>
                  <td className="py-3 px-4 text-slate-200">15 Minutes</td>
                  <td className="py-3 px-4 text-slate-200">2 Hours</td>
                  <td className="py-3 px-4 text-slate-400">60 Minutes</td>
                  <td className="py-3 px-4 text-slate-400 font-sans">24/7/365 On-Call</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-amber-400">HIGH (P2)</td>
                  <td className="py-3 px-4 text-slate-200">60 Minutes</td>
                  <td className="py-3 px-4 text-slate-200">8 Hours</td>
                  <td className="py-3 px-4 text-slate-400">4 Hours</td>
                  <td className="py-3 px-4 text-slate-400 font-sans">Business Hours (8am - 6pm)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-blue-400">MEDIUM (P3)</td>
                  <td className="py-3 px-4 text-slate-200">4 Hours</td>
                  <td className="py-3 px-4 text-slate-200">24 Hours</td>
                  <td className="py-3 px-4 text-slate-400">12 Hours</td>
                  <td className="py-3 px-4 text-slate-400 font-sans">Business Hours (8am - 6pm)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-400">LOW (P4)</td>
                  <td className="py-3 px-4 text-slate-200">8 Hours</td>
                  <td className="py-3 px-4 text-slate-200">48 Hours</td>
                  <td className="py-3 px-4 text-slate-400">24 Hours</td>
                  <td className="py-3 px-4 text-slate-400 font-sans">Standard Support Queue</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live Active Escalation & Breach Watchlist */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Active SLA Countdown Queue
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Open tickets ordered by urgency and approaching deadline threshold.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">SLA Countdown</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="py-4 px-4">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : activeTicketsWithSla.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No active tickets with pending SLA targets. All queues are clear.
                    </td>
                  </tr>
                ) : (
                  activeTicketsWithSla.map((t) => (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-850/60 transition-colors ${
                        t.remaining.isOverdue ? "bg-red-950/10" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                        <Link href={`/tickets/${t.id}`}>{t.ticketCode}</Link>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link
                          href={`/tickets/${t.id}`}
                          className="font-medium text-slate-200 hover:text-white truncate block"
                        >
                          {t.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={t.priority.toLowerCase() as any}>{t.priority}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={t.status.toLowerCase() as any}>
                          {t.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {t.assignedAgent?.name || (
                          <span className="text-amber-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <span
                          className={`flex items-center gap-1 font-semibold ${
                            t.remaining.isOverdue
                              ? "text-red-400"
                              : t.remaining.minutes <= 120
                                ? "text-amber-400"
                                : "text-slate-300"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {t.remaining.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/tickets/${t.id}`}>
                          <Button size="sm" variant="secondary" className="text-xs h-7">
                            View <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
