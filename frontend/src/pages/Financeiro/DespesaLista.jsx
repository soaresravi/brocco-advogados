import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Modal, Form, Select, Row, Col, Card, DatePicker, notification, Tooltip, Drawer, Typography, Tag } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';

import { getDespesas, createDespesa, updateDespesa, deleteDespesa, getDespesasAtrasados } from '../../services/financeiroService';
import { CATEGORIA_DESPESA_OPTIONS, SIM_NAO_OPTIONS } from '../../constants/enums';

const { TextArea } = Input;

function DespesaLista() {

    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState(null);
    const [filtroPago, setFiltroPago] = useState(null);
    const [filtroDataInicio, setFiltroDataInicio] = useState(null);
    const [filtroDataFim, setFiltroDataFim] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [isEditMode, setIsEditMode]  = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [atrasados, setAtrasados] = useState([]);

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
        carregarAtrasados();
    }, []);

    useEffect(() => {
        carregarDados();
    }, [pagination.current, pagination.pageSize, searchText, filtroCategoria, filtroPago, filtroDataInicio, filtroDataFim]);

    const carregarAtrasados = async () => {

        try {
            const response = await getDespesasAtrasados();
            setAtrasados(response);
        } catch (error) {
            console.error('Erro ao carregar atrasados:', error);
        }

    };

    const carregarDados = async () => {

        setLoading(true);

        try {

            const response = await getDespesas(pagination.current - 1, pagination.pageSize, {
                search: searchText || undefined,
                categoria: filtroCategoria,
                pago: filtroPago,
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
        setFiltroCategoria(null);
        setFiltroPago(null);
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
                dataPrevistaPagamento: record.dataPrevistaPagamento ? dayjs(record.dataPrevistaPagamento) : null,
                dataEfetivaPagamento: record.dataEfetivaPagamento ? dayjs(record.dataEfetivaPagamento) : null,
                pago: record.pago ? 'SIM' : 'NAO',
                categoria: record.categoria,
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
            await deleteDespesa(editingItem.id);
            showNotification('success', 'Despesa excluída com sucesso!');
            setModalVisible(false);
            setEditingItem(null);
            carregarDados();
            carregarAtrasados();
        } catch (error) {
            showNotification('error', 'Erro ao excluir despesa');
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
                ...values,
                pago: values.pago === 'SIM',
                dataPrevistaPagamento: values.dataPrevistaPagamento ? values.dataPrevistaPagamento.format('YYYY-MM-DD') : null,
                dataEfetivaPagamento: values.dataEfetivaPagamento ? values.dataEfetivaPagamento.format('YYYY-MM-DD') : null,
            };

            if (editingItem) {
                await updateDespesa(editingItem.id, dataToSend);
                showNotification('success', 'Despesa atualizada com sucesso!');
            } else {
                await createDespesa(dataToSend);
                showNotification('success', 'Despesa criada com sucesso!');
            }

            setModalVisible(false);
            setIsEditMode(null);
            carregarDados();
            carregarAtrasados();

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar despesa');
        } finally {
            setModalLoading(false);
        }

    };

    const columns = [
      
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: 'Data prevista', dataIndex: 'dataPrevistaPagamento', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Data do pagamento', dataIndex: 'dataEfetivaPagamento', width: 110, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Valor', dataIndex: 'valor', width: 100, render: (value) => value ? `R$ ${value.toLocaleString('pt-BR')}` : '-' },
      
        { title: 'Categoria', dataIndex: 'categoria', width: 120, render: (text) => {
            if (!text) return '-';
            const encontrado = CATEGORIA_DESPESA_OPTIONS.find(o => o.value === text);
            return encontrado ? encontrado.label : text;
        }},
        
        { title: 'Despesa', dataIndex: 'despesa', width: 150, ellipsis: true },
        { title: 'Pago?', dataIndex: 'pago', width: 90, render: (value) => value ? <Tag color="success">Sim</Tag> : <Tag color="error">Não</Tag> },
        
        { title: '', width: 60, fixed: 'right', render: (_, record) => (
            <Button type="link" icon={<MoreOutlined />} onClick={() => handleViewDetails(record)} style={{ color: '#1a3a5c' }} />
        ) },
    
    ];

    const totalDespesas = data.reduce((sum, item) => sum + (item.valor || 0), 0);

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>

        {atrasados.length > 0 && (
            
            <Card size="small" style={{ marginBottom: 16, borderColor: '#faad14' }}>
        
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ color: '#faad14' }}>Despesas atrasadas:</strong>
                    <span>{atrasados.length} pendente(s)</span>
                </div>
            
                {atrasados.slice(0, 3).map((item) => (
                    
                    <div key={item.id} style={{ fontSize: 12, marginTop: 4 }}>
                        R$ {item.valor?.toLocaleString('pt-BR')} - {item.categoria} - {item.despesa} (Atraso: {item.diasAtraso} dias)
                    </div>
                
                ))}
            
                {atrasados.length > 3 && <div style={{ fontSize: 12, marginTop: 4 }}>+{atrasados.length - 3} outros</div>}
        
            </Card>

        )}

        <Card size="small">
            
            {!isMobile && (

                <Row gutter={[12, 12]} justify="space-between" align="middle">
            
                    <Col xs={24} md={16}>
        
                        <Space wrap>
                            <Input placeholder="Buscar por despesa ou detalhes" value={searchText} onChange={handleSearch} style={{ width: 200 }} prefix={<SearchOutlined />} allowClear />
                            <Select placeholder="Categoria" allowClear style={{ width: 140 }} value={filtroCategoria} onChange={(value) => { setFiltroCategoria(value); setPagination((prev) => ({ ...prev, current: 1 })); }} options={CATEGORIA_DESPESA_OPTIONS} />
                            <Select placeholder="Pago?" allowClear style={{ width: 100 }} value={filtroPago} onChange={(value) => { setFiltroPago(value); setPagination((prev) => ({ ...prev, current: 1 })); }} options={SIM_NAO_OPTIONS} />
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={(value) => { setFiltroDataInicio(value); setPagination((prev) => ({ ...prev, current: 1 })); }} size="small" />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={(value) => { setFiltroDataFim(value); setPagination((prev) => ({ ...prev, current: 1 })); }} size="small" />
                            <Button onClick={handleReset} icon={<ReloadOutlined />}>Limpar</Button>
                        </Space>
        
                    </Col>
    
                    <Col>
                        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53' }} disabled={isReadOnly}>Nova despesa</Button>
                    </Col>
            
                </Row>
            
            )}

            {isMobile && (

                <>
            
                    <div style={{ marginBottom: 16 }}>
        
                        <Space orientation="vertical" style={{ width: '100%' }} size="small">
                            <Input placeholder="Buscar por despesa ou detalhes" value={searchText} onChange={handleSearch} style={{ width: '100%' }} prefix={<SearchOutlined />} allowClear />
                            <Button icon={<SearchOutlined />} onClick={() => setFiltersDrawerOpen(true)} style={{ width: '100%' }}>Filtros</Button>
                            <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />} style={{ background: '#131a53', borderColor: '#131a53', width: '100%' }} disabled={isReadOnly}>Nova despesa</Button>
                        </Space>
                    
                    </div>
                
                    <Drawer title={<span style={{ color: '#1a3a5c' }}>Filtros</span>} placement="bottom" onClose={() => setFiltersDrawerOpen(false)} open={filtersDrawerOpen} size="auto">
            
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Select placeholder="Categoria" allowClear style={{ width: '100%' }} value={filtroCategoria} onChange={(value) => { setFiltroCategoria(value); setPagination((prev) => ({ ...prev, current: 1 })); }} options={CATEGORIA_DESPESA_OPTIONS} />
                            <Select placeholder="Pago?" allowClear style={{ width: '100%' }} value={filtroPago} onChange={(value) => { setFiltroPago(value); setPagination((prev) => ({ ...prev, current: 1 })); }} options={SIM_NAO_OPTIONS} />
                            <DatePicker placeholder="Data do início" format="DD/MM/YYYY" onChange={(value) => { setFiltroDataInicio(value); setPagination((prev) => ({ ...prev, current: 1 })); }} size="small" style={{ width: '100%' }} />
                            <DatePicker placeholder="Data do fim" format="DD/MM/YYYY" onChange={(value) => { setFiltroDataFim(value); setPagination((prev) => ({ ...prev, current: 1 })); }} size="small" style={{ width: '100%' }} />
                            <Button onClick={() => { handleReset(); setFiltersDrawerOpen(false); }} style={{ width: '100%' }}>Limpar filtros</Button>
                            <Button type="primary" onClick={() => setFiltersDrawerOpen(false)} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)', width: '100%' }}>Aplicar filtros</Button>
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
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Nenhuma despesa encontrada</div>
                    ) : (

                        <>
                    
                            {data.map((item) => (

                                <Card key={item.id} size="small" style={{ marginBottom: 8, borderRadius: 6 }} styles={{ body: { padding: '8px 10px' } }}>
                            
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Typography.Text strong style={{ color: '#1a3a5c', fontSize: 13 }}>R$ {item.valor?.toLocaleString('pt-BR')}</Typography.Text>
                                        <Tag color={item.pago ? 'success' : 'error'} style={{ fontSize: 10, margin: 0 }}>{item.pago ? 'Pago' : 'Pendente'}</Tag>
                                    </div>
            
                                    <Row gutter={[6, 4]}>
                                        <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Categoria</Typography.Text><div style={{ fontSize: 11 }}>{CATEGORIA_DESPESA_OPTIONS.find(o => o.value === item.categoria)?.label || item.categoria || '-'}</div></Col>
                                        <Col span={12}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Data prevista</Typography.Text><div style={{ fontSize: 11 }}>{item.dataPrevistaPagamento ? dayjs(item.dataPrevistaPagamento).format('DD/MM/YYYY') : '-'}</div></Col>
                                    </Row>
                                
                                    <Row gutter={[6, 4]}>
                                        <Col span={24}><Typography.Text type="secondary" style={{ fontSize: 10 }}>Despesa</Typography.Text><div style={{ fontSize: 11 }}>{item.despesa || '-'}</div></Col>
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
                Total: {data.length} de {pagination.total} despesa{pagination.total !== 1 ? 's' : ''} | Valor total: R$ {totalDespesas.toLocaleString('pt-BR')}
            </div>

        </Card>

        <Modal title={!editingItem ? 'Nova despesa' : (isEditMode ? 'Editar despesa' : 'Visualizar despesa')} open={modalVisible} onCancel={handleCancelModal} width={isMobile ? '90%' : 600} footer={
            
            !editingItem ? [
                <Button key="cancel" onClick={handleCancelModal}>Cancelar</Button>,
                canEdit && <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>
            ].filter(Boolean) : isEditMode ? [
                <Button key="cancel" onClick={() => { setIsEditMode(false); if (editingItem) { form.setFieldsValue({ ...editingItem, dataPrevistaPagamento: editingItem.dataPrevistaPagamento ? dayjs(editingItem.dataPrevistaPagamento) : null, dataEfetivaPagamento: editingItem.dataEfetivaPagamento ? dayjs(editingItem.dataEfetivaPagamento) : null }); } }}>Cancelar</Button>,
                canEdit && <Button key="submit" type="primary" loading={modalLoading} onClick={handleModalOk} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}>Salvar</Button>
            ].filter(Boolean) : [
                canEdit && <Button key="edit" type="primary" onClick={handleEnableEdit} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}><EditOutlined /> Editar informações</Button>,
                canEdit && <Button key="delete" danger onClick={() => { Modal.confirm({ title: 'Excluir despesa', content: 'Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.', okText: 'Sim, excluir', cancelText: 'Não, cancelar', okButtonProps: { style: { background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }, danger: true }, centered: true, onOk: handleDelete }); }}><DeleteOutlined /> Excluir</Button>
            ].filter(Boolean)} mask={{ closable: false }} style={{ top: 50 }}>
            
                <Form form={form} layout="vertical" size="small" disabled={editingItem && !isEditMode}>
            
                    <Row gutter={16}>
            
                        <Col span={12}>
            
                            <Form.Item name="dataPrevistaPagamento" label="Data prevista">
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                            </Form.Item>
            
                        </Col>
            
                        <Col span={12}>
            
                            <Form.Item name="dataEfetivaPagamento" label="Data do pagamento">
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="small" />
                            </Form.Item>

                        </Col>

                    </Row>
                    
                    <Row gutter={16}>
                    
                        <Col span={12}>
                    
                            <Form.Item name="valor" label="Valor" rules={[{ required: true }]}>
                                <Input type="number" size="small" step="0.01" />
                            </Form.Item>
                    
                        </Col>
                    
                        <Col span={12}>
                    
                            <Form.Item name="categoria" label="Categoria" rules={[{ required: true }]}>
                                <Select placeholder="Selecione" allowClear showSearch={{ optionFilterProp: "label" }} size="small" options={CATEGORIA_DESPESA_OPTIONS} />
                            </Form.Item>
                    
                        </Col>
                    
                    </Row>
                    
                    <Row gutter={16}>
                    
                        <Col span={12}>
                    
                            <Form.Item name="pago" label="Pago?">
                                <Select size="small" options={SIM_NAO_OPTIONS} />
                            </Form.Item>
                    
                        </Col>
                    
                        <Col span={12}>
                    
                            <Form.Item name="despesa" label="Despesa">
                                <Input size="small" />
                            </Form.Item>
                    
                        </Col>
                    
                    </Row>
                    
                    <Form.Item name="detalhes" label="Detalhes">
                        <TextArea rows={3} size="small" />
                    </Form.Item>

                </Form>
        </Modal>
        
    </div>
    );
}

export default DespesaLista;