import { useState, useEffect } from 'react';
import { Result, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

function GoogleCallback() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('success');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {

        const urlParams = new URLSearchParams(window.location.search);
        const googleStatus = urlParams.get('google');

        if (googleStatus === 'success') {
            setStatus('success');
        } else if (googleStatus === 'error') {
            setStatus('error');
        }

        setLoading(false);

        const timer = setTimeout(() => {
            window.close();
            navigate('/configuracoes');
        }, 3000);

        return () => clearTimeout(timer);

    }, [navigate]);

    if (loading) {
       
        return (
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin size="large" />
        </div>
        
        );
    
    }

    if (status === 'success') {
        
        return (
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: isMobile ? 16 : 0 }}>
            
            <Result status="success" title="Permissão concedida!" subTitle="Sua conta do Google foi conectada com sucesso. Agora você pode fechar esta janela." extra={[
                <Button type="primary" key="close" onClick={() => window.close()} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Fechar esta janela </Button>,
            ]} />
        
        </div>
        );
    
    }

    return (
    
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: isMobile ? 16 : 0 }}>
       
        <Result status="error" title="Erro na conexão" subTitle="Ocorreu um erro ao conectar sua conta do Google. Tente novamente." extra={[
            <Button type="primary" key="close" onClick={() => window.close()} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Fechar </Button>,
        ]} />
        
    </div>
    );

}

export default GoogleCallback;