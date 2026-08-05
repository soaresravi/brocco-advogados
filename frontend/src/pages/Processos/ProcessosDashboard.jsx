import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { FolderOutlined, CheckCircleOutlined, CloseCircleOutlined, WalletOutlined, TrophyOutlined, WarningOutlined } from '@ant-design/icons';

import { getProcessosDashboard } from '../../services/processoService';
import { REGIME_PRISIONAL_OPTIONS } from '../../constants/enums';

import GraficoBarraVertical from '../../components/Graficos/GraficoBarraVertical';

function ProcessosDashboard() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

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

            const response = await getProcessosDashboard();

            const convertedData = {
                
                ...response,

                porRegime: Object.keys(response?.porRegime || {}).reduce((acc, key) => {
                    const found = REGIME_PRISIONAL_OPTIONS.find(o => o.value === key);
                    acc[found ? found.label : key] = response.porRegime[key];
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

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.permissao === 'ADMIN';

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
    
            <Col xs={12} sm={12} md={6} lg={4}>
                
                <Card size="small">
                    <Statistic title="Total de processos" value={data?.total || 0} prefix={<FolderOutlined style={{ color: '#131a53' }} />}  styles={{ content: { color: '#131a53', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6} lg={4}>
    
                <Card size="small">
                    <Statistic title="Processos ativos" value={data?.ativos || 0} prefix={<CheckCircleOutlined style={{ color: '#22c55e' }} />} styles={{ content: { color: '#22c55e', fontSize: isMobile ? 18 : 20 } }}  />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6} lg={4}>
                
                <Card size="small">
                    <Statistic title="Processos inativos" value={data?.inativos || 0} prefix={<CloseCircleOutlined style={{ color: '#ef4444' }} />} styles={{ content: { color: '#ef4444', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6} lg={4}>
                
                <Card size="small">
                    <Statistic title="Lapso próximo (≤ 60 dias)" value={data?.lapsoProximo || 0} prefix={<WarningOutlined style={{ color: '#eab308' }} />} styles={{ content: { color: '#eab308', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            
            </Col>

            {isAdmin && (
            
                <>
                    
                    <Col xs={12} sm={12} md={6} lg={6}>
                       
                        <Card size="small">
                            <Statistic title="Total de honorários" value={formatCurrency(data?.totalHonorarios)} prefix={<WalletOutlined style={{ color: '#1a3a5c' }} />} styles={{ content: { color: '#1a3a5c', fontSize: isMobile ? 18 : 20 } }} />
                        </Card>

                    </Col>

                    <Col xs={12} sm={12} md={6} lg={6}>
                    
                        <Card size="small">
                            <Statistic title="Maior honorário" value={formatCurrency(data?.maiorHonorario)} prefix={<TrophyOutlined style={{ color: '#eab308' }} />} styles={{ content: { color: '#eab308', fontSize: isMobile ? 18 : 20 } }} />
                        </Card>

                    </Col>
                
                </>

            )}
        
        </Row>
        
        <Row gutter={[12, 12]}>
    
            <Col xs={24} md={12}>
               
                <Card size="small" title="Distribuição por regime da pena">
                    <GraficoBarraVertical data={data?.porRegime || {}} isMobile={isMobile} />
                </Card>
            
            </Col>
        
        </Row>
    
    </div>
    );
}

export default ProcessosDashboard;