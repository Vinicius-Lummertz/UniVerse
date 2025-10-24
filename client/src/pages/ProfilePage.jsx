// src/pages/ProfilePage.jsx

import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/NavBar';
import BottomNav from '../components/BottomNav';
import { FiCalendar } from 'react-icons/fi';

const ProfilePage = () => {
    const { username } = useParams(); 
    const { authTokens } = useContext(AuthContext);

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // Busca os detalhes do perfil
                const profileRes = await axios.get(`http://localhost:8000/api/users/${username}/`);
                setProfile(profileRes.data);

                // Busca os posts do usuário
                const postsRes = await axios.get(`http://localhost:8000/api/posts/?owner__username=${username}`, {
                    headers: { 'Authorization': `Bearer ${authTokens.access}` }
                });
                setPosts(postsRes.data);
            } catch (error) {
                console.error("Erro ao buscar dados do perfil", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [username, authTokens]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    if (!profile) {
        return <div className="text-center mt-10">Perfil não encontrado.</div>
    }

    return (
        <div className="pb-20">
            <Navbar />
            <main className="container mx-auto p-4">
                {/* Card do Perfil */}
                <div className="card w-full max-w-2xl mx-auto bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                        <h2 className="card-title text-3xl">{profile.username}</h2>
                        <p className="text-base-content/70">{profile.email}</p>
                    </div>
                </div>

                {/* Posts do Usuário */}
                <div className="flex flex-col items-center gap-6">
                    <h3 className="text-xl font-bold self-start max-w-2xl mx-auto w-full">Posts de {profile.username}</h3>
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <div key={post.pk} className="card w-full max-w-2xl bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title">{post.title}</h2>
                                    <p>{post.content}</p>
                                    <small className="text-xs text-base-content/60 mt-2">
                                        {new Date(post.createdAt).toLocaleString('pt-BR')}
                                    </small>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-base-content/70">Este usuário ainda não fez nenhum post.</p>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default ProfilePage;