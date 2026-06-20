import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-[12px] border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface px-3 py-2 text-sm text-theme-text-primary backdrop-blur-sm shadow-sm transition-all duration-200 placeholder:text-theme-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50 hover:border-theme-border dark:hover:border-theme-border hover:bg-theme-hover-card-bg disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
