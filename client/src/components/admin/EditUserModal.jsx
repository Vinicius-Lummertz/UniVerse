// src/components/admin/EditUserModal.jsx
import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const EditUserModal = ({ isOpen, onClose, userToEdit, onUserUpdated }) => {
    const modalRef = useRef(null);
    const [allBadges, setAllBadges] = useState([]);
    
    // Estado do formulário
    const [isStaff, setIsStaff] = useState(false);
    const [selectedBadgeIds, setSelectedBadgeIds] = useState([]);

    // 1. Controla o modal do DaisyUI
    useEffect(() => {
        if (isOpen) modalRef.current?.showModal();
        else modalRef.current?.close();
    }, [isOpen]);

    // 2. Busca todos os badges disponíveis (uma vez)
    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const response = await axiosInstance.get('/api/admin/badges/');
                setAllBadges(response.data);
            } catch (error) {
                console.error("Erro ao buscar badges:", error);
                toast.error("Não foi possível carregar a lista de badges.");
            }
        };
        fetchBadges();
    }, []);

    // 3. Popula o formulário quando o 'userToEdit' muda
    useEffect(() => {
        if (userToEdit) {
            setIsStaff(userToEdit.is_staff);
            // Mapeia os badges atuais do usuário para seus IDs
            setSelectedBadgeIds(userToEdit.profile.badges.map(badge => badge.id));
        }
    }, [userToEdit]);

    // Lida com a mudança nos checkboxes de badges
    const handleBadgeChange = (badgeId) => {
        setSelectedBadgeIds(prevIds => 
            prevIds.includes(badgeId)
                ? prevIds.filter(id => id !== badgeId) // Remove
                : [...prevIds, badgeId] // Adiciona
        );
    };

    // 4. Envia a atualização para o backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        // O backend espera os badge_ids dentro de um objeto 'profile'
        const payload = {
            is_staff: isStaff,
            profile: {
                badge_ids: selectedBadgeIds
            }
        };

        const promise = axiosInstance.patch(`/api/admin/users/${userToEdit.id}/`, payload);

        toast.promise(promise, {
            loading: 'Salvando permissões...',
            success: 'Usuário atualizado com sucesso!',
            error: 'Erro ao salvar.'
        });

        try {
            const response = await promise;
            onUserUpdated(response.data); // Retorna o usuário atualizado para o componente pai
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error.response?.data || error);
        }
    };

    return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box w-11/12 max-w-lg">
                <h3 className="font-bold text-lg">Editar: {userToEdit?.username}</h3>
                
                <form onSubmit={handleSubmit} className="py-4 space-y-4">
                    
                    {/* Toggle Admin (is_staff) */}
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text font-bold">Admin (is_staff)</span>
                            <input 
                                type="checkbox" 
                                className="toggle toggle-primary" 
                                checked={isStaff}
                                onChange={(e) => setIsStaff(e.target.checked)} 
                            />
                        </label>
                        <p className="text-xs text-base-content/60">
                            Admins têm acesso a este painel e podem moderar conteúdo.
                        </p>
                    </div>

                    <div className="divider"></div>

                    {/* Seleção de Badges */}
                    <div className="form-control">
                        <span className="label-text font-bold mb-2">Badges (Permissões)</span>
                        <div className="space-y-2">
                            {allBadges.length > 0 ? allBadges.map(badge => (
                                <label key={badge.id} className="label cursor-pointer">
                                    <span className={`badge badge-${badge.color || 'neutral'}`}>{badge.name}</span>
                                    <input 
                                        type="checkbox" 
                                        className="checkbox checkbox-primary"
                                        value={badge.id}
                                        checked={selectedBadgeIds.includes(badge.id)}
                                        onChange={() => handleBadgeChange(badge.id)}
                                    />
                                </label>
                            )) : (
                                <p className="text-xs text-base-content/60">Carregando badges...</p>
                            )}
                        </div>
                        <p className="text-xs text-base-content/60 mt-2">
                            O badge "Professor" permite criar anúncios para o curso.
                        </p>
                    </div>
                    
                    {/* Ações */}
                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                    </div>
                </form>
            </div>
            {/* Fundo clicável para fechar */}
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default EditUserModal;