import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import Login from './pages/Login/Login';
import AppLayout from './components/Layout/AppLayout';
import DashboardPrincipal from './pages/DashboardPrincipal';
import ClienteLista from './pages/Clientes/ClienteLista';
import ClientesDashboard from './pages/Clientes/ClientesDashboard';
import ProcessoLista from './pages/Processos/ProcessoLista';
import ProcessosDashboard from './pages/Processos/ProcessosDashboard';
import ProcessosPrazos from './pages/Processos/ProcessosPrazos';
import AudienciaLista from './pages/Audiencias/AudienciaLista';
import AudienciasDashboard from './pages/Audiencias/AudienciasDashboard';
import MicrosoftCallback from './pages/MicrosoftCallback';
import AtendimentoLista from './pages/Atendimentos/AtendimentoLista';
import WhatsAppLista from './pages/Atendimentos/WhatsAppLista';
import AtendimentosDashboard from './pages/Atendimentos/AtendimentosDashboard';
import ProvidenciasLista from './pages/Atendimentos/ProvidenciasLista';
import AndamentosLista from './pages/Andamentos/AndamentosLista';
import AndamentosDashboard from './pages/Andamentos/AndamentosDashboard';
import TarefaLista from './pages/Tarefas/TarefaLista';
import TarefasDashboard from './pages/Tarefas/TarefasDashboard';
import FinanceiroDashboard from './pages/Financeiro/FinanceiroDashboard';
import RecebimentoLista from './pages/Financeiro/RecebimentoLista';
import DespesaLista from './pages/Financeiro/DespesaLista';
import NotificacoesChat from './pages/NotificacoesChat';
import Configuracoes from './pages/Configuracoes';

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
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={<DashboardPrincipal />} />
        <Route path="/callback/microsoft" element={<MicrosoftCallback />} />
       
        <Route path="/clientes/lista" element={<ClienteLista /> } />
        <Route path="/clientes/dashboard" element={<ClientesDashboard /> } />
       
        <Route path="/processos/lista" element={<ProcessoLista /> } />
        <Route path="/processos/dashboard" element={<ProcessosDashboard /> } />
        <Route path="/processos/prazos" element={<ProcessosPrazos /> } />
       
        <Route path="/audiencias/lista" element={<AudienciaLista /> } />
        <Route path="/audiencias/dashboard" element={<AudienciasDashboard /> } />

        <Route path="/atendimentos/lista" element={<AtendimentoLista /> } />
        <Route path="/atendimentos/whatsapp" element={<WhatsAppLista /> } />
        <Route path="/atendimentos/dashboard" element={<AtendimentosDashboard /> } />
        <Route path="atendimentos/providencias" element={<ProvidenciasLista /> } />
        
        <Route path="/andamentos/lista" element={<AndamentosLista /> } />
        <Route path="/andamentos/dashboard" element={<AndamentosDashboard /> } />
     
        <Route path="/tarefas/lista" element={<TarefaLista /> } />
        <Route path="/tarefas/dashboard" element={<TarefasDashboard /> } />

        <Route path="/financeiro/dashboard" element={<FinanceiroDashboard /> } />
        <Route path="/financeiro/recebimentos" element={<RecebimentoLista /> } />
        <Route path="/financeiro/despesas" element={<DespesaLista /> } />

        <Route path="/notificacoes" element={<NotificacoesChat />} />
        <Route path="/configuracoes" element={<Configuracoes /> } />

      </Routes>

    </AppLayout>
  
  );
}

export default App;