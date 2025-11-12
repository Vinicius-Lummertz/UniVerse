// src/pages/NotificationsPage.jsx
import { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FiBell, FiAlertTriangle, FiUserCheck, FiMessageSquare, FiAward, FiHeart } from 'react-icons/fi'; // 1. Importar FiHeart
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
    const [activeTab, setActiveTab] = useState('announcements'); 
    
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnn, setLoadingAnn] = useState(true);

    const [notifications, setNotifications] = useState([]);
    const [loadingSoc, setLoadingSoc] = useState(true);

    const { user, fetchNotificationStatus } = useContext(AuthContext);

    // Busca Recados (Avisos)
    useEffect(() => {
        const fetchAnnouncements = async () => {
            setLoadingAnn(true);
            try {
                const response = await axiosInstance.get('/api/announcements/');
                setAnnouncements(response.data);
                
                const unreadIds = response.data
                    .filter(ann => ann.read_by && !ann.read_by.includes(user.id))
                    .map(ann => ann.id);

                if (unreadIds.length > 0) {
                    await axiosInstance.post('/api/announcements/mark-read/', { ids: unreadIds });
                    fetchNotificationStatus(); 
                }
            } catch (error) {
                if (error.response?.status !== 401) {
                    toast.error("Não foi possível carregar os avisos.");
                }
                console.error("Erro em fetchAnnouncements:", error); 
            } finally {
                setLoadingAnn(false);
            }
        };

        fetchAnnouncements();
    }, [user.id, fetchNotificationStatus]); 

    // Busca Notificações (Social)
    useEffect(() => {
        const fetchSocialNotifications = async () => {
            setLoadingSoc(true);
            try {
                const response = await axiosInstance.get('/api/notifications/');
                setNotifications(response.data);
                
                const hasUnread = response.data.some(notif => !notif.read);

                if (hasUnread) {
                    await axiosInstance.post('/api/notifications/mark-read/');
                    fetchNotificationStatus();
                }
            } catch (error) {
                if (error.response?.status !== 401) {
                    toast.error("Não foi possível carregar as notificações.");
                }
            } finally {
                setLoadingSoc(false);
            }
        };

        if (activeTab === 'social') {
            fetchSocialNotifications();
        }
    }, [activeTab, fetchNotificationStatus]); 

    // 2. Atualizar Helper de Ícone
    const NotificationIcon = ({ verb }) => {
        if (verb === 'follow') return <FiUserCheck className="text-info" />;
        if (verb === 'comment') return <FiMessageSquare className="text-success" />;
        if (verb === 'reaction') return <FiHeart className="text-error" />; // Alterado para FiHeart
        if (verb === 'membership_approved') return <FiAward className="text-primary" />;
        return <FiBell />;
    };

    // 3. Helper para criar o texto e o link da notificação
    const NotificationLink = ({ notif }) => {
        const senderLink = (
            <Link to={`/profile/${notif.sender_username}`} className="font-bold link link-hover">
                {notif.sender_username}
            </Link>
        );

        // Caso 1: Notificação de Post (Comentário ou Reação)
        if (notif.post_id) {
            return (
                <p>
                    {senderLink}
                    {' '}{notif.verb}
                    <Link to={`/posts/${notif.post_id}`} className="font-semibold italic link link-hover ml-1">
                        "{notif.post_title || 'seu post'}"
                    </Link>
                </p>
            );
        }

        // Caso 2: Notificação de Comunidade
        if (notif.community_id) {
            return (
                 <p>
                    {senderLink}
                    {' '}{notif.verb}
                    <Link to={`/communities/${notif.community_id}`} className="font-semibold italic link link-hover ml-1">
                        {notif.community_name || 'sua comunidade'}
                    </Link>
                </p>
            );
        }
        
        // Caso 3: Notificação de Follow (sem link de post)
        if (notif.verb === 'follow') {
             return <p>{senderLink} {notif.verb}</p>;
        }

        // Caso Genérico
        return <p>{senderLink} {notif.verb}</p>;
    };


    return (
        <>
            <Navbar />
            <div className="pb-20">
                <main className="container mx-auto p-4">
                    <h1 className="text-3xl font-bold mb-6">Central de Notificações</h1>

                    {/* Abas */}
                    <div role="tablist" className="tabs tabs-lifted tabs-lg mb-6">
                        <a
                            role="tab"
                            className={`tab ${activeTab === 'announcements' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('announcements')}
                        >
                            <FiAlertTriangle className="mr-2 text-error" /> Avisos (Recados)
                        </a>
                        <a
                            role="tab"
                            className={`tab ${activeTab === 'social' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('social')}
                        >
                            <FiBell className="mr-2 text-secondary" /> Notificações
                        </a>
                    </div>

                    {/* Conteúdo das Abas */}
                    <div className="card w-full bg-base-100 shadow-xl">
                        <div className="card-body">
                            
                            {/* === ABA DE AVISOS (Recados) === */}
                            {activeTab === 'announcements' && (
                                <div className="space-y-4">
                                    {loadingAnn && <div className="text-center p-4"><span className="loading loading-spinner"></span></div>}
                                    {!loadingAnn && announcements.length === 0 && (
                                        <p className="text-base-content/70 text-center p-4">Nenhum aviso da sua universidade ou curso por enquanto.</p>
                                    )}
                                    {announcements.map(ann => (
                                        <div key={ann.id} className="flex gap-4 p-3 border-b border-base-200">
                                            <FiAlertTriangle className="text-error mt-1 flex-shrink-0" size={20} />
                                            <div className="flex-grow">
                                                <p className="whitespace-pre-wrap">{ann.content}</p>
                                                <div className="text-xs text-base-content/60 mt-2">
                                                    Por: {ann.author} ({ann.target_course || ann.target_university || "Global"})
                                                </div>
                                            </div>
                                            <time className="text-xs text-base-content/60 flex-shrink-0">
                                                {new Date(ann.timestamp).toLocaleDateString('pt-BR')}
                                            </time>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* === ABA DE NOTIFICAÇÕES (Social) === */}
                            {activeTab === 'social' && (
                                <div className="space-y-4">
                                    {loadingSoc && <div className="text-center p-4"><span className="loading loading-spinner"></span></div>}
                                    {!loadingSoc && notifications.length === 0 && (
                                        <p className="text-base-content/70 text-center p-4">Nenhuma notificação social ainda.</p>
                                    )}
                                    {notifications.map(notif => (
                                        // 4. Renderiza a linha da notificação
                                        <div key={notif.id} className="flex gap-4 p-3 border-b border-base-200 items-center">
                                            <div className="flex-shrink-0">
                                                <NotificationIcon verb={notif.verb} />
                                            </div>
                                            <div className="flex-grow">
                                                <NotificationLink notif={notif} />
                                            </div>
                                            <time className="text-xs text-base-content/60 flex-shrink-0">
                                                {new Date(notif.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </time>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </div>
            <BottomNav />
        </>
    );
};

export default NotificationsPage;