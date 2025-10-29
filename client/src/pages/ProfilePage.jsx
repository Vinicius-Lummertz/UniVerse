// src/pages/ProfilePage.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/NavBar';
import BottomNav from '../components/BottomNav';
import ImageViewModal from '../components/ImageViewModal';
import EditProfileModal from '../components/EditProfileModal';
import toast from 'react-hot-toast'; 
import ConfirmationModal from '../components/ConfirmationModal';
import axiosInstance from '../utils/axiosInstance';


const ProfilePage = () => {
    const { username } = useParams();
    const { authTokens, user, logoutUser } = useContext(AuthContext); // Pega o usuário logado

    const [profileData, setProfileData] = useState(null); // Agora guarda o objeto User + Profile
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States para os modais
    const [isViewImageOpen, setIsViewImageOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    const [isFollowing, setIsFollowing] = useState(false);

    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

    // Checa se o usuário logado está vendo o seu próprio perfil
    const isOwnProfile = user?.username === username;
    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // Busca os detalhes do perfil
                const profileRes = await axios.get(`http://192.168.15.164:8000/api/users/${username}/`);
                setProfileData(profileRes.data);
                setIsFollowing(profileRes.data.profile.is_following);
                // Busca os posts do usuário
                const postsRes = await axios.get(`http://192.168.15.164:8000/api/posts/?owner__username=${username}`, {
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


    const handleFollowToggle = async () => {
        const method = isFollowing ? 'delete' : 'post';
        try {
            await axiosInstance({
                method: method,
                url: `/api/users/${username}/follow/`
            });
            
            setIsFollowing(!isFollowing);
            setProfileData(prevData => ({
                ...prevData,
                profile: {
                    ...prevData.profile,
                    followers_count: isFollowing ? prevData.profile.followers_count - 1 : prevData.profile.followers_count + 1
                }
            }));
            toast.success(isFollowing ? "Deixou de seguir" : "Seguindo!");
        } catch (error) {
            console.error("Erro ao seguir/deixar de seguir", error);
            toast.error("Ocorreu um erro.");
        }
    };


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

    const handleAccountDelete = async () => {
            const promise = axios.delete('http://192.168.15.164:8000/api/profile/delete/', {
                 headers: { 'Authorization': `Bearer ${authTokens.access}` }
            });

            toast.promise(promise, {
                loading: 'Excluindo sua conta...',
                success: 'Conta excluída com sucesso. Adeus!',
                error: 'Não foi possível excluir sua conta.'
            });

            try {
                await promise;
                setIsDeleteAccountOpen(false); // Fecha o modal de confirmação
                logoutUser(); // Desloga o usuário
            } catch (error) {
                console.error(error);
            }
        };



    if (loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    if (!profileData) {
        return <div className="text-center mt-10">Perfil não encontrado.</div>
    }

    // Os dados agora estão em profileData.profile
    const { bio, profile_pic, followers_count, following_count } = profileData.profile || {}



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
                            <div className="stats stats-horizontal shadow mt-4">
                            <div className="stat">
                                <div className="stat-title">Posts</div>
                                <div className="stat-value">{posts.length}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Seguidores</div>
                                <div className="stat-value">{followers_count}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Seguindo</div>
                                <div className="stat-value">{following_count}</div>
                            </div>
                        </div>
                            
                            
                            {isOwnProfile ? (
                                <button className="btn btn-primary btn-sm" onClick={() => setIsEditProfileOpen(true)}>Editar Perfil</button>
                            ) : (
                                <button 
                                    className={`btn btn-sm ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                                    onClick={handleFollowToggle}
                                >
                                    {isFollowing ? "Deixar de Seguir" : "Seguir"}
                                </button>
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
                    onOpenDeleteConfirm={() => {
                        setIsEditProfileOpen(false); // Fecha o modal de edição
                        setIsDeleteAccountOpen(true); // Abre o modal de confirmação
                    }}
                />
            )}
            <ConfirmationModal
                isOpen={isDeleteAccountOpen}
                onClose={() => setIsDeleteAccountOpen(false)}
                onConfirm={handleAccountDelete}
                title="Excluir Conta Permanentemente"
                message="Você tem certeza? Esta ação não pode ser desfeita. Todos os seus posts, seguidores e dados de perfil serão apagados para sempre."
            />
        </>
    );
};

export default ProfilePage;