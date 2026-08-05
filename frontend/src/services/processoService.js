import api from '../api/api';

export const getProcessos = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/processos', { params });
    return response.data;
};

export const getProcessoById = async (id) => {
    const response = await api.get(`/processos/${id}`);
    return response.data;
};

export const createProcesso = async (data) => {
    const response = await api.post('/processos', data);
    return response.data;
};

export const updateProcesso = async (id, data) => {
    const response = await api.put(`/processos/${id}`, data);
    return response.data;
};

export const deleteProcesso = async (id) => {
    await api.delete(`/processos/${id}`);
};

export const getProcessosDashboard = async () => {
    const response = await api.get('/processos/dashboard');
    return response.data;
};

export const getPrazosHoje = async () => {
    const response = await api.get('/processos/prazos/hoje');
    return response.data;
};

export const getPrazosProximos = async () => {
    const response = await api.get('/processos/prazos/proximos');
    return response.data;
};

export const getPrazosEmAberto = async () => {
    const response = await api.get('/processos/prazos/em-aberto');
    return response.data;
};

export const getCalendarioPrazos = async (mes, ano) => {
    const params = {};
    if (mes) params.mes = mes;
    if (ano) params.ano = ano;
    const response = await api.get('/processos/prazos/calendario', { params });
    return response.data;
};

export const getMovimentacoes = async (processoId) => {
    const response = await api.get(`/processos/${processoId}/movimentacoes`);
    return response.data;
};

export const createMovimentacao = async (processoId, data) => {
    const response = await api.post(`/processos/${processoId}/movimentacoes`, data);
    return response.data;
};

export const updateMovimentacao = async (processoId, movId, data) => {
    const response = await api.put(`/processos/${processoId}/movimentacoes/${movId}`, data);
    return response.data;
};

export const deleteMovimentacao = async (processoId, movId) => {
    await api.delete(`/processos/${processoId}/movimentacoes/${movId}`);
};

export const getClientesOptions = async () => {
    const response = await api.get('/clientes');
    return response.data.content || [];
};

export const getProcessosOptions = async (search = '') => {
   
    const response = await api.get('/processos', {
        params: { page: 0, size: 20, search }
    });
   
    return response.data.content || [];

};