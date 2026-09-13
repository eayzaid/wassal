import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-3 sm:p-3.5 text-sm flex items-center gap-2.5 [&:has(h5)]:items-start [&:has(h5)_svg]:mt-0.5 [&>svg]:shrink-0 [&>svg]:w-4 [&>svg]:h-4',
  {
    variants: {
      variant: {
        default: 'bg-wassal-bg text-wassal-ink border-wassal-border',
        destructive:
          'border-wassal-wine/30 bg-rose-50 text-wassal-wine [&>svg]:text-wassal-wine',
        success:
          'border-wassal-green-ink/30 bg-emerald-50 text-wassal-green-ink [&>svg]:text-wassal-green-ink',
        warning:
          'border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-snug tracking-tight text-sm', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs leading-snug flex-1 min-w-0', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
