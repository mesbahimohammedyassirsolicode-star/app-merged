import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { Button } from './button';
import { AlertTriangle, RefreshCw, ServerCrash } from 'lucide-react';
import { toast } from 'sonner';

type ErrorBoundaryVariant = 'app' | 'route' | 'widget';

interface CustomErrorBoundaryProps {
  children: React.ReactNode;
  variant?: ErrorBoundaryVariant;
  onReset?: () => void;
}

// 1. App-level: Critical failure (entire app crash)
function AppErrorFallback({ error }: FallbackProps) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-theme-surface p-6 text-center">
      <div className="mb-6 rounded-full bg-red-100 p-4">
        <ServerCrash className="h-10 w-10 text-red-600" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-theme-text-primary">Erreur critique de l'application</h1>
      <p className="mb-6 max-w-lg text-theme-text-secondary">
        L'application a rencontré une erreur inattendue. Veuillez recharger la page.
      </p>
      <div className="mb-8 w-full max-w-2xl rounded-lg glass-panel p-4 text-left shadow-sm overflow-auto border border-red-100">
        <p className="text-sm font-mono text-theme-text-primary">{error instanceof Error ? error.message : 'Erreur inconnue'}</p>
      </div>
      <Button onClick={() => window.location.reload()} size="lg" className="bg-red-600 hover:bg-red-700 text-white">
        <RefreshCw className="mr-2 h-5 w-5" />
        Recharger l'application
      </Button>
    </div>
  );
}

// 2. Route-level: Page failure (preserves layout/sidebar)
function RouteErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex h-full w-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-500/10 p-6 text-center">
      <div className="mb-4 rounded-full bg-red-100 p-3">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-red-900">Erreur de chargement de la page</h2>
      <p className="mb-6 max-w-md text-sm text-red-400">
        Nous n'avons pas pu charger cette section. Veuillez réessayer ou contacter le support.
      </p>
      <div className="mb-6 w-full max-w-md rounded-lg glass-panel p-4 text-left shadow-sm overflow-auto">
        <p className="text-xs font-mono text-theme-text-primary">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
      <Button onClick={resetErrorBoundary} variant="outline" className="glass-panel hover:bg-red-500/10 hover:text-red-400 border-red-500/20">
        <RefreshCw className="mr-2 h-4 w-4" />
        Réessayer
      </Button>
    </div>
  );
}

// 3. Widget-level: Component failure (isolated to a specific card)
function WidgetErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-500/10/50 p-4 text-center h-full min-h-[150px]">
      <AlertTriangle className="mb-2 h-6 w-6 text-red-500" />
      <p className="mb-3 text-xs font-medium text-red-800">
        Ce composant n'a pas pu être chargé.
      </p>
      <Button onClick={resetErrorBoundary} variant="outline" size="sm" className="h-8 text-xs glass-panel hover:bg-red-500/10 hover:text-red-400 border-red-500/20">
        <RefreshCw className="mr-2 h-3 w-3" />
        Réessayer
      </Button>
    </div>
  );
}

export function ErrorBoundary({ children, variant = 'widget', onReset }: CustomErrorBoundaryProps) {
  const FallbackComponent = 
    variant === 'app' ? AppErrorFallback : 
    variant === 'route' ? RouteErrorFallback : 
    WidgetErrorFallback;

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onReset={onReset}
      onError={(error, info) => {
        console.error(`ErrorBoundary (${variant}) caught:`, error, info);
        // Only show global toast for route and app level errors
        if (variant !== 'widget') {
          toast.error('Une erreur inattendue s’est produite.');
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// HOC for easily wrapping widgets
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<CustomErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary variant="widget" {...boundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
