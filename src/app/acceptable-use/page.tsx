import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function AcceptableUsePage() {
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
            <CheckCircle2 className="w-4 h-4" /> Usage Governance
          </div>
          <h1 className="text-2xl font-bold text-white">Acceptable Use Policy</h1>
          <p className="text-xs text-slate-400">
            Last Updated: October 2026 • IT Resource &amp; Workstation Standards
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              1. Workplace Resource Guidelines
            </h2>
            <p>
              Workstations, monitors, and network credentials provisioned through NexDesk remain
              organizational property. Employees are responsible for the physical custody of
              assigned equipment and must report losses or hardware damage immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">2. Prohibited Conduct</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                Submitting fraudulent support tickets or impersonating other organizational members.
              </li>
              <li>
                Attempting to bypass role-based access restrictions or access tickets of other
                employees without authorization.
              </li>
              <li>
                Injecting malicious spreadsheet formula payloads (e.g. <code>=CMD()</code>) into
                ticket or asset descriptions.
              </li>
              <li>
                Attempting credential stuffing or automated brute force attacks against
                authentication handlers.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">3. Enforcement &amp; Audit</h2>
            <p>
              All ticket modifications, login attempts, and asset status updates are logged to the
              security audit ledger. Violations may result in administrative account suspension.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
