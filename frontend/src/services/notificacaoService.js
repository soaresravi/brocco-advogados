import api from '../api/api';

export const getNotificacoes = async (page = 0, size = 20) => {
    const response = await api.get('/notificacoes', { params: { page, size } });
    return response.data;
};

export const getNotificacoesNaoLidas = async () => {
    const response = await api.get('/notificacoes/nao-lidas');
    return response.data;
};

export const getContadorNotificacoes = async () => {
    const response = await api.get('/notificacoes/contador');
    return response.data;
};

export const marcarNotificacaoComoLida = async (id) => {
    const response = await api.put(`/notificacoes/${id}/marcar-lida`);
    return response.data;
};

export const marcarTodasNotificacoesComoLidas = async () => {
    const response = await api.put('/notificacoes/marcar-todas-lidas');
    return response.data;
};

export const limparNotificacoesAntigas = async (dias = 30) => {
    const response = await api.delete('/notificacoes/limpar-antigas', { params: { dias } });
    return response.data;
};

export const deletarNotificacao = async (id) => {
    await api.delete(`/notificacoes/${id}`);
};

export const getConversas = async () => {
    const response = await api.get('/chat/conversas');
    return response.data;
};

export const getMensagens = async (usuarioId, page = 0, size = 50) => {

    const response = await api.get(`/chat/conversa/${usuarioId}`, {
        params: { page, size }
    });

    return response.data;

};

export const enviarMensagem = async (destinatarioId, conteudo) => {
    const response = await api.post('/chat', { destinatarioId, conteudo });
    return response.data;
};

export const deletarConversa = async (usuarioId) => {
    await api.delete(`/chat/conversa/${usuarioId}`);
};

export const getUsuariosSimples = async () => {
    const response = await api.get('/users/simples');
    return response.data;
};