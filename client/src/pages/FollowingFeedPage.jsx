// src/pages/FollowingFeedPage.jsx
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import Navbar from '../components/NavBar';

const FollowingFeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authTokens } = useContext(AuthContext);

    useEffect(() => {
        const getFollowingPosts = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://192.168.15.164:8000/api/feed/following/', {
                    headers: { 'Authorization': `Bearer ${authTokens.access}` }
                });
                setPosts(response.data);
            } catch (error) {
                console.error("Erro ao buscar posts de quem você segue", error);
            } finally {
                setLoading(false);
            }
        };
        getFollowingPosts();
    }, [authTokens]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    return (
        <div className="pb-20">
            <Navbar />
            <main className="container mx_auto p-4">
                <div className="flex flex-col items-center gap-6">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            // Renderiza o card do post (reutilize o componente do card do daisyUI)
                            <div key={post.pk} className="card w-full max-w-2xl bg-base-100 shadow-xl">
                                {post.image && <figure><img src={post.image} alt={post.title} /></figure>}
                                <div className="card-body">
                                    <h2 className="card-title">{post.title}</h2>
                                    <p className="font-bold">{post.owner}</p>
                                    <p>{post.content}</p>
                                    <small className="text-xs text-base-content/60 mt-2">{new Date(post.createdAt).toLocaleString('pt-BR')}</small>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-lg">Sua timeline está vazia. Siga pessoas para ver os posts delas aqui.</p>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default FollowingFeedPage;