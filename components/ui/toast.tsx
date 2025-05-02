/* =========================================================================
   components/ui/toast.tsx  –  Radix Toast custom
   ========================================================================= */
"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import "@/hooks/use-toast";

/* ───────────────────────── Provider & Viewport ────────────────────────── */
export const ToastProvider = ToastPrimitives.Provider;

declare module "@/hooks/use-toast" {
  interface ToastOptions {
    variant?: "default" | "destructive" | "success";
  }
}

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 sm:inset-auto sm:right-4 sm:bottom-4 sm:items-end",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

/* ───────────────────────── Variants & Root ────────────────────────────── */
const toastVariants = cva(
  [
    "group relative flex w-[--toast-width] max-w-[420px] overflow-hidden",
    "rounded-lg border pl-1 pr-4 py-3 shadow-xl backdrop-blur-md",
    "transition-[transform,opacity] duration-300 ease-out",
    /* Radix states */
    "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-4 sm:data-[state=open]:slide-in-from-bottom-4",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-right-4",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full",
  ].join(" "),
  {
    variants: {
      intent: {
        default: "border-muted bg-white/60 dark:bg-zinc-900/60",
        success:
          "border-emerald-300/30 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-600/20 dark:text-emerald-50",
        destructive:
          "border-rose-300/30 bg-rose-50/60 text-rose-900 dark:bg-rose-600/20 dark:text-rose-50",
      },
      size: {
        sm: "text-xs [&_svg]:size-4 ",
        md: "text-sm [&_svg]:size-4 ",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "md",
    },
  },
);

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {
  /** Un Avatar ou une icône Lucide – optionnel */
  icon?: React.ReactNode;
}

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, intent, size, icon, children, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ intent, size }), className)}
    {...props}
  >
    {/* Bandeau coloré à gauche (utilise la variant) */}
    <span
      className={cn(
        "absolute inset-y-0 left-0 w-1 rounded-r",
        intent === "success"
          ? "bg-emerald-500"
          : intent === "destructive"
            ? "bg-rose-500"
            : "bg-amber-400",
      )}
    />
    {/* Contenu */}
    <div className="flex flex-1 items-start gap-3 pl-2">
      {icon && <div className="mt-0.5 size-6 shrink-0">{icon}</div>}
      <div className="flex-1 space-y-0.5">{children}</div>
    </div>
    <ToastClose />
  </ToastPrimitives.Root>
));
Toast.displayName = "Toast";

/* ─────────────────────────   Sub-components   ─────────────────────────── */
export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-muted-foreground", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-xs font-medium transition-all hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring",
      "group-[.destructive]:border-rose-400/40 group-[.destructive]:hover:bg-rose-600/20",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
      className,
    )}
    {...props}
  >
    <X className="size-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = "ToastClose";

/* ------------------------------------------------------------------ */
export type ToastActionElement = React.ReactElement<typeof ToastAction>;
