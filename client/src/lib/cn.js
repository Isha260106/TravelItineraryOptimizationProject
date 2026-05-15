import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely (Linear / shadcn-style). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
