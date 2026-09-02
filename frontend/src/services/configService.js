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

export const getEventosOutlook = async (dias = 7) => {
    const response = await api.get('/auth/microsoft/eventos', { params: { dias } });
    return response.data;
};