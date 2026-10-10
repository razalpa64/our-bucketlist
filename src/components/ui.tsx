"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { onToast, type Toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase";
import { Flourish, DoodleStar } from "./doodles";

/* ------------------------------------------------------------------ buttons */

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const v = {
    primary: "bg-forest text-ivory hover:bg-forest-deep shadow-paper",
    accent: "bg-terracotta text-ivory hover:bg-terracotta-deep shadow-paper",
    soft: "bg-ivory text-ink border border-ink/20 hover:border-forest/60 hover:bg-sage-mist",
    ghost: "text-forest hover:bg-sage-mist",
    danger: "bg-transparent text-terracotta-deep border border-terracotta/50 hover:bg-terracotta/10",
  }[variant];
  const s = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  }[size];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-[6px_10px_7px_11px] font-medium tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${v} ${s} ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ chips */

export function Chip({ active, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-forest bg-forest text-ivory"
          : "border-ink/20 bg-transparent text-ink-soft hover:border-sage hover:text-forest"
      } ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ modal */

export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastActive = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    lastActive.current = document.activeElement;
    const el = ref.current;
    const focusables = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((f) => !f.hasAttribute("disabled"));
    const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (!isTouch) {
      setTimeout(() => focusables()[0]?.focus(), 30);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      (lastActive.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-3 overscroll-contain sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-forest-deep/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={`paper-card-deep relative my-auto w-full ${wide ? "max-w-3xl" : "max-w-xl"} max-h-[92vh] sm:max-h-[88vh] overflow-y-auto scroll-slim overscroll-contain`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel = "Yes, do it",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="confirm-title">
      <div className="p-7">
        <h3 id="confirm-title" className="font-serif text-2xl text-forest">
          {title}
        </h3>
        <p className="mt-2 text-sm text-ink-soft">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="soft" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ toasts */

export function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(
    () =>
      onToast((t) => {
        setToasts((prev) => [...prev.slice(-3), t]);
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4200);
      }),
    []
  );
  return createPortal(
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[95] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className={`pointer-events-auto flex items-center gap-2 rounded-[6px_9px_6px_10px] border px-4 py-2 text-sm shadow-lift ${
              t.kind === "error"
                ? "border-terracotta/60 bg-rose-soft text-terracotta-deep"
                : t.kind === "success"
                  ? "border-sage bg-sage-mist text-forest"
                  : "border-ink/20 bg-ivory text-ink"
            }`}
          >
            <DoodleStar className={`h-3.5 w-3.5 ${t.kind === "error" ? "text-terracotta" : "text-ochre"}`} />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

/* ---------------------------------------------------------------- headings */

export function SectionHeading({
  eyebrow,
  title,
  sub,
  id,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  id?: string;
  align?: "center" | "left";
}) {
  const center = align === "center";
  return (
    <div className={`${center ? "text-center" : "text-left"} mb-10`}>
      <p className="text-[11px] font-semibold tracking-[0.28em] text-terracotta uppercase">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-serif text-4xl font-semibold text-forest md:text-5xl">
        {title}
      </h2>
      {sub && <p className={`mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft ${center ? "mx-auto" : ""}`}>{sub}</p>}
      <Flourish className={`mt-4 h-5 w-32 text-sage ${center ? "mx-auto" : ""}`} />
    </div>
  );
}

/* ------------------------------------------------------- signed media img */

const urlCache = new Map<string, { url: string; at: number }>();

export function SignedImg({
  path,
  alt,
  className,
  eager,
}: {
  path: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(urlCache.get(path)?.url ?? null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    const hit = urlCache.get(path);
    if (hit && Date.now() - hit.at < 50 * 60 * 1000) {
      setUrl(hit.url);
      return;
    }
    supabase()
      .storage.from("dream-media")
      .createSignedUrl(path, 3600)
      .then((res: { data: { signedUrl: string } | null; error: { message: string } | null }) => {
        if (!live) return;
        if (res.error || !res.data) setFailed(true);
        else {
          urlCache.set(path, { url: res.data.signedUrl, at: Date.now() });
          setUrl(res.data.signedUrl);
        }
      });
    return () => {
      live = false;
    };
  }, [path]);

  if (failed)
    return <div className={`flex items-center justify-center bg-sage-mist text-xs text-ink-faint ${className}`}>image unavailable</div>;
  if (!url) return <div className={`animate-pulse bg-sage-mist ${className}`} aria-label={alt} role="img" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} loading={eager ? "eager" : "lazy"} className={className} />
  );
}
