"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Shield,
  Building,
  MapPin,
  Laptop,
  Ticket,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [userAssets, setUserAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [meRes, assetRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/assets")]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setProfile(meData.user);
      }
      if (assetRes.ok) {
        const aData = await assetRes.json();
        setUserAssets(aData.assets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Employee Workstation Profile
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your corporate credentials, identity role, and assigned organizational hardware.
          </p>
        </div>

        {/* Profile Details Card */}
        <Card className="p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl font-bold">
                    {profile?.name ? profile.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{profile?.name}</h3>
                    <p className="text-xs text-slate-400">
                      {profile?.jobTitle || "Enterprise Staff Member"}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{profile?.email}</p>
                  </div>
                </div>

                <div>
                  <Badge variant="role">{profile?.role?.replace(/_/g, " ")}</Badge>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Employee ID</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {profile?.employeeProfile?.employeeNumber || "EMP-0142"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Department</span>
                  <span className="font-medium text-slate-200">
                    {profile?.department?.name || "Corporate"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Assigned Desk</span>
                  <span className="font-medium text-slate-200">
                    {profile?.employeeProfile?.officeDesk || "Desk 3-DES-14"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Campus Location</span>
                  <span className="font-medium text-slate-200">
                    {profile?.employeeProfile?.location || "Headquarters"}
                  </span>
                </div>
              </div>

              {/* Security info alert */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  Role-Based Access Enforcement
                </div>
                <p>
                  Your current system authorization tier is <strong>{profile?.role}</strong>. For
                  security compliance and least-privilege standards, role elevation requires
                  ticketed approval through IT Administration.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Assigned IT Equipment */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-cyan-400" />
              Assigned Corporate Hardware &amp; Peripherals ({userAssets.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Devices currently registered in your custody.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Device Model</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Warranty</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No hardware units currently assigned to this account.
                    </td>
                  </tr>
                ) : (
                  userAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                        {asset.assetTag}
                      </td>
                      <td className="py-3.5 px-4 font-mono uppercase text-[10px] text-slate-300">
                        {asset.assetType}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {asset.manufacturer} {asset.model}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{asset.serialNumber}</td>
                      <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                        {new Date(asset.warrantyExpiry).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/assets/${asset.id}`}>
                          <Button size="sm" variant="secondary" className="text-xs h-7">
                            View Device
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
