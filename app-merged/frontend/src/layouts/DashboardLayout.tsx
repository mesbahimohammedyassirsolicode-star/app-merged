import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart,
  Briefcase,
  MessageSquare,
  Bell,
  UserCircle,
  FolderOpen,
  Link2,
  FileDown,
  Bot,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { hasAnyPermission, PERMISSIONS, type PermissionSlug } from '../lib/rbac';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const navItems: {
  label: string;
  icon: typeof Home;
  href: string;
  roles?: string[];
  anyPermission?: PermissionSlug[];
}[] = [
  { label: 'Tableau de bord', icon: Home, href: '/dashboard', anyPermission: [PERMISSIONS.DASHBOARD_READ] },
  {
    label: 'Utilisateurs',
    icon: Users,
    href: '/users',
    roles: ['admin', 'directeur', 'secretariat'],
    anyPermission: [PERMISSIONS.USERS_MANAGE],
  },
  {
    label: 'Affectation parent-stagiaires',
    icon: Link2,
    href: '/admin/parent-links',
    roles: ['admin'],
    anyPermission: [PERMISSIONS.ADMIN_PARENT_LINKS],
  },
  {
    label: 'Années scolaires',
    icon: Calendar,
    href: '/academic/years',
    roles: ['admin', 'directeur', 'secretariat'],
    anyPermission: [PERMISSIONS.ACADEMIC_MANAGE],
  },
  {
    label: 'Filières',
    icon: BookOpen,
    href: '/academic/filieres',
    roles: ['admin', 'directeur', 'secretariat'],
    anyPermission: [PERMISSIONS.ACADEMIC_MANAGE],
  },
  { label: 'Mon groupe', icon: Users, href: '/group', roles: ['student', 'stagiaire'] },
  {
    label: 'Groupes',
    icon: Users,
    href: '/groups',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'parent'],
    anyPermission: [PERMISSIONS.GROUPS_MANAGE, PERMISSIONS.GROUPS_READ, PERMISSIONS.PARENT_PORTAL],
  },
  {
    label: 'Modules',
    icon: BookOpen,
    href: '/modules',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent'],
    anyPermission: [PERMISSIONS.MODULES_MANAGE, PERMISSIONS.MODULES_READ_CATALOG],
  },
  {
    label: 'Fichiers de cours',
    icon: FolderOpen,
    href: '/course-files',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent'],
    anyPermission: [PERMISSIONS.COURSE_FILES_READ],
  },
  {
    label: 'Présences',
    icon: ClipboardList,
    href: '/attendance',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire'],
    anyPermission: [PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.ATTENDANCE_WRITE],
  },
  {
    label: 'Emploi du temps',
    icon: Calendar,
    href: '/timetable',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire'],
    anyPermission: [PERMISSIONS.TIMETABLE_READ],
  },
  {
    label: 'Progression',
    icon: BarChart,
    href: '/progress',
    roles: ['student', 'stagiaire'],
    anyPermission: [PERMISSIONS.PROGRESS_READ],
  },
  {
    label: 'Évaluations',
    icon: BarChart,
    href: '/evaluations',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent'],
    anyPermission: [PERMISSIONS.EVALUATIONS_READ, PERMISSIONS.EVALUATIONS_WRITE],
  },
  {
    label: 'Saisie des notes',
    icon: ClipboardList,
    href: '/grades-entry',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur'],
    anyPermission: [PERMISSIONS.GRADES_WRITE],
  },
  {
    label: 'Stages',
    icon: Briefcase,
    href: '/stages',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur'],
    anyPermission: [PERMISSIONS.STAGES_MANAGE],
  },
  { label: 'Messages', icon: MessageSquare, href: '/messages', anyPermission: [PERMISSIONS.MESSAGES_USE] },
  { label: 'Avis (anonyme)', icon: MessageSquare, href: '/feedback', anyPermission: [PERMISSIONS.FEEDBACK_SUBMIT] },
  { label: 'Notifications', icon: Bell, href: '/notifications', anyPermission: [PERMISSIONS.NOTIFICATIONS_READ] },
  {
    label: 'AI Assistant',
    icon: Bot,
    href: '/ai-assistant',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'parent'],
    anyPermission: [PERMISSIONS.AI_USE],
  },
  { label: 'Mon profil', icon: UserCircle, href: '/profile' },
  {
    label: 'Exports CSV',
    icon: FileDown,
    href: '/exports',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur'],
    anyPermission: [PERMISSIONS.EXPORTS_RUN],
  },
  {
    label: 'Mes enfants',
    icon: UserCircle,
    href: '/parent/children',
    roles: ['parent'],
    anyPermission: [PERMISSIONS.PARENT_PORTAL],
  },
];

export default function DashboardLayout() {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Performance: useCallback for stable references passed to memoized Sidebar
  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const canSee = (roles?: string[], anyPermission?: PermissionSlug[]) => {
    if (roles?.length) {
      if (!user?.role || !roles.includes(user.role)) {
        return false;
      }
    }
    if (anyPermission?.length) {
      return hasAnyPermission(permissions, anyPermission);
    }
    return true;
  };

  const resolvedAttendanceHref = useMemo(() => 
    user?.role === 'admin' || user?.role === 'directeur' || user?.role === 'secretariat'
      ? '/attendance/seances'
      : '/attendance',
    [user?.role]
  );

  // Performance: memoize array derivations to prevent new references on every render.
  const visibleNav = useMemo(() =>
    navItems
      .filter((item) => canSee(item.roles, item.anyPermission))
      .map((item) =>
        item.href === '/attendance'
          ? { ...item, href: resolvedAttendanceHref }
          : item
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.role, permissions, resolvedAttendanceHref]
  );

  const activeItem = visibleNav.find(
    (item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
  );

  const sidebarItems = useMemo(() =>
    visibleNav.map((item) => ({
      label: item.label,
      icon: item.icon,
      href: item.href,
    })),
    [visibleNav]
  );

  const handleNavigate = useCallback((href: string) => {
    navigate(href);
    setMobileOpen(false);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-theme-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-theme-text-primary dark:text-white transition-colors duration-300">
      <Sidebar
        items={sidebarItems}
        activePath={location.pathname}
        appTitle={t('app.title')}
        appSubtitle={t('app.subtitle')}
        userName={user?.name}
        userRole={user?.role}
        logoutLabel={t('auth.logout')}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {mobileOpen ? (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md md:hidden" 
          onClick={() => setMobileOpen(false)}
        >
          <aside 
            className="h-full w-72 border-r border-theme-border dark:border-theme-border bg-theme-surface dark:bg-gradient-to-b dark:from-slate-900/80 dark:to-slate-950/40 backdrop-blur-xl p-4 shadow-2xl relative z-50 text-theme-text-primary dark:text-white" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-theme-text-primary dark:text-white">{t('app.title')}</h2>
              <button 
                onClick={() => setMobileOpen(false)} 
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-theme-surface dark:bg-theme-surface border border-theme-border dark:border-theme-border text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNavigate(item.href)}
                    className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm font-medium transition-all ${
                      isActive
                        ? 'text-blue-600 dark:text-white bg-blue-500/10 dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-blue-600/10 border border-blue-500/30'
                        : 'text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg'
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      ) : null}

      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out",
        isCollapsed ? "md:ml-20" : "md:ml-72"
      )}>
        <Topbar
          title={activeItem?.label ?? t('app.title')}
          subtitle={t('app.subtitle')}
          userName={user?.name}
          userRole={user?.role}
          logoutLabel={t('auth.logout')}
          onLogout={handleLogout}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 sm:p-6 lg:p-8 pb-20"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
