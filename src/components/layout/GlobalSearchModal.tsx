"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Ticket, Laptop, BookOpen, User, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchResults {
  tickets: Array<{
    id: string;
    ticketCode: string;
    title: string;
    status: string;
    priority: string;
    type: string;
  }>;
  assets: Array<{
    id: string;
    assetTag: string;
    model: string;
    manufacturer: string;
    lifecycleStatus: string;
    assetType: string;
  }>;
  knowledge: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    category: { name: string };
  }>;
  employees: Array<{
    id: string;
    name: string;
    email: string;
    jobTitle: string;
    department?: { name: string };
  }>;
}

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    tickets: [],
    assets: [],
    knowledge: [],
    employees: [],
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ tickets: [], assets: [], knowledge: [], employees: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ tickets: [], assets: [], knowledge: [], employees: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.tickets.length +
    results.assets.length +
    results.knowledge.length +
    results.employees.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets, assets, employees, articles... (e.g. VPN, BSOD, ThinkPad)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin mr-2" />}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.length >= 2 && !loading && totalResults === 0 && (
            <div className="py-8 text-center text-slate-400 text-sm">
              No records found matching &ldquo;{query}&rdquo;.
            </div>
          )}

          {/* Tickets */}
          {results.tickets.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Ticket className="w-3.5 h-3.5 text-blue-400" />
                Tickets & Incidents ({results.tickets.length})
              </div>
              <div className="space-y-1">
                {results.tickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-400 font-semibold">
                          {t.ticketCode}
                        </span>
                        <span className="text-xs text-slate-200 truncate">{t.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={t.priority.toLowerCase() as any}>{t.priority}</Badge>
                      <Badge variant={t.status.toLowerCase() as any}>
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* IT Assets */}
          {results.assets.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                IT Hardware Assets ({results.assets.length})
              </div>
              <div className="space-y-1">
                {results.assets.map((a) => (
                  <Link
                    key={a.id}
                    href={`/assets/${a.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-emerald-400 font-semibold">
                          {a.assetTag}
                        </span>
                        <span className="text-xs text-slate-200 truncate">
                          {a.manufacturer} {a.model}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {a.lifecycleStatus.replace(/_/g, " ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Base */}
          {results.knowledge.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                Knowledge Base Articles ({results.knowledge.length})
              </div>
              <div className="space-y-1">
                {results.knowledge.map((k) => (
                  <Link
                    key={k.id}
                    href={`/knowledge-base/${k.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-medium text-slate-200 truncate">{k.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{k.summary}</p>
                    </div>
                    <span className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded flex-shrink-0">
                      {k.category.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Employees */}
          {results.employees.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Employees ({results.employees.length})
              </div>
              <div className="space-y-1">
                {results.employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-transparent"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-medium text-slate-200">{emp.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {emp.jobTitle} • {emp.email}
                      </p>
                    </div>
                    {emp.department && (
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded flex-shrink-0">
                        {emp.department.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">
              ESC
            </kbd>
            <span>to close</span>
          </div>
          <span>Search enforces RBAC data segregation</span>
        </div>
      </div>
    </div>
  );
};
