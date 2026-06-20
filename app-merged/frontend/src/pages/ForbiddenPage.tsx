import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { resolveDashboardPath } from '../lib/rbac';
import { buttonVariants } from '../components/ui/button-variants';
import { cn } from '../lib/utils';

export default function ForbiddenPage() {
  const { user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-400">
        <ShieldAlert className="h-8 w-8" aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold text-theme-text-primary">Accès refusé</h1>
        <p className="text-theme-text-secondary text-sm leading-relaxed">
          Vous n&apos;avez pas l&apos;autorisation d&apos;accéder à cette page. Si vous pensez qu&apos;il s&apos;agit
          d&apos;une erreur, contactez l&apos;administration.
        </p>
        {from ? (
          <p className="text-xs text-theme-text-secondary break-all">
            Chemin demandé&nbsp;: <span className="font-mono">{from}</span>
          </p>
        ) : null}
      </div>
      <Link
        to={resolveDashboardPath(user?.role)}
        replace
        className={cn(buttonVariants({ variant: 'default' }))}
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
