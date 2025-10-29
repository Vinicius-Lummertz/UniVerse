// src/pages/FollowingFeedPage.jsx
import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import Navbar from '../components/NavBar';
import Feed from '../components/Feed';
import axiosInstance from '../utils/axiosInstance';

const FollowingFeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get('/api/feed/following/');
                setPosts(response.data);
            } catch (error) {
                console.error("Erro ao buscar posts de quem você segue", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="pb-20">
            <Navbar />
            <Feed
                endpoint="/api/feed/following/"
                posts={posts}
                setPosts={setPosts}
                loading={loading}
            />
            <BottomNav />
        </div>
    );
};

export default FollowingFeedPage;