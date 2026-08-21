import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Typography, Alert, Spin, Row, Col, Modal, Table, Upload, Select, Tag, DatePicker, notification } from 'antd';
import { WindowsOutlined, UserOutlined, PlusOutlined, ReloadOutlined, DownloadOutlined, CheckCircleOutlined, DisconnectOutlined, EditOutlined, UploadOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMicrosoftStatus, disconnectMicrosoft, getCurrentUser, updatePerfil, alterarSenha, getMicrosoftAuthUrl } from '../services/configService';
import { getUsuarios, criarUsuario, atualizarUsuario, deletarUsuario } from '../services/userService';
import { getLogs, limparLogs } from '../services/logService';

import api from '../api/api';
import dayjs from 'dayjs';

const { Text } = Typography;

function Configuracoes() {

    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [user, setUser] = useState(null);
    const [microsoftConnected, setMicrosoftConnected] = useState(false);
    const [microsoftEmail, setMicrosoftEmail] = useState('');
    const [microsoftLoading, setMicrosoftLoading] = useState(false);

    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsPagination, setLogsPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [filtroAcao, setFiltroAcao] = useState(null);
    const [filtroDataInicio, setFiltroDataInicio] = useState(null);
    const [filtroDataFim, setFiltroDataFim] = useState(null);

    const [usuarios, setUsuarios] = useState([]);
    const [usuariosLoading, setUsuariosLoading] = useState(false);
    const [usuariosPagination, setUsuariosPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [modalUsuarioVisible, setModalUsuarioVisible] = useState(false);
    const [modalUsuarioLoading, setModalUsuarioLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const [perfilForm] = Form.useForm();
    const [senhaForm] = Form.useForm();
    const [usuarioForm] = Form.useForm();

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = userData.permissao === 'ADMIN';

    const showNotification = (type, msg) => {

        notification[type]({
            message: null,
            description: msg,
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

        if (isAdmin) {
            carregarUsuarios();
            carregarLogs();
        }

    }, []);

    const carregarDados = async () => {

        setLoading(true);

        try {

            const [userData, microsoftStatus] = await Promise.all([
                getCurrentUser(),
                getMicrosoftStatus().catch(() => ({ connected: false, email: null }))
            ]);

            setMicrosoftConnected(microsoftStatus.connected);
            setMicrosoftEmail(microsoftStatus.email || '');

            perfilForm.setFieldsValue({
                nome: userData.nome,
                email: userData.email,
                nomeEscritorio: userData.nomeEscritorio
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }

    };

    const handleUpdatePerfil = async (values) => {

        setLoading(true);

        try {

            const response = await updatePerfil(values);
            await carregarDados();
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

            localStorage.setItem('user', JSON.stringify({
                ...storedUser,
                nome: response.user.nome,
                email: response.user.email,
                nomeEscritorio: response.user.nomeEscritorio
            }));

            window.dispatchEvent(new CustomEvent('user-updated'));
            showNotification('success', 'Perfil atualizado com sucesso!');

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }

    };

    const handleAlterarSenha = async (values) => {

        if (values.novaSenha !== values.confirmarSenha) {
            showNotification('error', 'As senhas não coincidem');
            return;
        }

        setLoading(true);

        try {

            await alterarSenha({
                senhaAtual: values.senhaAtual,
                novaSenha: values.novaSenha,
                confirmarSenha: values.confirmarSenha
            });

            senhaForm.resetFields();
            showNotification('success', 'Senha alterada com sucesso!');

        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao alterar senha');
        } finally {
            setLoading(false);
        }

    };

    const handleConnectMicrosoft = async () => {

        setMicrosoftLoading(true);

        try {

            const response = await getMicrosoftAuthUrl();
            const msWindow = window.open(response.url, '_blank');
            
            const interval = setInterval(() => {
                
                if (msWindow && msWindow.closed) {
                    clearInterval(interval);
                    carregarDados();
                    showNotification('success', 'Outlook conectado com sucesso!');
                }

            }, 500);

            setTimeout(() => clearInterval(interval), 300000);

        } catch (error) {
            showNotification('error', 'Erro ao conectar com Outlook');
        } finally {
            setMicrosoftLoading(false);
        }

    };

    const handleDisconnectMicrosoft = async () => {
        
        Modal.confirm({ title: 'Desconectar Outlook', content: 'Tem certeza que deseja desconectar sua conta do Outlook?', okText: 'Sim, desconectar', cancelText: 'Cancelar', centered: true, onOk: async () => {
            
            try {
                await disconnectMicrosoft();
                await carregarDados();
                showNotification('success', 'Outlook desconectado!');
            } catch (error) {
                showNotification('error', 'Erro ao desconectar');
            }

        }});

    };

    const carregarUsuarios = async (page = 0, size = 10) => {

        setUsuariosLoading(true);

        try {

            const response = await getUsuarios(page, size);
            setUsuarios(response.content || []);

            setUsuariosPagination({
                current: response.page + 1,
                pageSize: response.size,
                total: response.total,
            });

        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setUsuariosLoading(false);
        }

    };

    const handleNovoUsuario = () => {
        setIsEditMode(false);
        setEditingUser(null);
        usuarioForm.resetFields();
        usuarioForm.setFieldsValue({ permissao: 'EDIT' });
        setModalUsuarioVisible(true);
    };

    const handleEditarUsuario = (record) => {
       
        setIsEditMode(true);
        setEditingUser(record);
    
        usuarioForm.setFieldsValue({
            nome: record.nome,
            email: record.email,
            permissao: record.permissao === 'ADMIN' ? 'EDIT' : record.permissao,
            senha: '',
        });
    
        setModalUsuarioVisible(true);

    };
    
    const handleSalvarUsuario = async () => {
        // Separa validação de API — antd já marca os campos em vermelho
        let values;
        try {
            values = await usuarioForm.validateFields();
        } catch {
            return;
        }
    
        setModalUsuarioLoading(true);
        try {
            if (isEditMode && editingUser) {
                const dataToSend = {
                    nome: values.nome,
                    email: values.email,
                    permissao: values.permissao,
                };
                if (values.senha && values.senha.trim().length >= 6) {
                    dataToSend.senha = values.senha;
                }
                const updatedUser = await atualizarUsuario(editingUser.id, dataToSend);
                // Atualiza direto na lista sem re-fetch
                setUsuarios(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
                showNotification('success', 'Usuário atualizado com sucesso!');
            } else {
                const newUser = await criarUsuario(values);
                // Adiciona direto na lista sem re-fetch
                setUsuarios(prev => [...prev, newUser]);
                setUsuariosPagination(prev => ({ ...prev, total: prev.total + 1 }));
                showNotification('success', 'Usuário criado com sucesso!');
            }
            setModalUsuarioVisible(false);
        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Erro ao salvar usuário');
        } finally {
            setModalUsuarioLoading(false);
        }
    };
    const handleExcluirUsuario = (record) => {
        Modal.confirm({
            title: 'Excluir usuário',
            content: `Tem certeza que deseja excluir "${record.nome}"?`,
            okText: 'Sim, excluir',
            cancelText: 'Cancelar',
            centered: true,
            onOk: async () => {
                try {
                    await deletarUsuario(record.id);
                    setUsuarios(prev => prev.filter(u => u.id !== record.id));
                    setUsuariosPagination(prev => ({ ...prev, total: prev.total - 1 }));
                    showNotification('success', 'Usuário excluído com sucesso!');
                } catch (error) {
                    showNotification('error', error.response?.data?.message || 'Erro ao excluir usuário');
                }
            }
        });
    };

    const carregarLogs = async (page = 0, size = 10) => {

        setLogsLoading(true);

        try {

            const params = { page, size };
            if (filtroAcao) params.acao = filtroAcao;
            if (filtroDataInicio) params.dataInicio = filtroDataInicio.format('YYYY-MM-DD');
            if (filtroDataFim) params.dataFim = filtroDataFim.format('YYYY-MM-DD');

            const response = await getLogs(params);
            setLogs(response.content || []);

            setLogsPagination({
                current: response.page + 1,
                pageSize: response.size,
                total: response.total,
            });
            
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setLogsLoading(false);
        }
        
    };

    const handleLimparLogs = async () => {

        Modal.confirm({ title: 'Limpar logs antigos', content: 'Deseja remover logs com mais de 30 dias?', okText: 'Sim, limpar', cancelText: 'Cancelar', centered: true, onOk: async () => {
            
            try {
                await limparLogs(30);
                showNotification('success', 'Logs antigos removidos!');
                carregarLogs(0, logsPagination.pageSize);
            } catch (error) {
                showNotification('error', 'Erro ao limpar logs');
            }
        
        }});

    };

    const fazerBackup = async () => {

        setBackupLoading(true);

        try {

            const response = await api.get('/backup/download', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
           
            link.href = url;
            link.setAttribute('download', `backup_${dayjs().format('YYYYMMDD_HHmmss')}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
           
            showNotification('success', 'Backup gerado com sucesso!');
        
        } catch (error) {
            showNotification('error', 'Erro ao gerar backup');
        } finally {
            setBackupLoading(false);
        }

    };

    const restaurarBackup = async (file) => {
    
        setRestoreLoading(true);
        const formData = new FormData();
        formData.append('file', file);
    
        try {
         
            await api.post('/backup/restaurar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
         
            showNotification('success', 'Backup restaurado com sucesso!');
            setTimeout(() => window.location.reload(), 2000);
        
        } catch (error) {
            showNotification('error', 'Erro ao restaurar backup');
        } finally {
            setRestoreLoading(false);
        }
    
        return false;
    
    };

    const exportarCSV = async (entidade) => {
     
        try {
     
            const response = await api.get(`/backup/exportar/${entidade}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
            const link = document.createElement('a');
          
            link.href = url;
            link.setAttribute('download', `${entidade}_${dayjs().format('YYYY-MM-DD')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
          
            showNotification('success', `Exportação de ${entidade} concluída!`);
        
        } catch (error) {
            showNotification('error', 'Erro ao exportar dados');
        }

    };

    const handleDeleteConta = async () => {
      
        let senha = '';
      
        Modal.confirm({ title: 'Excluir conta permanentemente', icon: <ExclamationCircleOutlined />, content: (
        
            <div>
                <p style={{ color: 'red', fontWeight: 'bold' }}>ATENÇÃO: Esta ação é irreversível!</p>
                <p>Todos os seus dados serão permanentemente excluídos.</p>
                <p style={{ marginTop: 16 }}>Digite sua senha para confirmar:</p>
                <Input.Password placeholder="Sua senha" onChange={(e) => senha = e.target.value} />
            </div>
        
        ), okText: 'Sim, excluir minha conta', cancelText: 'Cancelar', okButtonProps: { danger: true }, centered: true, width: 500, onOk: async () => {
            
            if (!senha) {
                showNotification('error', 'Digite sua senha para confirmar');
                return;
            }
            
            try {
                await api.delete('/auth/conta', { data: { senha } });
                showNotification('success', 'Conta excluída com sucesso!');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => window.location.href = '/login', 2000);
            } catch (error) {
                showNotification('error', error.response?.data?.message || 'Erro ao excluir conta');
            }
        
        }});

    };

    if (loading && !user) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
    }

    return (
    
    <div style={{ padding: isMobile ? 8 : 16, maxWidth: 900, margin: '0 auto' }}>
            
        <Card title={<span style={{ color: '#1a3a5c' }}>Perfil</span>} style={{ marginBottom: 24 }}>
            
            <Form form={perfilForm} layout="vertical" onFinish={handleUpdatePerfil}>
        
                <Form.Item name="nome" label="Nome completo" rules={[{ required: true }]}>
                    <Input size="large" />
                </Form.Item>
                
                <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email' }]}>
                    <Input size="large" />
                </Form.Item>
    
                <Form.Item name="nomeEscritorio" label="Nome do escritório">
                    <Input size="large" />
                </Form.Item>
            
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Salvar alterações </Button>
                </Form.Item>
            
            </Form>
        
        </Card>

        <Card title={<span style={{ color: '#1a3a5c' }}>Segurança</span>} style={{ marginBottom: 24 }}>
    
            <Form form={senhaForm} layout="vertical" onFinish={handleAlterarSenha}>

                <Form.Item name="senhaAtual" label="Senha atual" rules={[{ required: true }]}>
                    <Input.Password size="large" />
                </Form.Item>
            
                <Form.Item name="novaSenha" label="Nova senha" rules={[{ required: true, min: 6 }]}>
                    <Input.Password size="large" />
                </Form.Item>
                
                <Form.Item name="confirmarSenha" label="Confirmar nova senha" rules={[{ required: true }]}>
                    <Input.Password size="large" />
                </Form.Item>
    
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Alterar senha </Button>
                </Form.Item>
            
            </Form>
        
        </Card>

        <Card title={<span style={{ color: '#1a3a5c' }}><WindowsOutlined /> Outlook Agenda</span>} style={{ marginBottom: 24 }}>
            
            {microsoftConnected ? (
                
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Alert title="Conectado" description={microsoftEmail && `Conta: ${microsoftEmail}`} type="success" icon={<CheckCircleOutlined />} showIcon />
                    <Button danger icon={<DisconnectOutlined />} onClick={handleDisconnectMicrosoft} loading={microsoftLoading}> Desconectar Outlook </Button>
                </Space>
            
            ) : (

                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Alert title="Não conectado" description="Conecte sua conta do Outlook para sincronizar automaticamente audiências e tarefas." type="warning" showIcon />
                    <Button type="primary" icon={<WindowsOutlined />} onClick={handleConnectMicrosoft} loading={microsoftLoading} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Conectar Outlook </Button>
                </Space>
            
            )}
        
        </Card>

        {isAdmin && (

            <Card title={<span style={{ color: '#1a3a5c' }}><UserOutlined /> Gerenciar usuários</span>} style={{ marginBottom: 24 }} extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleNovoUsuario} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)' }}> Novo usuário </Button>
            }>
                
                <Table dataSource={usuarios} rowKey="id" loading={usuariosLoading} pagination={usuariosPagination} onChange={(pagination) => carregarUsuarios(pagination.current - 1, pagination.pageSize)} size="small" scroll={{ x: isMobile ? 400 : undefined }} columns={[
                    
                    { title: 'Nome', dataIndex: 'nome' },
                    { title: 'E-mail', dataIndex: 'email' },
                    
                    { title: 'Permissão', dataIndex: 'permissao', render: (text) => {
                        const colors = { ADMIN: 'red', EDIT: 'blue', READ: 'green' };
                        const labels = { ADMIN: 'Administrador', EDIT: 'Edição', READ: 'Leitura' };
                        return <Tag color={colors[text] || 'default'}>{labels[text] || text}</Tag>;
                    }},
                    
                    { title: 'Ações', width: 120, render: (_, record) => (
                        
                        <Space>
                            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditarUsuario(record)} style={{ color: '#1a3a5c' }} />
                            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleExcluirUsuario(record)} />
                        </Space>
                    )}
                
                ]} />
            
            </Card>
        )}

        {isAdmin && (
            
            <Card title={<span style={{ color: '#1a3a5c' }}>Log de atividades</span>} style={{ marginBottom: 24 }}>
        
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
    
                    <Col xs={24} sm={8}>
                        
                        <Select placeholder="Ação" allowClear style={{ width: '100%' }} value={filtroAcao} onChange={(value) => { setFiltroAcao(value); carregarLogs(0, logsPagination.pageSize); }} options={[
                            { value: 'CREATE', label: 'Criação' },
                            { value: 'UPDATE', label: 'Atualização' },
                            { value: 'DELETE', label: 'Exclusão' },
                            { value: 'LOGIN', label: 'Login' },
                            { value: 'BACKUP_DOWNLOAD', label: 'Download Backup' },
                            { value: 'BACKUP_RESTORE', label: 'Restaurar Backup' },
                            { value: 'EXPORT', label: 'Exportação' },
                        ]} />
                    
                    </Col>
                
                    <Col xs={12} sm={6}>
                        <DatePicker placeholder="Data início" format="DD/MM/YYYY" style={{ width: '100%' }} onChange={(value) => { setFiltroDataInicio(value); carregarLogs(0, logsPagination.pageSize); }} />
                    </Col>
                
                    <Col xs={12} sm={6}>
                        <DatePicker placeholder="Data fim" format="DD/MM/YYYY" style={{ width: '100%' }} onChange={(value) => { setFiltroDataFim(value); carregarLogs(0, logsPagination.pageSize); }} />
                    </Col>
                
                    <Col xs={24} sm={4}>
                        <Button icon={<ReloadOutlined />} onClick={() => carregarLogs(0, logsPagination.pageSize)} style={{ width: '100%' }}> Atualizar </Button>
                    </Col>
                
                </Row>

                <Table dataSource={logs} rowKey="id" loading={logsLoading} pagination={logsPagination} onChange={(pagination) => carregarLogs(pagination.current - 1, pagination.pageSize)} size="small" scroll={{ x: isMobile ? 500 : undefined }} columns={[
                    { title: 'Data/Hora', dataIndex: 'createdAt', width: 160, render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm:ss') },
                    { title: 'Ação', dataIndex: 'acao', width: 100 },
                    { title: 'Entidade', dataIndex: 'entidade', width: 100 },
                    { title: 'Descrição', dataIndex: 'descricao', ellipsis: true },
                    { title: 'IP', dataIndex: 'ip', width: 120 },
                ]} />

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Button size="small" onClick={handleLimparLogs}> Limpar logs com mais de 30 dias </Button>
                </div>
            
            </Card>
        
        )}

        <Card title={<span style={{ color: '#1a3a5c' }}>Backup e restauração</span>} style={{ marginBottom: 24 }}>
    
            <Row gutter={[16, 16]}>

                <Col xs={24} sm={12} style={{ textAlign: 'center' }}>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={fazerBackup} loading={backupLoading} style={{ background: 'linear-gradient(135deg, #0d1239 0%, #131a53 100%)', width: isMobile ? '100%' : 'auto' }}> Baixar backup </Button>
                    <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Exporta todos os seus dados em um arquivo ZIP</p>
                </Col>
        
                <Col xs={24} sm={12} style={{ textAlign: 'center' }}>
                
                    <Upload accept=".zip" showUploadList={false} beforeUpload={restaurarBackup} customRequest={() => {}}>
                        <Button icon={<UploadOutlined />} style={{ borderColor: '#faad14', color: '#faad14', width: isMobile ? '100%' : 'auto' }} loading={restoreLoading}> Restaurar backup </Button>
                    </Upload>
                
                    <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}><strong>Cuidado:</strong> substitui dados atuais!</p>
            
                </Col>
        
            </Row>
    
        </Card>

        <Card title={<span style={{ color: '#1a3a5c' }}><FileTextOutlined /> Exportar dados (CSV)</span>} style={{ marginBottom: 24 }}>
            
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, justifyContent: 'center' }}>
                <Button icon={<FileTextOutlined />} onClick={() => exportarCSV('clientes')} style={{ width: isMobile ? '100%' : 'auto' }}> Clientes </Button>
                <Button icon={<FileTextOutlined />} onClick={() => exportarCSV('processos')} style={{ width: isMobile ? '100%' : 'auto' }}> Processos </Button>
                <Button icon={<FileTextOutlined />} onClick={() => exportarCSV('financeiro')} style={{ width: isMobile ? '100%' : 'auto' }}> Financeiro </Button>
            </div>
            
            <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Exporta os dados em formato CSV para abrir no Excel ou Google Sheets</Text>
            </div>

        </Card>

        <div style={{ backgroundColor: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8, padding: isMobile ? 12 : 16, textAlign: 'center' }}>
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteConta} size={isMobile ? 'middle' : 'large'} style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff', fontWeight: 'bold', width: isMobile ? '100%' : 'auto' }}> Excluir minha conta </Button>
            <p style={{ fontSize: isMobile ? 11 : 12, color: '#ff4d4f', marginTop: 12, marginBottom: 0, fontWeight: 500 }}> ATENÇÃO: Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos. </p>
        </div>

        <Modal title={isEditMode ? 'Editar usuário' : 'Novo usuário'} open={modalUsuarioVisible} onCancel={() => setModalUsuarioVisible(false)} onOk={handleSalvarUsuario} confirmLoading={modalUsuarioLoading} centered width={isMobile ? '90%' : 500}>
                
            <Form form={usuarioForm} layout="vertical" size="small">
                    
                <Form.Item name="nome" label="Nome" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                    
                    <Form.Item
  name="senha"
  label={isEditMode ? 'Nova senha (deixe em branco para não alterar)' : 'Senha'}
  rules={
    isEditMode
      ? [{ min: 6, message: 'Senha deve ter pelo menos 6 caracteres' }]
      : [
          { required: true, message: 'Por favor, insira a senha' },
          { min: 6, message: 'Senha deve ter pelo menos 6 caracteres' },
        ]
  }
>
  <Input.Password />
</Form.Item>

{!isEditMode && (
  <Form.Item
    name="confirmarSenha"
    label="Confirmar senha"
    rules={[{ required: true, message: 'Por favor, confirme a senha' }]}
  >
    <Input.Password />
  </Form.Item>
)}
                    
                <Form.Item name="permissao" label="Permissão" rules={[{ required: true }]}>
                    <Select options={[ { value: 'EDIT', label: 'Edição' }, { value: 'READ', label: 'Leitura' }, ]} />
                </Form.Item>
                    
                <Alert title="A permissão pode ser alterada a qualquer momento." type="info" showIcon style={{ marginTop: 8 }} />
                    
            </Form>
        </Modal>
        
    </div>
    );
}

export default Configuracoes;