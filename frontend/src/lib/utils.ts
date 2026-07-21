import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes, resolving conflicts safely.
 * Standard for shadcn/ui and 21st.dev components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
