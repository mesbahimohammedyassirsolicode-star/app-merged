import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    toast.error('Une erreur inattendue s’est produite.');
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[320px] p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-sm text-gray-600 mb-4 max-w-md">{this.state.error.message}</p>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Réessayer
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
