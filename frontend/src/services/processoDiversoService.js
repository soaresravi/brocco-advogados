import api from '../api/api';

export const getProcessosDiversos = async (page = 0, size = 10, filters = {}) => {
   
    const params = { 
        page, 
        size, 
        tipo: 'DIVERSO', 
        ...filters 
    };
  
    const response = await api.get('/processos', { params });
    return response.data;

};

export const getProcessoDiverso = async (id) => {
    const response = await api.get(`/processos/${id}`);
    return response.data;
};

export const createProcessoDiverso = async (data) => {
    const response = await api.post('/processos', data);
    return response.data;
};

export const updateProcessoDiverso = async (id, data) => {
    const response = await api.put(`/processos/${id}`, data);
    return response.data;
};

export const deleteProcessoDiverso = async (id) => {
    await api.delete(`/processos/${id}`);
};

export const getClientesOptions = async (search = '') => {
    
    const response = await api.get('/clientes', {
        params: { page: 0, size: 20, search }
    });
   
    return response.data.content || [];

};

export const getMovimentacoesDiversas = async (processoId) => {
    const response = await api.get(`/processos/${processoId}/movimentacoes`);
    return response.data;
};

export const createMovimentacaoDiversa = async (processoId, data) => {
    const response = await api.post(`/processos/${processoId}/movimentacoes`, data);
    return response.data;
};

export const updateMovimentacaoDiversa = async (processoId, movId, data) => {
    const response = await api.put(`/processos/${processoId}/movimentacoes/${movId}`, data);
    return response.data;
};

export const deleteMovimentacaoDiversa = async (processoId, movId) => {
    await api.delete(`/processos/${processoId}/movimentacoes/${movId}`);
};