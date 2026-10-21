"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Clock,
  Laptop,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRemainingTime } from "@/lib/sla/sla-engine";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    type: "INCIDENT",
    priority: "MEDIUM",
    impact: "MEDIUM",
    urgency: "MEDIUM",
    categoryId: "",
    subcategoryId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
        priority: priorityFilter,
        type: typeFilter,
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

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.categories?.length > 0 && !createForm.categoryId) {
          setCreateForm((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets(1);
    fetchCategories();
  }, [statusFilter, priorityFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets(1);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create ticket");
        setSubmitting(false);
        return;
      }

      setCreateModalOpen(false);
      setCreateForm({
        title: "",
        description: "",
        type: "INCIDENT",
        priority: "MEDIUM",
        impact: "MEDIUM",
        urgency: "MEDIUM",
        categoryId: categories[0]?.id || "",
        subcategoryId: "",
      });
      fetchTickets(1);
    } catch {
      setFormError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = categories.find((c) => c.id === createForm.categoryId);

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header and Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              All Incidents &amp; Tickets
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise service requests and operational incidents queue with SLA indicators.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => fetchTickets(pagination.page)}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <Card className="p-3.5">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <div className="lg:col-span-2 relative">
              <Input
                placeholder="Search ticket code, title, or requester..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs"
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "NEW", label: "New" },
                { value: "TRIAGED", label: "Triaged" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "PENDING_USER", label: "Pending User" },
                { value: "RESOLVED", label: "Resolved" },
                { value: "CLOSED", label: "Closed" },
              ]}
            />

            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs"
              options={[
                { value: "ALL", label: "All Priorities" },
                { value: "CRITICAL", label: "Critical (P1)" },
                { value: "HIGH", label: "High (P2)" },
                { value: "MEDIUM", label: "Medium (P3)" },
                { value: "LOW", label: "Low (P4)" },
              ]}
            />

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs"
              options={[
                { value: "ALL", label: "All Types" },
                { value: "INCIDENT", label: "Incident" },
                { value: "SERVICE_REQUEST", label: "Service Request" },
              ]}
            />
          </form>
        </Card>

        {/* Tickets Table Card */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Title &amp; Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Target</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="py-4 px-4">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No tickets match the selected filters.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    const slaInfo = formatRemainingTime(
                      t.resolutionDue ? new Date(t.resolutionDue) : null,
                    );
                    return (
                      <tr key={t.id} className="hover:bg-slate-850/60 transition-colors">
                        {/* Ticket Code */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                          <Link href={`/tickets/${t.id}`} className="hover:underline">
                            {t.ticketCode}
                          </Link>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              t.type === "INCIDENT"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}
                          >
                            {t.type === "INCIDENT" ? "Incident" : "Request"}
                          </span>
                        </td>

                        {/* Title & Category */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <Link
                            href={`/tickets/${t.id}`}
                            className="font-medium text-slate-200 hover:text-white truncate block"
                          >
                            {t.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span>{t.category?.name}</span>
                            {t.affectedAsset && (
                              <span className="flex items-center gap-1 text-slate-400 font-mono">
                                <Laptop className="w-3 h-3 text-cyan-400" />
                                {t.affectedAsset.assetTag}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4">
                          <Badge variant={t.priority.toLowerCase() as any}>{t.priority}</Badge>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <Badge variant={t.status.toLowerCase() as any}>
                            {t.status.replace(/_/g, " ")}
                          </Badge>
                        </td>

                        {/* SLA Target */}
                        <td className="py-3.5 px-4 tabular-nums">
                          {t.status === "RESOLVED" || t.status === "CLOSED" ? (
                            <span className="text-[11px] text-emerald-400">Met Target</span>
                          ) : (
                            <span
                              className={`text-[11px] font-mono flex items-center gap-1 ${
                                slaInfo.isOverdue ? "text-red-400 font-semibold" : "text-slate-300"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {slaInfo.text}
                            </span>
                          )}
                        </td>

                        {/* Assignee */}
                        <td className="py-3.5 px-4 text-slate-300">
                          {t.assignedAgent ? (
                            <span className="text-xs">{t.assignedAgent.name}</span>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                          )}
                        </td>

                        {/* Created At */}
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

          {/* Pagination Footer */}
          <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {tickets.length} of {pagination.totalCount} records (Page {pagination.page} of{" "}
              {pagination.totalPages})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchTickets(pagination.page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTickets(pagination.page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Submit New Support Ticket"
        description="Provide details regarding the IT issue or service request. SLA countdown begins upon creation."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Ticket Type"
              id="ticketType"
              value={createForm.type}
              onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
              options={[
                { value: "INCIDENT", label: "Incident (Broken / Fault)" },
                { value: "SERVICE_REQUEST", label: "Service Request (Hardware / Access)" },
              ]}
            />
            <Select
              label="Priority Level"
              id="ticketPriority"
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
              options={[
                { value: "LOW", label: "Low (P4 - 48h Resolution)" },
                { value: "MEDIUM", label: "Medium (P3 - 24h Resolution)" },
                { value: "HIGH", label: "High (P2 - 8h Resolution)" },
                { value: "CRITICAL", label: "Critical (P1 - 2h Resolution)" },
              ]}
            />
          </div>

          <Input
            label="Summary / Title"
            id="ticketTitle"
            placeholder="e.g. VPN gateway disconnected continuously or Outlook search not indexing"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              id="ticketCategory"
              value={createForm.categoryId}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  categoryId: e.target.value,
                  subcategoryId: "",
                })
              }
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />

            <Select
              label="Subcategory"
              id="ticketSubcategory"
              value={createForm.subcategoryId}
              onChange={(e) => setCreateForm({ ...createForm, subcategoryId: e.target.value })}
              options={[
                { value: "", label: "-- None / General --" },
                ...(currentCategory?.subcategories?.map((s: any) => ({
                  value: s.id,
                  label: s.name,
                })) || []),
              ]}
            />
          </div>

          <Textarea
            label="Detailed Description & Steps to Reproduce"
            id="ticketDescription"
            rows={4}
            placeholder="Include error codes, system specifications, troubleshooting steps already attempted..."
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
