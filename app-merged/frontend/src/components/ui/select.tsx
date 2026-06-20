import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function CustomSelect({ options, value, onChange, placeholder, className }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300",
                        isOpen
                        ? "border-blue-500/50 bg-blue-500/5 ring-4 ring-blue-500/10 text-theme-text-primary dark:text-theme-text-primary"
                        : "border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface text-theme-text-primary dark:text-theme-text-secondary hover:bg-theme-hover-card-bg hover:border-theme-border dark:hover:border-theme-border"
                )}
            >
                <span className={cn(!selectedOption && "text-theme-text-secondary dark:text-theme-text-secondary")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-theme-text-secondary transition-transform duration-300", isOpen && "rotate-180 text-blue-500 dark:text-blue-400")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface/90 shadow-2xl backdrop-blur-2xl"
                    >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                            {options.map((option) => {
                                const isSelected = value === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-all duration-200 mb-0.5 last:mb-0",
                                            isSelected
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : "text-theme-text-secondary dark:text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg"
                                        )}
                                    >
                                        <span className="font-medium">{option.label}</span>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            >
                                                <Check className="h-4 w-4" />
                                            </motion.div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

