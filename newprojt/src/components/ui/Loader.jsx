import { Loader2 } from 'lucide-react';

export default function Loader({ className, text = "Chargement..." }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className || ''}`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}
