import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-wassal-plum text-white hover:bg-wassal-plum/80',
        secondary:
          'border-transparent bg-wassal-sage-deep text-white hover:bg-wassal-sage-deep/80',
        destructive:
          'border-wassal-wine/30 bg-wassal-wine/10 text-wassal-wine hover:bg-wassal-wine/20',
        outline: 'text-wassal-plum border-wassal-border',
        // Lifecycle badges
        active:
          'border-wassal-green-ink/30 bg-wassal-green-ink/10 text-wassal-green-ink',
        pending:
          'border-wassal-slate/30 bg-wassal-slate/10 text-wassal-slate',
        blocked:
          'border-wassal-wine/30 bg-wassal-wine/10 text-wassal-wine',
        rejected:
          'border-wassal-plum/30 bg-wassal-plum/10 text-wassal-plum',
        // Role badges
        role:
          'border-wassal-slate/20 bg-wassal-slate/10 text-wassal-slate font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
