// src/components/admin/BadgeEditModal.jsx
import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

// Cores do DaisyUI para seleção
const DAISY_COLORS = [
    'default', 'primary', 'secondary', 'accent', 
    'info', 'success', 'warning', 'error', 'neutral'
];

const BadgeEditModal = ({ isOpen, onClose, badgeToEdit, onBadgeSaved }) => {
    const modalRef = useRef(null);
    const isEditMode = Boolean(badgeToEdit);
    
    // Estado do formulário
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [color, setColor] = useState('default');
    const [canAccessAdmin, setCanAccessAdmin] = useState(false);
    const [canSendAnnouncement, setCanSendAnnouncement] = useState(false);
    const [canModeratePosts, setCanModeratePosts] = useState(false);

    // 1. Controla o modal do DaisyUI
    useEffect(() => {
        if (isOpen) modalRef.current?.showModal();
        else modalRef.current?.close();
    }, [isOpen]);

    // 2. Popula o formulário quando o 'badgeToEdit' muda (ou limpa se for nulo)
    useEffect(() => {
        if (badgeToEdit) {
            setName(badgeToEdit.name);
            setIcon(badgeToEdit.icon || '');
            setColor(badgeToEdit.color || 'default');
            setCanAccessAdmin(badgeToEdit.can_access_admin_panel);
            setCanSendAnnouncement(badgeToEdit.can_send_announcement);
            setCanModeratePosts(badgeToEdit.can_moderate_global_posts);
        } else {
            // Limpa para o modo "Criar"
            setName('');
            setIcon('');
            setColor('default');
            setCanAccessAdmin(false);
            setCanSendAnnouncement(false);
            setCanModeratePosts(false);
        }
    }, [badgeToEdit, isOpen]); // Depende do isOpen para resetar ao reabrir

    // 3. Envia os dados (POST ou PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name,
            icon,
            color,
            can_access_admin_panel: canAccessAdmin,
            can_send_announcement: canSendAnnouncement,
            can_moderate_global_posts: canModeratePosts,
        };

        const url = isEditMode 
            ? `/api/admin/badges/manage/${badgeToEdit.id}/` 
            : `/api/admin/badges/manage/`;
            
        const method = isEditMode ? 'put' : 'post';

        const promise = axiosInstance[method](url, payload);

        toast.promise(promise, {
            loading: isEditMode ? 'Atualizando badge...' : 'Criando badge...',
            success: `Badge ${isEditMode ? 'atualizado' : 'criado'}!`,
            error: 'Erro ao salvar.'
        });

        try {
            await promise;
            onBadgeSaved(); // Avisa o pai para recarregar
        } catch (error) {
            console.error("Erro ao salvar badge:", error.response?.data || error);
            // Mostra erros de validação da API (ex: nome duplicado)
            if (error.response?.data?.name) {
                toast.error(`Erro: ${error.response.data.name[0]}`);
            }
        }
    };

    return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box w-11/12 max-w-lg">
                <h3 className="font-bold text-lg">
                    {isEditMode ? `Editar Badge: ${badgeToEdit.name}` : "Criar Novo Badge"}
                </h3>
                
                <form onSubmit={handleSubmit} className="py-4 space-y-4">
                    
                    {/* Infos Básicas */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Nome do Badge (Obrigatório)</span></label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered" required />
                    </div>
                    <div className="flex gap-4">
                        <div className="form-control w-1/2">
                            <label className="label"><span className="label-text">Ícone (Emoji ou Texto)</span></label>
                            <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className="input input-bordered" placeholder="Ex: 🧑‍🏫 ou 'Admin'" />
                        </div>
                        <div className="form-control w-1/2">
                            <label className="label"><span className="label-text">Cor</span></label>
                            <select value={color} onChange={(e) => setColor(e.target.value)} className="select select-bordered">
                                {DAISY_COLORS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="divider">Permissões</div>

                    {/* Toggles de Permissão */}
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text font-medium">Pode Acessar o Painel Admin?</span>
                            <input type="checkbox" className="toggle toggle-primary" checked={canAccessAdmin} onChange={(e) => setCanAccessAdmin(e.target.checked)} />
                        </label>
                    </div>
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text font-medium">Pode Enviar Recados (Anúncios)?</span>
                            <input type="checkbox" className="toggle toggle-primary" checked={canSendAnnouncement} onChange={(e) => setCanSendAnnouncement(e.target.checked)} />
                        </label>
                    </div>
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text font-medium">Pode Moderar Posts (Global)?</span>
                            <input type="checkbox" className="toggle toggle-primary" checked={canModeratePosts} onChange={(e) => setCanModeratePosts(e.target.checked)} />
                        </label>
                    </div>
                    
                    {/* Ações */}
                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
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

export default BadgeEditModal;