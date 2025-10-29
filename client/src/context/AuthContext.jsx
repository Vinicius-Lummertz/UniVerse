// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Instale com: npm install jwt-decode
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Importe o toast

const AuthContext = createContext();
export default AuthContext;

const API_URL = 'http://192.168.15.164:8000/';

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
    const [user, setUser] = useState(() => localStorage.getItem('authTokens') ? jwtDecode(localStorage.getItem('authTokens')) : null);
    const navigate = useNavigate();

    const loginUser = async (username, password) => {
        try {
            // 1. Pega os Tokens
            const tokenResponse = await axios.post(`${API_URL}/api/token/`, { username, password });
            const tokenData = tokenResponse.data;
            setAuthTokens(tokenData);
            localStorage.setItem('authTokens', JSON.stringify(tokenData));

            // 2. Decodifica o token para pegar o username (se já não tiver)
            const decodedToken = jwtDecode(tokenData.access);
            const loggedInUsername = decodedToken.username;

            // 3. Busca os dados completos do Usuário/Perfil
            try {
                const userResponse = await axios.get(`${API_URL}/api/users/${loggedInUsername}/`, {
                     headers: { 'Authorization': `Bearer ${tokenData.access}` }
                });
                const fullUserData = userResponse.data;
                setUser(fullUserData); // Salva o objeto User completo (com profile aninhado)
                localStorage.setItem('userInfo', JSON.stringify(fullUserData)); // Salva no localStorage
                 
                navigate('/');
                toast.success('Login efetuado com sucesso!');

            } catch (profileError) {
                console.error("Erro ao buscar dados do perfil após login!", profileError);
                // Mesmo com erro no perfil, o login funcionou. Salva dados básicos do token.
                setUser(decodedToken); 
                localStorage.setItem('userInfo', JSON.stringify(decodedToken)); // Salva dados básicos
                navigate('/'); // Ou talvez para uma página de erro/configuração?
                toast.error("Login efetuado, mas houve erro ao carregar o perfil.");
            }

        } catch (loginError) {
            console.error("Erro no login!", loginError);
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
        localStorage.removeItem('userInfo');
        navigate('/login');
        toast.success('Você saiu da sua conta.');
    };

    const contextData = useMemo(() => ({ user, authTokens, loginUser, logoutUser, registerUser }), [user, authTokens]);

    useEffect(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            setUser(JSON.parse(storedUserInfo));
        }
        const storedTokens = localStorage.getItem('authTokens');
         if (storedTokens) {
             setAuthTokens(JSON.parse(storedTokens));
         }
     }, []);

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};