// src/components/EditProfileModal.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';

const EditProfileModal = ({ isOpen, onClose, profile, onProfileUpdate }) => {
    const [bio, setBio] = useState('');
    const [profilePic, setProfilePic] = useState(null);
    const { authTokens } = useContext(AuthContext);
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

        const promise = axios.patch('http://localhost:8000/api/profile/', formData, {
            headers: {
                'Authorization': `Bearer ${authTokens.access}`,
                'Content-Type': 'multipart/form-data',
            }
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
                <form onSubmit={handleSubmit} className="py-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Bio</span></label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="textarea textarea-bordered h-24"></textarea>
                    </div>
                    <div className="form-control mt-4">
                        <label className="label"><span className="label-text">Foto de Perfil</span></label>
                        <input type="file" onChange={(e) => setProfilePic(e.target.files[0])} className="file-input file-input-bordered" />
                    </div>
                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop"><button onClick={onClose}>close</button></form>
        </dialog>
    );
};
export default EditProfileModal;