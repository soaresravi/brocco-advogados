import { useState, useEffect } from 'react';
import { Table, Input, Drawer, Typography, Tag, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification, Tooltip, TimePicker, message } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined, WindowsOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';

import { getAtendimentos, createAtendimento, updateAtendimento, deleteAtendimento, getMicrosoftStatus, getMicrosoftAuthUrl } from '../../services/atendimentoService';
import { SIM_NAO_OPTIONS, COMO_CONHECEU_OPTIONS } from '../../constants/enums';

const { TextArea } = Input;

function AtendimentoLista() {
    
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroClienteNovo, setFiltroClienteNovo] = useState(null);
    const [filtroFechouContrato, setFiltroFechouContrato] = useState(null);
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
    }, [pagination.current, pagination.pageSize, searchText, filtroClienteNovo, filtroFechouContrato, filtroDataInicio, filtroDataFim]);

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getAtendimentos(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                clienteNovo: filtroClienteNovo,
                fechouContrato: filtroFechouContrato,
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
        setFiltroClienteNovo(null);
        setFiltroFechouContrato(null);
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
                data: record.data ? dayjs(record.data) : null,
                hora: record.hora ? dayjs(record.hora, 'HH:mm') : null,
                dataProximoContato: record.dataProximoContato ? dayjs(record.dataProximoContato) : null,
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
            await deleteAtendimento(editingItem.id);
            showNotification('success', 'Atendimento excluído com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir atendimento');
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

    const verificarMicrosoft = async () => {

        try {

            const microsoftStatus = await getMicrosoftStatus();

            if (!microsoftStatus.connected) {

                Modal.confirm({ title: 'Microsoft Outlook não conectado', content: 'Para sincronizar os eventos com sua agenda, você precisa conectar sua conta do Outlook. Deseja conectar agora?', okText: 'Sim, conectar', cancelText: 'Cancelar', centered: true, okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' } }, onOk: async () => {
                    const authUrlResponse = await getMicrosoftAuthUrl();
                    window.open(authUrlResponse.url, '_blank');
                    showNotification('info', 'Após conectar, clique novamente em Salvar');
                }, });

                return false;

            }

            return true;

        } catch (error) {
            showNotification('error', 'Erro ao verificar conexão com Outlook');
            return false;
        }

    };

    const handleModalOk = async () => {

        try {

            const values = await form.validateFields();
            setModalLoading(true);
            
            const microsoftOk = await verificarMicrosoft();

            if (!microsoftOk) {
                setModalLoading(false);
                return;
            }

            const dataToSend = {
                ...values,
                data: values.data ? values.data.format('YYYY-MM-DD') : null,
                hora: values.hora ? values.hora.format('HH:mm') : null,
                dataProximoContato: values.dataProximoContato ? values.dataProximoContato.format('YYYY-MM-DD') : null,
            };

            if (editingItem) {
                await updateAtendimento(editingItem.id, dataToSend);
                showNotification('success', 'Atendimento atualizado e sincronizado com Microsoft Outlook!');
            } else {
                await createAtendimento(dataToSend);
                showNotification('success', 'Atendimento criado e sincronizado com Microsoft Outlook!');
            }

            setModalVisible(false);
            setIsEditMode(false);
            setEditingItem(null);
            carregarDados();
        
        } catch (error) {

            if (error.response?.status === 498 && error.response?.data?.microsoftTokenExpirado) {
               
                Modal.confirm({ title: 'Microsoft Outlook desconectado', content: 'Seu token do Microsoft Outlook expirou. O registro foi salvo, mas não foi sincronizado. Deseja reconectar agora?', okText: 'Sim, reconectar', cancelText: 'Agora não', centered: true, okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' } }, onOk: async () => {
                    const authUrlResponse = await getMicrosoftAuthUrl();
                    window.open(authUrlResponse.url, '_blank');
                }, });
                
                setModalVisible(false);
                setIsEditMode(false);
                setEditingItem(null);
                carregarDados();
            
            } else {
                showNotification('error', error.response?.data?.message || 'Erro ao salvar atendimento');
            }
        
        } finally {
            setModalLoading(false);
        }

    };

    const handleClienteNovoChange = (value) => {
        setFiltroClienteNovo(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleFechouContratoChange = (value) => {
        setFiltroFechouContrato(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
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
        { title: 'Data', dataIndex: 'data', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Hora', dataIndex: 'hora', width: 80 },
        { title: 'Cliente', dataIndex: 'nome', width: 150 },
        { title: 'Assunto', dataIndex: 'assunto', ellipsis: true },
        { title: 'Telefone', dataIndex: 'telefone', width: 120 },
        { title: 'Valor', dataIndex: 'valorConsulta', width: 100, render: (value) => value ? `R$ ${value.toLocaleString('pt-BR')}` : '-' },
        
        { title: 'Outlook', width: 70, render: (_, record) => (
            
            record.microsoftEventId ? (
                <Tooltip title="Sincronizado com Microsoft Outlook"> <WindowsOutlined style={{ color: '#4285f4', fontSize: 16 }} /> </Tooltip>
            ) : (
                <Tooltip title="Não sincronizado"> <WindowsOutlined style={{ color: '#ccc', fontSize: 16 }} /> </Tooltip>
            )

        ), },
       
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
                            <Input placeholder="Buscar por nome, assunto ou telefone" value={searchText} onChange={handleSearch} style={{ width: 200 }} prefix={<SearchOutlined />} allowClear />
                            <Select placeholder="Cliente novo?" allowClear style={{ width: 120 }} value={filtroClienteNovo} onChange={(v) => { setFiltroClienteNovo(v); setPagination((prev) => ({ ...prev, current: 1 })); }} options={SIM_NAO_OPTIONS} />
                            <Select placeholder="Fechou contrato?" allowClear style={{ width: 130 }} value={filtroFechouContrato} onChange={(v) => { setFiltroFechouContrato(v); setPagination((prev) => ({ ...prev, current: 1 })); }} options={SIM_NAO_OPTIONS} />
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={(v) => { setFiltroDataInicio(v); setPagination((prev) => ({ ...prev, current: 1 })); }} size="small" />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={(v) => { setFiltroDataFim(v); setPagination((prev) => ({ ...prev, current: 1 })); }} size="small" />
                            <Button onClick={handleReset} icon={<ReloadOutlined />}> Limpar </Button>
                        </Space>

                    </Col>
                    
                    <Col>
                        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53' }} disabled={isReadOnly}> Novo atendimento </Button>
                    </Col>
                
                </Row>
            
            )}
            
            {isMobile && (
            
                <>
                    
                    <div style={{ marginBottom: 16 }}>
                
                        <Space orientation="vertical" style={{ width: '100%' }} size="small">
                            <Input placeholder="Buscar por nome, assunto ou telefone" value={searchText} onChange={handleSearch} style={{ width: '100%' }} prefix={<SearchOutlined />} allowClear />
                            <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}> Filtros </Button>
                            <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53', width: '100%' }} disabled={isReadOnly}> Novo atendimento </Button>
                        </Space>
                    
                    </div>
                
                    <Drawer title={<span style={{ color: '#1a3a5c' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
            
                        <Space orientation="vertical" style={{ width: '100%' }} size="middle">    
                            <Select placeholder="Cliente novo?" allowClear style={{ width: '100%' }} value={filtroClienteNovo} onChange={handleClienteNovoChange} options={SIM_NAO_OPTIONS} />
                            <Select placeholder="Fechou contrato?" allowClear style={{ width: '100%' }} value={filtroFechouContrato} onChange={handleFechouContratoChange} options={SIM_NAO_OPTIONS} />
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={handleDataInicioChange} size="small" style={{ width: '100%' }} />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={handleDataFimChange} size="small" style={{ width: '100%' }} />
                            <Button onClick={() => { handleReset(); setFiltersDrawerOpen(false); }} style={{ width: '100%' }}> Limpar filtros </Button>
                            <Button type="primary" onClick={() => setFiltersDrawerOpen(false)} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)', width: '100%' }}> Aplicar filtros </Button>
                        </Space>
                    
                    </Drawer>
                
                </>
            
            )}

            {!isMobile && (
                <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} onChange={(pagination) => setPagination({ ...pagination, current: pagination.current })} scroll={{ x: 900 }} size="small" style={{ marginTop: 16 }} />
            )}

            {isMobile && (
                
                <div style={{ marginTop: 16 }}>
            
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Carregando...</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhum atendimento encontrado</div>
                    ) : (
                    
                        <>
                            
                            {data.map((item) => (
                            
                                <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                
                                        <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}>{item.nome || 'Sem nome'}</Typography.Text>
                            
                                        <Tag color={item.microsoftEventId ? 'success' : 'default'} style={{ fontSize: 10, margin: 0, padding: '0px 6px', lineHeight: '18px' }}>
                                            {item.microsoftEventId ? <WindowsOutlined style={{ marginRight: 4 }} /> : null}
                                            {item.microsoftEventId ? 'Sinc.' : 'Não sinc.'}
                                        </Tag>
                                
                                    </div>
                            
                                    <Row gutter={[6, 4]}>
                                        
                                        <Col span={12}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Data/Hora</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.data ? dayjs(item.data).format('DD/MM/YYYY') : '-'} {item.hora || ''}</div>
                                        </Col>
                        
                                        <Col span={12}>
                    
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Valor</Typography.Text>
                
                                            <div style={{ fontSize: 11, fontWeight: 500, color: '#1a3a5c' }}>
                                                {item.valorConsulta ? `R$ ${item.valorConsulta.toLocaleString('pt-BR')}` : '-'}
                                            </div>
    
                                        </Col>

                                    </Row>
                                    
                                    <Row gutter={[6, 4]}>
                                        
                                        <Col span={24}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Assunto</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.assunto || '-'}</div>
                                        </Col>
                        
                                    </Row>
                    
                                    <Row gutter={[6, 4]}>
                                        
                                        <Col span={24}>
                                            <Typography.Text type="secondary" style={{ fontSize: 10 }}>Contato</Typography.Text>
                                            <div style={{ fontSize: 11 }}>{item.telefone || '-'} {item.email ? `| ${item.email}` : ''}</div>
                                        </Col>
                        
                                    </Row>
                    
                                    <div style={{ marginTop: 8, textAlign: 'right' }}>
                                        <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(item)} style={{ color: '#1a3a5c', padding: 0 }} size="small">Ver detalhes</Button>
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
                Total: {data.length} de {pagination.total} atendimento{pagination.total !== 1 ? 's' : ''}
            </div>

        </Card>

        <Modal title={!editingItem ? 'Novo atendimento' : (isEditMode ? 'Editar atendimento' : 'Visualizar atendimento')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 600} footer={
            
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                canEdit && <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>
            ].filter(Boolean) : isEditMode ? [
            
                <Button key="cancel" onClick={() => {
                    
                    setIsEditMode(false);
                    
                    if (editingItem) {
            
                        form.setFieldsValue({
                            ...editingItem,
                            data: editingItem.data ? dayjs(editingItem.data) : null,
                            hora: editingItem.hora ? dayjs(editingItem.hora, 'HH:mm') : null,
                            dataProximoContato: editingItem.dataProximoContato ? dayjs(editingItem.dataProximoContato) : null,
                        });
                    
                    }
                
                }}>Cancelar</Button>,
                
                canEdit && <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>
            
            ].filter(Boolean) : [
                
                canEdit && <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}><EditOutlined /> Editar informações</Button>,
        
                canEdit && <Button key="delete" danger onClick={() => {
                    Modal.confirm({ title: 'Excluir atendimento', content: 'Tem certeza que deseja excluir este atendimento?', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: handleDelete, });
                }}><DeleteOutlined /> Excluir</Button>
        
            ].filter(Boolean)} closable={{ mask: false }} style={{ top: 50 }}>
                
                <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
                
                    <Row gutter={16}>
                
                        <Col span={12}>
                            
                            <Form.Item name="data" label="Data" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                            </Form.Item>
                        </Col>
                        
                        <Col span={12}>
                        
                            <Form.Item name="hora" label="Hora">
                                <TimePicker style={{ width: '100%' }} format="HH:mm" size="small" placeholder="Selecione o horário" />
                            </Form.Item>
                        
                        </Col>
                    
                    </Row>
                    
                    <Row gutter={16}>
                    
                        <Col span={12}>
                    
                            <Form.Item name="clienteNovo" label="Cliente novo?">
                                <Select size="small" options={SIM_NAO_OPTIONS} />
                            </Form.Item>
                       
                        </Col>
                       
                        <Col span={12}>
                       
                            <Form.Item name="fechouContrato" label="Fechou contrato?">
                                <Select size="small" options={SIM_NAO_OPTIONS} />
                            </Form.Item>
                       
                        </Col>

                    </Row>
                  
                    <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
                        <Input size="small" />
                    </Form.Item>
                  
                    <Form.Item name="assunto" label="Assunto">
                        <Input size="small" />
                    </Form.Item>
                  
                    <Row gutter={16}>
                       
                        <Col span={12}>
                       
                            <Form.Item name="telefone" label="Telefone">
                                <Input size="small" />
                            </Form.Item>
                       
                        </Col>
                       
                        <Col span={12}>
                       
                            <Form.Item name="email" label="E-mail">
                                <Input type="email" size="small" />
                            </Form.Item>
                       
                        </Col>
                    
                    </Row>
                    
                    <Row gutter={16}>
                       
                        <Col span={12}>
                       
                            <Form.Item name="dataProximoContato" label="Próximo contato">
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                            </Form.Item>
                       
                        </Col>
                       
                        <Col span={12}>
                       
                            <Form.Item name="valorConsulta" label="Valor da consulta">
                                <Input type="number" size="small" step="0.01" />
                            </Form.Item>
                       
                        </Col>
                    
                    </Row>
                    
                    <Form.Item name="comoConheceu" label="Como conheceu">
                        <Select size="small" options={COMO_CONHECEU_OPTIONS} />
                    </Form.Item>
                  
                    <Form.Item name="observacoes" label="Observações">
                        <TextArea rows={3} size="small" />
                    </Form.Item>
                
                </Form>
        </Modal>
    
    </div>
    );
}

export default AtendimentoLista;