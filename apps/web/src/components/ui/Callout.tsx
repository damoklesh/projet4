import type { PropsWithChildren } from 'react';

interface CalloutProps extends PropsWithChildren {
  tone?: 'info' | 'success' | 'danger';
}

export function Callout({ children, tone = 'info' }: CalloutProps) {
  return <div className={`callout callout--${tone}`}>{children}</div>;
}
