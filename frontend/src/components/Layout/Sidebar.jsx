import { useState, useEffect } from "react";
import { Layout, Menu, Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {  DashboardOutlined, TeamOutlined, FolderOutlined, CalendarOutlined, DollarOutlined, CheckSquareOutlined, SettingOutlined, BarChartOutlined, UnorderedListOutlined, ScheduleOutlined, FileTextOutlined, SwapOutlined, WalletOutlined, MenuUnfoldOutlined, MenuFoldOutlined, MenuOutlined, BellOutlined, MessageOutlined, WhatsAppOutlined, ToolOutlined, AuditOutlined, ProjectOutlined} from '@ant-design/icons';

import './AppLayout.css';

const { Sider } = Layout;

function Sidebar({ onCollapseChange, isMobile }) {

    const navigate = useNavigate();
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {

        if (isMobile) {
            setCollapsed(true);
            if (onCollapseChange) onCollapseChange(true);
        }

    }, [isMobile]);

    const toggleCollapsed = () => {

        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            const newState = !collapsed;
            setCollapsed(newState);
            if (onCollapseChange) onCollapseChange(newState);
        }

    };

    const menuItems = [
        
        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Painel de controle', onClick: () => navigate('/dashboard'), },
        { key: 'notificacoes', icon: <BellOutlined />, label: 'Chat e alertas', onClick: () => navigate('/notificacoes'), },
        
        { key: 'clientes', icon: <TeamOutlined />, label: 'Clientes', children: [
            { key: '/clientes/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/clientes/dashboard'), },
            { key: '/clientes/lista', icon: <UnorderedListOutlined />, label: 'Clientes', onClick: () => navigate('/clientes/lista'), },
        ],},

        { key: 'processos', icon: <FolderOutlined />, label: 'Processos', children: [
            { key: '/processos/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/processos/dashboard'), },
            { key: '/processos/lista', icon: <UnorderedListOutlined />, label: 'Processos', onClick: () => navigate('/processos/lista'), },
            { key: '/processos/prazos', icon: <ScheduleOutlined />, label: 'Prazos', onClick: () => navigate('/processos/prazos'), },
        ],},

        { key: 'audiencias', icon: <CalendarOutlined />, label: 'Audiências', children: [
            { key: '/audiencias/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/audiencias/dashboard'), },
            { key: '/audiencias/lista', icon: <UnorderedListOutlined />, label: 'Audiências', onClick: () => navigate('/audiencias/lista'), },
        ],},

        { key: 'atendimentos', icon: <FileTextOutlined />, label: 'Atendimentos', children: [
            { key: '/atendimentos/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/atendimentos/dashboard'), },
            { key: '/atendimentos/lista', icon: <UnorderedListOutlined />, label: 'Parlatório', onClick: () => navigate('/atendimentos/lista'), },
            { key: '/atendimentos/whatsapp', icon: <WhatsAppOutlined />, label: 'WhatsApp', onClick: () => navigate('/atendimentos/whatsapp'), },
            { key: '/atendimentos/providencias', icon: <ToolOutlined />, label: 'Providências', onClick: () => navigate('/atendimentos/providencias'), },
        ],},

        { key: 'andamentos', icon: <AuditOutlined />, label: 'Andamentos', children: [
            { key: '/andamentos/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/andamentos/dashboard'), },
            { key: '/andamentos/lista', icon: <UnorderedListOutlined />, label: 'Andamentos', onClick: () => navigate('/andamentos/lista'), },
        ],},

        { key: 'tarefas', icon: <CheckSquareOutlined />, label: 'Tarefas', children: [
            { key: '/tarefas/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/tarefas/dashboard'), },
            { key: '/tarefas/lista', icon: <UnorderedListOutlined />, label: 'Tarefas', onClick: () => navigate('/tarefas/lista'), },
        ],},

        { key: 'financeiro', icon: <DollarOutlined />, label: 'Financeiro', children: [
            { key: '/financeiro/dashboard', icon: <BarChartOutlined />, label: 'Dashboard', onClick: () => navigate('/financeiro/dashboard'), },
            { key: '/financeiro/recebimentos', icon: <WalletOutlined />, label: 'Recebimentos', onClick: () => navigate('/financeiro/recebimentos'), },
            { key: '/financeiro/despesas', icon: <SwapOutlined />, label: 'Despesas', onClick: () => navigate('/financeiro/despesas'), },
        ],},

        { key: '/configuracoes', icon: <SettingOutlined />, label: 'Configurações', onClick: () => navigate('/configuracoes'), },
    
    ];

    if (isMobile) {
        
        return (
        
        <>
        
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000, padding: 16, cursor: 'pointer', background: 'linear-gradient(135deg, #0d1239 0%, #1b2678 100%)', borderRadius: '0 0 8px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} onClick={toggleCollapsed}>
                <MenuOutlined style={{ fontSize: 20, color: '#fff' }} />
            </div>
            
            <Drawer placement="left"closable={true} onClose={() => setMobileOpen(false)} open={mobileOpen} size={280} styles={{ body: { padding: 0, background: 'linear-gradient(180deg, #0a1628 0%, #131a53 100%)', }, }}>
                <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} defaultOpenKeys={[]} items={menuItems} style={{ background: 'transparent', fontFamily: 'Poppins, sans-serif', height: '100vh', }} />
            </Drawer>

        </>
        );

    }

    return (
    
    <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} trigger={null} style={{ background: 'linear-gradient(180deg, #0d1239 0%, #131a53 100%)', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100, boxShadow: '2px 0 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', }} theme="dark" width={200} collapsedWidth={80}>
        
        <div onClick={toggleCollapsed} style={{ height: 64, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s', border: 'none', flexShrink: 0, }}>
            
            {collapsed ? (
                <MenuUnfoldOutlined style={{ fontSize: 24, color: '#ffffff' }} />
            ) : (
                <MenuFoldOutlined style={{ fontSize: 24, color: '#ffffff' }} />
            )}

        </div>

        <div className="sidebar-scroll-area">
            <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} defaultOpenKeys={[]} items={menuItems} style={{ background: 'transparent', fontFamily: 'Poppins, sans-serif', borderRight: 'none', }} />
        </div>
    
    </Sider>
    );
}

export default Sidebar;