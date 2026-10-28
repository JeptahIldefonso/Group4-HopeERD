"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title?: string;
    description?: string;
    headerActions?: React.ReactNode;
  }
>(({ className, children, title, description, headerActions, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 flex flex-col w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border border-border bg-bg-raised shadow-2xl duration-200 animate-in fade-in zoom-in-95 rounded-[12px] focus:outline-none",
        className
      )}
      {...props}
    >
      {(title || headerActions) && (
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0">
          {title && (
            <DialogPrimitive.Title className="font-sans text-base font-semibold text-fg tracking-tight">
              {title}
            </DialogPrimitive.Title>
          )}
          <div className="flex items-center space-x-1.5 ml-auto">
            {headerActions}
            <DialogPrimitive.Close className="rounded-[6px] p-1.5 text-fg-subtle hover:text-fg hover:bg-bg-hover transition-colors cursor-pointer">
              <X className="h-4 w-4 stroke-[1.5]" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
        </div>
      )}
      {description && (
        <DialogPrimitive.Description className="text-xs text-fg-muted leading-relaxed px-5 pt-2">
          {description}
        </DialogPrimitive.Description>
      )}
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

ModalContent.displayName = "ModalContent";
