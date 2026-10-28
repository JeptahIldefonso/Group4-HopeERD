import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[2px] bg-fg/[0.06] border border-border/40",
        className
      )}
      {...props}
    />
  );
}
