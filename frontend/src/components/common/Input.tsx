import React, { forwardRef, InputHTMLAttributes } from 'react';
import { Input as ShadcnInput } from '../ui/input';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, id, className = '', ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-wassal-plum mb-1.5"
          >
            {label}
            {props.required && <span className="text-wassal-wine ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-wassal-slate pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <ShadcnInput
            id={inputId}
            ref={ref}
            error={Boolean(error)}
            className={`${leftIcon ? 'pl-9' : 'pl-3'} ${rightIcon ? 'pr-9' : 'pr-3'} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-wassal-slate flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-wassal-wine font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-wassal-slate">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
