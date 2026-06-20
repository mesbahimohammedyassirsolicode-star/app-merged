import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (typeof document === 'undefined') return null;
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface px-6 py-4">
                            <h2 className="text-xl font-bold tracking-tight text-theme-text-primary dark:text-white">{title}</h2>
                            <button 
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="custom-scrollbar max-h-[80vh] overflow-y-auto p-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        portalRoot
    );
}

