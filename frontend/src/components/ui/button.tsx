import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // WASSAL Primary: bright green fill + plum text (5.9:1 AA WCAG contrast)
        default:
          'bg-wassal-green text-wassal-plum font-semibold hover:bg-[#48c960] active:bg-[#3fb854] focus-visible:ring-wassal-green shadow-xs',
        // WASSAL Destructive: wine fill + white text
        destructive:
          'bg-wassal-wine text-white font-medium hover:bg-[#451830] active:bg-[#341324] focus-visible:ring-wassal-wine shadow-xs',
        // WASSAL Outline: border with dark text
        outline:
          'border border-wassal-border bg-wassal-surface text-wassal-plum hover:bg-wassal-bg hover:text-wassal-plum focus-visible:ring-wassal-slate shadow-xs',
        // WASSAL Secondary: deep sage fill + white text
        secondary:
          'bg-wassal-sage-deep text-white font-medium hover:bg-[#3e6656] active:bg-[#335447] focus-visible:ring-wassal-sage-deep shadow-xs',
        // Ghost
        ghost: 'text-wassal-slate hover:bg-black/5 hover:text-wassal-plum',
        // Link
        link: 'text-wassal-green-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        md: 'h-9 px-4 py-2',
        lg: 'h-10 rounded-md px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
