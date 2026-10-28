import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-mono text-xs uppercase tracking-[0.14em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none active:scale-[0.98]";

    const variantStyles = {
      default:
        "bg-fg text-bg-raised hover:bg-fg/90 shadow-sm border border-transparent",
      outline:
        "bg-transparent text-fg border border-border hover:bg-bg-hover hover:border-[#041a24]",
      ghost:
        "bg-transparent text-fg hover:bg-bg-hover hover:text-fg",
      subtle:
        "bg-bg-hover text-fg hover:bg-bg-subtle border border-border/50",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-[11px] rounded-[6px]",
      md: "h-10 px-5 text-xs rounded-[6px]",
      lg: "h-12 px-7 text-xs rounded-[6px]",
      icon: "h-9 w-9 p-0 rounded-[6px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
