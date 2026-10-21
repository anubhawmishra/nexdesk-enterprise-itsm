import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 px-4 sm:px-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500/80" />
          <span>NEXDESK Enterprise IT Service Desk &amp; Asset Management • v1.0.0</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-[11px] text-slate-500">Internal Operations Platform</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">
            Privacy Notice
          </Link>
          <Link href="/terms" className="hover:text-slate-300 transition-colors">
            Terms of Use
          </Link>
          <Link href="/acceptable-use" className="hover:text-slate-300 transition-colors">
            Acceptable Use
          </Link>
          <Link href="/security" className="hover:text-slate-300 transition-colors">
            Security &amp; Data Handling
          </Link>
        </nav>
      </div>
    </footer>
  );
};
