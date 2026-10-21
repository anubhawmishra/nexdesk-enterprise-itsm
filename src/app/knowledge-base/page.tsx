"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Eye,
  ThumbsUp,
  ArrowRight,
  Tag,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory,
        search,
      });

      const res = await fetch(`/api/knowledge?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen className="w-3.5 h-3.5" /> Self-Service IT Portal
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Enterprise Knowledge Base &amp; SOPs
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard operating procedures, step-by-step diagnostic workflows, and pre-approved
              remediation checklists for Windows workstations, GlobalProtect VPN, and enterprise
              software.
            </p>

            {/* Quick search input */}
            <div className="pt-2">
              <div className="relative max-w-lg">
                <Input
                  placeholder="Search articles (e.g. VPN Error 1002, Outlook OST, Wi-Fi 802.1X, BSOD)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchArticles()}
                  className="pl-9 h-11 text-xs sm:text-sm bg-slate-950 border-slate-700"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Topics ({articles.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === c.slug
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-12 w-full" />
              </Card>
            ))
          ) : articles.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              No knowledge base articles found matching your query.
            </div>
          ) : (
            articles.map((art) => (
              <Link key={art.id} href={`/knowledge-base/${art.slug}`}>
                <Card className="p-5 h-full flex flex-col justify-between hoverable group space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded">
                        {art.category?.name}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Eye className="w-3 h-3 text-slate-400" />
                        {art.viewCount} views
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors leading-snug">
                      {art.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-400" />
                      {art.helpfulCount} found helpful
                    </span>
                    <span className="text-blue-400 flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                      Read article <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
