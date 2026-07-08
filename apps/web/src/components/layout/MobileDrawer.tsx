import { useEffect, type PropsWithChildren } from 'react';

interface MobileDrawerProps extends PropsWithChildren {
  onClose: () => void;
  open: boolean;
}

export function MobileDrawer({ children, onClose, open }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="mobile-drawer">
      <button aria-label="Fermer le menu" className="mobile-drawer__overlay" onClick={onClose} type="button" />
      <div className="mobile-drawer__panel">{children}</div>
    </div>
  );
}
