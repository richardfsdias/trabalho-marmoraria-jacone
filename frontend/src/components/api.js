// api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("DEBUG FRONTEND - Token JWT enviado:", token); // Log para depuração
        } else {
            console.log("DEBUG FRONTEND - Nenhum token JWT encontrado no localStorage. É preciso fazer login."); // Log para depuração
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const ApiClient = {
    auth: {
        login: async (credentials) => {
            const response = await api.post('/login', credentials);
            console.log("DEBUG FRONTEND - Resposta do Login:", response.data); // Log para depuração
            return response;
        },
        cadastro: (userData) => api.post('/funcionarios/cadastro', userData),
    },
    // ... (Seus outros módulos como clientes, funcionarios, estoque, etc. já devem estar aqui ou você adicionará)

    clientes: { // Módulo de clientes para buscar clientes no formulário de orçamento
        getAll: () => api.get('/clientes'),
        getById: (id) => api.get(`/clientes/${id}`),
        create: (clienteData) => api.post('/clientes', clienteData),
        update: (id, clienteData) => api.put(`/clientes/${id}`, clienteData),
        delete: (id) => api.delete(`/clientes/${id}`),
    },
    
    marmores: {
        getAll: () => api.get('/marmores'),
        getById: (id) => api.get(`/marmores/${id}`), // Embora não usado em Marmores.js, bom para completude
        create: (marmoreData) => {
            console.log("DEBUG FRONTEND - Enviando dados do mármore para criação:", marmoreData);
            return api.post('/marmores', marmoreData);
        },
        update: (id, marmoreData) => {
            console.log("DEBUG FRONTEND - Enviando dados do mármore para atualização:", id, marmoreData);
            return api.put(`/marmores/${id}`, marmoreData);
        },
        delete: (id) => {
            console.log("DEBUG FRONTEND - Enviando solicitação para deletar mármore:", id);
            return api.delete(`/marmores/${id}`);
        },
    },

     estoque: { 
        getAll: () => api.get('/estoque'),
        getById: (id) => api.get(`/estoque/${id}`),
        create: (itemData) => api.post('/estoque', itemData),
        update: (id, itemData) => api.put(`/estoque/${id}`, itemData),
        delete: (id) => api.delete(`/estoque/${id}`),
        
        // Movimentações relacionadas ao estoque
        getAllMovimentacoes: () => api.get('/movimentacoes_estoque'), // Corrigido para corresponder ao backend
        createMovimentacao: (movimentacaoData) => api.post('/movimentacoes_estoque', movimentacaoData), // Adicionado
    },

    orcamentos: { // Novo módulo para orçamentos
        getAll: () => api.get('/orcamentos'),
        getById: (id) => api.get(`/orcamentos/${id}`),
        create: (orcamentoData) => {
            console.log("DEBUG FRONTEND - Enviando dados do orçamento para criação:", orcamentoData);
            return api.post('/orcamentos', orcamentoData);
        },
        update: (id, orcamentoData) => {
            console.log("DEBUG FRONTEND - Enviando dados do orçamento para atualização:", orcamentoData);
            return api.put(`/orcamentos/${id}`, orcamentoData);
        },
        delete: (id) => api.delete(`/orcamentos/${id}`),
        updateStatus: (id, status) => api.put(`/orcamentos/${id}/status`, { status }),
    },

    calculadora: {
        getMateriais: () => api.get('/estoque'),
    },

    funcionarios: {
        getAll: () => api.get('/funcionarios'),
        getById: (id) => api.get(`/funcionarios/${id}`),
        update: (id, funcData) => api.put(`/funcionarios/${id}`, funcData),
        delete: (id) => api.delete(`/funcionarios/${id}`),
    },

    movimentacoes: {
        getAll: () => api.get('/movimentacoes'),
        create: (movData) => api.post('/movimentacoes', movData),
        getByEstoqueId: (estoqueId) => api.get(`/estoque/${estoqueId}/movimentacoes`),
    },
};

export default ApiClient;