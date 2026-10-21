"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Laptop,
  PlusCircle,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  HardDrive,
  Cpu,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    assetTag: "",
    serialNumber: "",
    assetType: "LAPTOP",
    manufacturer: "",
    model: "",
    operatingSystem: "Windows 11 Enterprise (23H2)",
    processor: "Intel Core i7-1365U",
    ramGb: 16,
    storageGb: 512,
    purchaseDate: new Date().toISOString().split("T")[0],
    warrantyExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3)
      .toISOString()
      .split("T")[0],
    lifecycleStatus: "IN_STORAGE",
    location: "IT Storage Cage 2B",
    purchaseCost: 1499,
  });

  const fetchAssets = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        type: typeFilter,
        status: statusFilter,
        search,
      });

      const res = await fetch(`/api/assets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets(1);
  }, [typeFilter, statusFilter]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          ramGb: Number(createForm.ramGb),
          storageGb: Number(createForm.storageGb),
          purchaseCost: Number(createForm.purchaseCost),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to register asset");
        setSubmitting(false);
        return;
      }

      setCreateModalOpen(false);
      fetchAssets(1);
    } catch {
      setFormError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = "/api/assets/export";
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header and Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-blue-400" />
              IT Hardware &amp; Asset Inventory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Workstation lifecycle tracking, hardware specifications, and assignment records.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => fetchAssets(pagination.page)}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCsv} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              Register Asset
            </Button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <Card className="p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Input
                placeholder="Search tag, model, serial, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchAssets(1)}
                className="pl-8 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs"
              options={[
                { value: "ALL", label: "All Asset Types" },
                { value: "LAPTOP", label: "Laptops" },
                { value: "DESKTOP", label: "Desktops" },
                { value: "MONITOR", label: "Monitors" },
                { value: "PRINTER", label: "Printers" },
                { value: "SERVER", label: "Servers" },
                { value: "NETWORK_DEVICE", label: "Network Devices" },
              ]}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs"
              options={[
                { value: "ALL", label: "All Lifecycle States" },
                { value: "IN_USE", label: "In Use (Assigned)" },
                { value: "IN_STORAGE", label: "In Storage (Available)" },
                { value: "IN_REPAIR", label: "Under Maintenance" },
                { value: "RETIRED", label: "Retired / Decommissioned" },
              ]}
            />
          </div>
        </Card>

        {/* Assets Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Device Model</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned User</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Warranty</th>
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
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No assets found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  assets.map((a) => {
                    const isWarrantyValid = new Date(a.warrantyExpiry) > new Date();
                    return (
                      <tr key={a.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                          <Link href={`/assets/${a.id}`} className="hover:underline">
                            {a.assetTag}
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {a.assetType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            href={`/assets/${a.id}`}
                            className="font-medium text-slate-200 hover:text-white truncate block"
                          >
                            {a.manufacturer} {a.model}
                          </Link>
                          {a.processor && (
                            <span className="text-[11px] text-slate-500 truncate block">
                              {a.processor} • {a.ramGb}GB RAM
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-400">{a.serialNumber}</td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              a.lifecycleStatus === "IN_USE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : a.lifecycleStatus === "IN_STORAGE"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : a.lifecycleStatus === "IN_REPAIR"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {a.lifecycleStatus.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-200">
                          {a.assignedToUser ? (
                            <span>{a.assignedToUser.name}</span>
                          ) : (
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 truncate max-w-[140px]">
                          {a.location}
                        </td>

                        <td className="py-3.5 px-4 tabular-nums">
                          <div className="flex items-center gap-1.5">
                            {isWarrantyValid ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span
                              className={`text-[11px] font-mono ${isWarrantyValid ? "text-slate-300" : "text-amber-400"}`}
                            >
                              {new Date(a.warrantyExpiry).toLocaleDateString([], {
                                year: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {assets.length} of {pagination.totalCount} assets (Page {pagination.page} of{" "}
              {pagination.totalPages})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchAssets(pagination.page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchAssets(pagination.page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Register Asset Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New IT Hardware Asset"
        description="Record hardware specifications, serial number, and procurement details into inventory."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Asset Tag"
              placeholder="e.g. AST-1045"
              value={createForm.assetTag}
              onChange={(e) => setCreateForm({ ...createForm, assetTag: e.target.value })}
              required
            />
            <Input
              label="Serial Number (Unique)"
              placeholder="e.g. PF4B9011"
              value={createForm.serialNumber}
              onChange={(e) => setCreateForm({ ...createForm, serialNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Asset Type"
              value={createForm.assetType}
              onChange={(e) => setCreateForm({ ...createForm, assetType: e.target.value })}
              options={[
                { value: "LAPTOP", label: "Laptop" },
                { value: "DESKTOP", label: "Desktop" },
                { value: "MONITOR", label: "Monitor" },
                { value: "PRINTER", label: "Printer" },
                { value: "SERVER", label: "Server" },
                { value: "NETWORK_DEVICE", label: "Network Device" },
              ]}
            />
            <Input
              label="Manufacturer"
              placeholder="e.g. Lenovo, Dell, Apple"
              value={createForm.manufacturer}
              onChange={(e) => setCreateForm({ ...createForm, manufacturer: e.target.value })}
              required
            />
            <Input
              label="Model"
              placeholder="e.g. ThinkPad X1 Carbon Gen 11"
              value={createForm.model}
              onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Processor (CPU)"
              placeholder="Intel Core i7-1365U"
              value={createForm.processor}
              onChange={(e) => setCreateForm({ ...createForm, processor: e.target.value })}
            />
            <Input
              label="RAM (GB)"
              type="number"
              value={createForm.ramGb}
              onChange={(e) => setCreateForm({ ...createForm, ramGb: Number(e.target.value) })}
            />
            <Input
              label="Storage (GB)"
              type="number"
              value={createForm.storageGb}
              onChange={(e) => setCreateForm({ ...createForm, storageGb: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Operating System"
              value={createForm.operatingSystem}
              onChange={(e) => setCreateForm({ ...createForm, operatingSystem: e.target.value })}
            />
            <Input
              label="Physical Location"
              value={createForm.location}
              onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Purchase Date"
              type="date"
              value={createForm.purchaseDate}
              onChange={(e) => setCreateForm({ ...createForm, purchaseDate: e.target.value })}
              required
            />
            <Input
              label="Warranty Expiry Date"
              type="date"
              value={createForm.warrantyExpiry}
              onChange={(e) => setCreateForm({ ...createForm, warrantyExpiry: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Register Asset
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
