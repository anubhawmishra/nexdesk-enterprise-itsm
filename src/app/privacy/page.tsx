import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
            <Shield className="w-4 h-4" /> Transparency &amp; Data Handling
          </div>
          <h1 className="text-2xl font-bold text-white">Privacy Notice</h1>
          <p className="text-xs text-slate-400">
            Last Updated: October 2026 • Local Portfolio &amp; Technical Demonstration Project
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">
              1. Portfolio &amp; Demonstration Scope
            </h2>
            <p>
              NEXDESK is an educational, locally developed enterprise demonstration project designed
              to model internal IT service desk, SLA management, and asset inventory workflows. It
              is operated on local or private infrastructure by individual developers. All
              organizations, employee names, and device records pre-seeded in the database are
              synthetic examples.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              2. Data We Collect in Operation
            </h2>
            <p>
              In operating the IT Service Desk, the system persists the following data categories in
              a PostgreSQL database:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong>User Identity Data:</strong> Name, work email address, department, job
                title, and cryptographic password hashes (bcrypt).
              </li>
              <li>
                <strong>Workstation Assignment Data:</strong> Serial numbers, hardware models,
                operating system version, and physical desk locations.
              </li>
              <li>
                <strong>Ticket Activity:</strong> Support issue descriptions, trouble tickets,
                resolution summaries, internal IT notes, and timestamps.
              </li>
              <li>
                <strong>Security Audit Logs:</strong> Sign-in attempts, source IP addresses, user
                agent strings, and state-modifying actions.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              3. Cookies &amp; Session Management
            </h2>
            <p>
              This application strictly utilizes a single functional session cookie (
              <code>nexdesk_session</code>) to maintain authenticated access. This cookie is:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                Stored as an <code>HttpOnly</code> cookie to prevent unauthorized script access.
              </li>
              <li>
                Configured with <code>SameSite=Lax</code> and <code>Secure</code> flags in
                production deployments.
              </li>
              <li>
                Valid for 8 hours or until sign-out. No third-party advertising, analytics, or
                behavioral tracking cookies are used.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              4. Data Storage &amp; Retention
            </h2>
            <p>
              All application records reside within the configured PostgreSQL database. Logs and
              incident histories are retained for operational triage and auditability. In a
              production enterprise deployment, retention schedules must be configured based on
              applicable organizational governance policies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              5. Contact &amp; Operator Identification
            </h2>
            <p>
              For inquiries regarding this codebase, data review, or deletion requests in a local
              development instance, contact the developer repository administrator via the project
              GitHub repository issue tracker or local project operator.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
