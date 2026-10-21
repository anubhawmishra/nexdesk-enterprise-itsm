import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Key, Server, Database, CheckCircle } from "lucide-react";

export default function SecurityPage() {
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
            <Lock className="w-4 h-4" /> Technical Controls &amp; Architecture
          </div>
          <h1 className="text-2xl font-bold text-white">
            Security &amp; Data Handling Architecture
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: October 2026 • OWASP-Guided Controls &amp; Retention Policies
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Security Controls Implemented
            </h2>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Server-Side Authorization (RBAC):</strong> Permissions are evaluated in
                  API route handlers and server components. UI controls are not trusted as the sole
                  boundary.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Password Hashing:</strong> Credentials are cryptographically hashed using
                  salted bcrypt prior to persistence. Plaintext passwords are never stored or
                  logged.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Session Security:</strong> Authenticated sessions use HttpOnly,
                  SameSite=Lax signed tokens to mitigate cross-site scripting (XSS) token
                  extraction.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>CSV Formula Injection Defense:</strong> RFC 4180 export sanitization
                  prefixes cells starting with <code>=</code>, <code>+</code>, <code>-</code>,{" "}
                  <code>@</code>, <code>\t</code>, or <code>\r</code> with a single quote to
                  neutralize spreadsheet execution.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Rate Limiting:</strong> Sliding-window rate limiting on authentication and
                  sensitive endpoints to protect against brute force attempts.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Security Headers &amp; CSP:</strong> Strict Content-Security-Policy,
                  X-Frame-Options: DENY, and X-Content-Type-Options: nosniff headers configured on
                  all routes.
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" /> Data Retention &amp; Deletion
            </h2>
            <p>
              Under current local database configuration, incident history and audit logs remain
              persisted for operational tracking. In formal enterprise environments, data purging
              cycles should be scheduled in accordance with regulatory requirements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Independent Testing &amp; Production Readiness
            </h2>
            <p>
              This application has been developed to adhere to modern security hygiene standards.
              However, it is not formally certified by an external auditor. Independent penetration
              testing and threat modeling are recommended before deployment in public enterprise
              environments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
