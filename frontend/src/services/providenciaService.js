import api from '../api/api';

export const getProvidencias = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/providencias', { params });
    return response.data;
};

export const getProvidenciaById = async (id) => {
    const response = await api.get(`/providencias/${id}`);
    return response.data;
};

export const createProvidencia = async (data) => {
    const response = await api.post('/providencias', data);
    return response.data;
};

export const updateProvidencia = async (id, data) => {
    const response = await api.put(`/providencias/${id}`, data);
    return response.data;
};

export const deleteProvidencia = async (id) => {
    await api.delete(`/providencias/${id}`);
};

export const buscarClientesProvidencia = async (search, page = 0, size = 10) => {
    const params = { search, page, size };
    const response = await api.get('/providencias/clientes/buscar', { params });
    return response.data;
};

export const getUsuariosSimples = async () => {
    const response = await api.get('/users/simples');
    return response.data;
};

export const criarClienteRapido = async (data) => {
    const response = await api.post('/clientes', data);
    return response.data;
};