import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'medium', children, ...props }) => {
    const baseStyles = 'rounded shadow transition duration-300 ease-in-out focus:outline-none';
    const variantStyles = {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'border border-[var(--analytics-border)] bg-[var(--analytics-surface)] text-[var(--analytics-text)] hover:bg-[var(--analytics-surface-soft)]',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };
    const sizeStyles = {
        small: 'px-2 py-1 text-sm',
        medium: 'px-4 py-2',
        large: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
