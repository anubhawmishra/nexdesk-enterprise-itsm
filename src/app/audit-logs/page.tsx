"use client";

import React, { useState, useEffect } from "react";
import { FileText, Search, Shield, RefreshCw, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        action: actionFilter,
        search,
      });

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          setError(
            "Forbidden: Access to security audit logs requires Manager or Administrator privileges.",
          );
        } else {
          setError("Failed to load audit logs.");
        }
        return;
      }
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Security &amp; Audit Event Repository
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable ledger of privileged operations, authentication events, and ticket lifecycle
              mutations.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Bar */}
        <Card className="p-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Search audit descriptions, actors, or entity IDs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLogs(1)}
                className="pl-8 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="text-xs"
                options={[
                  { value: "ALL", label: "All Actions" },
                  { value: "AUTH_LOGIN_SUCCESS", label: "Login Success" },
                  { value: "AUTH_LOGIN_FAILED", label: "Login Failed" },
                  { value: "TICKET_CREATED", label: "Ticket Created" },
                  { value: "TICKET_STATUS_CHANGED", label: "Status Transition" },
                  { value: "ASSET_ASSIGNMENT_CHANGED", label: "Asset Reassigned" },
                  { value: "ASSETS_EXPORTED_CSV", label: "CSV Exported" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Event Description</th>
                  <th className="py-3 px-4">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="py-4 px-4">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      No security audit events recorded matching criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400 tabular-nums">
                        {new Date(log.createdAt).toISOString().replace("T", " ").replace("Z", "")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-sans font-medium text-slate-200">{log.actorEmail}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            log.action.includes("FAILED") || log.action.includes("UNAUTHORIZED")
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : log.action.includes("LOGIN")
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        <span className="font-semibold text-slate-200">{log.entityType}</span>
                        {log.entityId && (
                          <span className="block text-[10px] font-mono text-slate-500">
                            {log.entityId}
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-slate-300 font-sans max-w-sm truncate"
                        title={log.description}
                      >
                        {log.description}
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-sans">
            <div>
              Showing {logs.length} of {pagination.totalCount} audit events (Page {pagination.page}{" "}
              of {pagination.totalPages})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
