// src/components/EditProfileModal.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

// 1. Prop 'onProfileUpdate' renomeada para 'onUpdate'
const EditProfileModal = ({ isOpen, onClose, profile, onUpdate, onOpenDeleteConfirm }) => {
    
    // 2. Pegar 'user' do AuthContext para nomes
    const { user } = useContext(AuthContext); 
    
    // 3. Adicionar state para os novos campos
    const [bio, setBio] = useState('');
    const [profilePic, setProfilePic] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const modalRef = useRef(null);
    const fileInputRef = useRef(null); // Ref para limpar o input de arquivo

    useEffect(() => {
        if (isOpen) {
            // 4. Popular todos os campos
            setBio(profile?.bio || '');
            setFirstName(user?.first_name || '');
            setLastName(user?.last_name || '');
            setProfilePic(null); // Reseta o arquivo
            if(fileInputRef.current) fileInputRef.current.value = ''; // Limpa o input de arquivo

            modalRef.current?.showModal();
        } else {
            modalRef.current?.close();
        }
    }, [isOpen, profile, user]); // Depende do 'user' do context também

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // --- Requisição 1: Perfil (Bio, Foto) ---
        const profileFormData = new FormData();
        profileFormData.append('bio', bio);
        if (profilePic) {
            profileFormData.append('profile_pic', profilePic);
        }
        const profilePromise = axiosInstance.patch('/api/profile/', profileFormData);

        // --- Requisição 2: Usuário (Nomes) ---
        const userData = {
            first_name: firstName,
            username: lastName || "",
        };
        // Usamos PATCH para atualizar apenas os campos enviados
        const userPromise = axiosInstance.patch('/api/user/update/', userData); 

        // 5. Executar ambas requisições em paralelo
        const promise = Promise.all([profilePromise, userPromise]);

        toast.promise(promise, {
            loading: 'Atualizando perfil...',
            success: 'Perfil atualizado com sucesso!',
            error: 'Não foi possível atualizar o perfil.'
        });

        try {
            const [profileResponse, userResponse] = await promise;
            
            // 6. Chamar a nova prop 'onUpdate' com ambos os resultados
            onUpdate({ profile: profileResponse.data, user: userResponse.data });
            onClose();
            
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error.response?.data || error);
        }
    };

return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Editar Perfil</h3>
                <form onSubmit={handleSubmit} className="py-4 space-y-4"> 
                    
                    {/* 7. Inputs para Nome e Sobrenome */}
                    <div className="flex gap-4">
                        <div className="form-control w-1/2">
                            <label className="label"><span className="label-text">Nome</span></label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="input input-bordered"
                            />
                        </div>
                         <div className="form-control w-1/2">
                            <label className="label"><span className="label-text">@</span></label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="input input-bordered"

                            />
                        </div>
                    </div>
                    
                    {/* Textarea de Bio */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Bio</span></label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="textarea textarea-bordered h-24"
                            placeholder='Fale um pouco sobre você...'
                        ></textarea>
                    </div>
                    
                    {/* Input de Foto de Perfil */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Foto de Perfil</span></label>
                        <input
                            ref={fileInputRef} // 8. Adicionar ref
                            type="file"
                            accept="image/*" // Aceitar apenas imagens
                            onChange={(e) => setProfilePic(e.target.files[0])}
                            className="file-input file-input-bordered w-full" 
                        />
                    </div>
                    
                    {/* Ações do Modal */}
                    <div className="modal-action mt-6 justify-between">
                        <button type="button" className="btn btn-error btn-outline" onClick={onOpenDeleteConfirm}>
                            Excluir Conta
                        </button>
                        <div className='space-x-2'> 
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