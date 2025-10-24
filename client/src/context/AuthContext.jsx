// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Instale com: npm install jwt-decode
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Importe o toast

const AuthContext = createContext();
export default AuthContext;

const API_URL = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
    const [user, setUser] = useState(() => localStorage.getItem('authTokens') ? jwtDecode(localStorage.getItem('authTokens')) : null);
    const navigate = useNavigate();

    const loginUser = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/token/`, {
                username,
                password
            });
            if (response.status === 200) {
                const data = response.data;
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                localStorage.clear()
                localStorage.setItem('authTokens', JSON.stringify(data));
                navigate('/');
                toast.success('Login efetuado com sucesso!')
            }
        } catch (error) {
            console.error("Erro no login!", error);
            toast.error("Usuário ou senha inválidos!");
        }
    };

    const registerUser = async (username, email, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/register/`, {
                username,
                email,
                password
            });
            if (response.status === 201) {
                navigate('/login');
                toast.success("Usuário criado com sucesso! Faça o login.");
            }
        } catch (error) {
            console.error("Erro no registro!", error);
            toast.error("Falha ao registrar. Verifique os dados.");
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
        toast.success('Você saiu da sua conta.');
    };

    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        registerUser,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};