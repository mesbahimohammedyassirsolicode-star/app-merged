import { Search, Bell, User, ChevronDown, Menu } from 'lucide-react';

export default function Navbar({ setMobileOpen }) {
  return (
    <header className="h-16 glass border-b border-border sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
      {/* Left Section: School Name & Mobile Menu */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-md hover:bg-accent text-muted-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1">
          Lycée International Excellence
        </h2>
      </div>

      {/* Middle Section: Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher un élève, classe..." 
            className="w-full bg-accent/50 border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Switcher */}
        <div className="hidden sm:flex items-center bg-accent/50 rounded-lg p-1 border border-border">
          <button className="px-3 py-1 text-xs font-bold rounded-md bg-background shadow-sm text-foreground">FR</button>
          <button className="px-3 py-1 text-xs font-bold rounded-md text-muted-foreground hover:text-foreground">AR</button>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 md:gap-3 pl-3 border-l border-border ml-1 md:ml-2 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-none mb-1">Ahmed Alami</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary/20 overflow-hidden bg-accent flex items-center justify-center group-hover:border-primary/50 transition-all">
            <User className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-all" />
        </div>
      </div>
    </header>
  );
}
