import { useState, useEffect, useRef } from 'react';
import { Card, Tabs, Tag, Button, Space, Typography, Empty, Spin, Input, Avatar, Badge, Modal, message, Tooltip } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, MessageOutlined, SendOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';

import { getNotificacoes, marcarTodasNotificacoesComoLidas, marcarNotificacaoComoLida, deletarNotificacao, limparNotificacoesAntigas, getConversas, getMensagens, enviarMensagem, getUsuariosSimples, getContadorNotificacoes } from '../services/notificacaoService';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function NotificacoesChat() {

    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeTab, setActiveTab] = useState('notificacoes');

    const [notificacoes, setNotificacoes] = useState([]);
    const [notificacoesPagination, setNotificacoesPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [naoLidas, setNaoLidas] = useState(0);
    const [notificacoesLoading, setNotificacoesLoading] = useState(false);

    const [conversas, setConversas] = useState([]);
    const [conversaSelecionada, setConversaSelecionada] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [mensagemInput, setMensagemInput] = useState('');
    const [mensagensLoading, setMensagensLoading] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [ws, setWs] = useState(null);

    const mensagensEndRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        carregarUsuarios();
        carregarNotificacoes();
        carregarConversas();
        carregarContadorNaoLidas();
    }, []);

    useEffect(() => {

        if (mensagensEndRef.current) {
            mensagensEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }

    }, [mensagens]);

    useEffect(() => {

        if (!user.id) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/chat/${user.id}`;
        const socket = new WebSocket(wsUrl);
        
        setWs(socket);

        socket.onopen = () => {
            console.log('Websocket conectado');
        };

        socket.onmessage = (event) => {

            try {

                const data = JSON.parse(event.data);

                if (conversaSelecionada && data.remetenteId === conversaSelecionada.usuarioId) {
                    setMensagens(prev => [...prev, data]);
                }

                carregarContadorNaoLidas();
                carregarConversas();

            } catch (error) {
                console.error('Erro ao processar mensagem WebSocket:', error);
            }

        };

        socket.onclose = () => {
            console.log('WebSocket desconectado');
        };

        socket.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
        };

        return () => {

            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }

        };

    }, [user.id, conversaSelecionada]);

    const carregarUsuarios = async () => {

        try {

            const response = await getUsuariosSimples();
            const userLogado = JSON.parse(localStorage.getItem('user') || '{}');
            const outrosUsuarios = response.filter(u => u.id !== userLogado.id);
            const usuariosMap = {};

            outrosUsuarios.forEach(u => {
                usuariosMap[u.id] = u;
            });

            setUsuarios(usuariosMap);

        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }

    };

    const carregarNotificacoes = async (page = 0) => {

        setNotificacoesLoading(true);

        try {

            const response = await getNotificacoes(page, notificacoesPagination.pageSize);
            setNotificacoes(response.content || []);

            setNotificacoesPagination({
                ...notificacoesPagination,
                total: response.total,
                current: response.page + 1,
            });

        } catch (error) {
            message.error('Erro ao carregar notificações');
        } finally {
            setNotificacoesLoading(false);
        }

    };

    const carregarContadorNaoLidas = async () => {

        try {
            const response = await getContadorNotificacoes();
            setNaoLidas(response.naoLidas || 0);
        } catch (error) {
            console.error('Erro ao carregar contador:', error);
        }

    };

    const marcarComoLida = async (id) => {
       
        try {
    
            await marcarNotificacaoComoLida(id);
    
            setNotificacoes(prev => prev.map(n => 
                n.id === id ? { ...n, lida: true } : n
            ));
    
            carregarContadorNaoLidas();

        } catch (error) {
            message.error('Erro ao marcar como lida');
        }

    };

    const marcarTodasComoLidas = async () => {

        try {
            await marcarTodasNotificacoesComoLidas();
            setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
            setNaoLidas(0);
            message.success('Todas as notificações marcadas como lidas');
        } catch (error) {
            message.error('Erro ao marcar todas como lidas');
        }

    };

    const deletarNotificacaoHandler = async (id) => {
        
        Modal.confirm({ title: 'Excluir notificação', content: 'Tem certeza que deseja excluir esta notificação?', okText: 'Sim, excluir', cancelText: 'Cancelar', centered: true, onOk: async () => {
            
            try {
                await deletarNotificacao(id);
                setNotificacoes(prev => prev.filter(n => n.id !== id));
                carregarContadorNaoLidas();
                message.success('Notificação excluída');
            } catch (error) {
                message.error('Erro ao excluir notificação');
            }
        }});

    };

    const limparAntigas = async () => {

        Modal.confirm({ title: 'Limpar notificações antigas', content: 'Tem certeza que deseja excluir todas as notificações com mais de 30 dias?', okText: 'Sim, limpar', cancelText: 'Cancelar', centered: true, onOk: async () => {
            
            try {
                await limparNotificacoesAntigas(30);
                carregarNotificacoes(0);
                carregarContadorNaoLidas();
                message.success('Notificações antigas removidas');
            } catch (error) {
                message.error('Erro ao limpar notificações');
            }

        }});

    };

    const formatarHoraMensagem = (data) => {
       
        const agora = dayjs();
        const momento = dayjs(data);
        
        if (momento.isSame(agora, 'day')) {
            return momento.format('HH:mm');
        }
        
        if (momento.isSame(agora.subtract(1, 'day'), 'day')) {
            return `Ontem ${momento.format('HH:mm')}`;
        }
        
        if (momento.isAfter(agora.subtract(7, 'day'))) {
            return momento.format('dddd HH:mm');
        }

        return momento.format('DD/MM/YYYY HH:mm');

    };

    const getTipoIcon = (tipo) => {
        
        const icons = {
            'LAPSO_PROGRESSAO': <WarningOutlined style={{ color: '#ef4444' }} />,
            'PROVIDENCIA': <InfoCircleOutlined style={{ color: '#3b82f6' }} />,
            'TAREFA_PENDENTE': <ClockCircleOutlined style={{ color: '#eab308' }} />,
            'OBSERVACAO': <MessageOutlined style={{ color: '#8b5cf6' }} />,
            'PENDENCIA_ADMINISTRATIVA': <WarningOutlined style={{ color: '#f59e0b' }} />,
            'PENDENCIA_FINANCEIRA': <WarningOutlined style={{ color: '#ef4444' }} />,
        };
        
        return icons[tipo] || <BellOutlined />;
    
    };

    const getTipoCor = (tipo) => {
       
        const cores = {
            'LAPSO_PROGRESSAO': 'error',
            'PROVIDENCIA': 'processing',
            'TAREFA_PENDENTE': 'warning',
            'OBSERVACAO': 'purple',
            'PENDENCIA_ADMINISTRATIVA': 'orange',
            'PENDENCIA_FINANCEIRA': 'error',
        };
       
        return cores[tipo] || 'default';
    
    };

    const getTipoLabel = (tipo) => {
    
        const labels = {
            'LAPSO_PROGRESSAO': 'Lapso de progressão',
            'PROVIDENCIA': 'Providência',
            'TAREFA_PENDENTE': 'Tarefa pendente',
            'OBSERVACAO': 'Observação',
            'PENDENCIA_ADMINISTRATIVA': 'Pendência administrativa',
            'PENDENCIA_FINANCEIRA': 'Pendência financeira',
            'MENSAGEM': 'Mensagem',
            'ALERTA': 'Alerta',
        };

        return labels[tipo] || tipo;

    };

    const carregarConversas = async () => {

        try {
            const response = await getConversas();
            setConversas(response || []);
        } catch (error) {
            console.error('Erro ao carregar conversas:', error);
        }

    };

    const carregarMensagens = async (usuarioId) => {

        setMensagensLoading(true);

        try {
            const response = await getMensagens(usuarioId, 0, 50);
            setMensagens(response.content || []);
            setConversas(prev => prev.map(c => c.usuarioId === usuarioId ? { ...c, naoLidas: 0 } : c ));
        } catch (error) {
            message.error('Erro ao carregar mensagens');
        } finally {
            setMensagensLoading(false);
        }

    };

    const selecionarConversa = (usuarioId) => {

        const conversa = conversas.find(c => c.usuarioId === usuarioId);
        setConversaSelecionada(conversa || null);

        if (usuarioId) {
            carregarMensagens(usuarioId);
        }

    };
    const handleEnviarMensagem = async () => {
      
        if (!mensagemInput.trim() || !conversaSelecionada) return;
        setEnviando(true);
    
        try {
           
            const conteudo = mensagemInput.trim();
            setMensagemInput('');

            const mensagemSalva = await enviarMensagem(conversaSelecionada.usuarioId, conteudo);

            if (ws && ws.readyState === WebSocket.OPEN) {
               
                ws.send(JSON.stringify({
                    destinatarioId: conversaSelecionada.usuarioId,
                    conteudo,
                    notifyOnly: true
                }));

            }
    
            setMensagens(prev => [...prev, mensagemSalva]);
            setConversas(prev => prev.map(c => c.usuarioId === conversaSelecionada.usuarioId ? { ...c, ultimaMensagem: conteudo, ultimaData: new Date().toISOString() } : c));
    
        } catch (error) {
            message.error('Erro ao enviar mensagem');
        } finally {
            setEnviando(false);
        }

    };

    const handleKeyPress = (e) => {

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEnviarMensagem();
        }

    };

    const excluirConversa = (usuarioId) => {
        
        Modal.confirm({ title: 'Excluir conversa', content: 'Tem certeza que deseja excluir toda a conversa?', okText: 'Sim, excluir', cancelText: 'Cancelar', centered: true, onOk: async () => {
            
            try {
        
                await deletarConversa(usuarioId);
                setConversas(prev => prev.filter(c => c.usuarioId !== usuarioId));

                if (conversaSelecionada?.usuarioId === usuarioId) {
                    setConversaSelecionada(null);
                    setMensagens([]);
                }
        
                message.success('Conversa excluída');
    
            } catch (error) {
                message.error('Erro ao excluir conversa');
            }
        
        }});

    };

    const renderNotificacoes = () => (
    
    <div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            
            <Space>
                <BellOutlined style={{ fontSize: 20, color: '#1a3a5c' }} />
                <Title level={5} style={{ margin: 0, color: '#1a3a5c' }}> Notificações {naoLidas > 0 && <Tag color="red">{naoLidas} não lidas</Tag>} </Title>
            </Space>
        
            <Space wrap>
                {naoLidas > 0 && (<Button size="small" onClick={marcarTodasComoLidas} icon={<CheckOutlined />}> Marcar todas como lidas </Button>)}
                <Button size="small" onClick={limparAntigas} icon={<DeleteOutlined />}> Limpar antigas </Button>
                <Button size="small" onClick={() => carregarNotificacoes(0)} icon={<ReloadOutlined />}> Atualizar </Button>
            </Space>
        
        </div>
    
        <Spin spinning={notificacoesLoading}>
            
            {notificacoes.length === 0 ? (
                <Empty description="Nenhuma notificação" />
            ) : (
                
                <div>
            
                    {notificacoes.map((item) => {

                        const actions = [];
    
                        if (!item.lida) {
                            actions.push(<Tooltip title="Marcar como lida" key="marcar"> <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} onClick={(e) => { e.stopPropagation(); marcarComoLida(item.id); }} /> </Tooltip>);
                        }
    
                        actions.push(<Tooltip title="Excluir" key="excluir"> <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 16 }} onClick={(e) => { e.stopPropagation(); deletarNotificacaoHandler(item.id); }}/> </Tooltip>);
    
                        return (
                        
                        <div key={item.id} style={{ background: item.lida ? 'transparent' : '#f0f7ff', borderRadius: 8, padding: '12px 16px', marginBottom: 8, border: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', }} onClick={() => !item.lida && marcarComoLida(item.id)}>
                            
                            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    
                                <div style={{ fontSize: 20, display: 'flex', alignItems: 'center' }}>
                                    {getTipoIcon(item.tipo)}
                                </div>
                    
                                <div style={{ flex: 1 }}>
            
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <Text strong>{item.titulo}</Text>
                                        <Tag color={getTipoCor(item.tipo)}> {getTipoLabel(item.tipo)} </Tag>
                                        {!item.lida && <Tag color="processing">Nova</Tag>}
                                    </div>
                                    
                                    <div>
                                        
                                        <Text>{item.mensagem}</Text> <br />
                                        
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {item.remetenteNome && `De: ${item.remetenteNome} • `}
                                            {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                        </Text>
                                        
                                    </div>
                                    
                                </div>
                                
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {actions}
                            </div>
                        
                        </div>
                        );
                    
                    })}
    
                    {notificacoesPagination.total > notificacoesPagination.pageSize && (

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                            <Button size="small" onClick={() => carregarNotificacoes(notificacoesPagination.current - 2)} disabled={notificacoesPagination.current === 1}> Anterior </Button>
                            <span style={{ fontSize: 12 }}> {notificacoesPagination.current} / {Math.ceil(notificacoesPagination.total / notificacoesPagination.pageSize)} </span>
                            <Button size="small" onClick={() => carregarNotificacoes(notificacoesPagination.current)} disabled={notificacoesPagination.current >= Math.ceil(notificacoesPagination.total / notificacoesPagination.pageSize)}> Próxima </Button>
                        </div>
                    
                    )}
                
                </div>
            )}
        </Spin>
    </div>
    );

    const renderChat = () => (
    
    <div style={{ display: 'flex', height: isMobile ? 'calc(100vh - 200px)' : 500 }}>
        
        <div style={{ width: isMobile ? '100%' : 280, borderRight: isMobile ? 'none' : '1px solid #f0f0f0', overflowY: 'auto', display: isMobile && conversaSelecionada ? 'none' : 'block' }}>
            
            <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
                <Title level={5} style={{ margin: 0, color: '#1a3a5c' }}> <MessageOutlined /> Conversas </Title>
            </div>
            
            {conversas.length === 0 ? (
                <Empty description="Nenhuma conversa" />
            ) : (
            
                <div>
                    
                    {conversas.map((item) => {
                        
                        const usuario = usuarios[item.usuarioId] || { nome: 'Usuário' };
                        
                        return (
                        
                        <div key={item.usuarioId} style={{ cursor: 'pointer', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: conversaSelecionada?.usuarioId === item.usuarioId ? '#f0f7ff' : 'transparent', borderLeft: conversaSelecionada?.usuarioId === item.usuarioId ? '3px solid #131a53' : '3px solid transparent', }} onClick={() => selecionarConversa(item.usuarioId)}>
                            
                            <div style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'center' }}>
                                
                                <Avatar icon={<UserOutlined />} style={{ background: '#131a53' }} />
                                
                                <div style={{ flex: 1 }}>
                               
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text strong>{usuario.nome}</Text>
                                        {item.naoLidas > 0 && <Badge count={item.naoLidas} />}
                                    </div>
                                    
                                    <div>
                                        <Text ellipsis style={{ fontSize: 12, color: '#8c8c8c' }}> {item.ultimaMensagem || 'Nenhuma mensagem ainda'} </Text>                      
                                        {item.ultimaData && (<span style={{ fontSize: 10, color: '#aaa', marginLeft: 8 }}> {formatarHoraMensagem(item.ultimaData)} </span> )}
                                    </div>
                                
                                </div>
                            
                            </div>
                            
                            <Tooltip title="Excluir conversa"> <DeleteOutlined style={{ color: '#ff4d4f' }} onClick={(e) => { e.stopPropagation(); excluirConversa(item.usuarioId); }} /> </Tooltip>
                        
                        </div>
                        );

                    })}
                </div>
            )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', display: isMobile && !conversaSelecionada ? 'none' : 'flex'  }}>
            
            {conversaSelecionada ? (
                
                <>
                    
                    <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        
                        <Space>
                            <Avatar icon={<UserOutlined />} style={{ background: '#131a53' }} />
                            <Text strong> {usuarios[conversaSelecionada.usuarioId]?.nome || 'Usuário'} </Text>
                        </Space>
                    
                        {isMobile && (
                            <Button size="small" onClick={() => setConversaSelecionada(null)}> Voltar </Button>
                        )}
                    
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#fafafa' }}>
                        
                        <Spin spinning={mensagensLoading}>
                            
                            {mensagens.length === 0 ? (
                                <Empty description="Nenhuma mensagem" />
                            ) : (
                                
                                mensagens.map((msg, index) => {
                                    
                                    const isMine = msg.remetenteId === user.id;
                                
                                    return (
                                    
                                    <div key={index} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8, }}>
                                        
                                        <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: 12, background: isMine ? '#131a53' : '#f0f0f0', color: isMine ? '#fff' : '#000',}}>
                                            
                                            {!isMine && ( <Text strong style={{ fontSize: 11, display: 'block', color: '#131a53' }}> {msg.remetenteNome || 'Usuário'} </Text> )}
                                            <Text style={{ color: isMine ? '#fff' : '#000' }}> {msg.conteudo} </Text>
                                                    
                                            <div style={{ fontSize: 10, textAlign: 'right', color: isMine ? 'rgba(255,255,255,0.6)' : '#8c8c8c', marginTop: 4 }}>
                                                {formatarHoraMensagem(msg.createdAt)}
                                            </div>

                                        </div>
                                
                                    </div>
                                    );

                                })

                            )}
                            
                            <div ref={mensagensEndRef} />
                        
                        </Spin>
                    </div>

                    <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
                        <TextArea rows={2} value={mensagemInput} onChange={(e) => setMensagemInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Digite sua mensagem..." style={{ flex: 1, resize: 'none' }} />
                        <Button type="primary" icon={<SendOutlined />} onClick={handleEnviarMensagem} loading={enviando} style={{ background: '#131a53', alignSelf: 'flex-end' }}> Enviar </Button>
                    </div>

                </>

            ) : (
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#8c8c8c'}}>
                    <Empty description="Selecione uma conversa" />
                </div>
            
            )}
        
        </div>
    
    </div>
    );

    return (
    
    <div style={{ padding: isMobile ? 8 : 16 }}>
        
        <Card size="small">
            
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                
                { key: 'notificacoes', label: (
                
                    <Space>
                        <BellOutlined /> Notificações {naoLidas > 0 && <Badge count={naoLidas} style={{ backgroundColor: '#ff4d4f' }} />}
                    </Space>
                
                ), children: renderNotificacoes(),},
                
                { key: 'chat', label: (
                    
                    <Space>
                        
                        <MessageOutlined /> Chat
                        
                        {conversas.reduce((acc, c) => acc + (c.naoLidas || 0), 0) > 0 && (
                            <Badge count={conversas.reduce((acc, c) => acc + (c.naoLidas || 0), 0)} style={{ backgroundColor: '#3b82f6' }} />
                        )}
                    
                    </Space>

                ), children: renderChat(), },
            
            ]} />

        </Card>
        
    </div>
    );
}

export default NotificacoesChat;