import api from '../api/api';

export const getLogs = async (params = {}) => {
    const response = await api.get('/logs', { params });
    return response.data;
};

export const limparLogs = async (dias = 30) => {
    const response = await api.delete('/logs/limpar', { params: { dias } });
    return response.data;
};

export const getAcoesLog = async () => {
    const response = await api.get('/logs/acoes');
    return response.data;
};

export const getEntidadesLog = async () => {
    const response = await api.get('/logs/entidades');
    return response.data;
};