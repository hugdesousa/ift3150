/* ------------------------------------------------------------------
   ift3150/hooks/use-toast.tsx
   Client-side toast helper (React)   –   exports: toast / useToast
------------------------------------------------------------------- */
"use client";

import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

/* ─── Configuration interne ─────────────────────────────────────── */
const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 10_000;

/* ─── Types publics ──────────────────────────────────────────────── */
export interface ToastOptions extends ToastProps {
  /* couleur */
  variant?: "default" | "destructive" | "success";
  /* id custom éventuel */
  id?: string;

  description?: React.ReactNode;
}

interface ToasterToast extends ToastOptions {
  id: string;
}
type State = { toasts: ToasterToast[] };
type Action =
  | { type: "ADD"; toast: ToasterToast }
  | { type: "UPDATE"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS"; id?: string }
  | { type: "REMOVE"; id?: string };

/* ─── Helpers globaux ───────────────────────────────────────────── */
let idCounter = 0;
const genId = () => `${++idCounter}`;
let memState: State = { toasts: [] };
const listeners: Array<(s: State) => void> = [];
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function dispatch(action: Action) {
  memState = reducer(memState, action);
  listeners.forEach((l) => l(memState));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };

    case "UPDATE":
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };

    case "DISMISS": {
      const ids = action.id ? [action.id] : state.toasts.map((t) => t.id);
      ids.forEach((id) => {
        if (timeouts.has(id)) return;
        timeouts.set(
          id,
          setTimeout(
            () => dispatch({ type: "REMOVE", id }),
            TOAST_REMOVE_DELAY,
          ),
        );
      });
      return {
        toasts: state.toasts.map((t) =>
          ids.includes(t.id) ? { ...t, open: false } : t,
        ),
      };
    }

    case "REMOVE":
      return {
        toasts: action.id ? state.toasts.filter((t) => t.id !== action.id) : [],
      };
  }
}

/* ─── API toast() utilisable partout côté client ───────────────── */
export function toast(opts: ToastOptions) {
  const id = opts.id ?? genId();
  const update = (patch: Partial<ToastOptions>) =>
    dispatch({ type: "UPDATE", toast: { ...patch, id } });
  const dismiss = () => dispatch({ type: "DISMISS", id });

  dispatch({
    type: "ADD",
    toast: {
      ...opts,
      id,
      open: true,
      onOpenChange: (open) => !open && dismiss(),
    },
  });

  return { id, update, dismiss };
}

/* ─── Hook React (pour le <ToastProvider>) ──────────────────────── */
export function useToast() {
  const [state, setState] = React.useState<State>(memState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (id?: string) => dispatch({ type: "DISMISS", id }),
  };
}

/* ── garde-fou explicite (IDE) ──────────────────────────────────── */
export { toast as _toast_export_, useToast as _useToast_export_ };
