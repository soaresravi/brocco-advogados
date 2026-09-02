import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Tabs, Badge, Button, Space, DatePicker, notification, Typography, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPrazosHoje, getPrazosProximos, getPrazosEmAberto, getCalendarioPrazos } from '../../services/processoService';

function ProcessosPrazos() {

    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [prazosHoje, setPrazosHoje] = useState([]);
    const [prazosProximos, setPrazosProximos] = useState([]);
    const [prazosEmAberto, setPrazosEmAberto] = useState({ total: 0, content: [] });
    const [prazosFiltrados, setPrazosFiltrados] = useState([]);
    const [calendario, setCalendario] = useState({});
    const [activeTab, setActiveTab] = useState('lista');

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

            const [hoje, proximos, emAberto, calendarioData] = await Promise.all([
                getPrazosHoje(),
                getPrazosProximos(),
                getPrazosEmAberto(),
                getCalendarioPrazos(),
            ]);

            setPrazosHoje(Array.isArray(hoje) ? hoje : []);
            setPrazosProximos(Array.isArray(proximos) ? proximos : []);
            
            const emAbertoData = emAberto && typeof emAberto === 'object' ? emAberto : { total: 0, content: [] };
            
            setPrazosEmAberto(emAbertoData);
            setPrazosFiltrados(Array.isArray(emAbertoData.content) ? emAbertoData.content : []);
            setCalendario(calendarioData && typeof calendarioData === 'object' ? calendarioData : {});
        
        } catch (error) {
           
            console.error('Erro ao carregar prazos:', error);
           
            notification.error({
                title: null,
                description: 'Erro ao carregar prazos',
                placement: 'bottomRight',
                duration: 10,
                showProgress: true,
                pauseOnHover: false,
                closable: true,
            });

        } finally {
            setLoading(false);
        }

    };

    const colunasLista = [
        
        { title: 'ID', dataIndex: 'id', width: isMobile ? 60 : 70 },
        { title: 'Nº do processo', dataIndex: 'numeroProcesso', width: isMobile ? 150 : 200 },
        { title: 'Cliente', dataIndex: 'clienteNome', width: isMobile ? 120 : 200 },
        { title: 'Data do prazo', dataIndex: 'dataPrazo', width: isMobile ? 100 : 120, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        
        { title: 'Status', key: 'status', width: isMobile ? 110 : 120, render: (_, record) => {
        
            const diasRestantes = record.diasRestantes;
        
            if (diasRestantes < 0) {
                return <Badge status="error" text="Atrasado" />;
            } else if (diasRestantes === 0) {
                return <Badge status="warning" text="Vence hoje" />;
            } else if (diasRestantes <= 3) {
                return <Badge status="processing" text={`Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`} />;
            }
        
            return <Badge status="default" text={`Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`} />;
        }, },
    
    ];

    const calendarioData = Object.entries(calendario?.porDia || {}).map(([dia, processos]) => {

        const mes = calendario?.mes || new Date().getMonth() + 1;
        const ano = calendario?.ano || new Date().getFullYear();
        const dataCompleta = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        return {
            data: dayjs(dataCompleta).format('DD/MM/YYYY'),
            dataOriginal: dataCompleta,
            processos: Array.isArray(processos) ? processos : [],
            quantidade: Array.isArray(processos) ? processos.length : 0,
        };

    });

    const colunasCalendario = [
       
        { title: 'Data', dataIndex: 'data', width: isMobile ? 90 : 120, sorter: (a, b) => dayjs(a.dataOriginal).unix() - dayjs(b.dataOriginal).unix() },
        { title: 'Quantidade', dataIndex: 'quantidade', width: isMobile ? 80 : 100, render: (text) => <Badge count={text} style={{ backgroundColor: '#131a53' }} /> },
       
        { title: 'Processos', dataIndex: 'processos', render: (processos) => (
            
            <Space wrap size={isMobile ? 'small' : 'middle'}>
            
                {processos.map((p, idx) => (
                    <Button key={idx} type="link" size="small" style={{ color: '#1a3a5c', padding: 0, fontSize: isMobile ? 11 : 12 }}> {p.numeroProcesso} </Button>
                ))}
            
            </Space>
        
        ),},

    ];

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>

        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            
            <Col xs={24} sm={8}>
                
                <Card size="small">
                    
                    <Statistic title="Prazos para hoje" value={prazosHoje.length} prefix={<WarningOutlined style={{ color: '#eab308' }} />} styles={{ content: { color: '#131a53', fontSize: isMobile ? 20 : 24 } }} />
                    
                    {prazosHoje.length > 0 && (
                        
                        <div style={{ marginTop: 12 }}>
                           
                            {prazosHoje.slice(0, 3).map((item) => (
                            
                                <div key={item.id} style={{ marginBottom: 4, fontSize: isMobile ? 10 : 12 }}>
                                    <div style={{ fontWeight: 500, color: '#1a3a5c' }}>{item.numeroProcesso}</div>
                                    <div style={{ color: '#94a3b8', fontSize: isMobile ? 9 : 11 }}>{item.clienteNome}</div>
                                </div>

                            ))}
                            
                            {prazosHoje.length > 3 && (
                            
                                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                                    +{prazosHoje.length - 3} outros
                                </div>
                            
                            )}
                        
                        </div>
                    
                    )}
                </Card>
            </Col>
        
            <Col xs={24} sm={8}>
                
                <Card size="small">
                    <Statistic title="Próximos 7 dias" value={prazosProximos.length} prefix={<ClockCircleOutlined style={{ color: '#1a3a5c' }} />} styles={{ content: { color: '#131a53', fontSize: isMobile ? 20 : 24 } }} />
                </Card>
            
            </Col>
        
            <Col xs={24} sm={8}>
                
                <Card size="small">
                    <Statistic title="Processos com prazo aberto" value={prazosEmAberto?.total || 0} prefix={<CalendarOutlined style={{ color: '#1a3a5c' }} />} styles={{ content: { color: '#131a53', fontSize: isMobile ? 20 : 24 } }} />
                </Card>
            
            </Col>
        
        </Row>

        <Card size="small">
            
            <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="small" className="custom-tabs" items={[
                
                { key: 'lista', label: 'Lista de prazos', children: (
                
                    <div>
                        
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>
                                Total: {prazosFiltrados.length} de {prazosEmAberto?.total || 0} prazo(s) em aberto
                            </span>
                            
                            <DatePicker.RangePicker placeholder={['Data inicial', 'Data final']} format="DD/MM/YYYY" onChange={(dates) => {
                                
                                if (dates && dates[0] && dates[1]) {
                                    const filtered = (prazosEmAberto?.content || []).filter(p => dayjs(p.dataPrazo).isAfter(dates[0].subtract(1, 'day')) && dayjs(p.dataPrazo).isBefore(dates[1].add(1, 'day')));
                                    setPrazosFiltrados(filtered);
                                } else {
                                    setPrazosFiltrados(prazosEmAberto?.content || []);
                                }
                            
                            }} allowClear size="small" />
                        
                        </div>

                        {!isMobile ? (
                            <Table dataSource={prazosFiltrados} columns={colunasLista} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
                        ) : (
                            
                            <div>
                                
                                {prazosFiltrados.length === 0 ? (
                                
                                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                        Nenhum prazo nos próximos 7 dias
                                    </div>

                                ) : (
                                   
                                    prazosFiltrados.map((item) => {
                                        
                                        const diasRestantes = item.diasRestantes;
                            
                                        let statusColor = '#52c41a';
                                        let statusText = `Vence em ${diasRestantes} dias`;
    
                                        if (diasRestantes < 0) {
                                            statusColor = '#ef4444';
                                            statusText = 'Atrasado';
                                        } else if (diasRestantes === 0) {
                                            statusColor = '#eab308';
                                            statusText = 'Vence hoje';
                                        } else if (diasRestantes <= 3) {
                                            statusColor = '#3b82f6';
                                            statusText = `Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`;
                                        }
                                        
                                        return (
                                        
                                        <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}> {item.numeroProcesso} </Typography.Text>
                                                <Tag color={statusColor} style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}> {statusText} </Tag>
                                            </div>
                            
                                            <Row gutter={[6, 4]}>
                                    
                                                <Col span={24}>
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Cliente</Typography.Text>
                                                    <div style={{ fontSize: 11 }}>{item.clienteNome || '-'}</div>
                                                </Col>
                                            
                                            </Row>
                            
                                            <Row gutter={[6, 4]}>
                                                
                                                <Col span={24}>
                                        
                                                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>Data do Prazo</Typography.Text>
                                        
                                                    <div style={{ fontSize: 11, fontWeight: 500 }}>
                                                        {item.dataPrazo ? dayjs(item.dataPrazo).format('DD/MM/YYYY') : '-'}
                                                    </div>
                        
                                                </Col>

                                            </Row>
                                        
                                        </Card>
                                        );
                                    })
                                )}
                            </div>
                        )}
                                    
                    </div>
                ),},
                
                { key: 'calendario', label: 'Calendário', children: (
                    
                    <div>
        
                        {!isMobile ? (    
                            <Table dataSource={calendarioData} columns={colunasCalendario} rowKey="dataOriginal" size="small" pagination={{ pageSize: 10 }} />
                        ) : (
                        
                            <div>
                                
                                {calendarioData.length === 0 ? (
                                
                                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                        Nenhum prazo no calendário
                                    </div>
                                
                                ) : (
                                    
                                    calendarioData.map((item) => (
                                    
                                        <Card key={item.dataOriginal} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}> {item.data} </Typography.Text>
                                                <Badge count={item.quantidade} style={{ backgroundColor: '#131a53' }} />
                                            </div>
                        
                                            <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 10 }}>Processos</Typography.Text>
                                            
                                            <Space wrap size="small" style={{ marginTop: 4 }}>
                                             
                                                {item.processos.map((p, idx) => (
                                                    <Button key={idx} type="link" size="small" style={{ color: '#1a3a5c', padding: 0, fontSize: 11 }}> {p.numeroProcesso} </Button>
                                                ))}
                                            
                                            </Space>

                                        </Card>
                                
                                    ))
                                
                                )}
                            </div>
                        )}
                    </div>
                ),},
            ]} />
        </Card>
        
    </div>
    );
}

export default ProcessosPrazos;