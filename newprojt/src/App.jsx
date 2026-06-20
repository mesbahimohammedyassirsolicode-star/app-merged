import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

const Dashboard = lazy(() => import('./pages/Dashboard'));

const routeFallback = (
  <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
    Chargement du tableau de bord…
  </div>
);
import Students from './pages/students/Students';
import Teachers from './pages/teachers/Teachers';
import Niveaux from './pages/academic/Niveaux';
import Classes from './pages/academic/Classes';
import Payments from './pages/finance/Payments';
import Unpaid from './pages/finance/Unpaid';
import Absences from './pages/absences/Absences';
import Bulletins from './pages/academic/Bulletins';
import Transport from './pages/transport/Transport';
import Schedule from './pages/schedule/Schedule';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { cn } from './lib/utils';

function AppLayout({ children, sidebarCollapsed, setSidebarCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) return children;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden">
      <Toaster />
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div 
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64",
          "pl-0"
        )}
      >
        <Navbar setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>

        <footer className="p-6 text-center text-xs text-muted-foreground border-t border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
            <p>© 2026 EduFlow — Excellence en Gestion Scolaire.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
              <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppLayout 
      sidebarCollapsed={sidebarCollapsed} 
      setSidebarCollapsed={setSidebarCollapsed}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
    >
      <ErrorBoundary>
        <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={routeFallback}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/eleves" element={<ProtectedRoute><Students /></ProtectedRoute>} />
        <Route path="/enseignants" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
        <Route path="/niveaux" element={<ProtectedRoute><Niveaux /></ProtectedRoute>} />
        <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
        <Route path="/paiements" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/impayes" element={<ProtectedRoute><Unpaid /></ProtectedRoute>} />
        <Route path="/absences" element={<ProtectedRoute><Absences /></ProtectedRoute>} />
        <Route path="/bulletins" element={<ProtectedRoute><Bulletins /></ProtectedRoute>} />
        <Route path="/transport" element={<ProtectedRoute><Transport /></ProtectedRoute>} />
        <Route path="/emploi" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        
        <Route path="*" element={
          <div className="max-w-7xl mx-auto h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2rem] opacity-50 min-h-[70vh]">
            <div className="text-center space-y-6 px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 transform hover:scale-110 transition-transform duration-500">
                  <span className="text-5xl">404</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
                Page non trouvée
              </h1>
              <p className="text-muted-foreground text-base md:text-xl max-w-lg mx-auto leading-relaxed">
                La page que vous recherchez n'existe pas.
              </p>
            </div>
          </div>
        } />
      </Routes>
      </ErrorBoundary>
    </AppLayout>
  );
}

export default App;
