import type { PropsWithChildren } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

interface PublicPageLayoutProps extends PropsWithChildren {
  align?: 'center' | 'bottom';
}

export function PublicPageLayout({ align = 'center', children }: PublicPageLayoutProps) {
  return (
    <div className="public-layout">
      <Header />
      <main className={`public-layout__main public-layout__main--${align}`}>{children}</main>
      <Footer />
    </div>
  );
}
