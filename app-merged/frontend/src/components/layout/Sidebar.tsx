import { memo } from 'react';
import { LogOut, type LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activePath: string;
  appTitle: string;
  appSubtitle: string;
  userName?: string;
  userRole?: string;
  logoutLabel: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
}

function isActiveRoute(activePath: string, href: string): boolean {
  return activePath === href || activePath.startsWith(`${href}/`);
}

// Performance: React.memo prevents sidebar re-render when only main content changes
const Sidebar = memo(function Sidebar({
  items,
  activePath,
  appTitle,
  appSubtitle,
  userName,
  userRole,
  logoutLabel,
  onNavigate,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="hidden h-full w-72 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur md:flex">
      <div className="border-b border-slate-200/80 px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{appTitle}</h1>
        <p className="mt-1 text-xs font-medium text-slate-500">{appSubtitle}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const isActive = isActiveRoute(activePath, item.href);
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item.href)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              )}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 p-4">
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {userName?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
            <p className="truncate text-xs capitalize text-slate-500">{userRole}</p>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logoutLabel}
        </Button>
      </div>
    </aside>
  );
});

export default Sidebar;
