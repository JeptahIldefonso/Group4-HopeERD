import * as React from "react";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No Entries Found",
  description = "No items match your active filter or search parameters.",
  action,
  icon = <FolderOpen className="w-8 h-8 stroke-[1.25] text-fg-subtle" />,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-[2px] border border-border border-dashed bg-bg-raised/40",
        className
      )}
    >
      <div className="mb-4 text-fg-subtle">{icon}</div>
      <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-fg mb-1">
        {title}
      </h3>
      <p className="text-xs text-fg-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
