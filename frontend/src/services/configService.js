import api from '../api/api';

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const updatePerfil = async (data) => {
    const response = await api.put('/auth/perfil', data);
    return response.data;
};

export const alterarSenha = async (data) => {
    const response = await api.put('/auth/alterar-senha', data);
    return response.data;
};

export const getGoogleStatus = async () => {
    const response = await api.get('/auth/google/status');
    return response.data;
};

export const disconnectGoogle = async () => {
    await api.delete('/auth/google/disconnect');
};

export const getAuthUrl = async () => {
    const response = await api.get('/auth/google/auth-url');
    return response.data;
};