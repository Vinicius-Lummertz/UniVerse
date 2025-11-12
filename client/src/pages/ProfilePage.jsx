// src/pages/ProfilePage.jsx
import { useState, useEffect, useContext, useCallback, Link } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import ImageViewModal from '../components/ImageViewModal';
import EditProfileModal from '../components/EditProfileModal';
import toast from 'react-hot-toast'; 
import ConfirmationModal from '../components/ConfirmationModal';
import axiosInstance from '../utils/axiosInstance';
import Feed from '../components/Feed'; 
import OnboardingModal from '../components/OnboardingModal'; 
import Navbar from '../components/Navbar';
import { FiUsers } from 'react-icons/fi'; 

const ProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    
    // 3. Pegar mais dados do AuthContext
    const { authTokens, user, setUser, logoutUser, showOnboardingModal, setShowOnboardingModal } = useContext(AuthContext); 

    const [profileData, setProfileData] = useState(null); 
    const [posts, setPosts] = useState([]);
    
    // 4. Dividir os estados de loading
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    
    const [isViewImageOpen, setIsViewImageOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

    const isOwnProfile = user?.username === username;

    // 5. Função separada para buscar o perfil
    const fetchProfile = useCallback(async () => {
        setLoadingProfile(true);
        try {
            const profileRes = await axiosInstance.get(`/api/users/${username}/`);
            setProfileData(profileRes.data);
            setIsFollowing(profileRes.data.profile.is_following);
            console.log(profileRes)
            // 6. Ativar o modal de onboarding se for o perfil próprio e não estiver completo
            if (isOwnProfile && profileRes.data.profile && !profileRes.data.profile.onboarding_complete) {
                setShowOnboardingModal(true);
            }

        } catch (error) {
            console.error("Erro ao buscar dados do perfil", error);
            toast.error("Perfil não encontrado.");
            navigate('/');
        } finally {
            setLoadingProfile(false);
        }
    }, [username, isOwnProfile, navigate, setShowOnboardingModal]);

    // 7. Função separada e "Callback" para buscar os posts (para o Feed)
    const fetchPosts = useCallback(async () => {
        setLoadingPosts(true);
        try {
            const postsRes = await axiosInstance.get(`/api/posts/?owner__username=${username}`);
            setPosts(postsRes.data);
        } catch (error) {
             if (error.response?.status !== 401) {
                console.error("Erro ao buscar posts do usuário", error);
                toast.error("Não foi possível carregar os posts.");
             }
        } finally {
            setLoadingPosts(false);
        }
    }, [username]);

    // 8. useEffect principal que busca perfil e posts
    useEffect(() => {
        fetchProfile();
        fetchPosts();
    }, [username, fetchProfile, fetchPosts]); // Depende do username e das funções


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

    const handleStartChat = async () => {
        try {
            const response = await axiosInstance.post(`/api/chat/start/${username}/`);
            const conversationId = response.data.id;
            navigate(`/chat/${conversationId}`);
        } catch (error) {
            console.error("Erro ao iniciar a conversa", error);
            toast.error("Não foi possível iniciar o chat.");
        }
    };

    const handleAvatarClick = () => {
        if (isOwnProfile) {
            setIsEditProfileOpen(true);
        } else {
            setIsViewImageOpen(true);
        }
    };
    
    // 9. Nova função unificada para atualizar perfil (do modal)
    const handleProfileUpdate = ({ profile: updatedProfileData, user: updatedUserData }) => {
        
        setProfileData(prevData => ({
            ...prevData, 
            ...updatedUserData, 
            profile: { ...prevData.profile, ...updatedProfileData } 
        }));
        
        const newAuthUser = { 
            ...user, 
            ...updatedUserData, 
            profile: { ...user.profile, ...updatedProfileData } 
        };
        
        setUser(newAuthUser);
        localStorage.setItem('userInfo', JSON.stringify(newAuthUser));
    };

    const handleAccountDelete = async () => {
            const promise = axiosInstance.delete('/api/profile/delete/');

            toast.promise(promise, {
                loading: 'Excluindo sua conta...',
                success: 'Conta excluída com sucesso. Adeus!',
                error: 'Não foi possível excluir sua conta.'
            });

            try {
                await promise;
                setIsDeleteAccountOpen(false); 
                logoutUser(); 
            } catch (error) {
                console.error(error);
            }
        };

    // O loading principal agora é o loadingProfile
    if (loadingProfile) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    if (!profileData) {
        return <div className="text-center mt-10">Perfil não encontrado.</div>
    }

    const { bio, profile_pic, followers_count, following_count, memberships } = profileData.profile || {};

return (
        <>
            <div className="pb-20">
                <Navbar />
                <main className="container mx-auto p-4">
                    <div className="card w-full max-w-2xl mx-auto bg-base-100 shadow-xl mb-6">
                        <div className="card-body items-center text-center">
                            <div className="avatar">
                                <div className="w-24 rounded-full ring ring-offset-base-100 ring-offset-2 cursor-pointer" onClick={handleAvatarClick}>
                                    <img src={profile_pic || '/avatar-default.svg'} alt="Foto do Perfil" />
                                </div>
                            </div>
                            <h2 className="card-title text-3xl mt-4">
                                {profileData.first_name}
                            </h2>
                            {
                                <p className="text-base-content/70 -mt-2">@{profileData.username}</p>
                            }

                            <p className="text-base-content/70 mt-2">{bio || (isOwnProfile && "Adicione uma bio para se apresentar!")}</p>
                            
                            {/* Stats */}
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
                            
                            {/* Botões de Ação */}
                            <div className="card-actions justify-center gap-2 mt-4">
                                {isOwnProfile ? (
                                    <button className="btn btn-primary btn-sm" onClick={() => setIsEditProfileOpen(true)}>Editar Perfil</button>
                                ) : (
                                    <>
                                        <button 
                                            className={`btn btn-sm ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                                            onClick={handleFollowToggle}
                                        >
                                            {isFollowing ? "Deixar de Seguir" : "Seguir"}
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-secondary"
                                            onClick={handleStartChat}
                                        >
                                            Mensagem
                                        </button> 
                                    </>
                                )}
                            
                            </div>
                        </div>
                    </div>

                    {/* --- INÍCIO DA SEÇÃO DE COMUNIDADES (Fase 5) --- */}
                    {/* Esta seção só aparece se o usuário tiver comunidades */}
                    {memberships && memberships.length > 0 && (
                        <div className="card w-full max-w-2xl mx-auto bg-base-100 shadow-xl mb-6">
                            <div className="card-body p-4 sm:p-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FiUsers />
                                    Comunidades
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {/* Mapeia os 'memberships' do perfil */}
                                    {memberships.map(mem => (
                                        <Link to={`/communities/${mem.community.id}`} key={mem.id} className="avatar-group -space-x-6 hover:space-x-0 transition-all" title={mem.community.name}>
                                            <div className="avatar border-2 border-base-100">
                                                <div className="w-12">
                                                    <img src={mem.community.community_image || '/avatar-default.svg'} alt={mem.community.name} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* --- FIM DA SEÇÃO DE COMUNIDADES --- */}


                    {/* Seção de Posts */}
                    <div className="flex flex-col items-center gap-6">
                        <h3 className="text-xl font-bold self-start max-w-2xl mx-auto w-full">Posts de {profileData.username}</h3>
                        <Feed
                            posts={posts}
                            setPosts={setPosts}
                            loading={loadingPosts}
                            getPosts={fetchPosts} 
                            emptyFeedMessage="Este usuário ainda não fez nenhum post."
                            showCreateWhenEmpty={false}
                        />
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
                    onUpdate={handleProfileUpdate} 
                    onOpenDeleteConfirm={() => {
                        setIsEditProfileOpen(false); 
                        setIsDeleteAccountOpen(true); 
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

            {isOwnProfile && showOnboardingModal && <OnboardingModal />}
        </>
    );
};

export default ProfilePage;