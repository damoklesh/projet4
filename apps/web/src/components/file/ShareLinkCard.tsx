import { Copy } from 'lucide-react';
import { Button } from '../ui/Button';

interface ShareLinkCardProps {
  url: string;
}

export function ShareLinkCard({ url }: ShareLinkCardProps) {
  return (
    <section className="result-panel">
      <h2>Share link</h2>
      <div className="copy-row">
        <input className="input" readOnly value={url} />
        <Button icon={<Copy size={16} />} onClick={() => navigator.clipboard.writeText(url)} variant="secondary">
          Copy
        </Button>
      </div>
    </section>
  );
}
