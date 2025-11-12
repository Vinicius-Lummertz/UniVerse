// src/components/communities/CreateCommunityModal.jsx
import { useState, useRef, useEffect, useContext } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import AuthContext from '../../context/AuthContext'; // Importar AuthContext

const CreateCommunityModal = ({ isOpen, onClose, onCommunityCreated }) => {
    const modalRef = useRef(null);
    const { user, setUser } = useContext(AuthContext); // Pegar setUser

    // Estado do formulário
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState('public');
    const [course, setCourse] = useState('');
    const [communityImage, setCommunityImage] = useState(null);
    const [coverImage, setCoverImage] = useState(null);

    useEffect(() => {
        if (isOpen) modalRef.current?.showModal();
        else modalRef.current?.close();
    }, [isOpen]);

    // Limpa o formulário ao fechar
    const handleClose = () => {
        setName('');
        setDescription('');
        setPrivacy('public');
        setCourse('');
        setCommunityImage(null);
        setCoverImage(null);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('privacy', privacy);
        formData.append('related_course', course);
        if (communityImage) formData.append('community_image', communityImage);
        if (coverImage) formData.append('cover_image', coverImage);

        // A API de create lida com o limite de 1
        const promise = axiosInstance.post('/api/communities/create/', formData);

        toast.promise(promise, {
            loading: 'Criando comunidade...',
            success: 'Comunidade criada com sucesso!',
            error: (err) => err.response?.data?.[0] || "Não foi possível criar a comunidade."
        });

        try {
            await promise;
            
            // ATUALIZAÇÃO IMPORTANTE: Recarrega o perfil do usuário no AuthContext
            // para que o novo 'membership' (como admin) seja registrado
            // e o limite de 1 comunidade seja atualizado.
            const userResponse = await axiosInstance.get(`/api/users/${user.username}/`);
            const fullUserData = userResponse.data;
            setUser(fullUserData);
            localStorage.setItem('userInfo', JSON.stringify(fullUserData));

            onCommunityCreated(); // Avisa a página pai para recarregar
            handleClose(); // Fecha e limpa
        } catch (error) {
            console.error("Erro ao criar comunidade:", error.response?.data || error);
        }
    };

    return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box w-11/12 max-w-2xl">
                <h3 className="font-bold text-lg">Criar Nova Comunidade</h3>
                <form onSubmit={handleSubmit} className="py-4 space-y-4">
                    
                    <div className="form-control">
                        <label className="label"><span className="label-text">Nome (Obrigatório)</span></label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered" required />
                    </div>
                    
                    <div className="form-control">
                        <label className="label"><span className="label-text">Descrição</span></label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="textarea textarea-bordered h-24"></textarea>
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Curso Relacionado (Opcional)</span></label>
                        <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} className="input input-bordered" placeholder="Ex: Engenharia de Software" />
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Privacidade</span></label>
                        <select value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="select select-bordered">
                            <option value="public">Pública (Qualquer um pode entrar)</option>
                            <option value="private">Privada (Requer aprovação)</option>
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Imagem da Comunidade (Ícone)</span></label>
                        <input type="file" accept="image/*" onChange={(e) => setCommunityImage(e.target.files[0])} className="file-input file-input-bordered" />
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Imagem de Capa</span></label>
                        <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} className="file-input file-input-bordered" />
                    </div>
                    
                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={handleClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Criar</button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop"><button onClick={handleClose}>close</button></form>
        </dialog>
    );
};

export default CreateCommunityModal;