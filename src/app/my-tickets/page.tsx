"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Search, Clock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRemainingTime } from "@/lib/sla/sla-engine";

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        scope: "my",
        status: statusFilter,
        search,
      });

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1);
  }, [statusFilter]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">My Support Tickets</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tickets submitted by your account and current resolution progress.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => fetchTickets(pagination.page)}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/tickets">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                Submit Ticket
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Search my tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTickets(1)}
                className="pl-8 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs"
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "NEW", label: "New" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "PENDING_USER", label: "Pending User" },
                  { value: "RESOLVED", label: "Resolved" },
                  { value: "CLOSED", label: "Closed" },
                ]}
              />
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">SLA Target</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="py-4 px-4">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      You have no active support requests matching the criteria.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    const slaInfo = formatRemainingTime(
                      t.resolutionDue ? new Date(t.resolutionDue) : null,
                    );
                    return (
                      <tr key={t.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                          <Link href={`/tickets/${t.id}`} className="hover:underline">
                            {t.ticketCode}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {t.type}
                          </span>
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
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums">
                          <span
                            className={`text-[11px] font-mono flex items-center gap-1 ${
                              slaInfo.isOverdue ? "text-red-400" : "text-slate-300"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {slaInfo.text}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                          {new Date(t.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
