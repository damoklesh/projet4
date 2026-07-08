import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ id, label, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label;

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <input id={inputId} className="input" {...props} />
    </label>
  );
}
