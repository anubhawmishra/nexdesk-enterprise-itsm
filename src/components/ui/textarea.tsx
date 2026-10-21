import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          className={twMerge(
            clsx(
              "w-full px-3 py-2 text-sm bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-900 resize-y",
              error
                ? "border-red-500/80 focus:ring-red-500"
                : "border-slate-800 hover:border-slate-700",
              className,
            ),
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
