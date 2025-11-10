// src/components/admin/BadgeManagementTab.jsx
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import BadgeEditModal from './BadgeEditModal'; 
import ConfirmationModal from '../ConfirmationModal'; 
import { FiEdit, FiTrash2, FiShield, FiPlus, FiCheck } from 'react-icons/fi';

// Helper para mostrar permissões
const PermissionIcon = ({ enabled }) => (
    enabled ? <FiCheck className="text-success" /> : <span className="text-base-content/30">-</span>
);

const BadgeManagementTab = () => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState(null); 

    const fetchBadges = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/api/admin/badges/manage/');
            setBadges(response.data);
        } catch (err) {
            console.error("Erro ao buscar badges:", err);
            toast.error("Erro ao carregar badges.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBadges();
    }, [fetchBadges]);

    // --- Handlers de Ação ---
    const handleOpenCreate = () => {
        setSelectedBadge(null); 
        setIsEditModalOpen(true);
    };

    const handleOpenEdit = (badge) => {
        setSelectedBadge(badge); 
        setIsEditModalOpen(true);
    };

    const handleOpenDelete = (badge) => {
        setSelectedBadge(badge);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setSelectedBadge(null);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
    };

    const handleBadgeSaved = () => {
        fetchBadges(); 
        handleCloseModals();
    };

    const confirmDelete = async () => {
        if (!selectedBadge) return;

        const promise = axiosInstance.delete(`/api/admin/badges/manage/${selectedBadge.id}/`);
        toast.promise(promise, {
            loading: 'Excluindo badge...',
            success: 'Badge excluído com sucesso!',
            error: 'Não foi possível excluir o badge.'
        });

        try {
            await promise;
            fetchBadges(); 
            handleCloseModals();
        } catch (err) {
            console.error(err);
            handleCloseModals();
        }
    };

    if (loading) return <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Gerenciar Badges e Permissões</h2>
                <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
                    <FiPlus /> Criar Novo Badge
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th>Badge</th>
                            {/* ATUALIZADO: Lendo do 'permissions' JSONField */}
                            <th className="text-center" title="Permite acesso ao Painel Admin (/admin)">Acessa Admin</th>
                            <th className="text-center" title="Permite enviar Anúncios/Recados">Envia Recados</th>
                            <th className="text-center" title="Permite deletar posts de outros usuários">Modera Posts</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {badges.map(badge => (
                            <tr key={badge.id}>
                                <td>
                                    <span className={`badge badge-${badge.color || 'neutral'} gap-1`}>
                                        {badge.icon || <FiShield />} {badge.name}
                                    </span>
                                </td>
                                {/* ATUALIZADO: Lendo do 'permissions' JSONField */}
                                <td className="text-center"><PermissionIcon enabled={badge.permissions?.can_access_admin_panel} /></td>
                                <td className="text-center"><PermissionIcon enabled={badge.permissions?.can_send_announcement} /></td>
                                <td className="text-center"><PermissionIcon enabled={badge.permissions?.can_moderate_global_posts} /></td>
                                <td className="space-x-1">
                                    <button className="btn btn-ghost btn-xs" onClick={() => handleOpenEdit(badge)}>
                                        <FiEdit />
                                    </button>
                                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleOpenDelete(badge)}>
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modais */}
            <BadgeEditModal
                isOpen={isEditModalOpen}
                onClose={handleCloseModals}
                badgeToEdit={selectedBadge}
                onBadgeSaved={handleBadgeSaved}
            />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseModals}
                onConfirm={confirmDelete}
                title={`Excluir Badge "${selectedBadge?.name}"?`}
                message="Você tem certeza? Esta ação não pode ser desfeita. Usuários com este badge perderão suas permissões."
            />
        </div>
    );
};

export default BadgeManagementTab;