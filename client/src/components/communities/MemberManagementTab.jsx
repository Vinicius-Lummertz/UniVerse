// src/components/communities/MemberManagementTab.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import AuthContext from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiShield, FiArrowUpCircle, FiArrowDownCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const MemberManagementTab = ({ communityId }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext); // Para checar se é o Dono

    // Busca de Membros (Fase 4 API)
    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/api/communities/${communityId}/members/`);
            setMembers(response.data);
        } catch (error) {
            toast.error("Não foi possível carregar os membros.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Ações de Moderação (Fase 4)
    const handleAction = async (endpoint, successMsg, errorMsg) => {
        const promise = axiosInstance.post(endpoint);
        toast.promise(promise, {
            loading: 'Processando...',
            success: successMsg,
            error: (err) => err.response?.data?.[0] || errorMsg
        });

        try {
            await promise;
            fetchMembers(); // Recarrega a lista
        } catch (error) {
            console.error(error);
        }
    };
    
    // Ação de Deleção (Fase 4)
    const handleRemove = async (membership) => {
        if (!window.confirm(`Tem certeza que deseja remover @${membership.user} da comunidade?`)) return;

        const promise = axiosInstance.delete(`/api/communities/members/${membership.id}/remove/`);
        toast.promise(promise, {
            loading: 'Removendo...',
            success: `@${membership.user} removido.`,
            error: (err) => err.response?.data?.[0] || 'Não foi possível remover.'
        });
        
        try {
            await promise;
            fetchMembers(); // Recarrega
        } catch (error) {
             console.error(error);
        }
    };

    const isOwner = user.username === members.find(m => m.community.admin_username === user.username)?.community.admin_username; // Encontra o dono

    if (loading) return <div className="flex justify-center"><span className="loading loading-spinner"></span></div>;

    return (
        <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
                <h2 className="card-title">Gerenciar Membros</h2>
                
                {/* 1. Lista de Pendentes */}
                <h3 className="font-bold mt-4">Solicitações Pendentes</h3>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <tbody>
                            {members.filter(m => m.status === 'pending').map(mem => (
                                <tr key={mem.id}>
                                    <td><Link to={`/profile/${mem.user}`} className="link">@{mem.user}</Link></td>
                                    <td className="text-right space-x-2">
                                        <button className="btn btn-success btn-xs" onClick={() => handleAction(`/api/communities/members/${mem.id}/approve/`, 'Membro aprovado!', 'Erro ao aprovar.')}>
                                            <FiCheck /> Aprovar
                                        </button>
                                        <button className="btn btn-error btn-xs" onClick={() => handleRemove(mem)}>
                                            <FiX /> Rejeitar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {members.filter(m => m.status === 'pending').length === 0 && (
                                <tr><td colSpan="2" className="text-center text-base-content/60">Nenhuma solicitação pendente.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 2. Lista de Membros Aprovados */}
                <h3 className="font-bold mt-6">Membros Aprovados</h3>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Membro</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.filter(m => m.status === 'approved').map(mem => (
                                <tr key={mem.id}>
                                    <td><Link to={`/profile/${mem.user}`} className="link">@{mem.user}</Link></td>
                                    <td>
                                        {mem.community.admin_username === mem.user ? (
                                            <span className="badge badge-primary">Dono</span>
                                        ) : mem.is_admin ? (
                                            <span className="badge badge-secondary">Admin</span>
                                        ) : (
                                            <span className="badge badge-ghost">Membro</span>
                                        )}
                                    </td>
                                    <td className="space-x-2">
                                        {/* Lógica de Promoção/Rebaixamento (Fase 4) */}
                                        {isOwner && mem.community.admin_username !== mem.user && (
                                            <button 
                                                className={`btn btn-xs ${mem.is_admin ? 'btn-warning' : 'btn-info'}`}
                                                onClick={() => handleAction(`/api/communities/members/${mem.id}/promote/`, 'Status de admin atualizado!', 'Erro ao atualizar status.')}
                                            >
                                                {mem.is_admin ? <FiArrowDownCircle /> : <FiArrowUpCircle />}
                                                {mem.is_admin ? 'Rebaixar' : 'Promover'}
                                            </button>
                                        )}
                                        {/* Lógica de Remoção */}
                                        {mem.community.admin_username !== mem.user && (
                                            <button className="btn btn-error btn-xs" onClick={() => handleRemove(mem)}>
                                                <FiX /> Remover
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MemberManagementTab;