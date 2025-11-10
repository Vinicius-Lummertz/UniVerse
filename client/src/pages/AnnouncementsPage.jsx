// src/pages/AnnouncementsPage.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FiPlus, FiBell } from 'react-icons/fi';

const AnnouncementsPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { user } = useContext(AuthContext);

    // --- VERIFICAÇÃO ATUALIZADA ---
    // Lê as permissões do JSONField de cada badge que o usuário possui.
    const canCreate = user?.profile?.badges?.some(
        badge => badge.permissions?.can_send_announcement
    ) || user?.is_staff; // Superusuário (is_staff) sempre pode.

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/api/announcements/');
            setAnnouncements(response.data);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error("Não foi possível carregar os recados.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    return (
        <>
            <Navbar />
            <div className="pb-20">
                <main className="container mx-auto p-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">
                            Mural de Recados
                        </h1>
                        {/* O 'canCreate' agora usa a nova lógica */}
                        {canCreate && (
                            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                                <FiPlus /> Novo Recado
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {loading && (
                             <div className="flex justify-center items-center h-64">
                                <span className="loading loading-spinner loading-lg"></span>
                            </div>
                        )}
                        
                        {!loading && announcements.length === 0 && (
                            <div className="card w-full bg-base-100 shadow-xl">
                                <div className="card-body items-center text-center">
                                    <FiBell size={48} className="text-base-content/30" />
                                    <h2 className="card-title mt-4">Nenhum recado por aqui</h2>
                                    <p>Ainda não há recados para sua universidade ou curso.</p>
                                </div>
                            </div>
                        )}

                        {!loading && announcements.map(announcement => (
                            <div key={announcement.id} className="card w-full bg-base-100 shadow-xl">
                                {console.log(announcement)}
                                <div className="card-body">
                                    {/* Mostra o alvo do recado (Global, Universidade, Curso) */}
                                    <div className="text-xs font-semibold text-primary mb-2">
                                        {announcement.target_course || announcement.target_university || "Recado Global"}
                                    </div>
                                    <p className="whitespace-pre-wrap">{announcement.content}</p>
                                    <div className="divider my-1"></div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold">
                                            Por: {announcement.author}
                                        </span>
                                        <span className="text-base-content/60">
                                            {new Date(announcement.timestamp).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
            <BottomNav />
            
            <CreateAnnouncementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAnnouncementCreated={fetchAnnouncements}
            />
        </>
    );
};

export default AnnouncementsPage;