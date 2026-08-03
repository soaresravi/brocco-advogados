import { useState, useEffect } from "react";
import { Table, Input, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification, Drawer, Typography, Tag, message } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined, UserAddOutlined, CloseOutlined, PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';

import { getClientes, createCliente, updateCliente, deleteCliente } from '../../services/clienteService';
import { REGIME_PRISIONAL_OPTIONS, REU_STATUS_OPTIONS, COMO_CONHECEU_OPTIONS, SEXO_OPTIONS, UNIDADE_PRISIONAL_OPTIONS } from '../../constants/enums';

const { TextArea } = Input;

function ClienteLista() {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroRegime, setFiltroRegime] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const [form] = Form.useForm();

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroRegime]);

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

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getClientes(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                regime: filtroRegime,
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
        setFiltroRegime(null);
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleViewDetails = (record) => {

        setEditingItem(record);
        setIsEditMode(false);
        setModalVisible(true);

        setTimeout(() => {
           
            form.setFieldsValue({
            
                ...record,
                dataNascimento: record.dataNascimento ? dayjs(record.dataNascimento) : null,
            
                contratantes: record.contratantes?.map(c => ({
                    ...c,
                    _key: Date.now() + Math.random()
                })) || [{ _key: Date.now() }]
            
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
            contratantes: [{ _key: Date.now() }]
        });

        setModalVisible(true);

    };

    const handleDelete = async () => {

        if (!editingItem) return;

        try {
            await deleteCliente(editingItem.id);
            showNotification('success', 'Cliente excluído com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir cliente');
        }

    };

    const handleModalOk = async () => {

        try {

            const values = await form.validateFields();
            setModalLoading(true);

            const dataToSend = {
                ...values,
                dataNascimento: values.dataNascimento ? values.dataNascimento.format('YYYY-MM-DD') : null,
                contratantes: values.contratantes?.filter(c => c.nome && c.telefone) || [],
            };

            if (editingItem) {
                await updateCliente(editingItem.id, dataToSend);
                showNotification('success', 'Cliente atualizado com sucesso!');
            } else {
                await createCliente(dataToSend);
                showNotification('success', 'Cliente criado com sucesso!');
            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar cliente');
        } finally {
            setModalLoading(false);
        }

    };

    const handleCancelModal = () => {

        if (isEditMode || !editingItem) {

            const hasChanges = form.isFieldsTouched();
            
            if (hasChanges) {
                
                Modal.confirm({ title: 'Tem certeza?', content: 'As informações não salvas serão perdidas.', okText: 'Sim, fechar', cancelText: 'Não, continuar editando', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}, centered: true, onOk: () => {
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

        } else {
            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            form.resetFields();
        }

    };

    const columns = [
       
        { title: 'ID', dataIndex: 'id', width: 60 },
       
        { title: 'Nome', dataIndex: 'nome', render: (text, record) => (
            <Button type="link" style={{ padding: 0, color: '#1a3a5c' }} onClick={() => handleViewDetails(record)}> {text} </Button>
        ),},
        
        { title: 'CPF', dataIndex: 'cpf', width: 130 },
        { title: 'Matrícula SAP', dataIndex: 'matriculaSap', width: 120 },
        
        { title: 'Regime', dataIndex: 'regimePrisional', width: 130, render: (text) => {
            const found = REGIME_PRISIONAL_OPTIONS.find(o => o.value === text);
            return found ? found.label : text || '-';
        },},

        { title: 'Nº do processo', dataIndex: 'numeroProcesso', width: 150 },
        
        { title: 'Réu', dataIndex: 'reuStatus', width: 100, render: (text) => {
            const found = REU_STATUS_OPTIONS.find(o => o.value === text);
            return found ? found.label : text || '-';
        },},
       
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c' }} />
        ),},

    ];

    const FilterSection = () => (
    
        <>
            
            <Select placeholder="Regime prisional" allowClear style={{ width: isMobile ? '100%' : 150 }} value={filtroRegime} onChange={(value) => {
                setFiltroRegime(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
            }} options={REGIME_PRISIONAL_OPTIONS} />

        </>

    );

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Card size="small">
            
            <Row gutter={[12, 12]} justify="space-between" align="middle">
                
                <Col xs={24} md={16}>
                    
                    <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
                        <Input placeholder="Buscar por nome, matrícula, CPF ou processo" value={searchText} onChange={handleSearch} style={{ width: isMobile ? '100%' : 280 }} prefix={<SearchOutlined />} allowClear />    
                        {!isMobile && <FilterSection />}
                        <Button onClick={handleReset} icon={<ReloadOutlined />}> Limpar </Button>
                    </Space>
                
                </Col>
                
                <Col xs={24} md={8} style={{ textAlign: isMobile ? 'center' : 'right' }}>
                    <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53 !important', borderColor: '#131a53 !important', width: isMobile ? '100%' : 'auto', transition: 'all 0.3s ease' }} className="btn-novo-cliente">Novo cliente </Button>
                </Col>
            
            </Row>
            
            {isMobile && (
            
                <div style={{ marginTop: 12 }}>
                    <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}> Filtros </Button>
                </div>
            
            )}

            {!isMobile && (
                <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 800 }} size="small" style={{ marginTop: 16 }} />
            )}

            {isMobile && (
                
                <div style={{ marginTop: 16 }}>
                    
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhum cliente encontrado</div>
                    ) : (
                    
                        <>
                        
                            {data.map((record) => {
                            
                                const regimeLabel = REGIME_PRISIONAL_OPTIONS.find(o => o.value === record.regimePrisional)?.label || record.regimePrisional || '-';
                                const reuLabel = REU_STATUS_OPTIONS.find(o => o.value === record.reuStatus)?.label || record.reuStatus || '-';

                                return (
                                
                                <Card key={record.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}> {record.nome} </Typography.Text>
                                        <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c', padding: 0 }} size="small" />
                                    </div>
                                        
                                    <Row gutter={[6, 4]}>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>CPF</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.cpf || '-'}</div>
                                        </Col>
                                            
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Matrícula SAP</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.matriculaSap || '-'}</div>
                                        </Col>
                            
                                    </Row>

                                    <Row gutter={[6, 4]}>
                                
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Regime</Typography.Text>
                                            <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}> {regimeLabel} </Tag>
                                        </Col>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Réu</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{reuLabel}</div>
                                        </Col>
                        
                                    </Row>

                                    <Row gutter={[6, 4]}>
                                    
                                        <Col span={24}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Nº do processo</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{record.numeroProcesso || '-'}</div>
                                        </Col>
                                    
                                    </Row>
                                
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
                Total: {data.length} de {pagination.total} cliente{pagination.total !== 1 ? 's' : ''}
            </div>

        </Card>

        <Drawer title={<span style={{ color: '#1a3a5c' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
                
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            
                <Select placeholder="Regime prisional" allowClear style={{ width: '100%' }} value={filtroRegime} onChange={(value) => {
                    setFiltroRegime(value);
                    setPagination((prev) => ({ ...prev, current: 1 }));
                }} options={REGIME_PRISIONAL_OPTIONS} />
                    
                <Button onClick={() => {
                    handleReset();
                    setFiltersDrawerOpen(false);
                }} style={{ width: '100%' }}> Limpar filtros </Button>
                    
                <Button type="primary" onClick={() => setFiltersDrawerOpen(false)} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)', width: '100%' }}> Aplicar filtros </Button>
                
            </Space>

        </Drawer>

        <Modal title={!editingItem ? 'Novo cliente' : (isEditMode ? 'Editar cliente' : 'Visualizar cliente')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 700} footer={
                
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>,
            ] : isEditMode ? [
                    
                <Button key="cancel" onClick={() => {
                            
                    setIsEditMode(false);
                    
                    if (editingItem) {
                            
                        form.setFieldsValue({
                            ...editingItem,
                            dataNascimento: editingItem.dataNascimento ? dayjs(editingItem.dataNascimento) : null,
                            contratantes: editingItem.contratantes?.map(c => ({ ...c, _key: Date.now() + Math.random() })) || [{ _key: Date.now() }]
                        });
                            
                    }

                }}>Cancelar</Button>,
                    
                <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>,
                
            ] : [
                <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> <EditOutlined /> Editar informações </Button>,
                <Button key="delete" danger onClick={() => { Modal.confirm({ title: 'Excluir cliente', content: 'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: handleDelete, }); }}> <DeleteOutlined /> Excluir </Button>,
            ]

        } closable={{ mask: false }} style={{ top: 50 }}>
                
            <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                    
                <Row gutter={16}>
                        
                    <Col span={14}>
                        
                        <Form.Item name="nome" label="Nome" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                            <Input size="small" />
                        </Form.Item>
                        
                    </Col>
                        
                    <Col span={10}>
                            
                        <Form.Item name="cpf" label="CPF" style={{ marginBottom: 8 }}>
                            <Input size="small" />
                        </Form.Item>
                        
                    </Col>
                    
                </Row>
                    
                <Row gutter={16}>
                        
                    <Col span={8}>
                        
                        <Form.Item name="dataNascimento" label="Data nascimento" style={{ marginBottom: 8 }}>
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                        </Form.Item>
                        
                    </Col>
                        
                    <Col span={8}>
                            
                        <Form.Item name="sexo" label="Sexo" style={{ marginBottom: 8 }}>
                            <Select placeholder="Selecione" size="small" allowClear options={SEXO_OPTIONS} />
                        </Form.Item>
                        
                    </Col>
                        
                    <Col span={8}>
                        
                        <Form.Item name="matriculaSap" label="Matrícula SAP" style={{ marginBottom: 8 }}>
                            <Input size="small" />
                        </Form.Item>
                            
                    </Col>
                    
                </Row>
                    
                <Row gutter={16}>
                        
                    <Col span={8}>
                            
                        <Form.Item name="regimePrisional" label="Regime prisional" style={{ marginBottom: 8 }}>
                            <Select placeholder="Selecione" size="small" allowClear options={REGIME_PRISIONAL_OPTIONS} />
                        </Form.Item>
                            
                    </Col>
                        
                    <Col span={8}>
                            
                        <Form.Item name="unidadePrisional" label="Unidade prisional" style={{ marginBottom: 8 }}>
                            <Select placeholder="Selecione" size="small" showSearch={{ filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }} allowClear options={UNIDADE_PRISIONAL_OPTIONS} />
                        </Form.Item>
                        
                    </Col>
                        
                    <Col span={8}>
                            
                        <Form.Item name="numeroProcesso" label="Nº do processo" style={{ marginBottom: 8 }}>
                            <Input size="small" />
                        </Form.Item>
                            
                    </Col>
                    
                </Row>
                    
                <Row gutter={16}>
                        
                    <Col span={8}>
                            
                        <Form.Item name="reuStatus" label="Réu" style={{ marginBottom: 8 }}>
                            <Select placeholder="Selecione" size="small" allowClear options={REU_STATUS_OPTIONS} />
                        </Form.Item>
                            
                    </Col>
                        
                    <Col span={8}>
                            
                        <Form.Item name="comoConheceu" label="Como conheceu" style={{ marginBottom: 8 }}>
                            <Select placeholder="Selecione" size="small" allowClear options={COMO_CONHECEU_OPTIONS} />
                        </Form.Item>
                        
                    </Col>
                    
                </Row>
                    
                <Form.Item name="crimesAcaoPenal" label="Crime(s) objeto(s) da ação penal" style={{ marginBottom: 8 }}>
                    <TextArea rows={2} size="small" placeholder="Descreva o(s) crime(s)" />
                </Form.Item>

                <div style={{ marginTop: 12, marginBottom: 8 }}>
                    <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}> Dados para contratação </Typography.Text>
                </div>

                <Form.List name="contratantes">
                        
                    {(fields, { add, remove }) => (
                        
                        <>
                                
                            {fields.map(({ key, name, ...restField }) => (
                                    
                                <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                                        
                                    <Col span={7}>
                                            
                                        <Form.Item {...restField} name={[name, 'nome']} rules={[{ required: true, message: 'Nome obrigatório' }]} style={{ marginBottom: 0 }}>
                                            <Input placeholder="Nome" size="small" disabled={editingItem && !isEditMode} />
                                        </Form.Item>
                                        
                                    </Col>
                                        
                                    <Col span={7}>
                                        
                                        <Form.Item {...restField} name={[name, 'telefone']} rules={[{ required: true, message: 'Telefone obrigatório' }]} style={{ marginBottom: 0 }}>
                                            <Input placeholder="Telefone" size="small" disabled={editingItem && !isEditMode} />
                                        </Form.Item>

                                    </Col>

                                    <Col span={8}>
                                            
                                        <Form.Item {...restField} name={[name, 'grauParentesco']} style={{ marginBottom: 0 }}>
                                            <Input placeholder="Grau de parentesco" size="small" disabled={editingItem && !isEditMode} />
                                        </Form.Item>
                                        
                                    </Col>
                                        
                                    <Col span={2} style={{ textAlign: 'center' }}>
                                        
                                        {isEditMode && fields.length > 1 && (
                                            <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(name)} danger size="small" />
                                        )}

                                    </Col>

                                </Row>
                            ))}
                                
                            {isEditMode && (
                                <Button type="dashed"onClick={() => add()} icon={<PlusCircleOutlined />} size="small" style={{ width: '100%' }}> Adicionar contratante </Button>
                            )}

                        </>
                    )}
                </Form.List>

                <Form.Item name="observacoes" label="Observações" style={{ marginBottom: 8, marginTop: 8 }}>
                    <TextArea rows={3} size="small" disabled={editingItem && !isEditMode} />
                </Form.Item>

            </Form>
        </Modal>
    </div>
    );
}

export default ClienteLista;