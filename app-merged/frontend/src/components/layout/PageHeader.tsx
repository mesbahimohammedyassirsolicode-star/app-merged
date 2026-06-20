import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-theme-text-primary sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-medium text-theme-text-secondary sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
