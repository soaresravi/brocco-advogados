import { useState, useEffect } from 'react';
import { Table, Input, Button, DatePicker, Space, Modal, Form, Select, Row, Col, Card, notification, Drawer, Typography, Tag, Checkbox, Spin } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import { getProvidencias, createProvidencia, updateProvidencia, deleteProvidencia, buscarClientesProvidencia, getUsuariosSimples } from '../../services/providenciaService';

import dayjs from 'dayjs';

const { TextArea } = Input;

const TIPO_PROVIDENCIA_OPTIONS = [
    { value: 'HABILITACAO_REVOGACAO', label: 'Habilitação/Revogação' },
    { value: 'ATESTADOS_TRABALHO', label: 'Atestados de Trabalho' },
    { value: 'ATESTADOS_ESTUDOS', label: 'Atestados de Estudos' },
    { value: 'CURSOS', label: 'Cursos' },
    { value: 'ENCCEJA', label: 'ENCCEJA' },
    { value: 'ENEM', label: 'ENEM' },
    { value: 'LEITURA', label: 'Leitura' },
    { value: 'DETRACAO', label: 'Detração' },
    { value: 'COMUTACAO', label: 'Comutação' },
    { value: 'INDULTO', label: 'Indulto' },
    { value: 'APROXIMACAO_FAMILIAR', label: 'Aproximação familiar' },
];

const STATUS_PROVIDENCIA_OPTIONS = [
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'EM_ANDAMENTO', label: 'Em andamento' },
    { value: 'CONCLUIDA', label: 'Concluída' },
];

function ProvidenciasLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(null);
    const [filtroClienteId, setFiltroClienteId] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [clientesOptions, setClientesOptions] = useState([]);
    const [clientesLoading, setClientesLoading] = useState(false);
    const [usuarios, setUsuarios] = useState([]);

    const [form] = Form.useForm();

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
    }, [pagination.current, pagination.pageSize, searchText, filtroStatus, filtroClienteId]);

    useEffect(() => {
    
        if (modalVisible && !editingItem) {
            buscarClientes('');
        }
    
    }, [modalVisible, editingItem]);

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

            const response = await getProvidencias(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                status: filtroStatus,
                clienteId: filtroClienteId,
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

    const buscarClientes = async (search = '') => {
       
        setClientesLoading(true);
       
        try {
            const response = await buscarClientesProvidencia(search);
            setClientesOptions(response.content || []);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setClientesLoading(false);
        }
    
    };

    const handleSearch = (e) => {
        setSearchText(e.target.value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleReset = () => {
        setSearchText('');
        setFiltroStatus(null);
        setFiltroClienteId(null);
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleStatusChange = (value) => {
        setFiltroStatus(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleViewDetails = (record) => {

        setEditingItem(record);
        setIsEditMode(false);
        setModalVisible(true);

        setTimeout(() => {
            
            form.setFieldsValue({
                ...record,
                clienteId: record.clienteId,
                dataAtendimento: record.dataAtendimento ? dayjs(record.dataAtendimento) : null,
                itens: record.itens || [],
                enviarParaId: record.enviarParaId,
                distribuirParaId: record.distribuirParaId,
            });

        }, 10);

    };

    const handleEnableEdit = () => setIsEditMode(true);

    const handleAdd = () => {
        setEditingItem(null);
        setIsEditMode(true);
        form.resetFields();
        setModalVisible(true);
    };

    const handleDelete = async () => {

        if (!editingItem) return;

        try {
            await deleteProvidencia(editingItem.id);
            showNotification('success', 'Providência excluída com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir providência');
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

    const handleModalOk = async () => {

        try {

            const values = await form.validateFields();
            setModalLoading(true);

            const dataToSend = {
                clienteId: values.clienteId,
                dataAtendimento: values.dataAtendimento ? values.dataAtendimento.format('YYYY-MM-DD') : null,
                itens: values.itens || [],
                observacoes: values.observacoes,
                enviarParaId: values.enviarParaId,
                distribuirParaId: values.distribuirParaId,
                status: values.status || 'PENDENTE',
            };

            if (editingItem) {
                await updateProvidencia(editingItem.id, dataToSend);
                showNotification('success', 'Providência atualizada com sucesso!');
            } else {
                await createProvidencia(dataToSend);
                showNotification('success', 'Providência criada com sucesso!');
            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar providência');
        } finally {
            setModalLoading(false);
        }

    };

    const columns = [
       
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: 'Cliente', dataIndex: 'clienteNome', width: 150 },
        { title: 'Matrícula SAP', dataIndex: 'clienteMatriculaSap', width: 120 },
        { title: 'Data', dataIndex: 'dataAtendimento', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
       
        { title: 'Status', dataIndex: 'status', width: 110, render: (text) => {
            const found = STATUS_PROVIDENCIA_OPTIONS.find(o => o.value === text);
            const color = text === 'PENDENTE' ? 'orange' : text === 'EM_ANDAMENTO' ? 'blue' : 'green';
            return <Tag color={color}>{found ? found.label : text}</Tag>;
        },},
        
        { title: 'Itens', dataIndex: 'itens', width: 150, render: (itens) => itens ? itens.length : 0 },
        
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c' }} />
        ),},
    
    ];

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>

        <Card size="small">
            
            {!isMobile && (
            
                <Row gutter={[12, 12]} justify="space-between" align="middle">
                
                    <Col xs={24} md={16}>
                
                        <Space wrap>
                            <Input placeholder="Buscar por cliente ou observação" value={searchText} onChange={handleSearch} style={{ width: 200 }} prefix={<SearchOutlined />} allowClear />
                            <Select placeholder="Status" allowClear style={{ width: 130 }} value={filtroStatus} onChange={(v) => { setFiltroStatus(v); setPagination((prev) => ({ ...prev, current: 1 })); }} options={STATUS_PROVIDENCIA_OPTIONS} />
                            <Button onClick={handleReset} icon={<ReloadOutlined />}> Limpar </Button>
                        </Space>
                
                    </Col>
                    
                    <Col>
                        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53' }} disabled={isReadOnly}> Nova providência </Button>
                    </Col>
                
                </Row>
            
            )}

            {isMobile && (
            
                <>
                    
                    <div style={{ marginBottom: 16 }}>
                
                        <Space orientation="vertical" style={{ width: '100%' }} size="small">
                            <Input placeholder="Buscar por cliente ou observação" value={searchText} onChange={handleSearch} style={{ width: '100%' }} prefix={<SearchOutlined />} allowClear />
                            <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}> Filtros </Button>
                            <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53', width: '100%' }} disabled={isReadOnly}> Nova providência </Button>
                        </Space>
                    
                    </div>
                
                    <Drawer title={<span style={{ color: '#1a3a5c' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
            
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Select placeholder="Status" allowClear style={{ width: '100%' }} value={filtroStatus} onChange={handleStatusChange} options={STATUS_PROVIDENCIA_OPTIONS} />
                            <Button onClick={() => { handleReset(); setFiltersDrawerOpen(false); }} style={{ width: '100%' }}> Limpar filtros </Button>
                            <Button type="primary" onClick={() => setFiltersDrawerOpen(false)} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)', width: '100%' }}> Aplicar filtros </Button>
                        </Space>
                    
                    </Drawer>
                
                </>
           
           )}

            {!isMobile && (
                <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 800 }} size="small" style={{ marginTop: 16 }} />
            )}

            {isMobile && (
            
                <div style={{ marginTop: 16 }}>
                    
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhuma providência encontrada</div>
                    ) : (
                        
                        <>
                    
                            {data.map((record) => (
                            
                                <Card key={record.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}>{record.clienteNome}</Typography.Text>
                                        <Tag color={record.status === 'PENDENTE' ? 'orange' : record.status === 'EM_ANDAMENTO' ? 'blue' : 'green'}> {STATUS_PROVIDENCIA_OPTIONS.find(o => o.value === record.status)?.label || record.status} </Tag>
                                    </div>
                                    
                                    <Row gutter={[6, 4]}>
                                
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Data</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.dataAtendimento ? dayjs(record.dataAtendimento).format('DD/MM/YYYY') : '-'}</div>
                                        </Col>
                
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Itens</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.itens ? record.itens.length : 0}</div>
                                        </Col>

                                    </Row>
                                    
                                    {record.observacoes && (
                                    
                                        <Row gutter={[6, 4]}>
                                            
                                            <Col span={24}>
                                                <Typography.Text type="secondary" style={{ fontSize: 10 }}>Observações</Typography.Text>
                                                <div style={{ fontSize: 11 }}>{record.observacoes}</div>
                                            </Col>
                            
                                        </Row>
                                        
                                    )}
                                
                                    <div style={{ marginTop: 8, textAlign: 'right' }}>
                                        <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c', padding: 0 }} size="small">Ver detalhes</Button>
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
                Total: {data.length} de {pagination.total} providência{pagination.total !== 1 ? 's' : ''}
            </div>
        
        </Card>

        <Modal title={!editingItem ? 'Nova providência' : (isEditMode ? 'Editar providência' : 'Visualizar providência')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 700} footer={
            
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                canEdit && <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>
            ].filter(Boolean) : isEditMode ? [
            
            <Button key="cancel" onClick={() => {
                
                setIsEditMode(false);
    
                if (editingItem) {
                    
                    form.setFieldsValue({
                        ...editingItem,
                        dataAtendimento: editingItem.dataAtendimento ? dayjs(editingItem.dataAtendimento) : null,
                    });
                
                }
    
            }}>Cancelar</Button>,
            canEdit && <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>
           
            ].filter(Boolean) : [ 
                canEdit && <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}><EditOutlined /> Editar informações</Button>,
                canEdit && <Button key="delete" danger onClick={() => { Modal.confirm({ title: 'Excluir providência', content: 'Tem certeza que deseja excluir esta providência?', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: handleDelete, }); }}><DeleteOutlined /> Excluir</Button>
            ].filter(Boolean)} closable={{ mask: false }} style={{ top: 50 }}>
               
                <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
               
                    {!editingItem ? (
                    
                        <Form.Item name="clienteId" label="Cliente" rules={[{ required: true, message: 'Selecione um cliente' }]}>
                            
                            <Select size="small" placeholder="Selecione um cliente" showSearch={{ filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()), onSearch: buscarClientes }} options={clientesOptions.map(c => ({ value: c.id, label: `${c.nome} ${c.matriculaSap ? `- ${c.matriculaSap}` : ''}`, }))} loading={clientesLoading} notFoundContent={clientesLoading ? 'Buscando...' : 'Digite para buscar clientes'} onFocus={() => {
                            
                                if (clientesOptions.length === 0) {
                                    buscarClientes('');
                                }
                        
                            }} disabled={isReadOnly} />
                        
                        </Form.Item>
                    
                    ) : (
                    
                        <div style={{ marginBottom: 16, padding: 8, background: '#f1f5f9', borderRadius: 6 }}>
                            <Typography.Text strong>Cliente: </Typography.Text>
                            <Typography.Text>{editingItem.clienteNome}</Typography.Text>
                            <Form.Item name="clienteId" hidden> <Input /> </Form.Item>
                        </div>
                    
                    )}

                    <Row gutter={16}>
                       
                        <Col span={12}>
                       
                            <Form.Item name="dataAtendimento" label="Data do atendimento" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                            </Form.Item>
                       
                        </Col>
                       
                        <Col span={12}>
                       
                            <Form.Item name="status" label="Status">
                                <Select size="small" options={STATUS_PROVIDENCIA_OPTIONS} />
                            </Form.Item>
                       
                        </Col>
                    
                    </Row>

                    <Form.Item name="itens" label="Itens da providência">
                        <Checkbox.Group options={TIPO_PROVIDENCIA_OPTIONS} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} />
                    </Form.Item>

                    <Form.Item name="observacoes" label="Observações">
                        <TextArea rows={3} size="small" />
                    </Form.Item>

                    <Row gutter={16}>
                      
                        <Col span={12}>
                      
                            <Form.Item name="enviarParaId" label="Enviar para (notificação)">
                                <Select size="small" placeholder="Selecione um usuário" options={usuarios.map(u => ({ value: u.id, label: u.nome }))} allowClear />
                            </Form.Item>
                      
                        </Col>
                      
                        <Col span={12}>
                      
                            <Form.Item name="distribuirParaId" label="Distribuir para (tarefa)">
                                <Select size="small" placeholder="Selecione um usuário" options={usuarios.map(u => ({ value: u.id, label: u.nome }))} allowClear />
                            </Form.Item>
                      
                        </Col>

                    </Row>

                </Form>
        </Modal>
    </div>
    );
}

export default ProvidenciasLista;