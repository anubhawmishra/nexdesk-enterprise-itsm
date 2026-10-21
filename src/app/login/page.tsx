"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Server, Shield, KeyRound, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("NexDesk@2026!");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#070b12] flex flex-col justify-between p-4 sm:p-6 antialiased">
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2 shadow-lg shadow-blue-500/10">
              <Server className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              NEXDESK{" "}
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                ENTERPRISE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Internal IT Operations &amp; Incident Management
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Corporate Email Address"
                id="email"
                type="email"
                placeholder="name@nexdesk.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" isLoading={loading}>
                Sign In to Workstation
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Select Demo Persona (Local Dev)</span>
                <span className="font-mono text-slate-500">NexDesk@2026!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleFillDemo("admin@nexdesk.internal")}
                  className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors flex flex-col"
                >
                  <span className="font-medium text-slate-200">Alex Vance</span>
                  <span className="text-[10px] text-red-400">Administrator</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo("itmanager@nexdesk.internal")}
                  className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors flex flex-col"
                >
                  <span className="font-medium text-slate-200">Marcus Chen</span>
                  <span className="text-[10px] text-purple-400">IT Manager</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo("agent1@nexdesk.internal")}
                  className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors flex flex-col"
                >
                  <span className="font-medium text-slate-200">Sarah Jenkins</span>
                  <span className="text-[10px] text-blue-400">Senior Support</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo("employee@nexdesk.internal")}
                  className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors flex flex-col"
                >
                  <span className="font-medium text-slate-200">Elena Rostova</span>
                  <span className="text-[10px] text-emerald-400">Employee</span>
                </button>
              </div>
            </div>
          </div>

          {/* Development disclaimer */}
          <div className="text-center text-[11px] text-slate-500 leading-relaxed px-4">
            Authorized access only. All actions are logged to the security audit repository. Local
            development portfolio project.
          </div>
        </div>
      </div>

      {/* Footer policy links */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-800/60 flex flex-wrap justify-center gap-4">
        <Link href="/privacy" className="hover:text-slate-300">
          Privacy Notice
        </Link>
        <Link href="/terms" className="hover:text-slate-300">
          Terms of Use
        </Link>
        <Link href="/acceptable-use" className="hover:text-slate-300">
          Acceptable Use
        </Link>
        <Link href="/security" className="hover:text-slate-300">
          Security &amp; Data Handling
        </Link>
      </footer>
    </div>
  );
}
