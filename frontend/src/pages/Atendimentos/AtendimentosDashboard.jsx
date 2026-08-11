import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Select, message } from 'antd';
import { DollarOutlined, TeamOutlined, CalendarOutlined, PhoneOutlined } from '@ant-design/icons';
import { getAtendimentosDashboard, getContatosHoje, getAtendimentosHoje } from '../../services/atendimentoService';

import dayjs from 'dayjs';
import GraficoLinha from '../../components/Graficos/GraficoLinha';
import GraficoRosca from '../../components/Graficos/GraficoRosca';

function AtendimentosDashboard() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [contatosHoje, setContatosHoje] = useState([]);
    const [atendimentosHoje, setAtendimentosHoje] = useState([]);
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

            const [dashboard, contatos, hoje] = await Promise.all([
                getAtendimentosDashboard(ano),
                getContatosHoje(),
                getAtendimentosHoje(),
            ]);

            setData(dashboard);
            setContatosHoje(contatos);
            setAtendimentosHoje(hoje);

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            message.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }

    };

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
        <div style={{ padding: isMobile ? 8 : 16 }}>
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} sm={12} md={6}>
                    <Card size="small">
                        <Statistic 
                            title="Total de atendimentos" 
                            value={data?.total || 0} 
                            prefix={<TeamOutlined style={{ color: '#1a3a5c' }} />} 
                            styles={{ content: { color: '#1a3a5c', fontSize: isMobile ? 16 : 20 } }} 
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <Card size="small">
                        <Statistic 
                            title="Valor total em consultas" 
                            value={formatCurrency(data?.totalConsultas)} 
                            prefix={<DollarOutlined style={{ color: '#22c55e' }} />} 
                            styles={{ content: { color: '#22c55e', fontSize: isMobile ? 16 : 20 } }} 
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <Card size="small">
                        <Statistic 
                            title="Atendimentos hoje" 
                            value={atendimentosHoje.length} 
                            prefix={<CalendarOutlined style={{ color: '#3b82f6' }} />} 
                            styles={{ content: { color: '#3b82f6', fontSize: isMobile ? 16 : 20 } }} 
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <Card size="small">
                        <Statistic 
                            title="Contatos a fazer hoje" 
                            value={contatosHoje.length} 
                            prefix={<PhoneOutlined style={{ color: '#eab308' }} />} 
                            styles={{ content: { color: '#eab308', fontSize: isMobile ? 16 : 20 } }} 
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={12}>
                    <Card size="small" title="Atendimentos de hoje">
                        {atendimentosHoje.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Nenhum atendimento hoje</div>
                        ) : (
                            atendimentosHoje.map((item) => (
                                <div key={item.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                                    <div style={{ fontWeight: 500, color: '#1a3a5c' }}>{item.nome}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.hora} - {item.assunto || 'Sem assunto'}</div>
                                </div>
                            ))
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card size="small" title="Contatos a fazer hoje">
                        {contatosHoje.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Nenhum contato pendente</div>
                        ) : (
                            contatosHoje.map((item) => (
                                <div key={item.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                                    <div style={{ fontWeight: 500, color: '#1a3a5c' }}>{item.nome}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.telefone} - {item.assunto}</div>
                                </div>
                            ))
                        )}
                    </Card>
                </Col>
            </Row>

            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={12}>
                    <Card size="small">
                        <GraficoRosca data={data?.novosAntigos} title="Novos x Antigos clientes" isMobile={isMobile} />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card size="small">
                        <GraficoRosca data={data?.fechouContrato} title="Fechou contrato?" isMobile={isMobile} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[12, 12]}>
                <Col xs={24}>
                    <Card size="small">
                        <GraficoLinha data={data?.porMes} title="Atendimentos por mês" ano={ano} isMobile={isMobile} />
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                            <Select value={ano} onChange={setAno} size="small" style={{ width: isMobile ? '80%' : 100 }} options={anosOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );

}

export default AtendimentosDashboard;