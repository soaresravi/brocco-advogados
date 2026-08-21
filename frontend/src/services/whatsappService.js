import api from '../api/api';

export const getWhatsAppContatos = async (page = 0, size = 10, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await api.get('/whatsapp', { params });
    return response.data;
};

export const getWhatsAppContatoById = async (id) => {
    const response = await api.get(`/whatsapp/${id}`);
    return response.data;
};

export const createWhatsAppContato = async (data) => {
    const response = await api.post('/whatsapp', data);
    return response.data;
};

export const updateWhatsAppContato = async (id, data) => {
    const response = await api.put(`/whatsapp/${id}`, data);
    return response.data;
};

export const deleteWhatsAppContato = async (id) => {
    await api.delete(`/whatsapp/${id}`);
};