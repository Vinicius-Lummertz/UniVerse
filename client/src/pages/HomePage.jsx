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
    
    const { user, showOnboardingModal } = useContext(AuthContext);

    const getPosts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/api/posts/');
            setPosts(response.data);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error("Não foi possível carregar os posts.");
            }
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        getPosts();
    }, [getPosts]);

    return (
        <>
            <Navbar />
            
            <Feed
                posts={posts}
                setPosts={setPosts}
                loading={loading}
                getPosts={getPosts}
                emptyFeedMessage="Não há nenhum post para mostrar ainda."
                showCreateWhenEmpty={true} 
            />
            
            <BottomNav />

            {user && showOnboardingModal && <OnboardingModal />}
        </>
    );
};

export default HomePage;