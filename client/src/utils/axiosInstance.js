// src/utils/axiosInstance.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Use a variável de ambiente ou o valor padrão
const API_URL = import.meta.env.RENDER_API_URL || 'http://192.168.15.164:8000';

const axiosInstance = axios.create({
    baseURL: API_URL,
});

axiosInstance.interceptors.request.use(async (config) => {
    const authTokens = localStorage.getItem('authTokens')
        ? JSON.parse(localStorage.getItem('authTokens'))
        : null;

    // Se não houver tokens (ex: login/registro) ou se for a URL de refresh, não intercepta
    if (!authTokens || config.url === '/api/token/refresh/') {
        return config;
    }

    const decodedToken = jwtDecode(authTokens.access);
    const isExpired = Date.now() >= decodedToken.exp * 1000;

    if (!isExpired) {
        config.headers.Authorization = `Bearer ${authTokens.access}`;
        return config;
    }

    // Token de acesso expirou, tenta o refresh
    try {
        console.log("Token expirado, tentando refresh...");
        const response = await axios.post(`${API_URL}/api/token/refresh/`, {
            refresh: authTokens.refresh
        });

        const newTokens = response.data;
        localStorage.setItem('authTokens', JSON.stringify(newTokens));

        // Atualiza o header da requisição original
        config.headers.Authorization = `Bearer ${newTokens.access}`;
        return config;
    } catch (error) {
        console.error("Refresh token falhou", error);
        // Limpa os tokens e redireciona para o login
        localStorage.removeItem('authTokens');
        localStorage.removeItem('userInfo');
        window.location.href = '/login'; // Força o redirecionamento
        return Promise.reject(error);
    }
});

export default axiosInstance;