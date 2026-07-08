import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ label: string; value: string }>;
}

export function Select({ id, label, options, ...props }: SelectProps) {
  const selectId = id ?? props.name ?? label;

  return (
    <div className="field">
      <label className="field__label" htmlFor={selectId}>
        {label}
      </label>
      <select id={selectId} className="input" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
