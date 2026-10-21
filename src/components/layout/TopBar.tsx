"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Bell,
  LogOut,
  User,
  Shield,
  CheckCheck,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    jobTitle?: string;
  } | null;
  onOpenSearch: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onOpenSearch }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // 1 min poll
      return () => clearInterval(interval);
    }
  }, [user]);

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Demo user quick-switcher for testing roles easily
  const handleQuickSwitch = async (email: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "NexDesk@2026!" }),
      });
      if (res.ok) {
        setShowUserMenu(false);
        router.refresh();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format breadcrumb text
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview Dashboard";
    if (pathname === "/my-tickets") return "My Tickets";
    if (pathname === "/tickets") return "All Incidents & Tickets";
    if (pathname.startsWith("/tickets/")) return "Ticket Details";
    if (pathname === "/service-requests") return "Service Requests";
    if (pathname === "/assets") return "IT Assets Inventory";
    if (pathname.startsWith("/assets/")) return "Asset Specification";
    if (pathname === "/employees") return "Employee Directory";
    if (pathname === "/knowledge-base") return "Knowledge Base";
    if (pathname.startsWith("/knowledge-base/")) return "Knowledge Article";
    if (pathname === "/sla-escalations") return "SLA & Escalation Monitoring";
    if (pathname === "/reports") return "Operational Reports & KPIs";
    if (pathname === "/audit-logs") return "Security & Audit Event Logs";
    if (pathname === "/admin") return "System Administration";
    if (pathname === "/profile") return "User Profile & Hardware";
    return "NexDesk IT Support";
  };

  return (
    <header className="sticky top-0 z-20 h-14 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Search trigger button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search portal...</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-slate-950" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded-full font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No notifications at this time.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors ${
                        n.isRead ? "bg-slate-900/50 text-slate-400" : "bg-slate-850 text-slate-200"
                      }`}
                    >
                      <p className="font-medium text-slate-200 mb-0.5">{n.title}</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {n.linkUrl && (
                          <a
                            href={n.linkUrl}
                            onClick={() => setShowNotifications(false)}
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                          >
                            View record <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu & Role Indicator */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-800"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold">
              {user ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 leading-none">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {user?.role ? user.role.replace(/_/g, " ") : "EMPLOYEE"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
              {/* User details */}
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant="role">
                    {user?.role ? user.role.replace(/_/g, " ") : "EMPLOYEE"}
                  </Badge>
                </div>
              </div>

              {/* Demo Account Quick Switcher */}
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Demo Persona
                </p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleQuickSwitch("admin@nexdesk.internal")}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded flex items-center justify-between"
                  >
                    <span>Alex Vance (Admin)</span>
                    <Shield className="w-3 h-3 text-red-400" />
                  </button>
                  <button
                    onClick={() => handleQuickSwitch("itmanager@nexdesk.internal")}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded flex items-center justify-between"
                  >
                    <span>Marcus Chen (Manager)</span>
                    <Shield className="w-3 h-3 text-purple-400" />
                  </button>
                  <button
                    onClick={() => handleQuickSwitch("agent1@nexdesk.internal")}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded flex items-center justify-between"
                  >
                    <span>Sarah Jenkins (Agent)</span>
                    <Shield className="w-3 h-3 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleQuickSwitch("employee@nexdesk.internal")}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded flex items-center justify-between"
                  >
                    <span>Elena Rostova (Employee)</span>
                    <User className="w-3 h-3 text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Logout */}
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
