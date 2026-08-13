import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification, Tooltip, Drawer, Typography, Tag } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined, GoogleOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';

import { getTarefas, createTarefa, updateTarefa, deleteTarefa, getProcessosOptions, getClientesOptions, getUsuariosSimples, getGoogleStatus, getGoogleAuthUrl } from '../../services/tarefaService';
import { STATUS_TAREFA_OPTIONS, URGENCIA_TAREFA_OPTIONS } from '../../constants/enums';

const { TextArea } = Input;

function TarefaLista() {

    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(null);
    const [filtroUrgencia, setFiltroUrgencia] = useState(null);
    const [filtroResponsavel, setFiltroResponsavel] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [processosOptions, setProcessosOptions] = useState([]);
    const [clientesOptions, setClientesOptions] = useState([]);
    const [usuariosOptions, setUsuariosOptions] = useState([]);

    const [form] = Form.useForm();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canEdit = user.permissao === 'ADMIN' || user.permissao === 'EDIT';
    const isReadOnly = !canEdit;

    const showNotification =  (type, message) => {

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
        carregarOpcoes();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroStatus, filtroUrgencia, filtroResponsavel]);

    const carregarOpcoes = async () => {

        try {

            const [processos, clientes, usuarios] = await Promise.all([
                getProcessosOptions(), getClientesOptions(), getUsuariosSimples(),
            ]);

            setProcessosOptions(processos.map(p => ({ value: p.id, label: `${p.numeroProcesso} - ${p.clienteNome || 'Sem cliente'}` })));
            setClientesOptions(clientes.map(c => ({ value: c.id, label: c.nome })));

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const usuarioLogado = { id: user.id, nome: `${user.nome} (Eu)` };
            const opcoes = [ usuarioLogado, ...usuarios.filter(u => u.id !== user.id)];

            setUsuariosOptions(opcoes.map(u => ({ value: u.id, label: u.nome })));

        } catch (error) {
            console.error('Erro ao carregar opções:', error);
        }

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getTarefas(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                status: filtroStatus,
                urgencia: filtroUrgencia,
                responsavelId: filtroResponsavel,
            });

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

    const handleSearch = (e) => {
        setSearchText(e.target.value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleReset = () => {
        setSearchText('');
        setFiltroStatus(null);
        setFiltroUrgencia(null);
        setFiltroResponsavel(null);
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleStatusChange = (value) => {
        setFiltroStatus(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleUrgenciaChange = (value) => {
        setFiltroUrgencia(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleResponsavelChange = (value) => {
        setFiltroResponsavel(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleViewDetails = (record) => {

        setEditingItem(record);
        setIsEditMode(false);
        setModalVisible(true);

        setTimeout(() => {
            
            form.setFieldsValue({
                ...record,
                status: record.status,
                urgencia: record.urgencia,
                prazo: record.prazo ? dayjs(record.prazo) : null,
                responsavelId: record.responsavelId,
                processoId: record.processoId,
                clienteId: record.clienteId,
            });

        }, 10);

    };

    const handleEnableEdit = () => {
        setIsEditMode(true);
    };

    const handleAdd = () => {

        setEditingItem(null);
        setIsEditMode(true);
        form.resetFields();

        form.setFieldsValue({
            status: 'NAO_INICIADA',
        });

        setModalVisible(true);

    };

    const handleDelete = async () => {

        if (!editingItem) return;

        try {
            await deleteTarefa(editingItem.id);
            showNotification('success', 'Tarefa excluída com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir tarefa');
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

    const verificarGoogle = async () => {

        try {

            const googleStatus = await getGoogleStatus();

            if (!googleStatus.connected) {

                Modal.confirm({ title: 'Google Agenda não conectado', content: 'Para sincronizar as tarefas com sua agenda, você precisa conectar sua conta do Google. Deseja conectar agora?', okText: 'Sim, conectar', cancelText: 'Cancelar', centered: true, okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' } }, onOk: async () => {
                    const authUrlResponse = await getGoogleAuthUrl();
                    window.open(authUrlResponse.url, '_blank');
                    showNotification('info', 'Após conectar, clique novamente em Salvar');
                }, });

                return false;

            }

            return true;
            
        } catch (error) {
            showNotification('error', 'Erro ao verificar conexão com Google');
            return false;
        }

    };

    const handleModalOk = async () => {

        try {

            const values = await form.validateFields();
            setModalLoading(true);

            const googleOk = await verificarGoogle();

            if (!googleOk) {
                setModalLoading(false);
                return;
            }

            const clienteSelecionado = clientesOptions.find(c => c.value === values.clienteId);
            const processoSelecionado = processosOptions.find(p => p.value === values.processoId);

            const dataToSend = {
                ...values,
                status: values.status,
                urgencia: values.urgencia,
                prazo: values.prazo ? values.prazo.format('YYYY-MM-DD') : null,
                clienteNome: clienteSelecionado?.label || null,
                processoNumero: processoSelecionado ? processoSelecionado.label.split(' - ')[0] : null,
            };

            if (editingItem) {
                await updateTarefa(editingItem.id, dataToSend);
                showNotification('success', 'Tarefa atualizada e sincronizada com Google Agenda!');
            } else {
                await createTarefa(dataToSend);
                showNotification('success', 'Tarefa criada e sincronizada com Google Agenda!');
            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();

        } catch (error) {

            if (error.response?.status === 401 && error.response?.data?.googleTokenExpirado) {
            
                Modal.confirm({ title: 'Google Agenda desconectado', content: 'Seu token do Google Agenda expirou. O registro foi salvo, mas não foi sincronizado. Deseja reconectar agora?', okText: 'Sim, reconectar', cancelText: 'Agora não', centered: true, okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' } }, onOk: async () => {
                    const authUrlResponse = await getGoogleAuthUrl();
                    window.open(authUrlResponse.url, '_blank');
                }, });

                setModalVisible(false);
                setIsEditMode(false);
                setEditingItem(null);
                carregarDados();
          
            } else {
                showNotification('error', error.response?.data?.message || 'Erro ao salvar');
            }

        } finally {
            setModalLoading(false);
        }

    };

    const columns = [
        
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: 'Tarefa', dataIndex: 'tarefa', ellipsis: true },
    
        { title: 'Status', dataIndex: 'status', width: 120, render: (text) => {
    
            if (!text) return '-';
    
            const encontrado = STATUS_TAREFA_OPTIONS.find(o => o.value === text);
            const label = encontrado ? encontrado.label : text;
            
            let color = 'default';
        
            if (text === 'CONCLUIDA') color = 'success';
            if (text === 'EM_ANDAMENTO') color = 'processing';
            
            return <Tag color={color}>{label}</Tag>;
       
        },},

        { title: 'Urgência', dataIndex: 'urgencia', width: 140, render: (text) => {
            
            if (!text) return '-';
        
            const encontrado = URGENCIA_TAREFA_OPTIONS.find(o => o.value === text);
            const label = encontrado ? encontrado.label : text;

            let color = 'default';
            
            if (text === 'EXIGE_ATENCAO_IMEDIATA') color = 'error';
            if (text === 'MUITO_URGENTE') color = 'warning';
            if (text === 'REQUER_ATENCAO') color = 'orange';
            if (text === 'POUCO_URGENTE') color = 'success';
            
            return <Tag color={color}>{label}</Tag>;
        
        },},

        { title: 'Prazo', dataIndex: 'prazo', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Responsável', dataIndex: 'responsavelNome', width: 120, render: (text) => text || '-' },
        { title: 'Cliente', dataIndex: 'clienteNome', width: 150, render: (text) => text || '-' },
        { title: 'Processo', dataIndex: 'processoNumero', width: 150, render: (text) => text || '-' },
       
        { title: 'Google', width: 70, render: (_, record) => (
            
            record.googleEventId ? (
                <Tooltip title="Sincronizado com Google Agenda"> <GoogleOutlined style={{ color: '#4285f4', fontSize: 16 }} /> </Tooltip>
            ) : (
                <Tooltip title="Não sincronizado"> <GoogleOutlined style={{ color: '#ccc', fontSize: 16 }} /> </Tooltip>
            )

        ),},

        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c' }} />
        ), },

    ];

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Card size="small">
            
            {!isMobile && (
                
                <Row gutter={[12, 12]} justify="space-between" align="middle">
            
                    <Col xs={24} md={16}>
        
                        <Space wrap>
                            <Input placeholder="Buscar por tarefa, cliente ou processo" value={searchText} onChange={handleSearch} style={{ width: 220 }} prefix={<SearchOutlined />} allowClear />
                            <Select placeholder="Status" allowClear style={{ width: 120 }} value={filtroStatus} onChange={handleStatusChange} options={STATUS_TAREFA_OPTIONS} />
                            <Select placeholder="Urgência" allowClear style={{ width: 140 }} value={filtroUrgencia} onChange={handleUrgenciaChange} options={URGENCIA_TAREFA_OPTIONS} />
                            <Select placeholder="Responsável" allowClear style={{ width: 140 }} value={filtroResponsavel} onChange={handleResponsavelChange} options={usuariosOptions} />
                            <Button onClick={handleReset} icon={<ReloadOutlined />}> Limpar </Button>
                        </Space>
    
                    </Col>
                    
                    <Col>
                        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53' }} disabled={isReadOnly}> Nova tarefa </Button>
                    </Col>
                
                </Row>
            
            )}
            
            {isMobile && (
                
                <>
            
                    <div style={{ marginBottom: 16 }}>
                        
                        <Space orientation="vertical" style={{ width: '100%' }} size="small">
                            <Input placeholder="Buscar por tarefa, cliente ou processo" value={searchText} onChange={handleSearch} style={{ width: '100%' }} prefix={<SearchOutlined />} allowClear />
                            <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}> Filtros </Button>
                            <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53', width: '100%' }} disabled={isReadOnly}> Nova tarefa </Button>
                        </Space>
                    
                    </div>
                
                    <Drawer title={<span style={{ color: '#1a3a5c' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
                
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Select placeholder="Status" allowClear style={{ width: '100%' }} value={filtroStatus} onChange={handleStatusChange} options={STATUS_TAREFA_OPTIONS} />
                            <Select placeholder="Urgência" allowClear style={{ width: '100%' }} value={filtroUrgencia} onChange={handleUrgenciaChange} options={URGENCIA_TAREFA_OPTIONS} />
                            <Select placeholder="Responsável" allowClear style={{ width: '100%' }} value={filtroResponsavel} onChange={handleResponsavelChange} options={usuariosOptions} />
                            <Button onClick={() => { handleReset(); setFiltersDrawerOpen(false); }} style={{ width: '100%' }}> Limpar filtros </Button>
                            <Button type="primary" onClick={() => setFiltersDrawerOpen(false)} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)', width: '100%' }}> Aplicar filtros </Button>
                        </Space>
                
                    </Drawer>

                </>

            )}

            {!isMobile && (
                <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 1100 }} size="small" style={{ marginTop: 16 }} />
            )}
            
            {isMobile && (
            
                <div style={{ marginTop: 16 }}>
                    
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhuma tarefa encontrada</div>
                    ) : (
                    
                        <>
                            
                            {data.map((item) => {
                                
                                let statusColor = 'default';
                                if (item.status === 'CONCLUIDA') statusColor = 'success';
                                if (item.status === 'EM_ANDAMENTO') statusColor = 'processing';
                                
                                const statusLabel = STATUS_TAREFA_OPTIONS.find(o => o.value === item.status)?.label || item.status || '-';
                                
                                let urgenciaColor = '#d9d9d9';
                                if (item.urgencia === 'EXIGE_ATENCAO_IMEDIATA') urgenciaColor = '#ff4d4f';
                                else if (item.urgencia === 'MUITO_URGENTE') urgenciaColor = '#ff7a45';
                                else if (item.urgencia === 'REQUER_ATENCAO') urgenciaColor = '#faad14';
                                else if (item.urgencia === 'POUCO_URGENTE') urgenciaColor = '#52c41a';
                                
                                const urgenciaLabel = URGENCIA_TAREFA_OPTIONS.find(o => o.value === item.urgencia)?.label || item.urgencia || '-';

                                return (
                                
                                <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6, borderLeft: `4px solid ${urgenciaColor}` }} styles={{ body: { padding: '8px 10px' } }}>
                        
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        
                                        <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}>{item.tarefa || 'Sem título'}</Typography.Text>
                                        <Tag color={statusColor} style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}>{statusLabel}</Tag>
                                
                                        <Tag color={item.googleEventId ? 'success' : 'default'} style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}>
                                            {item.googleEventId ? <GoogleOutlined style={{ marginRight: 4 }} /> : null}
                                            {item.googleEventId ? 'Sinc.' : 'Não sinc.'}
                                        </Tag>
                                
                                    </div>
                        
                                    <Row gutter={[6, 4]}>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Prazo</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.prazo ? dayjs(item.prazo).format('DD/MM/YYYY') : '-'}</div>
                                        </Col>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Urgência</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{urgenciaLabel}</div>
                                        </Col>
                                    
                                    </Row>
                            
                                    <Row gutter={[6, 4]}>
                    
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Responsável</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.responsavelNome || '-'}</div>
                                        </Col>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Cliente</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.clienteNome || '-'}</div>
                                        </Col>
                            
                                    </Row>
                    
                                    <Row gutter={[6, 4]}>
                                        
                                        <Col span={24}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Processo</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.processoNumero || '-'}</div>
                                        </Col>
        
                                    </Row>

                                    <div style={{ marginTop: 8, textAlign: 'right' }}>
                                        <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(item)} style={{ color: '#1a3a5c', padding: 0 }} size="small">Ver detalhes</Button>
                                    </div>
                        
                                </Card>
                                );
                            })}
                            
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
                Total: {data.length} de {pagination.total} tarefa{pagination.total !== 1 ? 's' : ''}
            </div>

        </Card>

        <Modal title={!editingItem ? 'Nova tarefa' : (isEditMode ? 'Editar tarefa' : 'Visualizar tarefa')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 700} footer={
            
            !editingItem ? [
                
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
        
                canEdit && (
                    <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Salvar </Button>
                )
        
            ].filter(Boolean) : isEditMode ? [
            
            <Button key="cancel" onClick={() => {
                
                setIsEditMode(false);
                
                if (editingItem) {
                    form.setFieldsValue({
                        ...editingItem,
                        prazo: editingItem.prazo ? dayjs(editingItem.prazo) : null,
                    });
                }
                
            }}>Cancelar</Button>,
            
            canEdit && (
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Salvar </Button>
            )
        
            ].filter(Boolean) : [
                
            canEdit && (
                <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> <EditOutlined /> Editar informações </Button>
            ),
            
            canEdit && (
                <Button key="delete" danger onClick={() => { Modal.confirm({ title: 'Excluir tarefa', content: 'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: handleDelete, }); }}> <DeleteOutlined /> Excluir </Button>
            )
            
            ].filter(Boolean)} mask={{ closable: false }} style={{ top: 50 }}>
                
                <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                
                    <Form.Item name="tarefa" label="Tarefa" rules={[{ required: true }]}>
                        <Input size="small" />
                    </Form.Item>
                
                    <Row gutter={16}>
                
                        <Col span={12}>
                           
                            <Form.Item name="status" label="Status">
                                <Select size="small" options={STATUS_TAREFA_OPTIONS} />
                            </Form.Item>
                        
                        </Col>
                        
                        <Col span={12}>
                        
                            <Form.Item name="urgencia" label="Urgência">
                                <Select size="small" options={URGENCIA_TAREFA_OPTIONS} />
                            </Form.Item>
                        
                        </Col>
                    
                    </Row>

                    <Row gutter={16}>
                
                        <Col span={12}>
                           
                            <Form.Item name="prazo" label="Prazo">
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                            </Form.Item>
                        
                        </Col>
                        
                        <Col span={12}>
                        
                            <Form.Item name="responsavelId" label="Responsável">
                                <Select size="small" showSearch={{ optionFilterProp: "label" }} placeholder="Selecione o responsável" options={usuariosOptions} />
                            </Form.Item>
                        
                        </Col>
                    
                    </Row>

                    <Row gutter={16}>
                
                        <Col span={12}>
                           
                            <Form.Item name="processoId" label="Nº do Processo">
                                <Select size="small" showSearch={{ optionFilterProp: "label" }} placeholder="Selecione o processo" options={processosOptions} loading={processosOptions.length === 0} />
                            </Form.Item>
                        
                        </Col>
                        
                        <Col span={12}>
                        
                            <Form.Item name="clienteId" label="Cliente">
                                <Select size="small" showSearch={{ optionFilterProp: "label" }} placeholder="Selecione o cliente" options={clientesOptions} loading={clientesOptions.length === 0} />
                            </Form.Item>
                        
                        </Col>
                    
                    </Row>

                    <Form.Item name="andamento" label="Andamento">
                        <TextArea rows={4} size="small" placeholder="Digite aqui o andamento da tarefa..." />
                    </Form.Item>
            
            </Form>
        </Modal>
    
    </div>
    );
}

export default TarefaLista;