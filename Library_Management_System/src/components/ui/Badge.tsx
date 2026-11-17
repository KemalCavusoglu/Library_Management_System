import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'accent';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  success: 'bg-brand-100 text-brand-700',
  warning: 'bg-accent-100 text-accent-700',
  danger: 'bg-red-100 text-red-700',
  brand: 'bg-brand-600 text-white',
  accent: 'bg-accent-500 text-white',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
