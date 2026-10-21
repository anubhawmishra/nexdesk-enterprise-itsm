"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  AlertOctagon,
  GitPullRequest,
  Laptop,
  Users,
  BookOpen,
  ShieldAlert,
  BarChart3,
  FileText,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Server,
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole = "EMPLOYEE", userName, userEmail }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isStaff =
    userRole === "IT_SUPPORT_AGENT" || userRole === "IT_MANAGER" || userRole === "ADMINISTRATOR";
  const isManagerOrAdmin = userRole === "IT_MANAGER" || userRole === "ADMINISTRATOR";
  const isAdmin = userRole === "ADMINISTRATOR";

  const navigation = [
    { name: "Overview Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "My Tickets", href: "/my-tickets", icon: Ticket, show: true },
    { name: "All Incidents", href: "/tickets", icon: AlertOctagon, show: isStaff },
    { name: "Service Requests", href: "/service-requests", icon: GitPullRequest, show: true },
    { name: "IT Assets", href: "/assets", icon: Laptop, show: true },
    { name: "Employees", href: "/employees", icon: Users, show: true },
    { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, show: true },
    { name: "SLA & Escalations", href: "/sla-escalations", icon: ShieldAlert, show: isStaff },
    { name: "Reports & Analytics", href: "/reports", icon: BarChart3, show: isStaff },
    { name: "Audit Logs", href: "/audit-logs", icon: FileText, show: isManagerOrAdmin },
    { name: "Administration", href: "/admin", icon: Settings, show: isAdmin },
    { name: "My Profile", href: "/profile", icon: User, show: true },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm shadow-blue-500/20">
              <Server className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  NEXDESK
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    ITSM
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 truncate">Enterprise Support Desk</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-900"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navigation
            .filter((item) => item.show)
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
        </div>

        {/* User Role Footer */}
        {!collapsed ? (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {userName || "Enterprise User"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{userRole.replace(/_/g, " ")}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-slate-800/80 flex justify-center">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300">
              {userName ? userName[0].toUpperCase() : "U"}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
