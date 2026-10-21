"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Share2,
  FileCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetch(`/api/knowledge/${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error("Article not found");
          return res.json();
        })
        .then((data) => {
          setArticle(data.article);
          setRelated(data.relatedArticles || []);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const handleVote = async (feedback: "helpful" | "not_helpful") => {
    if (voted) return;
    try {
      await fetch(`/api/knowledge/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      setVoted(true);
      if (feedback === "helpful") {
        setArticle((prev: any) => ({ ...prev, helpfulCount: prev.helpfulCount + 1 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (error || !article) {
    return (
      <AppShell>
        <div className="py-16 text-center space-y-4">
          <BookOpen className="w-8 h-8 text-purple-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Article Not Found</h2>
          <p className="text-xs text-slate-400">
            The knowledge article you requested could not be located.
          </p>
          <Link href="/knowledge-base">
            <Button variant="secondary" size="sm">
              Back to Knowledge Base
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/knowledge-base"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            KB-{article.id.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Article Body (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded">
                  {article.category?.name}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {article.viewCount} views
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {article.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{article.summary}</p>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Authored by {article.author?.name} ({article.author?.jobTitle})
                </span>
                <span>
                  Published{" "}
                  {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Prerequisites & Environment */}
            {article.prerequisites && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                  <AlertCircle className="w-4 h-4" />
                  Prerequisites &amp; Environment Requirements
                </div>
                <p className="text-slate-300 leading-relaxed">{article.prerequisites}</p>
              </div>
            )}

            {/* Step-by-Step Troubleshooting Checklist */}
            {article.troubleshootingSteps && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Step-by-Step Remediation Checklist
                  </CardTitle>
                </CardHeader>
                <div className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-slate-950 p-4 rounded-lg border border-slate-800">
                  {article.troubleshootingSteps}
                </div>
              </Card>
            )}

            {/* Expected Result */}
            {article.expectedResults && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Expected Resolution &amp; Verification
                </div>
                <p className="text-slate-300 leading-relaxed">{article.expectedResults}</p>
              </div>
            )}

            {/* In-depth Documentation Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Detailed Technical Notes</CardTitle>
              </CardHeader>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap space-y-2">
                {article.content}
              </div>
            </Card>

            {/* Helpfulness Feedback Box */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">Did this article resolve your technical issue?</span>
              {voted ? (
                <span className="text-emerald-400 font-medium">Thank you for your feedback!</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleVote("helpful")}
                    className="gap-1.5 text-emerald-400"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Yes, helpful
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleVote("not_helpful")}
                    className="gap-1.5 text-slate-400"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    No, need support
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Related Articles & Support Escalation */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Related Knowledge Articles
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {related.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No related articles in this topic.
                  </p>
                ) : (
                  related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/knowledge-base/${rel.slug}`}
                      className="block p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors text-xs space-y-1"
                    >
                      <span className="font-medium text-slate-200 hover:text-blue-400 block">
                        {rel.title}
                      </span>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{rel.summary}</p>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            <Card className="bg-blue-950/20 border-blue-500/20">
              <div className="space-y-3 text-xs">
                <span className="font-semibold text-blue-400 block text-sm">
                  Issue Still Unresolved?
                </span>
                <p className="text-slate-300 leading-relaxed">
                  If the steps above did not restore connectivity or functionality, escalate
                  directly to the Desktop Support queue.
                </p>
                <Link href="/tickets">
                  <Button size="sm" className="w-full">
                    Create Incident Ticket
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
