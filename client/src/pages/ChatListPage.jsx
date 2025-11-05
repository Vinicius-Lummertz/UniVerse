// src/pages/ChatListPage.jsx
import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';
import Navbar from '../components/NavBar';
const ChatListPage = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext); // Precisamos do usuário logado para comparar

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            try {
                // Busca no endpoint que criamos
                const response = await axiosInstance.get('/api/chat/conversations/');
                setConversations(response.data);
            } catch (error) {
                 if (error.response?.status !== 401) {
                    toast.error("Não foi possível carregar suas conversas.");
                 }
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    // Função para mostrar o nome do "outro" participante na conversa
    const getOtherParticipant = (participants) => {
        return participants.find(username => username !== user.username);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    return (
        <div className="pb-20">
            <Navbar />
            <main className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Suas Conversas</h1>
                {conversations.length > 0 ? (
                    <div className="divide-y divide-base-300">
                        {conversations.map(convo => {
                            const otherUser = getOtherParticipant(convo.participant_usernames);
                            return (
                                <Link 
                                    to={`/chat/${convo.id}`} 
                                    key={convo.id}
                                    className="p-4 flex items-center gap-4 hover:bg-base-200"
                                >
                                    {/* Avatar */}
                                    <div className="avatar placeholder">
                                        <div className="bg-neutral text-neutral-content rounded-full w-12">
                                            <span className="text-xl">{otherUser.substring(0, 1).toUpperCase()}</span>
                                        </div>
                                    </div>
                                    {/* Info */}
                                    <div className="flex-grow">
                                        <p className="font-bold">{otherUser}</p>
                                        <p className="text-sm text-base-content/70 truncate">
                                            {convo.last_message ? convo.last_message.content : "Nenhuma mensagem ainda."}
                                        </p>
                                    </div>
                                    {/* Timestamp */}
                                    <div className="text-xs text-base-content/60">
                                        {convo.last_message && new Date(convo.last_message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <p>Você não tem nenhuma conversa. Inicie uma pela página de perfil de um usuário.</p>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default ChatListPage;