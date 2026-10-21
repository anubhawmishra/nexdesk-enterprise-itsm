import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from "lucide-react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "critical"
    | "high"
    | "medium"
    | "low"
    | "new"
    | "triaged"
    | "in_progress"
    | "pending"
    | "resolved"
    | "closed"
    | "sla_within"
    | "sla_warning"
    | "sla_breached"
    | "role";
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  className,
  children,
  ...props
}) => {
  const styles: Record<string, { bg: string; icon?: React.ReactNode }> = {
    default: {
      bg: "bg-slate-800 text-slate-300 border-slate-700",
    },
    critical: {
      bg: "bg-red-500/10 text-red-400 border-red-500/30",
      icon: <ShieldAlert className="w-3 h-3 text-red-400" />,
    },
    high: {
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
    },
    medium: {
      bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      icon: <AlertCircle className="w-3 h-3 text-blue-400" />,
    },
    low: {
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
    },
    new: {
      bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      icon: <Sparkles className="w-3 h-3 text-purple-400" />,
    },
    triaged: {
      bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      icon: <UserCheck className="w-3 h-3 text-indigo-400" />,
    },
    in_progress: {
      bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      icon: <Clock className="w-3 h-3 text-blue-400 animate-pulse" />,
    },
    pending: {
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      icon: <Clock className="w-3 h-3 text-amber-400" />,
    },
    resolved: {
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
    },
    closed: {
      bg: "bg-slate-700/50 text-slate-400 border-slate-700",
      icon: <CheckCircle2 className="w-3 h-3 text-slate-400" />,
    },
    sla_within: {
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
    },
    sla_warning: {
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
    },
    sla_breached: {
      bg: "bg-red-500/10 text-red-400 border-red-500/30",
      icon: <ShieldAlert className="w-3 h-3 text-red-400" />,
    },
    role: {
      bg: "bg-slate-800 text-slate-300 border-slate-700",
    },
  };

  const current = styles[variant] || styles.default;

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tabular-nums",
          current.bg,
          className,
        ),
      )}
      {...props}
    >
      {current.icon}
      <span>{children}</span>
    </span>
  );
};
