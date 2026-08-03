import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { TeamOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { getClientesDashboard } from '../../services/clienteService';
import { REGIME_PRISIONAL_OPTIONS, COMO_CONHECEU_OPTIONS } from '../../constants/enums';

import GraficoBarraVertical from '../../components/Graficos/GraficoBarraVertical';
import GraficoBarraHorizontal from '../../components/Graficos/GraficoBarraHorizontal';

function ClientesDashboard() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const formatRegime = (value) => {
        const found = REGIME_PRISIONAL_OPTIONS.find(o => o.value === value);
        return found ? found.label : value;
    };

    const formatComoConheceu = (value) => {
        const found = COMO_CONHECEU_OPTIONS.find(o => o.value === value);
        return found ? found.label : value;
    };

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {

        setLoading(true);

        try {
            const response = await getClientesDashboard();

            const convertedData = {
              
                ...response,
              
                porRegime: Object.keys(response?.porRegime || {}).reduce((acc, key) => {
                    acc[formatRegime(key)] = response.porRegime[key];
                    return acc;
                }, {}),
              
                porComoConheceu: Object.keys(response?.porComoConheceu || {}).reduce((acc, key) => {
                    acc[formatComoConheceu(key)] = response.porComoConheceu[key];
                    return acc;
                }, {}),

            };
            
            setData(convertedData);

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }

    };

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>

        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
    
            <Col xs={12} sm={8}>

                <Card size="small">
                    <Statistic title="Total de clientes" value={data?.total || 0} prefix={<TeamOutlined style={{ color: '#131a53' }} />} styles={{ content: { color: '#131a53', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={8}>
                
                <Card size="small">
                    <Statistic title="Réus primários" value={data?.primarios || 0} prefix={<UserOutlined style={{ color: '#22c55e' }} />} styles={{ content: { color: '#22c55e', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={8}>
                
                <Card size="small">
                    <Statistic title="Réus reincidentes" value={data?.reincidentes || 0} prefix={<WarningOutlined style={{ color: '#ef4444' }} />} styles={{ content: { color: '#ef4444', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            
            </Col>
        
        </Row>

        <Row gutter={[12, 12]}>
            
            <Col xs={24} md={8}>
                
                <Card size="small" title="Regime prisional">
                    <GraficoBarraVertical data={data?.porRegime || {}} isMobile={isMobile} />
                </Card>
            
            </Col>
        
            <Col xs={24} md={8}>
                
                <Card size="small" title="Faixa etária">
                    <GraficoBarraVertical data={data?.porIdade || {}} isMobile={isMobile} />
                </Card>
            
            </Col>
        
            <Col xs={24} md={8}>
                
                <Card size="small" title="Como conheceu">
                    <GraficoBarraHorizontal data={data?.porComoConheceu || {}} isMobile={isMobile} />
                </Card>
            
            </Col>
        
        </Row>
    
    </div>
    );
}

export default ClientesDashboard;