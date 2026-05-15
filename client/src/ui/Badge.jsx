import { cn } from '../lib/cn';

const styles = {
  default: 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]',
  accent: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        styles[variant] ?? styles.default,
        className
      )}
    >
      {children}
    </span>
  );
}
