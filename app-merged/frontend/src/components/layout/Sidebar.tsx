import { memo } from 'react';
import { LogOut, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (href: string) => void;
  onLogout: () => void;
}

function isActiveRoute(activePath: string, href: string): boolean {
  return activePath === href || activePath.startsWith(`${href}/`);
}

const Sidebar = memo(function Sidebar({
  items,
  activePath,
  appTitle,
  appSubtitle,
  userName,
  userRole,
  logoutLabel,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  onLogout,
}: SidebarProps) {
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-full flex-col border-r border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-background/80 backdrop-blur-xl transition-all duration-300 md:flex",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex h-20 items-center border-b border-theme-border dark:border-theme-border px-6",
        isCollapsed && "justify-center px-0"
      )}>
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-glow-primary">
                <span className="text-xl font-bold text-white">{appTitle.charAt(0)}</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-bold tracking-tight text-theme-text-primary dark:text-white line-clamp-1">{appTitle}</h1>
                <p className="text-[10px] font-medium text-theme-text-secondary">{appSubtitle}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-glow-primary"
            >
              <span className="text-xl font-bold text-white">{appTitle.charAt(0)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
        {items.map((item, idx) => {
          const isActive = isActiveRoute(activePath, item.href);
          return (
            <motion.button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item.href)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.01 }}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm font-medium transition-all duration-300',
                isActive
                  ? 'text-blue-600 dark:text-white font-semibold'
                  : 'text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg',
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.label : ""}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-glow"
                  className="absolute inset-0 rounded-[12px] bg-blue-500/10 border border-blue-500/20 shadow-glow-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-all duration-300 relative z-10',
                  isActive 
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-theme-text-secondary group-hover:text-theme-hover-card-fg'
                )}
              />
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="truncate relative z-10"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !isCollapsed && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 h-4 w-1 rounded-r-full bg-blue-500 shadow-glow-primary"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-theme-border dark:border-theme-border p-4 space-y-3 bg-theme-surface dark:bg-theme-background/40">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-2 py-2"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-theme-surface dark:bg-theme-surface border border-theme-border dark:border-theme-border text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm">
              {userName?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-theme-text-primary dark:text-white">{userName}</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-theme-text-secondary">{userRole}</p>
            </div>
          </motion.div>
        )}

        <div className={cn("flex flex-col gap-2", isCollapsed && "items-center")}>
          <button
            onClick={onLogout}
            className={cn(
              "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-300",
              isCollapsed 
                ? "text-red-500 dark:text-red-400 hover:bg-red-500/10" 
                : "text-theme-text-secondary dark:text-theme-text-secondary hover:text-red-500 hover:bg-red-500/10 w-full"
            )}
            title={isCollapsed ? logoutLabel : ""}
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!isCollapsed && <span>{logoutLabel}</span>}
          </button>

          <button
            onClick={onToggleCollapse}
            className="flex h-10 w-full items-center justify-center rounded-[12px] border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg transition-all"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
