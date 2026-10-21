"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";
import { GlobalSearchModal } from "./GlobalSearchModal";

interface AppShellProps {
  children: React.ReactNode;
  initialUser?: any;
}

export const AppShell: React.FC<AppShellProps> = ({ children, initialUser }) => {
  const [user, setUser] = useState<any>(initialUser || null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    // If initialUser was not passed from server, fetch from /api/auth/me
    if (!initialUser) {
      fetch("/api/auth/me")
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data?.authenticated && data.user) {
            setUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [initialUser]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased">
      {/* Sidebar */}
      <Sidebar userRole={user?.role} userName={user?.name} userEmail={user?.email} />

      {/* Main Container */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 transition-all">
        <TopBar user={user} onOpenSearch={() => setSearchOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>

        <Footer />
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
