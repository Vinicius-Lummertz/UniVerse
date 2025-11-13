// src/pages/CommunityDetailPage.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import Feed from '../components/Feed';
import { FiUsers, FiFileText, FiSettings } from 'react-icons/fi';
import MemberManagementTab from '../components/communities/MemberManagementTab'; // Fase 4

// Botão de Ação Principal (Fase 2)
const ActionButton = ({ community, membershipStatus, membershipId, onAction }) => {
    
    const handleJoin = async () => {
        const promise = axiosInstance.post(`/api/communities/${community.id}/join/`);
        toast.promise(promise, {
            loading: 'Processando...',
            success: community.privacy === 'public' ? 'Você entrou na comunidade!' : 'Solicitação enviada!',
            error: 'Não foi possível processar.'
        });
        try {
            await promise;
            onAction(); // Recarrega os dados da página
        } catch (error) {
            console.error(error);
        }
    };
    
    const handleLeave = async () => {
        const promise = axiosInstance.delete(`/api/communities/members/${membershipId}/remove/`);
        toast.promise(promise, {
            loading: 'Saindo...',
            success: 'Você saiu da comunidade.',
            error: (err) => err.response?.data?.[0] || 'Não foi possível sair.'
        });
        try {
            await promise;
            onAction(); // Recarrega os dados da página
        } catch (error) {
            console.error(error);
        }
    };

    switch (membershipStatus) {
        case 'admin':
        case 'member':
            return <button className="btn btn-outline btn-sm" onClick={handleLeave}>Sair da Comunidade</button>;
        case 'pending':
            return <button className="btn btn-sm" disabled>Solicitação Pendente</button>;
        case 'none':
        default:
            return <button className="btn btn-primary btn-sm" onClick={handleJoin}>{community.privacy === 'public' ? 'Entrar' : 'Solicitar Entrada'}</button>;
    }
};

const CommunityDetailPage = () => {
    const { id: communityId } = useParams();
    const navigate = useNavigate();
    
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' ou 'members'
    
    // Pega o 'user' para recarregar o perfil após sair da comunidade
    const { user, setUser } = useContext(AuthContext);

    // Função para buscar TODOS os dados da página (comunidade e posts)
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Busca dados da Comunidade (inclui status de membro)
            const communityRes = await axiosInstance.get(`/api/communities/${communityId}/`);
            setCommunity(communityRes.data);
            
            // 2. Se for membro, busca os posts do Feed (Fase 3)
            const status = communityRes.data.membership_status;
            if (status === 'member' || status === 'admin') {
                const postsRes = await axiosInstance.get(`/api/communities/${communityId}/feed/`);
                setPosts(postsRes.data);
            } else {
                setPosts([]); // Limpa os posts se não for membro
            }
            
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error("Comunidade não encontrada.");
                navigate('/communities');
            }
        } finally {
            setLoading(false);
        }
    }, [communityId, navigate]);

    // Busca inicial
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Função para recarregar perfil no AuthContext (quando sai da comunidade)
    const refreshProfile = async () => {
         try {
            const userResponse = await axiosInstance.get(`/api/users/${user.username}/`);
            setUser(userResponse.data);
            localStorage.setItem('userInfo', JSON.stringify(userResponse.data));
         } catch (error) {
             console.error("Erro ao recarregar perfil no contexto", error);
         }
    };
    
    // Handler para os botões de ação (Fase 2)
    const handleAction = () => {
        fetchData(); // Recarrega dados da comunidade
        refreshProfile(); // Recarrega o perfil (para atualizar lista no ProfilePage)
    };

    if (loading || !community) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    const { membership_status, membership_id, is_admin } = community;
    const isMember = membership_status === 'member' || membership_status === 'admin';
    const isAdmin = membership_status === 'admin';

    return (
        <>
            <Navbar />
            <div className="pb-20">
                <main className="container mx-auto p-4">
                    {/* Header da Comunidade (Capa, Foto, Nome, Ação) */}
                    <div className="card w-full max-w-3xl mx-auto bg-base-100 shadow-xl mb-6">
                        <figure className="h-48 bg-base-300">
                            <img src={community.cover_image || '/planets.png'} alt="Capa" className="object-cover w-full h-full" />
                        </figure>
                        <div className="card-body p-4 md:p-8">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
                                <div className="avatar">
                                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                        <img src={community.community_image || '/avatar-default.svg'} alt={community.name} />
                                    </div>
                                </div>
                                <div className="flex-grow text-center sm:text-left">
                                    <h2 className="card-title text-3xl">{community.name}</h2>
                                    <p className="text-base-content/70">Admin: @{community.admin}</p>
                                </div>
                                <div className="card-actions flex-shrink-0">
                                    <ActionButton
                                        community={community}
                                        membershipStatus={membership_status}
                                        membershipId={membership_id}
                                        onAction={handleAction}
                                    />
                                </div>
                            </div>
                            <p className="mt-4">{community.description || "Nenhuma descrição fornecida."}</p>
                        </div>
                    </div>

                    {/* Abas da Comunidade (Feed e Membros) (Fase 3 e 4) */}
                    <div className="max-w-3xl mx-auto">
                        <div role="tablist" className="tabs tabs-bordered">
                            <a role="tab" className={`tab ${activeTab === 'feed' ? 'tab-active' : ''}`} onClick={() => setActiveTab('feed')}>
                                <FiFileText className="mr-2" /> Feed
                            </a>
                            <a role="tab" className={`tab ${activeTab === 'members' ? 'tab-active' : ''}`} onClick={() => setActiveTab('members')}>
                                <FiUsers className="mr-2" /> Membros
                            </a>
                            {isAdmin && ( // Aba de Admin
                                <a role="tab" className={`tab ${activeTab === 'admin' ? 'tab-active' : ''}`} onClick={() => setActiveTab('admin')}>
                                    <FiSettings className="mr-2" /> Gerenciar
                                </a>
                            )}
                        </div>
                        
                        {/* Conteúdo da Aba */}
                        <div className="mt-6">
                            {/* Aba Feed (Fase 3) */}
                            {activeTab === 'feed' && (
                                <>
                                    {!isMember ? (
                                        <div className="card bg-base-100 shadow-lg text-center p-8">
                                            <h3 className="font-bold">Conteúdo Privado</h3>
                                            <p>Você deve ser um membro aprovado para ver e criar posts nesta comunidade.</p>
                                        </div>
                                    ) : (
                                        <Feed
                                            posts={posts}
                                            setPosts={setPosts}
                                            loading={loading}
                                            getPosts={fetchData} // Recarrega tudo
                                            emptyFeedMessage="Esta comunidade ainda não tem posts."
                                            showCreateWhenEmpty={true}
                                            communityId={communityId}
                                            isMember={isMember}
                                            />
                                    )}
                                </>
                            )}
                            
                            {/* Aba Membros (Será a Fase 4) */}
                            {activeTab === 'members' && (
                                <p>Em breve: Lista de membros.</p>
                            )}

                            {/* Aba Gerenciar (Fase 4) */}
                            {activeTab === 'admin' && isAdmin && (
                                <MemberManagementTab communityId={communityId} />
                            )}
                        </div>
                    </div>
                </main>
            </div>
            <BottomNav />
        </>
    );
};

export default CommunityDetailPage;