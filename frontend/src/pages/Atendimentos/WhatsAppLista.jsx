import { useState, useEffect } from 'react';
import { Table, Input, Drawer, Typography, Button, Space, Modal, Form, Row, Col, Card, DatePicker, notification } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';
import { getWhatsAppContatos, createWhatsAppContato, updateWhatsAppContato, deleteWhatsAppContato } from '../../services/whatsappService';

const { TextArea } = Input;

function WhatsAppLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroDataInicio, setFiltroDataInicio] = useState(null);
    const [filtroDataFim, setFiltroDataFim] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

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
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroDataInicio, filtroDataFim]);

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getWhatsAppContatos(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                dataInicio: filtroDataInicio ? filtroDataInicio.format('YYYY-MM-DD') : undefined,
                dataFim: filtroDataFim ? filtroDataFim.format('YYYY-MM-DD') : undefined,
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
        setFiltroDataInicio(null);
        setFiltroDataFim(null);
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleViewDetails = (record) => {

        setEditingItem(record);
        setIsEditMode(false);
        setModalVisible(true);

        setTimeout(() => {
           
            form.setFieldsValue({
                ...record,
                dataContato: record.dataContato ? dayjs(record.dataContato) : null,
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
            await deleteWhatsAppContato(editingItem.id);
            showNotification('success', 'Contato excluído com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir contato');
        }

    };

    const handleCancelModal = () => {

        if (isEditMode && editingItem) {
            
            Modal.confirm({ title: 'Tem certeza?', content: 'As informações não salvas serão perdidas.', okText: 'Sim, fechar', cancelText: 'Não, continuar editando', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' } }, centered: true, onOk: () => {
                setModalVisible(false);
                setIsEditMode(false);
                setEditingItem(null);
                form.resetFields();
            },});

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
                ...values,
                dataContato: values.dataContato ? values.dataContato.format('YYYY-MM-DD') : null,
            };

            if (editingItem) {
                await updateWhatsAppContato(editingItem.id, dataToSend);
                showNotification('success', 'Contato atualizado com sucesso!');
            } else {
                await createWhatsAppContato(dataToSend);
                showNotification('success', 'Contato criado com sucesso!');
            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar contato');
        } finally {
            setModalLoading(false);
        }

    };

    const handleDataInicioChange = (value) => {
        setFiltroDataInicio(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleDataFimChange = (value) => {
        setFiltroDataFim(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const columns = [
       
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: 'Data', dataIndex: 'dataContato', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Nome', dataIndex: 'nome', width: 150 },
        { title: 'Telefone', dataIndex: 'telefone', width: 130 },
        { title: 'Assunto', dataIndex: 'assunto', ellipsis: true },
        
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
                            <Input placeholder="Buscar por nome, telefone ou assunto" value={searchText} onChange={handleSearch} style={{ width: 200 }} prefix={<SearchOutlined />} allowClear />
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={(v) => { setFiltroDataInicio(v); setPagination((prev) => ({ ...prev, current: 1 })); }} size="small" />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={(v) => { setFiltroDataFim(v); setPagination((prev) => ({ ...prev, current: 1 })); }} size="small" />
                            <Button onClick={handleReset} icon={<ReloadOutlined />}> Limpar </Button>
                        </Space>
                    
                    </Col>
                
                    <Col>
                        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53' }} disabled={isReadOnly}> Novo contato </Button>
                    </Col>
                
                </Row>
            
            )}

            {isMobile && (
                
                <>
                    
                    <div style={{ marginBottom: 16 }}>
                
                        <Space orientation="vertical" style={{ width: '100%' }} size="small">
                            <Input placeholder="Buscar por nome, telefone ou assunto" value={searchText} onChange={handleSearch} style={{ width: '100%' }} prefix={<SearchOutlined />} allowClear />
                            <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}> Filtros </Button>
                            <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53', width: '100%' }} disabled={isReadOnly}> Novo contato </Button>
                        </Space>
                    
                    </div>
                
                    <Drawer title={<span style={{ color: '#1a3a5c' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
                        
                        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={handleDataInicioChange} size="small" style={{ width: '100%' }} />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={handleDataFimChange} size="small" style={{ width: '100%' }} />
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
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhum contato encontrado</div>
                    ) : (
                        
                        <>
                            
                            {data.map((record) => (
                            
                                <Card key={record.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}>{record.nome}</Typography.Text>
                                        <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c', padding: 0 }} size="small" />
                                    </div>
                    
                                    <Row gutter={[6, 4]}>
                
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Data</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.dataContato ? dayjs(record.dataContato).format('DD/MM/YYYY') : '-'}</div>
                                        </Col>

                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Telefone</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.telefone || '-'}</div>
                                        </Col>
                                
                                    </Row>
                            
                                    <Row gutter={[6, 4]}>
                        
                                        <Col span={24}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Assunto</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.assunto || '-'}</div>
                                        </Col>
        
                                    </Row>
    
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
                Total: {data.length} de {pagination.total} contato{pagination.total !== 1 ? 's' : ''}
            </div>

        </Card>

        <Modal title={!editingItem ? 'Novo contato' : (isEditMode ? 'Editar contato' : 'Visualizar contato')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 500} footer={
            
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                canEdit && <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>
            ].filter(Boolean) : isEditMode ? [
                
                <Button key="cancel" onClick={() => {
                    
                    setIsEditMode(false);
                    
                    if (editingItem) {
            
                        form.setFieldsValue({
                            ...editingItem,
                            dataContato: editingItem.dataContato ? dayjs(editingItem.dataContato) : null,
                        });
                    
                    }
            
                }}>Cancelar</Button>,
                canEdit && <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>
            
            ].filter(Boolean) : [    
                canEdit && <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}><EditOutlined /> Editar informações</Button>,
                canEdit && <Button key="delete" danger onClick={() => { Modal.confirm({ title: 'Excluir contato', content: 'Tem certeza que deseja excluir este contato?', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: handleDelete, }); }}><DeleteOutlined /> Excluir</Button>
            ].filter(Boolean)} closable={{ mask: false }} style={{ top: 50 }}>
                
                <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                    
                    <Form.Item name="dataContato" label="Data do contato" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                    </Form.Item>
                    
                    <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
                        <Input size="small" />
                    </Form.Item>
                    
                    <Form.Item name="telefone" label="Telefone" rules={[{ required: true }]}>
                        <Input size="small" />
                    </Form.Item>
                    
                    <Form.Item name="assunto" label="Assunto">
                        <TextArea rows={3} size="small" />
                    </Form.Item>
                
                </Form>
            
            </Modal>
    </div>
    );
}

export default WhatsAppLista;