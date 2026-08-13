import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Select, Tabs } from 'antd';
import { DollarOutlined, WalletOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

import { getFinanceiroDashboard } from '../../services/financeiroService';
import GraficoLinha from '../../components/Graficos/GraficoLinha';

function FinanceiroDashboard() {

    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [data, setData] = useState(null);
    const [ano, setAno] = useState(new Date().getFullYear());

    const [resultadoPorMes, setResultadoPorMes] = useState({});
    const [recebimentosTotal, setRecebimentosTotal] = useState({});
    const [recebidos, setRecebidos] = useState({});
    const [naoRecebidos, setNaoRecebidos] = useState({});
    const [despesasTotal, setDespesasTotal] = useState({});
    const [pagas, setPagas] = useState({});
    const [naoPagas, setNaoPagas] = useState({});

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

    useEffect(() => {

        if (data) {

            const resultado = {};
            const recebTotal = {};
            const receb = {};
            const naoReceb = {};
            const despTotal = {};
            const pag = {};
            const naoPag = {};

            for (let mes = 1; mes <= 12; mes++) {

                const recebimentoItem = data?.recebimentosPorMes?.[mes];
                const despesaItem = data?.despesasPorMes?.[mes];

                const recebido = recebimentoItem?.recebido || 0;
                const naoRecebido = recebimentoItem?.naoRecebido || 0;
                const pago = despesaItem?.pago || 0;
                const naoPago = despesaItem?.naoPago || 0;

                recebTotal[mes] = recebido + naoRecebido;
                receb[mes] = recebido;
                naoReceb[mes] = naoRecebido;
                despTotal[mes] = pago + naoPago;
                pag[mes] = pago;
                naoPag[mes] = naoPago;
                resultado[mes] = recebTotal[mes] - despTotal[mes];

            }

            setResultadoPorMes(resultado);
            setRecebimentosTotal(recebTotal);
            setRecebidos(receb);
            setNaoRecebidos(naoReceb);
            setDespesasTotal(despTotal);
            setPagas(pag);
            setNaoPagas(naoPag);

        }

    }, [data]);

    const carregarDados = async () => {

        setLoading(true);

        try {
            const response = await getFinanceiroDashboard(ano);
            setData(response);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
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
                    <Statistic title="Total de recebimentos" value={formatCurrency(data?.totalRecebimentos)} prefix={<ArrowUpOutlined style={{ color: '#22c55e' }} />} styles={{ content: { color: '#1a3a5c', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
                
                <Card size="small">
                    <Statistic title="Total de despesas" value={formatCurrency(data?.totalDespesas)} prefix={<ArrowDownOutlined style={{ color: '#ef4444' }} />} styles={{ content: { color: '#1a3a5c', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
    
                <Card size="small">
                    <Statistic title="Resultado" value={formatCurrency(data?.resultado)} prefix={<DollarOutlined />} styles={{ content: { color: data?.resultado >= 0 ? '#22c55e' : '#ef4444', fontSize: isMobile ? 16 : 20 } }} />
                </Card>
            
            </Col>
        
            <Col xs={12} sm={12} md={6}>
    
                <Card size="small">
                    <Statistic title="Recebimentos em atraso" value={formatCurrency(data?.totalRecebimentosAtraso)} prefix={<WalletOutlined style={{ color: '#eab308' }} />} styles={{ content: { color: '#eab308', fontSize: isMobile ? 16 : 20 } }} />
                </Card>

            </Col>
        
        </Row>

        <Card size="small">
    
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Select value={ano} onChange={setAno} size="small" style={{ width: isMobile ? '80%' : 100 }} options={anosOptions} />
            </div>

            <Tabs defaultActiveKey="resultado" type="card" size="small" items={[
                
                { key: 'resultado', label: 'Resultado geral', children: (
                    <GraficoLinha data={resultadoPorMes} title="Resultado por mês (receitas - despesas)" ano={ano} isMobile={isMobile} />
                ),},
                
                { key: 'recebimentos', label: 'Recebimentos', children: (
                    
                    <>
                        <GraficoLinha data={recebimentosTotal} title="Recebimentos por mês" ano={ano} isMobile={isMobile} />
                        <GraficoLinha data={recebidos} title="Recebidos" ano={ano} cor="#22c55e" isMobile={isMobile} />
                        <GraficoLinha data={naoRecebidos} title="Não recebidos" ano={ano} cor="#ef4444" isMobile={isMobile} />
                    </>

                ),},
                
                { key: 'despesas', label: 'Despesas', children: (
                    
                    <>
                        <GraficoLinha data={despesasTotal} title="Despesas por mês" ano={ano} isMobile={isMobile} />
                        <GraficoLinha data={pagas} title="Pagas" ano={ano} cor="#22c55e" isMobile={isMobile} />
                        <GraficoLinha data={naoPagas} title="Não pagas" ano={ano} cor="#ef4444" isMobile={isMobile} />
                    </>
                
                ),},

            ]} />
        </Card>
    
    </div>
    );
}

export default FinanceiroDashboard;