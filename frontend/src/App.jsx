import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import Login from './pages/Login/Login';
import AppLayout from './components/Layout/AppLayout';
import DashboardPrincipal from './pages/DashboardPrincipal';
import ClienteLista from './pages/Clientes/ClienteLista';

function App() {
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {

    window.addEventListener('auth:logout', handleLogout);

    const interval = setInterval(() => {

      const currentToken = localStorage.getItem('token');

      if (!currentToken && isAuthenticated) {
        handleLogout();
      } else if (currentToken && !isAuthenticated) {
        setIsAuthenticated(true);
      }

    }, 2000);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      clearInterval(interval);
    };

  }, [isAuthenticated, handleLogout]);

  useEffect(() => {

    const token = localStorage.getItem('token');

    if (!token && location.pathname !== '/login' && !location.pathname.startsWith('/callback')) {
      setIsAuthenticated(false);
      navigate('/login', { replace: true });
    }

  }, [location.pathname, navigate]);

  if (!isAuthenticated) {

    return (
      
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} /> } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    
    );
  
  }

  return (
    
    <AppLayout>
      
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPrincipal />} />
        <Route path="/clientes/lista" element={<ClienteLista /> } />
      </Routes>

    </AppLayout>
  
  );
}

export default App;