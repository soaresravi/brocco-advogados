import api from '../api/api';

export const getTarefasDashboard = async (ano) => {
    const params = { ano };
    const response = await api.get('/tarefas/dashboard', { params });
    return response.data;
};

export const getTarefas = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters, };
    const response = await api.get('/tarefas', { params });
    return response.data;
};

export const getTarefa = async (id) => {
    const response = await api.get(`/tarefas/${id}`);
    return response.data;
};

export const createTarefa = async (data) => {
    const response = await api.post('/tarefas', data);
    return response.data;
};

export const updateTarefa = async (id, data) => {
    const response = await api.put(`/tarefas/${id}`, data);
    return response.data;
};

export const deleteTarefa = async (id) => {
    await api.delete(`/tarefas/${id}`);
};

export const getProcessosOptions = async (search = '') => {
    
    const response = await api.get('/processos', {
        params: { page: 0, size: 20, search }
    });
    
    return response.data.content || [];

};

export const getClientesOptions = async (search = '') => {

    const response = await api.get('/clientes', {
        params: { page: 0, size: 20, search }
    });
  
    return response.data.content || [];

};

export const getUsuariosSimples = async () => {
    const response = await api.get('/users/simples');
    return response.data;
};

export const getMicrosoftStatus = async () => {
    const response = await api.get('/auth/microsoft/status');
    return response.data;
};

export const getMicrosoftAuthUrl = async () => {
    const response = await api.get('/auth/microsoft/auth-url');
    return response.data;
};

export const disconnectMicrosoft = async () => {
    await api.delete('/auth/microsoft/disconnect');
};