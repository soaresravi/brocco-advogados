import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Select, message, Badge, Space, Tag } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';

import { getAudienciasDashboard, getAudienciasHoje, getAudienciasProximos } from '../../services/audienciaService';
import GraficoLinha from '../../components/Graficos/GraficoLinha';

function AudienciasDashboard() {

    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [data, setData] = useState(null);
    const [audienciasHoje, setAudienciasHoje] = useState([]);
    const [audienciasProximos, setAudienciasProximos] = useState([]);
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

            const [dashboard, hoje, proximos] = await Promise.all([
                getAudienciasDashboard(ano),
                getAudienciasHoje(),
                getAudienciasProximos(),
            ]);

            setData(dashboard && typeof dashboard === 'object' ? dashboard : null);
            setAudienciasHoje(Array.isArray(hoje) ? hoje : []);
            setAudienciasProximos(Array.isArray(proximos) ? proximos : []);

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            message.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }

    };

    const horariosColumns = [
        { title: 'Horário', dataIndex: 'horario', key: 'horario' },
        { title: 'Quantidade', dataIndex: 'quantidade', key: 'quantidade', render: (text) => <strong>{text}</strong> },
    ];

    const horariosData = data?.horarios ? Object.entries(data.horarios).map(([horario, quantidade]) => ({ horario, quantidade })) : [];

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>

        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            
            <Col xs={12} sm={12} md={6}>
        
                <Card size="small">
                    <Statistic title="Total de audiências" value={data?.total || 0} prefix={<CalendarOutlined style={{ color: '#1a3a5c' }} />} styles={{ content: { color: '#1a3a5c', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Agendadas" value={data?.agendadas || 0} prefix={<ClockCircleOutlined style={{ color: '#3b82f6' }} />} styles={{ content: { color: '#3b82f6', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Concluídas" value={data?.concluidas || 0} prefix={<CheckCircleOutlined style={{ color: '#22c55e' }} />} styles={{ content: { color: '#22c55e', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Canceladas" value={data?.canceladas || 0} prefix={<CloseCircleOutlined style={{ color: '#ef4444' }} />} styles={{ content: { color: '#ef4444', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
        </Row>

        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            
            <Col xs={24} md={12}>
        
                <Card size="small" title={<Space><WarningOutlined style={{ color: '#eab308' }} /><span>Audiências para hoje</span></Space>}>
                    
                    {audienciasHoje.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Nenhuma audiência agendada para hoje</div>
                    ) : (
                       
                        audienciasHoje.map((item) => (
                        
                            <div key={item.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ fontWeight: 500, color: '#1a3a5c' }}>{item.processoNumero}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{item.hora} - {item.detalhes} {item.local && `- ${item.local}`}</div>
                            </div>
                        
                        ))
                    
                    )}

                </Card>
            
            </Col>
        
            <Col xs={24} md={12}>
                
                <Card size="small" title={<Space><ClockCircleOutlined style={{ color: '#1a3a5c' }} /><span>Próximos 7 dias</span></Space>}>
            
                    {audienciasProximos.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Nenhuma audiência nos próximos 7 dias</div>
                    ) : (
                       
                        audienciasProximos.map((item) => {
                    
                            const dias = item.diasRestantes;
                            let tag = null;
                            if (dias === 0) tag = <Tag color="warning" style={{ fontSize: 9 }}>Hoje</Tag>;
                            else if (dias === 1) tag = <Tag color="processing" style={{ fontSize: 9 }}>Amanhã</Tag>;
                                
                            return (
                            
                            <div key={item.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                
                                <div style={{ fontWeight: 500, color: '#1a3a5c' }}>{item.processoNumero} {tag}</div>
                
                                <div style={{ fontSize: 12, color: '#64748b' }}>
                                    {dayjs(item.data).format('DD/MM/YYYY')} - {item.hora} - {item.detalhes}
                                </div>
        
                            </div>
                            );
                        
                        })
                    )}
                </Card>
            </Col>
        </Row>

        <Row gutter={[12, 12]}>
            
            <Col xs={24} md={14}>
        
                <Card size="small">
    
                    <GraficoLinha data={data?.porMes} title="Audiências por mês" ano={ano} isMobile={isMobile} />
                    
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <Select value={ano} onChange={setAno} size="small" style={{ width: isMobile ? '80%' : 100 }} options={anosOptions} />
                    </div>
        
                </Card>
    
            </Col>

            <Col xs={24} md={10}>
                
                <Card size="small" title="Distribuição por horário">
                    <Table dataSource={horariosData} columns={horariosColumns} rowKey="horario" size={isMobile ? 'middle' : 'small'} pagination={false} locale={{ emptyText: 'Nenhum dado' }} />
                </Card>
    
            </Col>

        </Row>
    
    </div>
    );
}

export default AudienciasDashboard;