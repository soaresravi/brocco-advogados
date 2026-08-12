import { useState, useEffect } from 'react';
import { Table, Tabs, Input, Button, Space, Modal, Form, Select, Row, Col, Card, notification, Drawer, Typography, Tag, Upload, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined, MoreOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';

import { getClientesComPendencias, getProvidenciasPendentes, atualizarStatusProvidencia, getAnexos, uploadAnexo, downloadAnexo, deleteAnexo, salvarObservacao } from '../../services/andamentoService';
import { getUsuariosSimples } from '../../services/providenciaService';

import { TIPO_PROVIDENCIA_OPTIONS, STATUS_PROVIDENCIA_OPTIONS } from '../../constants/enums';

const { TextArea } = Input;

function AndamentosLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');

    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [providencias, setProvidencias] = useState([]);
    const [providenciasLoading, setProvidenciasLoading] = useState(false);

    const [anexos, setAnexos] = useState([]);
    const [anexosLoading, setAnexosLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [observacao, setObservacao] = useState('');
    const [enviarParaId, setEnviarParaId] = useState(null);
    const [usuarios, setUsuarios] = useState([]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canEdit = user.permissao === 'ADMIN' || user.permissao === 'EDIT';
    const isReadOnly = !canEdit;

    const showNotification = (type, message) => {

        notification[type]({
            title: null,
            description: message,
            placement: 'bottomRight',
            duration: 10,
            showProgress: true,
            pauseOnHover: false,
            closable: true,
        });

    };

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarUsuarios();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText]);

    const carregarUsuarios = async () => {

        try {
            const response = await getUsuariosSimples();
            setUsuarios(response || []);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getClientesComPendencias(pagination.current - 1, pagination.pageSize, searchText);
            setData(response.content || []);

            setPagination({
                ...pagination,
                total: response.total,
                current: response.page + 1,
            });
            
        } catch (error) {
            showNotification('error', 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }

    };

    const carregarProvidencias = async (clienteId) => {

        setProvidenciasLoading(true);

        try {
            const response = await getProvidenciasPendentes(clienteId);
            setProvidencias(response || []);
        } catch (error) {
            showNotification('error', 'Erro ao carregar providências');
        } finally {
            setProvidenciasLoading(false);
        }

    };

    const carregarAnexos = async (clienteId) => {

        setAnexosLoading(true);

        try {
            const response = await getAnexos(clienteId);
            setAnexos(response || []);
        } catch (error) {
            showNotification('error', 'Erro ao carregar anexos');
        } finally {
            setAnexosLoading(false);
        }

    };

    const handleSearch = (e) => {
        setSearchText(e.target.value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleReset = () => {
        setSearchText('');
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleViewDetails = async (record) => {
        setClienteSelecionado(record);
        setModalVisible(true);
        setObservacao('');
        setEnviarParaId(null);
        await carregarProvidencias(record.id);
        await carregarAnexos(record.id);
    };

    const handleAtualizarStatus = async (providenciaId, novoStatus) => {

        if (isReadOnly) return;
        setModalLoading(true);

        try {
            await atualizarStatusProvidencia(providenciaId, novoStatus);
            showNotification('success', 'Status atualizado com sucesso!');
            await carregarProvidencias(clienteSelecionado.id);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao atualizar status');
        } finally {
            setModalLoading(false);
        }

    };

    const handleUpload = async (file) => {

        if (isReadOnly) return;
        setUploadLoading(true);

        try {
            await uploadAnexo(clienteSelecionado.id, file);
            showNotification('success', 'Anexo enviado com sucesso!');
            await carregarAnexos(clienteSelecionado.id);
        } catch (error) {
            showNotification('error', 'Erro ao enviar anexo');
        } finally {
            setUploadLoading(false);
        }

        return false;

    };

    const handleDownload = async (uuid, nome) => {

        try {

            const response = await downloadAnexo(uuid);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', nome);
            document.body.appendChild(link);

            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            showNotification('error', 'Erro ao baixar anexo');
        }

    };

    const handleDeleteAnexo = async (uuid, nome) => {

        if (isReadOnly) return;

        Modal.confirm({ title: 'Excluir anexo', content: `Tem certeza que deseja excluir "${nome}"?`, okText: 'Sim, excluir', cancelText: 'Cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: async () => {
            
            try {
                await deleteAnexo(uuid);
                showNotification('success', 'Anexo excluído com sucesso!');
                await carregarAnexos(clienteSelecionado.id);
            } catch (error) {
                showNotification('error', 'Erro ao excluir anexo');
            }
        }, });

    };

    const handleSalvarObservacao = async () => {

        if (!observacao.trim()) {
            showNotification('warning', 'Digite uma observação');
            return;
        }

        setModalLoading(true);
        
        try {
            await salvarObservacao(clienteSelecionado.id, observacao, enviarParaId);
            showNotification('success', 'Observação salva e notificação enviada!');
            setObservacao('');
            setEnviarParaId(null);
        } catch (error) {
            showNotification('error', 'Erro ao salvar observação');
        } finally {
            setModalLoading(false);
        }
        
    };

    const columns = [
        
        { title: 'ID', dataIndex: 'id', width: 60 },
        
        { title: 'Cliente', dataIndex: 'nome', render: (text, record) => (
            <Button type="link" style={{ padding: 0, color: '#1a3a5c' }} onClick={() => handleViewDetails(record)}> {text} </Button>),
        },
        
        { title: 'Matrícula SAP', dataIndex: 'matriculaSap', width: 130 },
        { title: 'Nº Processo', dataIndex: 'numeroProcesso', width: 150 },
        { title: 'Regime', dataIndex: 'regimePrisional', width: 130, },
        { title: 'Pendências', dataIndex: 'totalPendencias', width: 100, render: (text) => <Tag color="orange">{text}</Tag>, },
      
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c' }} />
        ),},
    
    ];

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Card size="small">
        
            <Row gutter={[12, 12]} justify="space-between" align="middle">
        
                <Col xs={24} md={16}>
        
                    <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
                       
                        <Input placeholder="Buscar por nome, matrícula ou processo" value={searchText} onChange={handleSearch} style={{ width: isMobile ? '100%' : 250 }} prefix={<SearchOutlined />} allowClear />
                        
                        {!isMobile && (
                            <Button onClick={handleReset} icon={<ReloadOutlined />}> Limpar </Button>
                        )}
                    
                    </Space>
                
                </Col>
                
                {isMobile && (
                    
                    <div style={{ marginTop: 12, width: '100%' }}>
                        <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}> Filtros </Button>
                    </div>
                
                )}
            
            </Row>

            {!isMobile && (
                <Table columns={columns} dataSource={data} rowKey="id"loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 800 }} size="small" style={{ marginTop: 16 }} />
            )}

            {isMobile && (
            
            <div style={{ marginTop: 16 }}>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhum cliente com pendências</div>
                ) : (
                    
                    <>
                        
                        {data.map((record) => (
                        
                            <Card key={record.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}> {record.nome} </Typography.Text>
                                    <Tag color="orange">{record.totalPendencias} pendência(s)</Tag>
                                </div>
                    
                                <Row gutter={[6, 4]}>
            
                                    <Col span={12}>
                                        <Typography.Text type="secondary" style={{ fontSize: 10 }}>Matrícula SAP</Typography.Text>
                                        <div style={{ fontSize: 11 }}>{record.matriculaSap || '-'}</div>
                                    </Col>
                                    
                                    <Col span={12}>
                                        <Typography.Text type="secondary" style={{ fontSize: 10 }}>Nº Processo</Typography.Text>
                                        <div style={{ fontSize: 11 }}>{record.numeroProcesso || '-'}</div>
                                    </Col>
    
                                </Row>
                                
                                <Row gutter={[6, 4]}>
                        
                                    <Col span={12}>
                                        <Typography.Text type="secondary" style={{ fontSize: 10 }}>Regime</Typography.Text>
                                        <div style={{ fontSize: 11 }}>{record.regimePrisional || '-'}</div>
                                    </Col>
                            
                                </Row>
                    
                                <div style={{ marginTop: 8, textAlign: 'right' }}>
                                    <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c', padding: 0 }} size="small"> Ver detalhes </Button>
                                </div>
                        
                            </Card>
                            
                        ))}
                        
                        {pagination.total > 0 && (
                        
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                                <Button size="small" onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })} disabled={pagination.current === 1}>Anterior</Button>
                                <span style={{ fontSize: 12 }}>{pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}</span>
                                <Button size="small" onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })} disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}>Próxima</Button>
                            </div>
                            
                        )}
                
                    </>
                )}
            </div>
            )}

            <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 'bold' }}>
                Total: {data.length} de {pagination.total} cliente(s) com pendências
            </div>

        </Card>

        <Drawer title={<span style={{ color: '#1a3a5c' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
            
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <Button onClick={() => { handleReset(); setFiltersDrawerOpen(false); }} style={{ width: '100%' }}> Limpar filtros </Button>
                <Button type="primary" onClick={() => setFiltersDrawerOpen(false)} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)', width: '100%' }}> Aplicar filtros </Button>
            </Space>
        
        </Drawer>
        
        <Modal title={clienteSelecionado ? `Andamentos - ${clienteSelecionado.nome}` : 'Detalhes do cliente'} open={modalVisible} onCancel={() => {
            setModalVisible(false);
            setClienteSelecionado(null);
            setProvidencias([]);
            setAnexos([]);
        }} width={isMobile ? '90%' : 800} footer={null} closable={{ mask: false }} style={{ top: 50 }}>
            
            {clienteSelecionado && (
            
                <>
                    
                    <div style={{ marginBottom: 16, padding: 12, background: '#f1f5f9', borderRadius: 6 }}>
                        
                        <Row gutter={[12, 8]}>
                    
                            <Col span={8}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Nome</Typography.Text>
                                <div style={{ fontWeight: 500 }}>{clienteSelecionado.nome}</div>
                            </Col>
    
                            <Col span={8}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Matrícula SAP</Typography.Text>
                                <div>{clienteSelecionado.matriculaSap || '-'}</div>
                            </Col>
                        
                            <Col span={8}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Nº Processo</Typography.Text>
                                <div>{clienteSelecionado.numeroProcesso || '-'}</div>
                            </Col>
        
                            <Col span={8}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Regime</Typography.Text>
                                <div>{clienteSelecionado.regimePrisional || '-'}</div>
                            </Col>
                    
                            <Col span={8}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Total de pendências</Typography.Text>
                                <Tag color="orange">{clienteSelecionado.totalPendencias}</Tag>
                            </Col>
    
                        </Row>

                    </div>

                    <Tabs defaultActiveKey="providencias" items={[
                        
                        { key: 'providencias', label: 'Providências pendentes', children: (
                            
                            <div>
                    
                                {providenciasLoading ? (
                                    <Spin size="small" />
                                ) : providencias.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}> Nenhuma providência pendente </div>
                                ) : (
                                    
                                    providencias.map((item) => (
                                        
                                        <Card key={item.id} size="small" style={{ marginBottom: 12 }} styles={{ body: { padding: 12 } }}>
                                
                                            <Row gutter={[12, 8]}>
                        
                                                <Col span={24}>
                                                    <Typography.Text strong>Data: </Typography.Text>
                                                    <Typography.Text>{dayjs(item.dataAtendimento).format('DD/MM/YYYY')}</Typography.Text>
                                                </Col>
                            
                                                <Col span={24}>
                    
                                                    <Typography.Text strong>Itens: </Typography.Text>
            
                                                    {item.itens?.map((tipo) => (
                                                    
                                                        <Tag key={tipo} color="blue" style={{ marginBottom: 4 }}>
                                                            {TIPO_PROVIDENCIA_OPTIONS.find(o => o.value === tipo)?.label || tipo}
                                                        </Tag>
                                                    ))}
                                            
                                                </Col>
                                    
                                                {item.observacoes && (

                                                    <Col span={24}>
                                                        <Typography.Text strong>Observações: </Typography.Text>
                                                        <Typography.Text>{item.observacoes}</Typography.Text>
                                                    </Col>
                                            
                                                )}
                                                
                                                <Col span={24}>
                                        
                                                    <Typography.Text strong>Status atual: </Typography.Text>
                                                   
                                                    <Tag color={item.status === 'PENDENTE' ? 'orange' : item.status === 'EM_ANDAMENTO' ? 'blue' : 'green'}>
                                                        {STATUS_PROVIDENCIA_OPTIONS.find(o => o.value === item.status)?.label || item.status}
                                                    </Tag>
                                        
                                                </Col>
                                
                                                {canEdit && (
                                                    
                                                    <Col span={24} style={{ marginTop: 8 }}>
                                            
                                                        <Space>
                                                            
                                                            {item.status !== 'CONCLUIDA' && (
                                                                
                                                                <>
                                                                    <Button size="small" type="primary" onClick={() => handleAtualizarStatus(item.id, 'EM_ANDAMENTO')} loading={modalLoading} style={{ background: '#3b82f6' }}> Em andamento </Button>
                                                                    <Button size="small" type="primary" onClick={() => handleAtualizarStatus(item.id, 'CONCLUIDA')} loading={modalLoading} style={{ background: '#22c55e' }}> <CheckOutlined /> Concluir </Button>
                                                                </>
                                                                
                                                            )}
                                                    
                                                        </Space>
                                            
                                                    </Col>

                                                )}
                                            
                                            </Row>
                                        </Card>
                                    ))
                                )}
                            </div>
                        ),},
                        
                        { key: 'anexos', label: 'Anexos', children: (
                        
                            <div>
                                
                                {canEdit && (

                                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                                    
                                        <Upload beforeUpload={handleUpload} showUploadList={false} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                                            <Button type="primary" icon={<UploadOutlined />} loading={uploadLoading} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Enviar anexo </Button>
                                        </Upload>
                                    
                                    </div>
                                
                                )}
                        
                                {anexosLoading ? (
                                    <Spin size="small" />
                                ) : anexos.length === 0 ? (
                                    
                                    <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                                        Nenhum anexo encontrado
                                    </div>

                                ) : (
                                    
                                    <Table dataSource={anexos} rowKey="id" size="small" pagination={false} columns={[
                                        
                                        { title: 'Nome', dataIndex: 'nome' },
                                        { title: 'Tamanho', dataIndex: 'tamanho', render: (t) => `${(t / 1024).toFixed(2)} KB` },
                                        { title: 'Data', dataIndex: 'uploadedAt', render: (t) => dayjs(t).format('DD/MM/YYYY HH:mm') },
                                        { title: 'Ações', width: 120, render: (_, record) => (
                                        
                                            <Space>
                                            
                                                <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record.id, record.nome)} style={{ color: '#1a3a5c' }} />
                                            
                                                {canEdit && (
                                                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteAnexo(record.id, record.nome)} />
                                                )}
                                        
                                            </Space>

                                        ),},

                                    ]} />

                                )}

                            </div>
                        ),},
                        
                        { key: 'observacoes', label: 'Observações', children: (
                            
                            <div>
                    
                                <Form layout="vertical" size="small">
            
                                    <Form.Item label="Observações">
                                        <TextArea rows={4} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Digite suas observações sobre este cliente..." disabled={isReadOnly} />
                                    </Form.Item>
                        
                                    <Form.Item label="Enviar para (notificação)">
                                        <Select size="small" placeholder="Selecione um usuário" options={usuarios.map(u => ({ value: u.id, label: u.nome }))} onChange={setEnviarParaId} allowClear disabled={isReadOnly} />
                                    </Form.Item>
                            
                                    {canEdit && (
                                        <Button type="primary" onClick={handleSalvarObservacao} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Salvar observação </Button>
                                    )}
                            
                                </Form>
                    
                            </div>
                        
                        ),},
                        
                    ]} />
                </>
            )}
        </Modal>
    </div>
    );
}

export default AndamentosLista;