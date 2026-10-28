import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "subtle";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] rounded-[2px] transition-colors";

  const variantStyles = {
    default: "bg-accent-dim text-fg border border-border",
    outline: "border border-border text-fg-muted bg-transparent",
    subtle: "bg-bg-hover text-fg-subtle border border-transparent",
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
}
