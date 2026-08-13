import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Select, Progress } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, UnorderedListOutlined, WarningOutlined } from '@ant-design/icons';

import { getTarefasDashboard } from '../../services/tarefaService';
import GraficoLinha from '../../components/Graficos/GraficoLinha';

function TarefasDashboard() {

    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [data, setData] = useState(null);
    const [ano, setAno] = useState(new Date().getFullYear());

    const anoAtual = new Date().getFullYear();
    const anosOptions = [anoAtual - 3, anoAtual - 2, anoAtual - 1, anoAtual].map(y => ({ value: y, label: y }));

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarDados();
    }, [ano]);

    const carregarDados = async () => {

        setLoading(true);

        try {
            const response = await getTarefasDashboard(ano);
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
            
            <Col xs={12} sm={12} md={6}>
        
                <Card size="small">
                    <Statistic title="Total de tarefas" value={data?.total || 0} prefix={<UnorderedListOutlined style={{ color: '#1a3a5c' }} />} styles={{ content: { color: '#1a3a5c', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Concluídas" value={data?.concluidas || 0} prefix={<CheckCircleOutlined style={{ color: '#22c55e' }} />} styles={{ content: { color: '#22c55e', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Não concluídas" value={data?.naoConcluidas || 0} prefix={<ClockCircleOutlined style={{ color: '#eab308' }} />} styles={{ content: { color: '#eab308', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#888', marginBottom: 4 }}>Progresso</div>
                        <Progress type="circle" percent={data?.percentualConclusao || 0} size={isMobile ? 50 : 60} strokeColor="#131a53" format={(percent) => <span style={{ fontSize: isMobile ? 11 : 14 }}>{percent}%</span>} />
                    </div>

                </Card>
            
            </Col>
        
        </Row>

        <Card size="small">
            
            <GraficoLinha data={data?.porMes} title="Tarefas por mês" ano={ano} isMobile={isMobile} />
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Select value={ano} onChange={setAno} size="small" style={{ width: isMobile ? '80%' : 100 }} options={anosOptions} />
            </div>

        </Card>

    </div>
    );
}

export default TarefasDashboard;