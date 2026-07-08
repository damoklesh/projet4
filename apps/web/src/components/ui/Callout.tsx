import type { PropsWithChildren } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface CalloutProps extends PropsWithChildren {
  tone?: 'info' | 'success' | 'warning' | 'danger';
}

export function Callout({ children, tone = 'info' }: CalloutProps) {
  const Icon = tone === 'danger' ? AlertCircle : tone === 'warning' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info;

  return (
    <div className={`callout callout--${tone}`} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={13} />
      <span>{children}</span>
    </div>
  );
}
