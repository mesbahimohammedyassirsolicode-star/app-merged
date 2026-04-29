import { LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/button';

interface TopbarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  logoutLabel: string;
  onLogout: () => void;
  onOpenMobileNav: () => void;
}

export default function Topbar({
  title,
  subtitle,
  userName,
  userRole,
  logoutLabel,
  onLogout,
  onOpenMobileNav,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            className="md:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
            {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">{userName}</p>
            <p className="text-xs capitalize text-slate-500">{userRole}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {logoutLabel}
          </Button>
        </div>
      </div>
    </header>
  );
}
