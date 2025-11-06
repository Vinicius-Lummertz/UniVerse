import { createContext, useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext();
export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    
    // CORREÇÃO: Inicializa o usuário a partir do 'userInfo', não do 'authTokens'
    const [user, setUser] = useState(() => 
        localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null
    );
    
    // NOVO ESTADO (Fase 1.2)
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    
    const [loading, setLoading] = useState(true); // Estado de loading para checagem inicial
    const navigate = useNavigate();

    const loginUser = async (username, password) => {
        try {
            const tokenResponse = await axiosInstance.post(`/api/token/`, { username, password });
            const tokenData = tokenResponse.data;
            setAuthTokens(tokenData);
            localStorage.setItem('authTokens', JSON.stringify(tokenData));

            const decodedToken = jwtDecode(tokenData.access);
            const loggedInUsername = decodedToken.username;

            // Busca os dados completos do perfil
            const userResponse = await axiosInstance.get(`/api/users/${loggedInUsername}/`);
            const fullUserData = userResponse.data;
            setUser(fullUserData);
            localStorage.setItem('userInfo', JSON.stringify(fullUserData));

            // ATUALIZAÇÃO (Fase 1.2): Checa a flag de onboarding
            if (fullUserData.profile && !fullUserData.profile.onboarding_complete) {
                setShowOnboardingModal(true);
            }

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
            // Adicionar feedback de erro mais específico (ex: usuário já existe)
            if (error.response && error.response.data.username) {
                 toast.error(`Erro no registro: ${error.response.data.username[0]}`);
            } else {
                 toast.error("Falha ao registrar. Verifique os dados.");
            }
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        setShowOnboardingModal(false); // Garante que o modal feche ao sair
        localStorage.removeItem('authTokens');
        localStorage.removeItem('userInfo');
        navigate('/login');
        toast.success('Você saiu da sua conta.');
    };

    // ATUALIZAÇÃO (Fase 1.2): Exporta os novos estados
    const contextData = useMemo(() => ({
        user,
        setUser, // Exporta o setUser para o modal de onboarding poder atualizar o user
        authTokens,
        loginUser,
        logoutUser,
        registerUser,
        showOnboardingModal,
        setShowOnboardingModal
    }), [user, authTokens, showOnboardingModal]);

    // ATUALIZAÇÃO (Fase 1.2): useEffect agora checa o onboarding no load
    useEffect(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const parsedUser = JSON.parse(storedUserInfo);
            setUser(parsedUser);
            // Checa no carregamento da página também
            if (parsedUser.profile && !parsedUser.profile.onboarding_complete) {
                setShowOnboardingModal(true);
            }
        }
        const storedTokens = localStorage.getItem('authTokens');
         if (storedTokens) {
             setAuthTokens(JSON.parse(storedTokens));
         }
        
        setLoading(false); // Finaliza o loading
    }, []);

    return (
        <AuthContext.Provider value={contextData}>
            {/* Mostra um loading global enquanto o contexto verifica o login */}
            {!loading ? children : (
                <div className="flex justify-center items-center h-screen">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            )}
        </AuthContext.Provider>
    );
};      