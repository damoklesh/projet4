import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ label: string; value: string }>;
}

export function Select({ id, label, options, ...props }: SelectProps) {
  const selectId = id ?? props.name ?? label;

  return (
    <label className="field" htmlFor={selectId}>
      <span className="field__label">{label}</span>
      <select id={selectId} className="input" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
