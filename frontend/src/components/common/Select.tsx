import React from 'react';
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CommonSelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Select: React.FC<CommonSelectProps> = ({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Sélectionner...',
  error,
  helperText,
  required,
  disabled,
  className = '',
  id,
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-wassal-plum"
        >
          {label}
          {required && <span className="text-wassal-wine ml-0.5">*</span>}
        </label>
      )}
      <RadixSelect
        value={value}
        defaultValue={defaultValue}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className={`w-full bg-wassal-surface border text-sm text-wassal-ink rounded-xl px-3 py-2 transition-colors ${
            error
              ? 'border-wassal-wine text-wassal-wine focus:ring-wassal-wine'
              : 'border-wassal-border focus:ring-wassal-slate'
          } ${className}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </RadixSelect>
      {error && <p className="mt-1 text-xs text-wassal-wine font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-wassal-slate">{helperText}</p>
      )}
    </div>
  );
};
