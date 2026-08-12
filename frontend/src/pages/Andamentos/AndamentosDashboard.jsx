import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Progress } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { getAndamentosDashboard } from '../../services/andamentoService';

function AndamentosDashboard() {

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
            const response = await getAndamentosDashboard();
            setData(response);
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
            
            <Col xs={12} sm={6}>
        
                <Card size="small">
                    <Statistic title="Total" value={data?.total || 0} prefix={<TeamOutlined style={{ color: '#1a3a5c' }} />} styles={{ content: { color: '#1a3a5c', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={6}>
    
                <Card size="small">
                    <Statistic title="Pendentes" value={data?.pendentes || 0} prefix={<ClockCircleOutlined style={{ color: '#eab308' }} />} styles={{ content: { color: '#eab308', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={6}>
    
                <Card size="small">
                    <Statistic title="Em andamento" value={data?.emAndamento || 0} prefix={<ClockCircleOutlined style={{ color: '#3b82f6' }} />} styles={{ content: { color: '#3b82f6', fontSize: isMobile ? 18 : 20 } }} />
                </Card>
            </Col>
        
            <Col xs={12} sm={6}>    
                
                <Card size="small">
                    <Statistic title="Concluídas" value={data?.concluidas || 0} prefix={<CheckCircleOutlined style={{ color: '#22c55e' }} />} styles={{ content: { color: '#22c55e', fontSize: isMobile ? 18 : 20 } }} />
                </Card>

            </Col>
        
        </Row>

        <Card size="small" title="Progresso geral">
            
            <Progress percent={data?.percentualConclusao || 0} status={data?.percentualConclusao >= 80 ? 'success' : data?.percentualConclusao >= 50 ? 'active' : 'exception'} strokeColor="linear-gradient(135deg, #0d1239 0%, #131a53 100%)" format={(percent) => `${percent}% concluído`} />
            
            <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                {data?.concluidas || 0} de {data?.total || 0} providências concluídas
            </div>
        
        </Card>
        
    </div>
    );
}

export default AndamentosDashboard;