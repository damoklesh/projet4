import { Copy } from 'lucide-react';
import { Button } from '../ui/Button';

interface ShareLinkCardProps {
  token: string;
}

export function ShareLinkCard({ token }: ShareLinkCardProps) {
  const href = `${window.location.origin}/s/${token}`;

  return (
    <section className="result-panel">
      <h2>Share link</h2>
      <div className="copy-row">
        <input className="input" readOnly value={href} />
        <Button icon={<Copy size={16} />} onClick={() => navigator.clipboard.writeText(href)} variant="secondary">
          Copy
        </Button>
      </div>
    </section>
  );
}
