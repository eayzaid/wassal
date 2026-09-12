import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, id, className = '', ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-wassal-plum mb-1.5"
          >
            {label}
            {props.required && <span className="text-wassal-wine ml-0.5">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full bg-wassal-surface border text-sm text-wassal-ink rounded-md px-3 py-2 transition-colors focus:outline-none focus:ring-1 ${
            error
              ? 'border-wassal-wine text-wassal-wine focus:border-wassal-wine focus:ring-wassal-wine'
              : 'border-wassal-border focus:border-wassal-slate focus:ring-wassal-slate'
          } disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-wassal-wine font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-wassal-slate">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
