// src/pages/CommunitiesPage.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import CreateCommunityModal from '../components/communities/CreateCommunityModal';

const CommunitiesPage = () => {
    const [communities, setCommunities] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { user, fetchNotificationStatus } = useContext(AuthContext); // Pega o usuário para checar permissão

    // Verifica se o usuário pode criar (é staff ou não atingiu o limite)
    const canCreateCommunity = user?.is_staff || !(user?.profile?.memberships || []).some(mem => mem.community?.admin === user.username);

    const fetchCommunities = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/api/communities/');
            setCommunities(response.data);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error("Não foi possível carregar as comunidades.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCommunities();
    }, [fetchCommunities]);

    const filteredCommunities = communities.filter(community =>
        community.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleCommunityCreated = () => {
        fetchCommunities(); // Recarrega a lista
        // (O AuthContext será atualizado pelo modal para checar o limite)
        setIsModalOpen(false);
    };

    return (
        <>
            <Navbar />
            <div className="pb-20">
                <main className="container mx-auto p-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Explorar Comunidades</h1>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => setIsModalOpen(true)}
                            disabled={!canCreateCommunity} // Desabilita se não puder criar
                            title={!canCreateCommunity ? "Você só pode criar 1 comunidade." : "Criar nova comunidade"}
                        >
                            <FiPlus /> Criar Comunidade
                        </button>
                    </div>

                    {/* Barra de Busca */}
                    <div className="form-control mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar comunidade por nome..."
                                className="input input-bordered w-full pl-10"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60" />
                        </div>
                    </div>

                    {/* Lista de Comunidades */}
                    {loading ? (
                        <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCommunities.map(community => (
                                <Link to={`/communities/${community.id}`} key={community.id} className="card bg-base-100 shadow-xl image-full hover:shadow-2xl transition-shadow">
                                    <figure>
                                        <img src={community.cover_image || '/planets.png'} alt={community.name} className="object-cover w-full h-48" />
                                    </figure>
                                    <div className="card-body justify-end p-4 bg-gradient-to-t from-black/70 to-transparent">
                                        <h2 className="card-title text-white">{community.name}</h2>
                                        <p className="text-sm text-white/80">Admin: @{community.admin}</p>
                                    </div>
                                </Link>
                            ))}
                            {filteredCommunities.length === 0 && !loading && (
                                <p className="col-span-full text-center text-base-content/70">Nenhuma comunidade encontrada.</p>
                            )}
                        </div>
                    )}
                </main>
            </div>
            <BottomNav />
            
            <CreateCommunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCommunityCreated={handleCommunityCreated}
            />
        </>
    );
};

export default CommunitiesPage;