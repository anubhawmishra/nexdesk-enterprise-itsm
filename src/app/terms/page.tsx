import React from "react";
import Link from "next/link";
import { ArrowLeft, FileCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 p-6 sm:p-12 antialiased">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Application
        </Link>

        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <FileCheck className="w-4 h-4" /> Operational Terms
          </div>
          <h1 className="text-2xl font-bold text-white">Terms of Use</h1>
          <p className="text-xs text-slate-400">
            Last Updated: October 2026 • NexDesk Internal Operational Framework
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">1. Acceptance of Terms</h2>
            <p>
              By accessing or using this software installation of NEXDESK, users acknowledge that
              this is an internal operational support desk system provided strictly for enterprise
              IT support management, equipment custody tracking, and knowledge access.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">2. Permitted Use</h2>
            <p>
              Users agree to submit authentic, factual information regarding workstation issues,
              network connectivity disruptions, and hardware allocation requests. The system may not
              be utilized for unauthorized testing, automated credential scanning, or personal file
              archival.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              3. Demonstration Disclaimer &amp; Warranty
            </h2>
            <p>
              This software is provided &ldquo;as is&rdquo; without warranties of commercial
              availability or SLA uptime guarantee. As an open portfolio application, operators and
              authors assume no liability for downtime or misconfiguration in external environments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
