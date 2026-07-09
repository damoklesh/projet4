import { Copy } from 'lucide-react';
import { copyTextToClipboard } from '../../services/clipboard';
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
        <Button icon={<Copy size={16} />} onClick={() => void copyTextToClipboard(url)} variant="secondary">
          Copy
        </Button>
      </div>
    </section>
  );
}
