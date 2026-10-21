"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Laptop,
  Ticket,
  Building,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        departmentId: departmentFilter,
        search,
      });

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [departmentFilter]);

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Corporate Employee Directory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Organizational staffing, departmental allocation, and assigned IT hardware.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchEmployees} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Directory
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Search employee by name, title, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchEmployees()}
                className="pl-8 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            <div className="w-full sm:w-60">
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-xs"
                options={[{ value: "ALL", label: "All Departments" }]}
              />
            </div>
          </div>
        </Card>

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-16 w-full" />
              </Card>
            ))
          ) : employees.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              No employees found matching the filter criteria.
            </div>
          ) : (
            employees.map((emp) => (
              <Card key={emp.id} className="p-5 flex flex-col justify-between space-y-4 hoverable">
                <div className="space-y-3">
                  {/* Top info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">{emp.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{emp.jobTitle}</p>
                    </div>
                    <Badge variant="role">{emp.role.replace(/_/g, " ")}</Badge>
                  </div>

                  {/* Department & Location */}
                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    {emp.department && (
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{emp.department.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.employeeProfile?.officeDesk && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          Desk {emp.employeeProfile.officeDesk} ({emp.employeeProfile.location})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Hardware */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Assigned Hardware ({emp.assignedAssets?.length || 0})
                    </span>
                    {emp.assignedAssets?.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No assets assigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {emp.assignedAssets.map((asset: any) => (
                          <Link
                            key={asset.id}
                            href={`/assets/${asset.id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400 hover:border-cyan-500/40 transition-colors"
                          >
                            <Laptop className="w-2.5 h-2.5 text-cyan-400" />
                            {asset.assetTag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer tickets badge */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-blue-400" />
                    {emp._count?.requestedTickets || 0} tickets submitted
                  </span>
                  <span className="font-mono text-slate-500">
                    {emp.employeeProfile?.employeeNumber}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
