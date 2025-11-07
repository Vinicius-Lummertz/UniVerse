// src/pages/HomePage.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import BottomNav from '../components/BottomNav';
import Navbar from '../components/Navbar';
import Feed from '../components/Feed';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import OnboardingModal from '../components/OnboardingModal';

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pega os dados do Onboarding Modal e o usuário do Contexto
    const { user, showOnboardingModal } = useContext(AuthContext);

    // A função de busca de dados (getPosts) vive na página
    const getPosts = useCallback(async () => {
        setLoading(true);
        try {
            // Este é o endpoint do "Feed Global"
            const response = await axiosInstance.get('/api/posts/');
            setPosts(response.data);
        } catch (error) {
            // Só mostra o erro se não for um 401 (que o axiosInstance já trata)
            if (error.response?.status !== 401) {
                toast.error("Não foi possível carregar os posts.");
            }
        } finally {
            setLoading(false);
        }
    }, []); // Dependência vazia, só é criada uma vez

    // A página busca os posts quando é carregada
    useEffect(() => {
        getPosts();
    }, [getPosts]);

    return (
        <>
            <Navbar />
            
            {/* Passa os dados e a função getPosts para o Feed */}
            <Feed
                posts={posts}
                setPosts={setPosts}
                loading={loading}
                getPosts={getPosts}
                emptyFeedMessage="Não há nenhum post para mostrar ainda."
                showCreateWhenEmpty={true} 
            />
            
            <BottomNav />

            {/* O Modal de Onboarding é renderizado aqui, controlado pelo Contexto */}
            {/* O modal só deve aparecer se o usuário estiver logado E a flag for true */}
            {user && showOnboardingModal && <OnboardingModal />}
        </>
    );
};

export default HomePage;