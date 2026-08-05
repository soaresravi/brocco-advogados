import api from '../api/api';

export const getAudiencias = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/audiencias', { params });
    return response.data;
};

export const getAudienciaById = async (id) => {
    const response = await api.get(`/audiencias/${id}`);
    return response.data;
};

export const createAudiencia = async (data) => {
    const response = await api.post('/audiencias', data);
    return response.data;
};

export const updateAudiencia = async (id, data) => {
    const response = await api.put(`/audiencias//${id}`, data);
    return response.data;
};

export const deleteAudiencia = async (id) => {
    await api.delete(`/audiencias/${id}`);
};

export const getAudienciasDashboard = async (ano) => {
    const params = { ano };
    const response = await api.get('/audiencias/dashboard', { params });
    return response.data;
};

export const getAudienciasHoje = async () => {
    const response = await api.get('/audiencias/hoje');
    return response.data;
};

export const getAudienciasProximos = async () => {
    const response = await api.get('/audiencias/proximos');
    return response.data;
};

export const getGoogleStatus = async () => {
    const response = await api.get('/auth/google/status');
    return response.data;
};

export const getGoogleAuthUrl = async () => {
    const response = await api.get('/auth/google/auth-url');
    return response.data;
};

export const disconnectGoogle = async () => {
    await api.delete('/auth/google/disconnect');
};

export const getProcessosOptions = async () => {
    const response = await api.get('/processos');
    return response.data.content || [];
};