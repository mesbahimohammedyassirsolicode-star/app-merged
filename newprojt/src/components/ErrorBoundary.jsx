import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full"></div>
            <div className="relative w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Une erreur est survenue</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              L'application a rencontré un problème inattendu lors de l'affichage de cette page.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Recharger la page
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-w-2xl w-full border border-border">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
