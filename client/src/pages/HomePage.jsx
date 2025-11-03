// src/pages/HomePage.jsx

import { useState, useEffect, useCallback } from 'react';
import BottomNav from '../components/BottomNav';
import Navbar from '../components/Navbar';
import Feed from '../components/Feed';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
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
        };
        fetchPosts();
    }, []);

    return (
        <div className="pb-20">
            <Navbar />
            <Feed
                endpoint="/api/posts/"
                posts={posts}
                setPosts={setPosts}
                loading={loading}
            />
            <BottomNav />
        </div>
    );
};

export default HomePage;