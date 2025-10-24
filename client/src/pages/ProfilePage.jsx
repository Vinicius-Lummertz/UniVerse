// src/pages/ProfilePage.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/NavBar';
import BottomNav from '../components/BottomNav';
import ImageViewModal from '../components/ImageViewModal';
import EditProfileModal from '../components/EditProfileModal';

const ProfilePage = () => {
    const { username } = useParams();
    const { authTokens, user } = useContext(AuthContext); // Pega o usuário logado

    const [profileData, setProfileData] = useState(null); // Agora guarda o objeto User + Profile
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States para os modais
    const [isViewImageOpen, setIsViewImageOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    // Checa se o usuário logado está vendo o seu próprio perfil
    const isOwnProfile = user?.username === username;
    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // Busca os detalhes do perfil
                const profileRes = await axios.get(`http://localhost:8000/api/users/${username}/`);
                setProfileData(profileRes.data);

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

    const handleAvatarClick = () => {
        if (isOwnProfile) {
            setIsEditProfileOpen(true);
        } else {
            setIsViewImageOpen(true);
        }
    };
    
    // Função para atualizar o state local quando o perfil for editado no modal
    const handleProfileUpdate = (updatedProfileData) => {
        setProfileData(prevData => ({
            ...prevData,
            profile: { ...prevData.profile, ...updatedProfileData }
        }));
    };


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    if (!profileData) {
        return <div className="text-center mt-10">Perfil não encontrado.</div>
    }

    // Os dados agora estão em profileData.profile
    const { bio, profile_pic } = profileData.profile || {}



    return (
        <>
            <div className="pb-20">
                <Navbar />
                <main className="container mx-auto p-4">
                    <div className="card w-full max-w-2xl mx-auto bg-base-100 shadow-xl mb-6">
                        <div className="card-body items-center text-center">
                            <div className="avatar">
                                <div className="w-24 rounded-full ring ring-offset-base-100 ring-offset-2 cursor-pointer" onClick={handleAvatarClick}>
                                    <img src={profile_pic || '/avatar-default.svg'} />
                                </div>
                            </div>
                            <h2 className="card-title text-3xl mt-4">{profileData.username}</h2>
                            <p className="text-base-content/70">{bio || (isOwnProfile && "Adicione uma bio para se apresentar!")}</p>
                            {isOwnProfile && (
                                <div className="card-actions mt-2">
                                    <button className="btn btn-primary btn-sm" onClick={() => setIsEditProfileOpen(true)}>Editar Perfil</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <h3 className="text-xl font-bold self-start max-w-2xl mx-auto w-full">Posts de {profileData.username}</h3>
                        {posts.length > 0 ? posts.map(post => (
                            // Use o card do post do daisyUI que já fizemos
                            <div key={post.pk} className="card w-full max-w-2xl bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title">{post.title}</h2>
                                    <p>{post.content}</p>
                                    {post.image && <figure><img src={post.image} alt={post.title} /></figure>}
                                    <small className="text-xs text-base-content/60 mt-2">{new Date(post.createdAt).toLocaleString('pt-BR')}</small>
                                </div>
                            </div>
                        )) : (
                            <p className="text-base-content/70">Este usuário ainda não fez nenhum post.</p>
                        )}
                    </div>
                </main>
                <BottomNav />
            </div>

            {/* Modais */}
            <ImageViewModal 
                isOpen={isViewImageOpen} 
                onClose={() => setIsViewImageOpen(false)} 
                imageUrl={profile_pic || '/default-avatar.png'} 
            />
            {isOwnProfile && (
                <EditProfileModal 
                    isOpen={isEditProfileOpen} 
                    onClose={() => setIsEditProfileOpen(false)}
                    profile={profileData.profile}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
        </>
    );
};

export default ProfilePage;