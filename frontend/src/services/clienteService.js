import api from '../api/api';

export const getClientes = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters};
    const response = await api.get('/clientes', { params } );
    return response.data;
};

export const getClienteById = async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
};

export const createCliente = async (data) => {
    const response = await api.post('/clientes', data);
    return response.data;
};

export const updateCliente = async (id, data) => {
    const response = await api.put(`/clientes/${id}`, data);
    return response.data;
};

export const deleteCliente = async (id) => {
    await api.delete(`/clientes/${id}`);
};

export const getClientesDashboard = async () => {
    const response = await api.get('/clientes/dashboard');
    return response.data;
};