import { LogOut, Menu, Search, Bell, Globe, User, ChevronDown, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import NotificationBellWidget from '../../features/notifications/widgets/NotificationBellWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

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
  const [searchFocused, setSearchFocused] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { i18n, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLangMenu(false);
  };

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <header className="relative z-40 w-full border-b border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-background/60 backdrop-blur-xl transition-all duration-300">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left Section: Title & Mobile Toggle */}
        <div className="flex min-w-0 items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenMobileNav}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-theme-surface dark:bg-theme-surface border border-theme-border dark:border-theme-border text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg transition-all"
          >
            <Menu size={20} />
          </motion.button>
          
          <div className="flex flex-col min-w-0">
            <motion.h2
              layoutId="topbar-title"
              className="truncate text-sm font-bold tracking-tight text-theme-text-primary dark:text-white uppercase transition-all duration-300"
            >
              {title}
            </motion.h2>
            {subtitle && (
              <p className="truncate text-[10px] font-medium text-theme-text-secondary uppercase tracking-widest">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className={cn(
            "relative w-full group transition-all duration-300",
            searchFocused ? "scale-[1.02]" : "scale-100"
          )}>
            <div className={cn(
              "absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors",
              searchFocused ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#475569] dark:text-[#CBD5E1]"
            )}>
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={t('search.placeholder', 'Rechercher...')}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                "w-full rounded-md border border-[#CBD5E1] bg-theme-surface py-2.5 pl-10 pr-14 text-sm font-medium text-[#1E293B] shadow-sm transition-all placeholder:text-[#475569] hover:border-[#94A3B8] hover:bg-[#F9FAFB] focus:border-[#2563EB] focus:bg-theme-surface focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/20 dark:border-[#475569] dark:bg-theme-surface dark:text-[#F8FAFC] dark:placeholder:text-[#CBD5E1] dark:hover:border-[#94A3B8] dark:hover:bg-[#111C33] dark:focus:border-[#60A5FA] dark:focus:bg-theme-surface dark:focus:ring-[#60A5FA]/25",
                searchFocused && "border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.18)] dark:border-[#60A5FA] dark:shadow-[0_0_0_3px_rgba(96,165,250,0.22)]"
              )}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[#CBD5E1] bg-theme-background px-1.5 font-mono text-[10px] font-medium text-[#334155] opacity-100 dark:border-[#475569] dark:bg-[#111C33] dark:text-[#E2E8F0]">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section: Actions & User */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-theme-surface dark:bg-theme-surface border border-theme-border dark:border-theme-border text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-theme-text-primary" />}
          </motion.button>

          {/* Language Switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-theme-surface dark:bg-theme-surface border border-theme-border dark:border-theme-border text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg transition-all"
            >
              <Globe size={18} />
              <span className="hidden sm:block text-xs font-medium uppercase">{i18n.language}</span>
              <ChevronDown size={14} className={cn("transition-transform duration-300", showLangMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="hover-card absolute right-0 mt-3 w-40 overflow-hidden rounded-lg border border-[#CBD5E1] bg-theme-background text-[#1E293B] shadow-[0_10px_24px_-12px_rgba(15,23,42,0.28),0_4px_8px_-4px_rgba(15,23,42,0.16)] z-50 dark:border-[#475569] dark:bg-theme-surface dark:text-[#F8FAFC]"
                >
                  <div className="p-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all",
                          i18n.language === lang.code 
                            ? "bg-[#DBEAFE] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:text-[#DBEAFE]" 
                            : "text-[#334155] hover:bg-theme-surface hover:text-[#1E293B] dark:text-[#E2E8F0] dark:hover:bg-[#111C33] dark:hover:text-[#F8FAFC]"
                        )}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <NotificationBellWidget />

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-1 pl-1 pr-2 rounded-full bg-theme-surface dark:bg-theme-surface border border-theme-border dark:border-theme-border hover:bg-theme-hover-card-bg transition-all group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white shadow-glow-primary">
                {userName?.charAt(0) ?? '?'}
              </div>
              <div className="hidden sm:flex flex-col items-start mr-1">
                <span className="text-xs font-semibold text-theme-text-primary dark:text-white truncate max-w-[100px]">{userName}</span>
                <span className="text-[9px] text-theme-text-secondary uppercase tracking-tighter">{userRole}</span>
              </div>
              <ChevronDown size={14} className={cn("text-theme-text-secondary transition-transform duration-300", showProfileMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="hover-card absolute right-0 mt-3 w-56 overflow-hidden rounded-lg border border-[#CBD5E1] bg-theme-background text-[#1E293B] shadow-[0_10px_24px_-12px_rgba(15,23,42,0.28),0_4px_8px_-4px_rgba(15,23,42,0.16)] z-50 dark:border-[#475569] dark:bg-theme-surface dark:text-[#F8FAFC]"
                >
                  <div className="p-4 border-b border-[#CBD5E1] bg-theme-surface dark:border-[#475569] dark:bg-[#111C33]">
                    <p className="text-sm font-bold text-[#1E293B] dark:text-[#F8FAFC]">{userName}</p>
                    <p className="text-sm text-[#334155] truncate dark:text-[#E2E8F0]">{userRole}</p>
                  </div>
                  <div className="p-2">
                    <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#334155] rounded-lg transition-all hover:bg-theme-surface hover:text-[#1E293B] dark:text-[#E2E8F0] dark:hover:bg-[#111C33] dark:hover:text-[#F8FAFC]">
                      <User size={16} />
                      <span>{t('profile.view', 'Mon Profil')}</span>
                    </button>
                    <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#334155] rounded-lg transition-all hover:bg-theme-surface hover:text-[#1E293B] dark:text-[#E2E8F0] dark:hover:bg-[#111C33] dark:hover:text-[#F8FAFC]">
                      <Settings size={16} />
                      <span>{t('settings.title', 'Paramètres')}</span>
                    </button>
                    <div className="h-px bg-[#CBD5E1] dark:bg-[#475569] my-1" />
                    <button
                      onClick={onLogout}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-500 rounded-xl hover:bg-red-500/10 transition-all"
                    >
                      <LogOut size={16} />
                      <span>{logoutLabel}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

// Utility function for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
