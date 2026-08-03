import { Layout, Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

function Header() {

    const navigate = useNavigate();
    
    const [user, setUser] = useState({ nome: '', email: '' });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

        if (storedUser.nome) {
            setUser(storedUser);
        }

        const checkScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkScreen();
        window.addEventListener('resize', checkScreen);

        const handleUserUpdate = () => {

            const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');

            if (updateUser.nome) {
                setUser(updatedUser);
            }

        };

        window.addEventListener('user-updated', handleUserUpdate);

        return () => {
            window.removeEventListener('resize', checkScreen);
            window.removeEventListener('user-updated', handleUserUpdate);
        };

    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        window.location.reload();
    };

    const menuItems = [
        { key: 'logout', icon: <LogoutOutlined />, label: 'Sair', onClick: handleLogout, },
    ];

    return (
    
    <AntHeader style={{ background: '#fff', padding: isMobile ? '0 12px' : '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64, borderBottom: '1px solid #e2e8f0' }}>
            
        <div>
            <Text strong style={{ color: '#1a3a5c', fontSize: isMobile ? 12 : 14, marginLeft: isMobile ? 50 : 0 }}> Olá, {user?.nome || 'Usuário'}! </Text>
        </div>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            
            <Space style={{ cursor: 'pointer' }}>
                
                <Avatar icon={<UserOutlined />} size={isMobile ? 'small' : 'default'} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }} />
            
                {!isMobile && (
                    <Text style={{ color: '#1e293b' }}> {user.email || 'usuario@email.com'} </Text>
                )}
            
            </Space>
        
        </Dropdown>
    
    </AntHeader>
    );
}

export default Header;