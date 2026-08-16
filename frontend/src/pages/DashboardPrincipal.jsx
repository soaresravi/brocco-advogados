import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Button, Tag, Space, Badge, List } from 'antd';
import { FolderOutlined, TeamOutlined, CalendarOutlined, WarningOutlined, ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

import api from '../api/api';

function DashboardPrincipal() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarDashboard();
    }, []);

    const carregarDashboard = async () => {

        setLoading(true);

        try {
            const response = await api.get('/painel');
            setData(response.data);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }

    };

    const getUrgenciaColor = (urgencia) => {
        
        const colors = {
            'Exige atenção imediata': '#ff4d4f',
            'Muito urgente': '#ff7a45',
            'Requer atenção': '#faad14',
            'Pouco urgente': '#52c41a',
        };

        return colors[urgencia] || '#d9d9d9';

    };

    const getUrgenciaIcon = (urgencia) => {
    
        const icons = {
            'Exige atenção imediata': <WarningOutlined style={{ color: '#ff4d4f' }} />,
            'Muito urgente': <WarningOutlined style={{ color: '#ff7a45' }} />,
            'Requer atenção': <WarningOutlined style={{ color: '#faad14' }} />,
            'Pouco urgente': <WarningOutlined style={{ color: '#52c41a' }} />,
        };
    
        return icons[urgencia] || <ClockCircleOutlined />;
    
    };

    const handleClickDia = (dia) => {

        if (dia.prazos > 0) {
            navigate('/processos/prazos');
        } else if (dia.audiencias > 0) {
            navigate('/audiencias/lista');
        } else if (dia.tarefas > 0) {
            navigate('/tarefas/lista');
        } else if (dia.atendimentos > 0) {
            navigate('/atendimentos/lista');
        } else if (dia.andamentos > 0) {
            navigate('/andamentos/lista');
        }

    };

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
    
            <Col xs={24} md={16}>

                <Card size="small">
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClockCircleOutlined style={{ fontSize: 20, color: '#1a3a5c' }} />
                        <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', color: '#1a3a5c' }}> {data?.dataHora || dayjs().format('DD/MM/YYYY HH:mm:ss')} </span>
                        <Tag color="blue" style={{ fontSize: 10 }}>America/Sao_Paulo</Tag>
                    </div>
                
                </Card>
            
            </Col>
        
            <Col xs={24} md={8} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <Button icon={<ReloadOutlined />} onClick={carregarDashboard}> Atualizar </Button>
            </Col>
        
        </Row>

        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
    
            <Col xs={12} sm={12} md={8}>
                <Card size="small" style={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate('/processos/lista')}> <Statistic title="Processos ativos" value={data?.processosAtivos || 0} prefix={<FolderOutlined style={{ color: '#1a3a5c' }} />} styles={{ title: { fontSize: isMobile ? 12 : 14 }, content: { color: '#1a3a5c', fontSize: isMobile ? 16 : 20 }}} /> </Card>
            </Col>

            <Col xs={12} sm={12} md={8}>
                
                <Card size="small" style={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate('/audiencias/lista')}>
                    <Statistic title="Audiências agendadas" value={data?.audienciasAgendadas || 0} prefix={<CalendarOutlined style={{ color: '#3b82f6' }} />} styles={{ title: { fontSize: isMobile ? 12 : 14 }, content: { color: '#3b82f6', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>

            <Col xs={12} sm={12} md={8}>
                
                <Card size="small" style={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate('/clientes/lista')}>
                    <Statistic title="Clientes cadastrados" value={data?.clientesCadastrados || 0} prefix={<TeamOutlined style={{ color: '#22c55e' }} />} styles={{ title: { fontSize: isMobile ? 12 : 14 }, content: { color: '#22c55e', fontSize: isMobile ? 16 : 20 }}} />
                </Card>
            
            </Col>
        
        </Row>

        <Card size="small" title={
        
            <Space>
                <WarningOutlined style={{ color: '#eab308' }} />
                <span style={{ color: '#1a3a5c' }}>Tarefas do dia ({data?.totalTarefasHoje || 0})</span>
            </Space>

        } style={{ marginBottom: 20 }}>
            
            {data?.tarefasDoDia && Object.keys(data.tarefasDoDia).length > 0 ? (

                <Row gutter={[12, 12]}>
                    
                    {Object.entries(data.tarefasDoDia).map(([urgencia, tarefas]) => (
                        
                        <Col xs={24} sm={12} md={6} key={urgencia}>
                    
                            <Card size="small" style={{ background: tarefas.length > 0 ? '#f8fafc' : '#f1f5f9', borderLeft: `4px solid ${getUrgenciaColor(urgencia)}`, height: '100%' }}>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    {getUrgenciaIcon(urgencia)}
                                    <span style={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 13 }}> {urgencia} </span>
                                    <Badge count={tarefas.length} style={{ backgroundColor: getUrgenciaColor(urgencia) }} />
                                </div>
                                
                                {tarefas.length > 0 ? (

                                    <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                                        
                                        {tarefas.slice(0, 3).map((tarefa) => (

                                            <div key={tarefa.id} style={{ fontSize: 11, padding: '4px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', color: '#475569' }} onClick={() => navigate('/tarefas/lista')}>
                                                
                                                {tarefa.tarefa}
                                            
                                                {tarefa.clienteNome && (
                                                    <span style={{ color: '#94a3b8', marginLeft: 4 }}> - {tarefa.clienteNome} </span>
                                                )}
                                            
                                            </div>
                                        
                                        ))}
                                    
                                        {tarefas.length > 3 && (
                                        
                                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                                                +{tarefas.length - 3} outras
                                            </div>

                                        )}

                                    </div>
                                
                                ) : (
                                    
                                    <div style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>
                                        Nenhuma tarefa
                                    </div>
                                )}

                            </Card>
                        </Col>
                    ))}
                </Row>

            ) : (
                
                <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                    Nenhuma tarefa para hoje
                </div>

            )}

        </Card>
        
        <Card size="small" title={
            
            <Space>
                <CalendarOutlined style={{ color: '#1a3a5c' }} />
                <span style={{ color: '#1a3a5c' }}>Próximos 7 dias</span>
            </Space>

        } style={{ marginBottom: 20 }}>
            
            {data?.agendaProximos7Dias && data.agendaProximos7Dias.length > 0 ? (

                <div style={{ overflowX: 'auto' }}>
            
                    <Row gutter={[8, 8]}>
        
                        {data.agendaProximos7Dias.map((dia) => {

                            const totalItens = (dia.prazos || 0) + (dia.audiencias || 0) + (dia.atendimentos || 0) + (dia.andamentos || 0) + (dia.tarefas || 0);
                            const isToday = dayjs(dia.data).isSame(dayjs(), 'day');
                            const podeClicar = totalItens > 0;
                                
                            return (
                            
                            <Col xs={12} sm={8} md={4} lg={3} key={dia.data}>
                    
                                <Card size="small" style={{ background: isToday ? '#f0f7ff' : '#f8fafc', border: isToday ? '2px solid #131a53' : '1px solid #f0f0f0', textAlign: 'center', cursor: podeClicar ? 'pointer' : 'default', opacity: podeClicar ? 1 : 0.6 }} onClick={() => podeClicar && handleClickDia(dia)}>
                                    
                                    <div style={{ fontWeight: 'bold', fontSize: 12, color: '#1a3a5c' }}>
                                        {dayjs(dia.data).format('DD/MM')}
                                    </div>
            
                                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                                        {dia.diaSemana}
                                    </div>
                            
                                    {isToday && <Tag color="blue" style={{ fontSize: 8 }}>Hoje</Tag>}
                        
                                    <div style={{ marginTop: 4 }}>
                                            
                                        <div style={{ fontSize: 10, textAlign: 'left' }}>
                                        
                                            {dia.prazos > 0 && (
                                                    
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                                                    <span>Prazos</span>
                                                    <span style={{ fontWeight: 'bold', color: '#faad14' }}>{dia.prazos}</span>
                                                </div>

                                            )}
                                                
                                            {dia.audiencias > 0 && (
                                                    
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                                                    <span>Audiências</span>
                                                    <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{dia.audiencias}</span>
                                                </div>

                                            )}
                                                
                                            {dia.atendimentos > 0 && (
                                                    
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                                                    <span>Atendimentos</span>
                                                    <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{dia.atendimentos}</span>
                                                </div>

                                            )}
                                                
                                            {dia.andamentos > 0 && (

                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                                                    <span>Andamentos</span>
                                                    <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>{dia.andamentos}</span>
                                                </div>

                                            )}
                                                
                                            {dia.tarefas > 0 && (

                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                                                    <span>Tarefas</span>
                                                    <span style={{ fontWeight: 'bold', color: '#06b6d4' }}>{dia.tarefas}</span>
                                                </div>

                                            )}

                                        </div>
                                        
                                        {totalItens === 0 && (

                                            <div style={{ fontSize: 10, color: '#94a3b8', padding: '8px 0' }}>
                                                Sem eventos
                                            </div>

                                        )}
                                            
                                        {podeClicar && (
                                            
                                            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
                                                Clique para ver
                                            </div>

                                        )}
                                        
                                    </div>
                                </Card>
                            </Col>
                            );
                        })}
                    </Row>
                </div>

            ) : (
                
                <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                    Nenhum evento nos próximos 7 dias
                </div>
            
            )}
        
        </Card>

        <Card size="small" title={
            
            <Space>
                <WarningOutlined style={{ color: '#ef4444' }} />
                <span style={{ color: '#1a3a5c' }}>Alertas rápidos</span>
            </Space>

        }>
            
            <Row gutter={[12, 12]}>
        
                <Col xs={12} md={6}>
    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fef2f2', borderRadius: 8, cursor: 'pointer' }} onClick={() => navigate('/processos/prazos')}>

                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 'bold', color: '#ef4444' }}>
                            {data?.prazosHoje || 0}
                        </div>
                    
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>Prazos para hoje</div>
                
                    </div>
            
                </Col>
        
                <Col xs={12} md={6}>
    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fefce8', borderRadius: 8, cursor: 'pointer' }} onClick={() => navigate('/andamentos/lista')}>

                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 'bold', color: '#eab308' }}>
                            {data?.providenciasPendentes || 0}
                        </div>
                    
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>Providências pendentes</div>
                
                    </div>
            
                </Col>
        
                <Col xs={12} md={6}>
    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fee2e2', borderRadius: 8, cursor: 'pointer' }} onClick={() => navigate('/financeiro/recebimentos')}>
                        
                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 'bold', color: '#ef4444' }}>
                            {data?.recebimentosAtraso || 0}
                        </div>
            
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>Recebimentos atrasados</div>
        
                    </div>
    
                </Col>

                <Col xs={12} md={6}>
                    
                    <div style={{ textAlign: 'center', padding: 8, background: '#fef2f2', borderRadius: 8, cursor: 'pointer' }} onClick={() => navigate('/financeiro/despesas')}>
                
                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 'bold', color: '#ef4444' }}>
                            {data?.despesasAtraso || 0}
                        </div>
    
                        <div style={{ fontSize: isMobile ? 10 : 12, color: '#666' }}>Despesas atrasadas</div>
                    
                    </div>
                
                </Col>
            
            </Row>
        </Card>
    
    </div>
    );
}

export default DashboardPrincipal;