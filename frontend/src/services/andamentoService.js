import api from '../api/api';

export const getClientesComPendencias = async (page = 0, size = 10, search = '') => {
    const params = { page, size, search };
    const response = await api.get('/andamentos/clientes', { params });
    return response.data;
};

export const getProvidenciasPendentes = async (clienteId) => {
    const response = await api.get(`/andamentos/clientes/${clienteId}/providencias`);
    return response.data;
};

export const atualizarStatusProvidencia = async (providenciaId, status) => {
    const params = { status };
    const response = await api.put(`/andamentos/providencias/${providenciaId}/status`, null, { params });
    return response.data;
};

export const salvarObservacao = async (clienteId, observacao, enviarParaId) => {

    const response = await api.post(`/andamentos/clientes/${clienteId}/observacoes`, {
        observacao, enviarParaId
    });

    return response.data;

};

export const getAnexos = async (clienteId) => {
    const response = await api.get(`/andamentos/clientes/${clienteId}/anexos`);
    return response.data;
};

export const uploadAnexo = async (clienteId, file) => {

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/andamentos/clientes/${clienteId}/anexos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;

};

export const downloadAnexo = async (uuid) => {

    const response = await api.get(`/andamentos/anexos/${uuid}/download`, {
        responseType: 'blob',
    });

    return response;

};

export const deleteAnexo = async (uuid) => {
    await api.delete(`/andamentos/anexos/${uuid}`);
};

export const getAndamentosDashboard = async () => {
    const response = await api.get('/andamentos/dashboard');
    return response.data;
};