import type { SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  placeholder?: string;
}

export function Select({
  label,
  options,
  placeholder,
  className = '',
  ...rest
}: SelectProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={`input ${className}`} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
