import type { PropsWithChildren } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps extends PropsWithChildren {
  title: string;
  open: boolean;
  onClose: () => void;
}

export function Modal({ children, onClose, open, title }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal__panel">
        <div className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <Button aria-label="Close" icon={<X size={16} />} onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
