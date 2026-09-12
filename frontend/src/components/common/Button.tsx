import React from 'react';
import { Button as ShadcnButton, ButtonProps as ShadcnButtonProps } from '../ui/button';

export type LegacyButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'default';
export type LegacyButtonSize = 'sm' | 'md' | 'lg' | 'default' | 'icon';

export interface ButtonProps extends Omit<ShadcnButtonProps, 'variant' | 'size'> {
  variant?: LegacyButtonVariant;
  size?: LegacyButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', leftIcon, rightIcon, children, ...props }, ref) => {
    // Map legacy 'primary' to shadcn 'default'
    const mappedVariant = variant === 'primary' ? 'default' : variant;
    // Map legacy 'md' to shadcn 'default'
    const mappedSize = size === 'md' ? 'default' : size;

    return (
      <ShadcnButton ref={ref} variant={mappedVariant} size={mappedSize} {...props}>
        {leftIcon}
        {children}
        {rightIcon}
      </ShadcnButton>
    );
  }
);

Button.displayName = 'Button';
export { ShadcnButton };
