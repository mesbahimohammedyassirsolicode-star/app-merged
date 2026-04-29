import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700',
                destructive: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
                outline: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
                secondary: 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200',
                ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                link: 'text-primary-700 underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4',
                sm: 'h-9 rounded-lg px-3',
                lg: 'h-11 rounded-xl px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);
