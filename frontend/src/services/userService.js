import api from '../api/api';

export const getUsuarios = async (page = 0, size = 10) => {
    const response = await api.get('/users', { params: { page, size } });
    return response.data;
};

export const getUsuariosSimples = async () => {
    const response = await api.get('/users/simples');
    return response.data;
};

export const criarUsuario = async (data) => {
    const response = await api.post('/users', data);
    return response.data;
};

export const atualizarUsuario = async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

export const deletarUsuario = async (id) => {
    await api.delete(`/users/${id}`);
};