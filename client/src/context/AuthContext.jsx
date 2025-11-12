// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useMemo, useCallback } from 'react'; // 1. Adicionar useCallback
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
    
    const [user, setUser] = useState(() => 
        localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null
    );
    
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    
    // 2. NOVOS ESTADOS PARA O ÍCONE DE SINO
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
    const [unreadSocial, setUnreadSocial] = useState(0);
    
    const [loading, setLoading] = useState(true); 
    const navigate = useNavigate();

    // 3. NOVA FUNÇÃO (useCallback para estabilidade)
    const fetchNotificationStatus = useCallback(async () => {
        // Só busca se estiver logado
        if (!localStorage.getItem('authTokens')) return; 

        try {
            const response = await axiosInstance.get('/api/notifications/status/');
            setUnreadAnnouncements(response.data.unread_announcements_count);
            setUnreadSocial(response.data.unread_social_count);
        } catch (error) {
            console.error("Erro ao buscar status de notificações", error);
        }
    }, []); // Dependência vazia, já que axiosInstance é estável

    const loginUser = async (username, password) => {
        try {
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

            // 4. Buscar status de notificação após o login
            await fetchNotificationStatus();

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
        // ... (lógica de registro existente)
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
        setShowOnboardingModal(false); 
        // 5. Limpar contagens ao sair
        setUnreadAnnouncements(0);
        setUnreadSocial(0);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('userInfo');
        navigate('/login');
        toast.success('Você saiu da sua conta.');
    };

    // 6. Atualizar contextData
    const contextData = useMemo(() => ({
        user,
        setUser, 
        authTokens,
        loginUser,
        logoutUser,
        registerUser,
        showOnboardingModal,
        setShowOnboardingModal,
        // Novas props
        unreadAnnouncements,
        unreadSocial,
        fetchNotificationStatus 
    }), [user, authTokens, showOnboardingModal, unreadAnnouncements, unreadSocial, fetchNotificationStatus]); // 7. Adicionar dependências

    // 8. useEffect de carregamento inicial
    useEffect(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const parsedUser = JSON.parse(storedUserInfo);
            setUser(parsedUser);
            if (parsedUser.profile && !parsedUser.profile.onboarding_complete) {
                setShowOnboardingModal(true);
            }
        }
        const storedTokens = localStorage.getItem('authTokens');
         if (storedTokens) {
             setAuthTokens(JSON.parse(storedTokens));
             // 9. Buscar status ao carregar o app (se já estiver logado)
             fetchNotificationStatus(); 
         }
        
        setLoading(false); 
    }, [fetchNotificationStatus]); // 10. Adicionar fetchNotificationStatus como dependência

    return (
        <AuthContext.Provider value={contextData}>
            {!loading ? children : (
                <div className="flex justify-center items-center h-screen">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            )}
        </AuthContext.Provider>
    );
};