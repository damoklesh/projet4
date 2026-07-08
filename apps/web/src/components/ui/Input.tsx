import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: ReactNode;
}

export function Input({ error, hint, id, label, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label;
  const descriptionId = error || hint ? `${inputId}-description` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error) || undefined}
        className="input"
        {...props}
      />
      {error ? (
        <p className="field__message field__message--error" id={descriptionId} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__message" id={descriptionId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
