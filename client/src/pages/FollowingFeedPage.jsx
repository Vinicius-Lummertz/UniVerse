// src/pages/FollowingFeedPage.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import BottomNav from '../components/BottomNav';
import Navbar from '../components/Navbar';
import Feed from '../components/Feed';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import OnboardingModal from '../components/OnboardingModal';

const FollowingFeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pega os dados do Onboarding Modal e o usuário do Contexto
    const { user, showOnboardingModal } = useContext(AuthContext);

    // A função de busca de dados (getPosts) vive na página
    const getPosts = useCallback(async () => {
        setLoading(true);
        try {
            // Este é o endpoint do "Feed Seguindo"
            const response = await axiosInstance.get('/api/feed/following/');
            setPosts(response.data);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error("Não foi possível carregar o feed.");
            }
        } finally {
            setLoading(false);
        }
    }, []); // Dependência vazia

    // A página busca os posts quando é carregada
    useEffect(() => {
        getPosts();
    }, [getPosts]);

    return (
        <>
            <Navbar />
            
            {/* Reutilizamos o MESMO componente Feed, apenas passando 
              os dados e a função de busca apropriados.
            */}
            <Feed
                posts={posts}
                setPosts={setPosts}
                loading={loading}
                getPosts={getPosts} 
                emptyFeedMessage="Siga novos usuários para ver os posts deles aqui."
                showCreateWhenEmpty={false}
            />
            
            <BottomNav />

            {/* O Modal de Onboarding é renderizado aqui, controlado pelo Contexto */}
            {user && showOnboardingModal && <OnboardingModal />}
        </>
    );
};

export default FollowingFeedPage;