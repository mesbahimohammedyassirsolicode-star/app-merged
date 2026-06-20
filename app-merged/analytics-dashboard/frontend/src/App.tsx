import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AnalyticsPage from './pages/AnalyticsPage';
import './index.css';

const App: React.FC = () => {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const savedTheme = window.localStorage.getItem('theme');
      const isDark = savedTheme === 'dark' || (savedTheme !== 'light' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    window.addEventListener('storage', applyTheme);
    return () => {
      media.removeEventListener('change', applyTheme);
      window.removeEventListener('storage', applyTheme);
    };
  }, []);

  return (
    <Router>
      <Switch>
        <Route path="/dashboard/analytics" component={AnalyticsPage} />
        {/* Add more routes as needed */}
      </Switch>
    </Router>
  );
};

export default App;
