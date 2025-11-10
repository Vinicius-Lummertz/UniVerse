// src/components/admin/BadgeEditModal.jsx
import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const DAISY_COLORS = [
    'default', 'primary', 'secondary', 'accent', 
    'info', 'success', 'warning', 'error', 'neutral'
];

// Define as permissões padrão para garantir que o formulário funcione
const defaultPermissions = {
    can_access_admin_panel: false,
    can_send_announcement: false,
    can_moderate_global_posts: false
};

const BadgeEditModal = ({ isOpen, onClose, badgeToEdit, onBadgeSaved }) => {
    const modalRef = useRef(null);
    const isEditMode = Boolean(badgeToEdit);
    
    // Estado do formulário
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [color, setColor] = useState('default');
    
    // ATUALIZADO: O estado das permissões é um objeto
    const [permissions, setPermissions] = useState(defaultPermissions);

    useEffect(() => {
        if (isOpen) modalRef.current?.showModal();
        else modalRef.current?.close();
    }, [isOpen]);

    useEffect(() => {
        if (badgeToEdit) {
            // Modo Edição: Popula com dados do badge
            setName(badgeToEdit.name);
            setIcon(badgeToEdit.icon || '');
            setColor(badgeToEdit.color || 'default');
            // Garante que o estado de permissões tenha todas as chaves
            setPermissions({ ...defaultPermissions, ...(badgeToEdit.permissions || {}) });
        } else {
            // Modo Criar: Reseta para os padrões
            setName('');
            setIcon('');
            setColor('default');
            setPermissions(defaultPermissions);
        }
    }, [badgeToEdit, isOpen]);

    // ATUALIZADO: Handler para atualizar o objeto de permissões
    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setPermissions(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ATUALIZADO: O payload agora envia o objeto 'permissions'
        const payload = {
            name,
            icon,
            color,
            permissions: permissions, // Envia o objeto de permissões
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
            onBadgeSaved(); 
        } catch (error) {
            console.error("Erro ao salvar badge:", error.response?.data || error);
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

                    {/* Toggles de Permissão (ATUALIZADOS) */}
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text font-medium">Pode Acessar o Painel Admin?</span>
                            <input 
                                type="checkbox" 
                                name="can_access_admin_panel"
                                className="toggle toggle-primary" 
                                checked={permissions.can_access_admin_panel}
                                onChange={handlePermissionChange} 
                            />
                        </label>
                    </div>
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text font-medium">Pode Enviar Recados (Anúncios)?</span>
                            <input 
                                type="checkbox" 
                                name="can_send_announcement"
                                className="toggle toggle-primary" 
                                checked={permissions.can_send_announcement}
                                onChange={handlePermissionChange} 
                            />
                        </label>
                    </div>
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text font-medium">Pode Moderar Posts (Global)?</span>
                            <input 
                                type="checkbox" 
                                name="can_moderate_global_posts"
                                className="toggle toggle-primary" 
                                checked={permissions.can_moderate_global_posts}
                                onChange={handlePermissionChange} 
                            />
                        </label>
                    </div>
                    
                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default BadgeEditModal;