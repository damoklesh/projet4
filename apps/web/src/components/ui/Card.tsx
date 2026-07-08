import type { PropsWithChildren } from 'react';

interface CardProps extends PropsWithChildren {
  className?: string;
  title?: string;
  variant?: 'centered' | 'bottomSheet' | 'plain';
}

export function Card({ children, className = '', title, variant = 'centered' }: CardProps) {
  return (
    <section className={`card card--${variant} ${className}`.trim()}>
      {title ? <h1 className="card__title">{title}</h1> : null}
      {children}
    </section>
  );
}
