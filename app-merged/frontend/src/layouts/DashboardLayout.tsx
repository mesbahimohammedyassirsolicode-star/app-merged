import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
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
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

const navItems: { label: string; icon: typeof Home; href: string; roles?: string[] }[] = [
  { label: 'Tableau de bord', icon: Home, href: '/dashboard' },
  { label: 'Utilisateurs', icon: Users, href: '/users', roles: ['admin', 'directeur', 'secretariat'] },
  { label: 'Affectation parent-stagiaires', icon: Link2, href: '/admin/parent-links', roles: ['admin'] },
  { label: 'Années scolaires', icon: Calendar, href: '/academic/years', roles: ['admin', 'directeur', 'secretariat'] },
  { label: 'Filières', icon: BookOpen, href: '/academic/filieres', roles: ['admin', 'directeur', 'secretariat'] },
  { label: 'Mon groupe', icon: Users, href: '/group', roles: ['student', 'stagiaire'] },
  {
    label: 'Groupes',
    icon: Users,
    href: '/groups',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur'],
  },
  {
    label: 'Modules',
    icon: BookOpen,
    href: '/modules',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire'],
  },
  {
    label: 'Fichiers de cours',
    icon: FolderOpen,
    href: '/course-files',
    roles: ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent'],
  },
  { label: 'Présences', icon: ClipboardList, href: '/attendance' },
  { label: 'Emploi du temps', icon: Calendar, href: '/timetable', roles: ['admin', 'teacher', 'student'] },
  { label: 'Progression', icon: BarChart, href: '/progress' },
  { label: 'Évaluations', icon: BarChart, href: '/evaluations' },
  { label: 'Stages', icon: Briefcase, href: '/stages' },
  { label: 'Avis (anonyme)', icon: MessageSquare, href: '/feedback' },
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Mes enfants', icon: UserCircle, href: '/parent/children', roles: ['parent'] },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Performance: useCallback for stable references passed to memoized Sidebar
  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const canSee = (roles?: string[]) => {
    if (!roles) return true;
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  const resolvedAttendanceHref =
    user?.role === 'admin' || user?.role === 'directeur' || user?.role === 'secretariat'
      ? '/attendance/seances'
      : '/attendance';

  // Performance: memoize array derivations to prevent new references on every render.
  // Without this, the memoized Sidebar would re-render every time because it receives
  // a new sidebarItems array reference.
  const visibleNav = useMemo(() =>
    navItems
      .filter((item) => canSee(item.roles))
      .map((item) =>
        item.href === '/attendance'
          ? { ...item, href: resolvedAttendanceHref }
          : item
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.role, resolvedAttendanceHref]
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
    <div className="flex h-screen bg-slate-100/70">
      <Sidebar
        items={sidebarItems}
        activePath={location.pathname}
        appTitle={t('app.title')}
        appSubtitle={t('app.subtitle')}
        userName={user?.name}
        userRole={user?.role}
        logoutLabel={t('auth.logout')}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {mobileOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px] md:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-72 border-r border-slate-200 bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-700">{t('app.title')}</h2>
              <Button variant="secondary" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          title={activeItem?.label ?? t('app.title')}
          subtitle={t('app.subtitle')}
          userName={user?.name}
          userRole={user?.role}
          logoutLabel={t('auth.logout')}
          onLogout={handleLogout}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
