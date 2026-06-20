import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  School, 
  Layers, 
  CreditCard, 
  AlertCircle, 
  FileText, 
  Bus, 
  Settings,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import authService from '../services/authService';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Élèves', path: '/eleves' },
  { icon: GraduationCap, label: 'Enseignants', path: '/enseignants' },
  { icon: CalendarX, label: 'Absences', path: '/absences' },
  { icon: School, label: 'Classes', path: '/classes' },
  { icon: Layers, label: 'Niveaux', path: '/niveaux' },
  { icon: CreditCard, label: 'Paiements', path: '/paiements' },
  { icon: AlertCircle, label: 'Impayés', path: '/impayes' },
  { icon: FileText, label: 'Bulletins', path: '/bulletins' },
  { icon: LayoutDashboard, label: 'Emploi du temps', path: '/emploi' },
  { icon: Bus, label: 'Transport', path: '/transport' },
  { icon: Settings, label: 'Paramètres', path: '/parametres' },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-50 flex flex-col",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <School className="w-5 h-5 text-primary-foreground" />
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="font-bold text-xl tracking-tight whitespace-nowrap">EduFlow</span>
            )}
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-accent"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => {
                if (window.innerWidth < 1024) setMobileOpen(false);
              }}
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn(
                    "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-primary" : ""
                  )} />
                  {(!collapsed || mobileOpen) && (
                    <span className="font-medium text-sm whitespace-nowrap">{label}</span>
                  )}
                  
                  {collapsed && !mobileOpen && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-border shadow-lg z-50 whitespace-nowrap">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 group"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!collapsed && <span className="text-sm font-medium">Réduire</span>}
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5" />
            {(!collapsed || mobileOpen) && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
