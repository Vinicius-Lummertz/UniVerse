// src/components/EditProfileModal.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const EditProfileModal = ({ isOpen, onClose, profile, onProfileUpdate, onOpenDeleteConfirm }) => {
    const [bio, setBio] = useState('');
    const [profilePic, setProfilePic] = useState(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setBio(profile?.bio || '');
            modalRef.current?.showModal();
        } else {
            modalRef.current?.close();
        }
    }, [isOpen, profile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('bio', bio);
        if (profilePic) {
            formData.append('profile_pic', profilePic);
        }

        const promise = axiosInstance.patch('/api/profile/', formData, {
        });

        toast.promise(promise, {
            loading: 'Atualizando perfil...',
            success: 'Perfil atualizado com sucesso!',
            error: 'Não foi possível atualizar o perfil.'
        });

        try {
            const response = await promise;
            onProfileUpdate(response.data); // Envia os novos dados de volta para a página de perfil
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Editar Perfil</h3>
                <form onSubmit={handleSubmit} className="py-4 space-y-4"> 
                    {/* Textarea de Bio */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Bio</span></label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="textarea textarea-bordered h-24"
                        ></textarea>
                    </div>
                    {/* Input de Foto de Perfil */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Foto de Perfil</span></label>
                        <input
                            type="file"
                            onChange={(e) => setProfilePic(e.target.files[0])}
                            className="file-input file-input-bordered w-full" // Garante w-full
                        />
                    </div>
                    {/* Ações do Modal */}
                    <div className="modal-action mt-6 justify-between">
                        {/* Botão Excluir Conta */}
                        <button type="button" className="btn btn-error btn-outline" onClick={onOpenDeleteConfirm}>
                            Excluir Conta
                        </button>
                        {/* Botões Cancelar/Salvar */}
                        <div className='space-x-2'> {/* Adiciona espaço entre botões */}
                            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Salvar</button>
                        </div>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop"><button onClick={onClose}>close</button></form>
        </dialog>
    );
};
export default EditProfileModal;