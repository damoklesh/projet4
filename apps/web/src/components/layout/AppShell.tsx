import type { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="history-shell">
      <Sidebar />
      <main className="history-main">{children}</main>
    </div>
  );
}
