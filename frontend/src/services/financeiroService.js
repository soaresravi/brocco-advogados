import api from '../api/api';

export const getFinanceiroDashboard = async (ano) => {
    const params = { ano };
    const response = await api.get('/financeiro/dashboard', { params });
    return response.data;
};

export const getRecebimentos = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/financeiro/recebimentos', { params });
    return response.data;
};

export const getRecebimento = async (id) => {
    const response = await api.get(`/financeiro/recebimentos/${id}`);
    return response.data;
};

export const createRecebimento = async (data) => {
    const response = await api.post('/financeiro/recebimentos', data);
    return response.data;
};

export const updateRecebimento = async (id, data) => {
    const response = await api.put(`/financeiro/recebimentos/${id}`, data);
    return response.data;
};

export const deleteRecebimento = async (id) => {
    await api.delete(`/financeiro/recebimentos/${id}`);
};

export const getRecebimentosAtrasados = async (id) => {
    const response = await api.get('/financeiro/recebimentos/alertas/atrasados');
    return response.data;
};

export const getDespesas = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/financeiro/despesas', { params });
    return response.data;   
};

export const getDespesa = async (id) => {
    const response = await api.get(`/financeiro/despesas/${id}`);
    return response.data;
};

export const createDespesa = async (data) => {
    const response = await api.post('/financeiro/despesas', data);
    return response.data;
};

export const updateDespesa = async (id, data) => {
    const response = await api.put(`/financeiro/despesas/${id}`, data);
    return response.data;
};

export const deleteDespesa = async (id) => {
    await api.delete(`/financeiro/despesas/${id}`);
};

export const getDespesasAtrasados = async () => {
    const response = await api.get('/financeiro/despesas/alertas/atrasados');
    return response.data;
};

export const getClientesOptions = async (search = '') => {

    const response = await api.get('/clientes', {
        params: { page: 0, size: 20, search }
    });

    return response.data.content || [];

};

export const getProcessosOptions = async (search = '') => {

    const response = await api.get('/processos', {
        params: { page: 0, size: 20, search }
    });

    return response.data.content || [];

};