interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  ariaLabel: string;
  onChange: (value: T) => void;
  options: Array<SegmentedControlOption<T>>;
  value: T;
}

export function SegmentedControl<T extends string>({
  ariaLabel,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          aria-checked={option.value === value}
          className={`segmented-control__item${option.value === value ? ' segmented-control__item--active' : ''}`}
          key={option.value}
          onClick={() => onChange(option.value)}
          role="radio"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
