import { useState, useEffect } from 'react';
import { Table, Input, Tag, Typography, Button, Space, Modal, Form, Select, Tabs, notification, Row, Col, Card, DatePicker, Drawer } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';

import { getProcessosDiversos, createProcessoDiverso, updateProcessoDiverso, deleteProcessoDiverso, getMovimentacoesDiversas, createMovimentacaoDiversa, updateMovimentacaoDiversa, deleteMovimentacaoDiversa, getClientesOptions } from '../../services/processoDiversoService';
import { QUALIFICACAO_OPTIONS } from '../../constants/enums';

const { TextArea } = Input;

const STATUS_PROCESSO_OPTIONS = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
];

function ProcessoDiversoLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [filtroSituacao, setFiltroSituacao] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('dados');

    const [movimentacoes, setMovimentacoes] = useState([]);
    const [movLoading, setMovLoading] = useState(false);
    const [movModalVisible, setMovModalVisible] = useState(false);
    const [editingMov, setEditingMov] = useState(null);
    const [filtroPrazo, setFiltroPrazo] = useState(null);

    const [clientesOptions, setClientesOptions] = useState([]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canEdit = user.permissao === 'ADMIN' || user.permissao === 'EDIT';
    const isReadOnly = !canEdit;

    const [movForm] = Form.useForm();
    const [form] = Form.useForm();

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarOpcoes();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroSituacao, filtroPrazo]);

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

    const carregarOpcoes = async () => {
       
        try {
            const clientes = await getClientesOptions();
            setClientesOptions(clientes.map(c => ({ value: c.id, label: c.nome })));
        } catch (error) {
            console.error('Erro ao carregar opções:', error);
        }
    
    };

    const carregarDados = async () => {
       
        setLoading(true);
       
        try {
          
            const params = {
                page: pagination.current - 1,
                size: pagination.pageSize,
                search: searchText || undefined,
                situacao: filtroSituacao,
                prazoEmAberto: filtroPrazo,
            };

            const response = await getProcessosDiversos(params.page, params.size, params);
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

    const carregarMovimentacoes = async (processoId) => {
       
        setMovLoading(true);
       
        try {
            const response = await getMovimentacoesDiversas(processoId);
            setMovimentacoes(response || []);
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
            setMovimentacoes([]);
        } finally {
            setMovLoading(false);
        }
   
    };

    const handleViewDetails = async (record) => {
      
        setEditingItem(record);
        setIsEditMode(false);
        setActiveTab('dados');
        setModalVisible(true);

        setTimeout(() => {
         
            form.setFieldsValue({
                ...record,
                clienteId: record.clienteId,
                dataPrazo: record.dataPrazo ? dayjs(record.dataPrazo) : null,
                situacao: record.situacao,
                qualificacao: record.qualificacao,
                areaJuridica: record.areaJuridica,
            });

        }, 10);

        await carregarMovimentacoes(record.id);
   
    };

    const handleEnableEdit = () => {
        setIsEditMode(true);
    };

    const handleAdd = () => {
        setEditingItem(null);
        setIsEditMode(true);
        form.resetFields();
        setMovimentacoes([]);
        setModalVisible(true);
    };

    const handleDelete = async () => {
        
        if (!editingItem) return;
      
        try {
            await deleteProcessoDiverso(editingItem.id);
            showNotification('success', 'Processo excluído com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir processo');
        }
    
    };

    const handleModalOk = async () => {
        
        try {
          
            const values = await form.validateFields();
            setModalLoading(true);

            const movimentacoesAtuais = movimentacoes.map(m => ({
                data: m.data,
                descricao: m.descricao,
            }));

            const dataToSend = {
                ...values,
                tipoProcesso: 'DIVERSO',
                clienteId: values.clienteId,
                dataPrazo: values.dataPrazo ? values.dataPrazo.format('YYYY-MM-DD') : null,
                situacao: values.situacao || 'ATIVO',
                movimentacoes: movimentacoesAtuais,
            };

            if (editingItem) {
                await updateProcessoDiverso(editingItem.id, dataToSend);
                showNotification('success', 'Processo atualizado com sucesso!');
            } else {
                await createProcessoDiverso(dataToSend);
                showNotification('success', 'Processo criado com sucesso!');
            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar processo');
        } finally {
            setModalLoading(false);
        }

    };

    const handleCancelModal = () => {
     
        if (isEditMode && editingItem) {
         
            Modal.confirm({ title: 'Tem certeza?', content: 'As informações não salvas serão perdidas.', okText: 'Sim, fechar', cancelText: 'Não, continuar editando', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' } }, centered: true, onOk: () => {
                setModalVisible(false);
                setIsEditMode(false);
                setEditingItem(null);
                form.resetFields();
            }, });
        
        } else {
            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            form.resetFields();
        }

    };

    const handleAddMov = () => {
        setEditingMov(null);
        movForm.resetFields();
        setMovModalVisible(true);
    };

    const handleEditMov = (record) => {
    
        setEditingMov(record);
       
        movForm.setFieldsValue({
            data: record.data ? dayjs(record.data) : null,
            descricao: record.descricao,
        });
       
        setMovModalVisible(true);
    
    };

    const handleDeleteMov = async (movId) => {
       
        try {
            await deleteMovimentacaoDiversa(editingItem.id, movId);
            showNotification('success', 'Movimentação excluída com sucesso!');
            carregarMovimentacoes(editingItem.id);
        } catch (error) {
            showNotification('error', 'Erro ao excluir movimentação');
        }

    };

    const handleMovModalOk = async () => {
       
        try {
          
            const values = await movForm.validateFields();
           
            const dataToSend = {
                data: values.data ? values.data.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                descricao: values.descricao,
            };

            if (editingMov) {
                await updateMovimentacaoDiversa(editingItem.id, editingMov.id, dataToSend);
                showNotification('success', 'Movimentação atualizada com sucesso!');
                setMovModalVisible(false);
                carregarMovimentacoes(editingItem.id);
                return;
            }

            if (editingItem && editingItem.id) {
                await createMovimentacaoDiversa(editingItem.id, dataToSend);
                showNotification('success', 'Movimentação criada com sucesso!');
                setMovModalVisible(false);
                carregarMovimentacoes(editingItem.id);
                return;
            }

            const novaMovimentacao = {
                id: Date.now(),
                data: dataToSend.data,
                descricao: dataToSend.descricao,
            };
          
            setMovimentacoes([...movimentacoes, novaMovimentacao]);
            showNotification('success', 'Movimentação adicionada! Salve o processo para persistir.');
            setMovModalVisible(false);

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar movimentação');
        }

    };

    const handleSearch = (e) => {
        setSearchText(e.target.value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleReset = () => {
        setSearchText('');
        setFiltroSituacao(null);
        setFiltroPrazo(null);
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleSituacaoChange = (value) => {
        setFiltroSituacao(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handlePrazoChange = (value) => {
        setFiltroPrazo(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const getStatusColor = (situacao) => {
        if (situacao === 'ATIVO') return 'green';
        if (situacao === 'INATIVO') return 'red';
        return 'default';
    };

    const columns = [
       
        { title: 'ID', dataIndex: 'id', width: 60 },
        
        { title: 'Nº do processo', dataIndex: 'numeroProcesso', render: (text, record) => (
            <Button type="link" style={{ padding: 0, color: record.prazoEmAberto ? '#ef4444' : '#1a3a5c', fontWeight: record.prazoEmAberto ? 'bold' : 'normal' }} onClick={() => handleViewDetails(record)}> {text || '-'} </Button>
        ),},
        
        { title: 'Situação', dataIndex: 'situacao', width: 100, render: (text) => {
            
            const found = STATUS_PROCESSO_OPTIONS.find(o => o.value === text);
        
            return (
                
                <Tag color={getStatusColor(text)} style={{ fontSize: 11 }}>
                    {found ? found.label : text || '-'}
                </Tag>

            );
        
        },},
        
        { title: 'Cliente', dataIndex: 'clienteNome', width: 150, render: (text) => text || '-' },
        { title: 'Área', dataIndex: 'areaJuridica', width: 120, render: (text) => text || '-' },
        { title: 'Comarca', dataIndex: 'comarca', width: 120, render: (text) => text || '-' },
        { title: 'Prazo', dataIndex: 'dataPrazo', width: 100, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Prazo aberto?', dataIndex: 'prazoEmAberto', width: 100, render: (text) => text ? 'Sim' : 'Não', },
    
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c' }} />
        ),},
    
    ];

    const tabItems = [
       
        { key: 'dados', label: 'Dados do processo', children: (
            
            <div style={{ marginTop: 8 }}>
        
                <Row gutter={16}>
    
                    <Col xs={24} sm={12} md={8}>
                    
                        <Form.Item name="numeroProcesso" label="Nº do processo">
                            <Input size="small" />
                        </Form.Item>
                    
                    </Col>
                
                    <Col xs={24} sm={12} md={8}>
            
                        <Form.Item name="situacao" label="Situação">
                            <Select size="small" options={STATUS_PROCESSO_OPTIONS} />
                        </Form.Item>

                    </Col>
                    
                    <Col xs={24} sm={12} md={8}>
                
                        <Form.Item name="prazoEmAberto" label="Prazo em aberto?">
                            <Select size="small" options={[{ value: true, label: 'Sim' }, { value: false, label: 'Não' }]} />
                        </Form.Item>
    
                    </Col>

                </Row>

                <Row gutter={16}>
            
                    <Col xs={24} sm={12} md={12}>
        
                        <Form.Item name="clienteId" label="Cliente">
                            <Select size="small" showSearch={{ filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} placeholder="Selecione o cliente" options={clientesOptions} loading={clientesOptions.length === 0} />
                        </Form.Item>
                    
                    </Col>
                
                    <Col xs={24} sm={12} md={12}>
            
                        <Form.Item name="dataPrazo" label="Data do prazo">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                    
                    </Col>
                
                </Row>

                <Row gutter={16}>
        
                    <Col xs={24} sm={12} md={8}>
                        
                        <Form.Item name="qualificacao" label="Qualificação">
                            <Select size="small" allowClear showSearch={{ filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} options={QUALIFICACAO_OPTIONS} placeholder="Selecione a qualificação" />
                        </Form.Item>
                    
                    </Col>
                
                    <Col xs={24} sm={12} md={8}>
            
                        <Form.Item name="comarca" label="Comarca">
                            <Input size="small" />
                        </Form.Item>
                    
                    </Col>
                
                    <Col xs={24} sm={12} md={8}>
            
                        <Form.Item name="varaOrgaoJulgador" label="Vara/Órgão Julgador">
                            <Input size="small" />
                        </Form.Item>
                    
                    </Col>
                
                </Row>

                <Row gutter={16}>
            
                    <Col xs={24} sm={12} md={8}>
                        
                        <Form.Item name="areaJuridica" label="Área Jurídica">
                            <Input size="small" placeholder="Ex: Cível, Trabalhista..." />
                        </Form.Item>
                    
                    </Col>
                
                    <Col xs={24} sm={12} md={8}>
            
                        <Form.Item name="honorarios" label="Honorários (R$)">
                            <Input type="number" size="small" />
                        </Form.Item>
                    </Col>
                
                </Row>

                <Form.Item name="observacoes" label="Observações">
                    <TextArea rows={3} size="small" />
                </Form.Item>

            </div>
        
        ),},
       
        { key: 'movimentacoes', label: 'Movimentações', children: (
            
            <div style={{ marginTop: 8 }}>
        
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
    
                    {isEditMode && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMov} size="small" style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Nova movimentação </Button>
                    )}
                
                </div>

                <Table loading={movLoading} dataSource={movimentacoes} rowKey="id" size="small" pagination={false} columns={[
                    
                    { title: 'Data', dataIndex: 'data', width: 120, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
                    { title: 'Movimentação', dataIndex: 'descricao' },
            
                    { title: 'Ações', width: 100, render: (_, record) => (
                        
                        <Space>
            
                            {isEditMode && (

                                <>
                                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEditMov(record)} style={{ color: '#1a3a5c' }} size="small" />
                                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => { Modal.confirm({ title: 'Excluir movimentação', content: 'Tem certeza que deseja excluir esta movimentação?', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: () => handleDeleteMov(record.id), });}} size="small" />
                                </>

                            )}
                        
                        </Space>

                    ), },
                
                ]} locale={{ emptyText: 'Nenhuma movimentação cadastrada' }} />
            
            </div>
        ),},

    ];

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>

        <Card size="small">
            
            <Row gutter={[12, 12]} justify="space-between" align="middle">
        
                <Col xs={24} md={16}>
    
                    <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
                        
                        <Input placeholder="Buscar por processo, cliente ou comarca" value={searchText} onChange={handleSearch} style={{ width: isMobile ? '100%' : 250 }} prefix={<SearchOutlined />} allowClear />
                    
                        {!isMobile && (
                        
                            <>
                                <Select placeholder="Situação" allowClear style={{ width: 120 }} value={filtroSituacao} onChange={handleSituacaoChange} options={STATUS_PROCESSO_OPTIONS} />
                                <Select placeholder="Prazo em aberto?" allowClear style={{ width: 140 }} value={filtroPrazo} onChange={handlePrazoChange} options={[{ value: true, label: 'Sim' }, { value: false, label: 'Não' }]} />
                            </>
                                
                        )}
                    
                        <Button onClick={handleReset} icon={<ReloadOutlined />}>Limpar</Button>
                
                    </Space>
            
                </Col>
        
                <Col xs={24} md={8} style={{ textAlign: isMobile ? 'center' : 'right' }}>
                    <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53', width: isMobile ? '100%' : 'auto' }} disabled={isReadOnly}> Novo processo </Button>
                </Col>
            
            </Row>

            {isMobile && (

                <div style={{ marginTop: 12 }}>
                    <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}> Filtros </Button>
                </div>
            
            )}

            {!isMobile && (
                <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 900 }} size="small" style={{ marginTop: 16 }} />
            )}

            {isMobile && (

                <div style={{ marginTop: 16 }}>
            
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhum processo encontrado</div>
                    ) : (

                        <>
                            
                            {data.map((record) => {

                                const situacaoLabel = STATUS_PROCESSO_OPTIONS.find(o => o.value === record.situacao)?.label || record.situacao || '-';
                                
                                return (
                                
                                <Card key={record.id} size="small" style={{ marginBottom: 8, borderRadius: 6, borderColor: record.prazoEmAberto ? '#ef4444' : undefined, borderWidth: record.prazoEmAberto ? 2 : undefined, }} styles={{ body: { padding: '8px 10px' } }}>
                            
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                
                                        <Typography.Text strong style={{ color: record.prazoEmAberto ? '#ef4444' : '#1a3a5c', fontSize: 13 }}>
                                            {record.numeroProcesso || 'Nº não informado'}
                                            {record.prazoEmAberto && <Tag color="red" style={{ fontSize: 9, marginLeft: 4 }}>Prazo aberto</Tag>}
                                        </Typography.Text>
                                
                                        <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c', padding: 0 }} size="small" />
                                
                                    </div>

                                    <Row gutter={[6, 4]}>
            
                                        <Col span={12}>
                                    
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Situação</Typography.Text>
                                    
                                            <div>
                                            
                                                <Tag color={getStatusColor(record.situacao)} style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}>
                                                    {situacaoLabel}
                                                </Tag>
                                    
                                            </div>
                            
                                        </Col>
                    
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Área</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.areaJuridica || '-'}</div>
                                        </Col>
                                    
                                    </Row>

                                    <Row gutter={[6, 4]}>
                    
                                        <Col span={24}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Cliente</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.clienteNome || '-'}</div>
                                        </Col>
                                
                                    </Row>

                                    <Row gutter={[6, 4]}>
                            
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Comarca</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.comarca || '-'}</div>
                                        </Col>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Prazo</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.dataPrazo ? dayjs(record.dataPrazo).format('DD/MM/YYYY') : '-'}</div>
                                        </Col>
        
                                    </Row>

                                    {record.honorarios && (

                                        <Row gutter={[6, 4]}>
                                        
                                            <Col span={24}>
                                
                                                <Typography.Text type="secondary" style={{ fontSize: 10 }}>Honorários</Typography.Text>
                                                
                                                <div style={{ fontSize: 11, fontWeight: 500, color: '#1a3a5c' }}>
                                                    R$ {record.honorarios.toLocaleString('pt-BR')}
                                                </div>
                                        
                                            </Col>
                                
                                        </Row>

                                    )}
                                
                                </Card>
                                );
                            })}

                            {pagination.total > 0 && (

                                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                                    <Button size="small" onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })} disabled={pagination.current === 1}> Anterior </Button>
                                    <span style={{ fontSize: 12 }}>{pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}</span>
                                    <Button size="small" onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })} disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}> Próxima </Button>
                                </div>
                            
                            )}

                        </>
                    )}
                </div>
            )}

            <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 'bold' }}>
                Exibindo {data.length} de {pagination.total} processo{pagination.total !== 1 ? 's' : ''}
            </div>
      
        </Card>

        <Drawer title={<span style={{ color: '#1a3a5c' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
            
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <Select placeholder="Situação" allowClear style={{ width: '100%' }} value={filtroSituacao} onChange={handleSituacaoChange} options={STATUS_PROCESSO_OPTIONS} />
                <Select placeholder="Prazo em aberto?" allowClear style={{ width: '100%' }} value={filtroPrazo} onChange={handlePrazoChange} options={[{ value: true, label: 'Sim' }, { value: false, label: 'Não' }]} />
                <Button onClick={() => { handleReset(); setFiltersDrawerOpen(false); }} style={{ width: '100%' }}> Limpar filtros </Button>
                <Button type="primary" onClick={() => setFiltersDrawerOpen(false)} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)', width: '100%' }}> Aplicar filtros </Button>
            </Space>
        
        </Drawer>

        <Modal title={!editingItem ? 'Novo processo' : (isEditMode ? 'Editar processo' : 'Visualizar processo')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 700} mask={{ closable: false }} style={{ top: 50 }} footer={
            
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                canEdit && ( <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Salvar </Button> )
            ].filter(Boolean) : isEditMode ? [
                
                <Button key="cancel" onClick={() => {
                    
                    setIsEditMode(false);
            
                    if (editingItem) {
    
                        form.setFieldsValue({
                            ...editingItem,
                            dataPrazo: editingItem.dataPrazo ? dayjs(editingItem.dataPrazo) : null,
                        });
    
                    }
                
                }}>Cancelar</Button>,
                
                canEdit && (<Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Salvar </Button> )
            
            ].filter(Boolean) : [
                canEdit && ( <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> <EditOutlined /> Editar informações </Button> ),
                canEdit && ( <Button key="delete" danger onClick={() => { Modal.confirm({ title: 'Excluir processo', content: 'Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: handleDelete, }); }}> <DeleteOutlined /> Excluir </Button>)
            ].filter(Boolean)}>
               
                <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="custom-tabs" />
                </Form>
            
        </Modal>

        <Modal title={editingMov ? 'Editar movimentação' : 'Nova movimentação'} open={movModalVisible} onOk={handleMovModalOk} onCancel={() => setMovModalVisible(false)} okButtonProps={{ style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' } }} width={500} mask={{ closable: false }}>
            
            <Form form={movForm} layout="vertical" size="small">
        
                <Form.Item name="data" label="Data" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                </Form.Item>
                
                <Form.Item name="descricao" label="Movimentação" rules={[{ required: true }]}>
                    <TextArea rows={4} size="small" />
                </Form.Item>
    
            </Form>

        </Modal>
    
    </div>
    );
}

export default ProcessoDiversoLista;