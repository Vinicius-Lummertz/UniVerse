// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode'; // Instale com: npm install jwt-decode
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Importe o toast
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext();
export default AuthContext;



export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
    const [user, setUser] = useState(() => {
        const tokensStr = localStorage.getItem('authTokens');
        if (!tokensStr) return null;
        try {
            const parsed = JSON.parse(tokensStr);
            return jwtDecode(parsed.access);
        } catch (_e) {
            return null;
        }
    });
    const navigate = useNavigate();

const loginUser = async (username, password) => {
        try {
            // 3. Use axiosInstance para o login (já inclui baseURL)
            const tokenResponse = await axiosInstance.post(`/api/token/`, { username, password });
            const tokenData = tokenResponse.data;
            setAuthTokens(tokenData);
            localStorage.setItem('authTokens', JSON.stringify(tokenData));

            const decodedToken = jwtDecode(tokenData.access);
            const loggedInUsername = decodedToken.username;

            const userResponse = await axiosInstance.get(`/api/users/${loggedInUsername}/`);
            const fullUserData = userResponse.data;
            setUser(fullUserData);
            localStorage.setItem('userInfo', JSON.stringify(fullUserData));

            navigate('/');
            toast.success('Login efetuado com sucesso!');

        } catch (loginError) {
             console.error("Erro no login!", loginError);
             if (loginError.response && loginError.response.status === 401) {
                 toast.error("Usuário ou senha inválidos!");
             } else {
                 toast.error("Ocorreu um erro no login.");
             }
        }
    };

    const registerUser = async (username, email, password) => {
        try {
            const response = await axiosInstance.post(`/api/register/`, {
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