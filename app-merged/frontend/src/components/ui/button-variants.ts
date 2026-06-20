import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-[12px] text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
    {
        variants: {
            variant: {
                default: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/40 border border-blue-400/20',
                destructive: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/20 hover:border-red-500/40',
                outline: 'border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface text-theme-text-primary dark:text-theme-text-primary hover:bg-theme-hover-card-bg hover:border-theme-border dark:hover:border-theme-border backdrop-blur-sm',
                secondary: 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 dark:border-purple-500/20 hover:bg-purple-600/20 dark:hover:bg-purple-600/20 hover:border-purple-500/40',
                ghost: 'text-theme-text-secondary dark:text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg',
                link: 'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline',
                glass: 'border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface text-theme-text-primary dark:text-theme-text-primary hover:bg-theme-hover-card-bg hover:border-theme-border dark:hover:border-theme-border backdrop-blur-sm',
                glow: 'bg-blue-600 text-white shadow-glow-primary hover:shadow-glow-primary-md border border-blue-400/30',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-lg px-3',
                lg: 'h-12 rounded-xl px-8 text-base',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);
