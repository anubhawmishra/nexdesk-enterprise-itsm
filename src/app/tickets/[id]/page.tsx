"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  User,
  Shield,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Lock,
  Send,
  Calendar,
  ChevronRight,
  ArrowLeft,
  FileCheck,
  Building,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRemainingTime } from "@/lib/sla/sla-engine";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New comment state
  const [commentContent, setCommentContent] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status modal
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) {
        if (res.status === 403) {
          setError("Access denied: You do not have permission to view this ticket.");
        } else if (res.status === 404) {
          setError("The requested ticket does not exist.");
        } else {
          setError("Failed to load ticket details.");
        }
        return;
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserAndAgents = async () => {
    try {
      const [meRes, empRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/employees")]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        const itStaff = (empData.employees || []).filter(
          (e: any) =>
            e.role === "IT_SUPPORT_AGENT" || e.role === "IT_MANAGER" || e.role === "ADMINISTRATOR",
        );
        setAvailableAgents(itStaff);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchCurrentUserAndAgents();
    }
  }, [ticketId]);

  const isStaff =
    currentUser?.role === "IT_SUPPORT_AGENT" ||
    currentUser?.role === "IT_MANAGER" ||
    currentUser?.role === "ADMINISTRATOR";

  // Post comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentContent,
          isInternal: isInternalComment,
        }),
      });

      if (res.ok) {
        setCommentContent("");
        setIsInternalComment(false);
        fetchTicket();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Change status
  const handleTransitionStatus = async (
    targetStatus: string,
    reason?: string,
    resNotes?: string,
    rCause?: string,
  ) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          changeReason: reason,
          resolutionNotes: resNotes,
          rootCause: rCause,
        }),
      });

      if (res.ok) {
        setResolveModalOpen(false);
        setResolutionNotes("");
        setRootCause("");
        fetchTicket();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Reassign
  const handleAssignTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: assigneeId || null }),
      });

      if (res.ok) {
        setAssignModalOpen(false);
        fetchTicket();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (error || !ticket) {
    return (
      <AppShell>
        <div className="py-16 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400 mb-2">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">Ticket Unavailable</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
          <Link href="/tickets">
            <Button variant="secondary" size="sm">
              Back to Queue
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const slaInfo = formatRemainingTime(ticket.resolutionDue ? new Date(ticket.resolutionDue) : null);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Incidents</span>
          </Link>

          {/* Quick status indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Status:</span>
            <Badge variant={ticket.status.toLowerCase() as any}>
              {ticket.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        {/* Ticket Header & Primary Action Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-base font-bold text-blue-400">
                  {ticket.ticketCode}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {ticket.type}
                </span>
                <Badge variant={ticket.priority.toLowerCase() as any}>
                  {ticket.priority} Priority
                </Badge>
              </div>
              <h1 className="text-lg font-bold text-white leading-snug">{ticket.title}</h1>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {isStaff && ticket.status === "NEW" && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    handleTransitionStatus("IN_PROGRESS", "Agent initiated troubleshooting.")
                  }
                  isLoading={updatingStatus}
                >
                  Start Progress
                </Button>
              )}

              {isStaff && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setAssigneeId(ticket.assignedAgentId || "");
                    setAssignModalOpen(true);
                  }}
                >
                  Assign Agent
                </Button>
              )}

              {isStaff && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setResolveModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Resolve Ticket
                </Button>
              )}

              {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleTransitionStatus("IN_PROGRESS", "Ticket reopened for follow-up testing.")
                  }
                  isLoading={updatingStatus}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reopen Ticket
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Conversation / Details on Left, Metadata & SLA on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area: Description and Activity Thread */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Incident Description &amp; Summary
                </CardTitle>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  Submitted {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </CardHeader>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>

              {/* Resolution details if resolved */}
              {ticket.resolvedAt && (
                <div className="mt-4 pt-4 border-t border-slate-800 bg-emerald-500/5 p-3.5 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                    <FileCheck className="w-4 h-4" />
                    Resolution Summary
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {ticket.resolutionNotes || "No detailed notes provided."}
                  </p>
                  {ticket.rootCause && (
                    <div className="mt-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Root Cause:</span>{" "}
                      {ticket.rootCause}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Conversation Timeline & Comments */}
            <Card className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    Activity &amp; Communications ({ticket.comments?.length || 0})
                  </CardTitle>
                  <span className="text-[11px] text-slate-400">Chronological audit record</span>
                </div>
              </CardHeader>

              {/* Message Feed */}
              <div className="space-y-3.5">
                {ticket.comments?.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No replies or notes recorded yet.
                  </div>
                ) : (
                  ticket.comments?.map((comment: any) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-xl border text-xs leading-relaxed ${
                        comment.isInternal
                          ? "bg-amber-500/5 border-amber-500/30 text-slate-200"
                          : "bg-slate-950/60 border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">
                            {comment.author?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 rounded bg-slate-800">
                            {comment.author?.role?.replace(/_/g, " ")}
                          </span>
                          {comment.isInternal && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              <Lock className="w-2.5 h-2.5" />
                              Internal IT Note
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 tabular-nums">
                          {new Date(comment.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{comment.content}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleAddComment}
                className="pt-4 border-t border-slate-800 space-y-3"
              >
                <Textarea
                  placeholder="Write a reply or troubleshooting update..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                  required
                />

                <div className="flex items-center justify-between">
                  {isStaff ? (
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1 text-amber-400">
                        <Lock className="w-3 h-3" />
                        Internal Note (Hidden from employee)
                      </span>
                    </label>
                  ) : (
                    <div />
                  )}

                  <Button type="submit" size="sm" isLoading={submittingComment} className="gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Post Update
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Sidebar: SLA Target, Requester, Asset, History */}
          <div className="space-y-5">
            {/* SLA Compliance Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Service Level Agreement
                </CardTitle>
              </CardHeader>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Resolution SLA:</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                        ? "text-emerald-400"
                        : slaInfo.isOverdue
                          ? "text-red-400"
                          : "text-blue-400"
                    }`}
                  >
                    {ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                      ? "Resolution Met"
                      : slaInfo.text}
                  </span>
                </div>

                <div className="text-[11px] space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Response Target:</span>
                    <span className="text-slate-200 font-mono">
                      {ticket.firstResponseDue
                        ? new Date(ticket.firstResponseDue).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolution Target:</span>
                    <span className="text-slate-200 font-mono">
                      {ticket.resolutionDue
                        ? new Date(ticket.resolutionDue).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Requester Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Requester Details
                </CardTitle>
              </CardHeader>
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-slate-200">{ticket.requester?.name}</div>
                <div className="text-slate-400">{ticket.requester?.email}</div>
                <div className="text-slate-400">{ticket.requester?.jobTitle}</div>
                {ticket.requester?.department && (
                  <div className="flex items-center gap-1.5 text-slate-400 pt-1 border-t border-slate-800">
                    <Building className="w-3 h-3 text-slate-500" />
                    <span>{ticket.requester.department.name}</span>
                  </div>
                )}
                {ticket.requester?.employeeProfile?.officeDesk && (
                  <div className="text-[11px] text-slate-500">
                    Desk: {ticket.requester.employeeProfile.officeDesk}
                  </div>
                )}
              </div>
            </Card>

            {/* Affected Asset Card */}
            {ticket.affectedAsset && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                    <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                    Affected IT Asset
                  </CardTitle>
                </CardHeader>
                <div className="space-y-1.5 text-xs">
                  <Link
                    href={`/assets/${ticket.affectedAsset.id}`}
                    className="font-mono text-cyan-400 font-semibold hover:underline block"
                  >
                    {ticket.affectedAsset.assetTag}
                  </Link>
                  <div className="text-slate-200 font-medium">
                    {ticket.affectedAsset.manufacturer} {ticket.affectedAsset.model}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    S/N: {ticket.affectedAsset.serialNumber}
                  </div>
                </div>
              </Card>
            )}

            {/* Status History Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status Transition History
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {ticket.statusHistory?.map((h: any) => (
                  <div key={h.id} className="text-xs border-l-2 border-slate-800 pl-3 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                      <span>{h.previousStatus}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                      <span className="text-blue-400">{h.newStatus}</span>
                    </div>
                    {h.changeReason && (
                      <p className="text-[11px] text-slate-400">{h.changeReason}</p>
                    )}
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(h.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • {h.changedBy?.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Resolve Ticket Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Resolve Ticket"
        description="Record resolution findings and underlying root cause before marking ticket resolved."
      >
        <div className="space-y-4">
          <Textarea
            label="Resolution Summary & Fix Applied"
            rows={3}
            placeholder="Explain steps taken to resolve the incident..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            required
          />

          <Input
            label="Root Cause Category / Description"
            placeholder="e.g. Expired SSL certificate, corrupted print spooler queue, driver mismatch"
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleTransitionStatus(
                  "RESOLVED",
                  "Ticket resolved by support specialist.",
                  resolutionNotes,
                  rootCause,
                )
              }
              isLoading={updatingStatus}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Confirm Resolution
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Agent Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Support Specialist"
        description="Select an IT staff member to take ownership of this ticket."
      >
        <div className="space-y-4">
          <Select
            label="Assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            options={[
              { value: "", label: "-- Unassigned --" },
              ...availableAgents.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.jobTitle || a.role})`,
              })),
            ]}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTicket}>Save Assignment</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
