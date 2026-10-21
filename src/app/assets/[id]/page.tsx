"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Laptop,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  User,
  Wrench,
  History,
  Ticket,
  PlusCircle,
  Building,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reassign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);

  // Maintenance Modal
  const [maintModalOpen, setMaintModalOpen] = useState(false);
  const [maintType, setMaintType] = useState("PREVENTIVE");
  const [maintDescription, setMaintDescription] = useState("");
  const [maintCost, setMaintCost] = useState("0");
  const [submittingMaint, setSubmittingMaint] = useState(false);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assets/${assetId}`);
      if (!res.ok) {
        setError("Failed to load asset details.");
        return;
      }
      const data = await res.json();
      setAsset(data.asset);
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesAndUser = async () => {
    try {
      const [empRes, meRes] = await Promise.all([fetch("/api/employees"), fetch("/api/auth/me")]);
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (assetId) {
      fetchAsset();
      fetchEmployeesAndUser();
    }
  }, [assetId]);

  const isStaff =
    currentUser?.role === "IT_SUPPORT_AGENT" ||
    currentUser?.role === "IT_MANAGER" ||
    currentUser?.role === "ADMINISTRATOR";

  const handleAssignAsset = async () => {
    try {
      const res = await fetch(`/api/assets/${asset.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToUserId: selectedUserId || null,
          notes: assignNotes,
        }),
      });

      if (res.ok) {
        setAssignModalOpen(false);
        fetchAsset();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMaint(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceType: maintType,
          description: maintDescription,
          cost: parseFloat(maintCost) || 0,
        }),
      });

      if (res.ok) {
        setMaintModalOpen(false);
        setMaintDescription("");
        setMaintCost("0");
        fetchAsset();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingMaint(false);
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

  if (error || !asset) {
    return (
      <AppShell>
        <div className="py-16 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Asset Not Found</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <Link href="/assets">
            <Button variant="secondary" size="sm">
              Back to Inventory
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isWarrantyValid = new Date(asset.warrantyExpiry) > new Date();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/assets"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Asset Inventory</span>
          </Link>
          <span className="text-xs text-slate-400 font-mono">ID: {asset.id}</span>
        </div>

        {/* Top Asset Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-cyan-400">
                  {asset.assetTag}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {asset.assetType}
                </span>
                <Badge
                  variant={
                    asset.lifecycleStatus === "IN_USE"
                      ? "low"
                      : asset.lifecycleStatus === "IN_STORAGE"
                        ? "medium"
                        : "high"
                  }
                >
                  {asset.lifecycleStatus.replace(/_/g, " ")}
                </Badge>
              </div>
              <h1 className="text-lg font-bold text-white">
                {asset.manufacturer} {asset.model}
              </h1>
            </div>

            {isStaff && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedUserId(asset.assignedToUserId || "");
                    setAssignModalOpen(true);
                  }}
                >
                  <User className="w-3.5 h-3.5 mr-1.5" />
                  {asset.assignedToUserId ? "Reassign Device" : "Assign to User"}
                </Button>
                <Button size="sm" onClick={() => setMaintModalOpen(true)} className="gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Log Maintenance
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Specifications and Maintenance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Specs Grid Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Serial Number</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {asset.serialNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Operating System</span>
                  <span className="font-medium text-slate-200">
                    {asset.operatingSystem || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Processor (CPU)</span>
                  <span className="font-medium text-slate-200">{asset.processor || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">System Memory</span>
                  <span className="font-mono font-medium text-slate-200">
                    {asset.ramGb ? `${asset.ramGb} GB RAM` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Storage Capacity</span>
                  <span className="font-mono font-medium text-slate-200">
                    {asset.storageGb ? `${asset.storageGb} GB NVMe` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Physical Location</span>
                  <span className="font-medium text-slate-200">{asset.location}</span>
                </div>
              </div>

              {asset.notes && (
                <div className="mt-4 pt-4 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[11px] mb-1 font-medium">
                    Provisioning Notes:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{asset.notes}</p>
                </div>
              )}
            </Card>

            {/* Maintenance History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Maintenance &amp; Service History ({asset.maintenanceLogs?.length || 0})
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {asset.maintenanceLogs?.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No maintenance records logged for this hardware unit.
                  </div>
                ) : (
                  asset.maintenanceLogs?.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{m.maintenanceType}</span>
                        <span className="text-slate-500 tabular-nums">
                          {new Date(m.performedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{m.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Technician: {m.performedBy}</span>
                        {m.cost > 0 && (
                          <span className="font-mono text-slate-400">${m.cost.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Related Incident Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-400" />
                  Related Incident Tickets ({asset.tickets?.length || 0})
                </CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {asset.tickets?.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No tickets currently linked to this asset.
                  </div>
                ) : (
                  asset.tickets?.map((t: any) => (
                    <Link
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-semibold text-blue-400">
                          {t.ticketCode}
                        </span>
                        <span className="text-slate-200 truncate">{t.title}</span>
                      </div>
                      <Badge variant={t.status.toLowerCase() as any}>
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: User Assignment, Warranty, History */}
          <div className="space-y-6">
            {/* Current Custodian */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Custodian / Assignee
                </CardTitle>
              </CardHeader>
              {asset.assignedToUser ? (
                <div className="space-y-2 text-xs">
                  <p className="font-semibold text-slate-200 text-sm">
                    {asset.assignedToUser.name}
                  </p>
                  <p className="text-slate-400">{asset.assignedToUser.email}</p>
                  <p className="text-slate-400">{asset.assignedToUser.jobTitle}</p>
                  {asset.department && (
                    <div className="flex items-center gap-1.5 text-slate-400 pt-2 border-t border-slate-800">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{asset.department.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 italic">
                  Device currently unassigned in inventory storage.
                </div>
              )}
            </Card>

            {/* Warranty Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Procurement &amp; Warranty
                </CardTitle>
              </CardHeader>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Purchase Date:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(asset.purchaseDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Warranty Expiration:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(asset.warrantyExpiry).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Warranty Status:</span>
                  <span
                    className={`font-medium flex items-center gap-1 ${
                      isWarrantyValid ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {isWarrantyValid ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" /> Active Coverage
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" /> Coverage Expired
                      </>
                    )}
                  </span>
                </div>
              </div>
            </Card>

            {/* Assignment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Custodian History
                </CardTitle>
              </CardHeader>
              <div className="space-y-3 text-xs">
                {asset.assignmentHistory?.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No previous custodians.</p>
                ) : (
                  asset.assignmentHistory?.map((h: any) => (
                    <div key={h.id} className="border-l-2 border-slate-800 pl-3 space-y-0.5">
                      <span className="font-medium text-slate-200">
                        {h.assignedToUser ? h.assignedToUser.name : "Inventory Return"}
                      </span>
                      {h.notes && <p className="text-[11px] text-slate-400">{h.notes}</p>}
                      <span className="text-[10px] text-slate-500 block">
                        Assigned {new Date(h.assignedAt).toLocaleDateString()}
                        {h.returnedAt
                          ? ` • Returned ${new Date(h.returnedAt).toLocaleDateString()}`
                          : " • Current"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Reassign Asset Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Asset Custodian"
        description="Select an employee to take physical possession of this hardware asset."
      >
        <div className="space-y-4">
          <Select
            label="Assigned Employee"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={[
              { value: "", label: "-- Return to Storage (Unassign) --" },
              ...employees.map((e) => ({
                value: e.id,
                label: `${e.name} (${e.jobTitle || e.role})`,
              })),
            ]}
          />

          <Input
            label="Assignment Reason / Notes"
            placeholder="e.g. Standard engineering laptop provisioning"
            value={assignNotes}
            onChange={(e) => setAssignNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAsset}>Update Custodian</Button>
          </div>
        </div>
      </Modal>

      {/* Log Maintenance Modal */}
      <Modal
        isOpen={maintModalOpen}
        onClose={() => setMaintModalOpen(false)}
        title="Log Hardware Maintenance Record"
        description="Record servicing, firmware flash, thermal repaste, or hardware upgrade."
      >
        <form onSubmit={handleLogMaintenance} className="space-y-4">
          <Select
            label="Maintenance Type"
            value={maintType}
            onChange={(e) => setMaintType(e.target.value)}
            options={[
              { value: "PREVENTIVE", label: "Preventive Inspection" },
              { value: "REPAIR", label: "Component Repair" },
              { value: "UPGRADE", label: "Hardware Upgrade" },
              { value: "INSPECTION", label: "Safety & Diagnostic Inspection" },
            ]}
          />

          <Textarea
            label="Work Summary & Diagnostics"
            rows={3}
            placeholder="Describe maintenance performed, parts replaced, benchmark results..."
            value={maintDescription}
            onChange={(e) => setMaintDescription(e.target.value)}
            required
          />

          <Input
            label="Service Cost (USD)"
            type="number"
            value={maintCost}
            onChange={(e) => setMaintCost(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setMaintModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submittingMaint}>
              Save Maintenance Log
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
