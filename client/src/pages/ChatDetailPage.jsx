// src/pages/ChatDetailPage.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';
import useWebSocket, { ReadyState } from 'react-use-websocket'; // Import da biblioteca
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import Navbar from '../components/NavBar';

const ChatDetailPage = () => {
    const { id: conversationId } = useParams(); // Pega o ID da conversa da URL
    const { authTokens, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [messageHistory, setMessageHistory] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messageContainerRef = useRef(null); // Para auto-scroll

    // --- Busca de Histórico (HTTP) ---
    useEffect(() => {
        const fetchMessageHistory = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/api/chat/conversations/${conversationId}/messages/`);
                setMessageHistory(response.data);
            } catch (error) {
                toast.error("Não foi possível carregar o histórico.");
                console.error(error);
                navigate('/chat'); // Volta para a lista se falhar
            } finally {
                setLoading(false);
            }
        };
        fetchMessageHistory();
    }, [conversationId, navigate]);

    // --- Configuração do WebSocket ---
    const getWebSocketUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).host : 'localhost:8000';
        const currentTokens = JSON.parse(localStorage.getItem('authTokens'));
        const accessToken = currentTokens ? currentTokens.access : null;
        
        return `${protocol}://${host}/ws/chat/${conversationId}/?token=${accessToken}`;
    };

    const { sendMessage, lastMessage, readyState } = useWebSocket(getWebSocketUrl(), {
        // Esta função é chamada sempre que uma nova mensagem chega do WebSocket
        onMessage: (event) => {
            const data = JSON.parse(event.data);
            // Adiciona a nova mensagem ao estado do histórico
            setMessageHistory(prev => [...prev, data]);
        },
        // Tenta reconectar se a conexão cair
        shouldReconnect: (closeEvent) => true,
        reconnectAttempts: 10,
        reconnectInterval: 3000,
    });

    // --- Lidar com o envio de novas mensagens ---
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Envia a mensagem pelo WebSocket
        sendMessage(JSON.stringify({
            'message': newMessage
        }));
        setNewMessage(''); // Limpa o input
    };

    // --- Auto-scroll para a última mensagem ---
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messageHistory]); // Roda sempre que o histórico (ou uma nova msg) mudar

    // Status da conexão (opcional, mas bom para debug)
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Conectando...',
        [ReadyState.OPEN]: 'Conectado',
        [ReadyState.CLOSING]: 'Fechando...',
        [ReadyState.CLOSED]: 'Desconectado',
        [ReadyState.UNINSTANTIATED]: 'Não instanciado',
    }[readyState];

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            
            {/* Header do Chat (Voltar) */}
            <div className="bg-base-200 p-3 flex items-center gap-2 shadow">
                <button onClick={() => navigate('/chat')} className="btn btn-ghost btn-circle">
                    <FiArrowLeft size={20} />
                </button>
                <span className="font-bold">Conversa</span>
                <span className="text-xs text-base-content/60 ml-auto">{connectionStatus}</span>
            </div>

            {/* Container das Mensagens (com scroll) */}
            <main ref={messageContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto bg-base-100">
                {messageHistory.map((msg, index) => (
                    <div key={msg.id || index} className={`chat ${msg.author_username === user.username ? 'chat-end' : 'chat-start'}`}>
                        <div className="chat-image avatar avatar-xs placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-8">
                                <span className="text-sm">{msg.author_username.substring(0, 1).toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="chat-header text-xs opacity-50">
                            {msg.author_username}
                            <time className="ml-1">{new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                        </div>
                        <div className="chat-bubble">{msg.content}</div>
                    </div>
                ))}
            </main>

            {/* Input de Envio de Mensagem */}
            <form onSubmit={handleSendMessage} className="p-4 bg-base-200 flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="input input-bordered flex-grow"
                />
                <button type="submit" className="btn btn-primary btn-circle">
                    <FiSend size={20} />
                </button>
            </form>
            {/* O BottomNav não é mostrado nesta página para dar espaço ao input */}
        </div>
    );
};

export default ChatDetailPage;