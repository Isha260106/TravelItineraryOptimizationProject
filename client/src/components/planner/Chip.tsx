import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "primary" | "warn";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variant === "default" && "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]",
        variant === "primary" && "border-primary/30 bg-primary/15 text-[oklch(0.85_0.10_275)]",
        variant === "warn" && "border-amber-400/30 bg-amber-400/10 text-amber-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
