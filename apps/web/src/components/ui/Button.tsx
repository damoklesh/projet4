import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({ children, className = '', icon, size = 'md', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button className={`button button--${variant} button--${size} ${className}`.trim()} type="button" {...props}>
      {icon ? <span className="button__icon">{icon}</span> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
