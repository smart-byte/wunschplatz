import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  kicker?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, kicker, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-rule pb-6">
      <div className="max-w-2xl">
        {kicker && <p className="section-label mb-3">{kicker}</p>}
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-prose-soft">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
