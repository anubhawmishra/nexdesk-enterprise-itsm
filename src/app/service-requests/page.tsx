"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Search, GitPullRequest, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: "SERVICE_REQUEST",
        search,
      });

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-purple-400" />
              Service Requests Catalog &amp; Orders
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Equipment procurement, software licensing, and onboarding hardware packages.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={fetchRequests}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/tickets">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                Submit Request
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-3.5">
          <div className="relative">
            <Input
              placeholder="Search service requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
              className="pl-8 text-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="py-4 px-4">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No service requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-purple-400">
                        <Link href={`/tickets/${r.id}`} className="hover:underline">
                          {r.ticketCode}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link
                          href={`/tickets/${r.id}`}
                          className="font-medium text-slate-200 hover:text-white truncate block"
                        >
                          {r.title}
                        </Link>
                        <span className="text-[11px] text-slate-400">{r.category?.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{r.requester?.name}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={r.priority.toLowerCase() as any}>{r.priority}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={r.status.toLowerCase() as any}>
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {r.assignedAgent?.name || (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                        {new Date(r.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
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
