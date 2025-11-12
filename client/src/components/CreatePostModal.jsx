// src/components/CreatePostModal.jsx

import { useState, useEffect, useContext, useRef } from 'react'; 
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast'; 
import axiosInstance from '../utils/axiosInstance';

// --- 1. Aceitar nova prop 'communityId' ---
const CreatePostModal = ({ isOpen, onClose, onPostCreated, postToEdit, communityId = null }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [fileType, setFileType] = useState(null);
    const { authTokens } = useContext(AuthContext);
    const modalRef = useRef(null)
    
    useEffect(() => {
            if (isOpen) modalRef.current?.showModal();
            else modalRef.current?.close();
        }, [isOpen]);

    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title);
            setContent(postToEdit.content);
        } else {
            setTitle('');
            setContent('');
            setFile(null);
            setFileType(null);
            const fileInput = modalRef.current?.querySelector('input[type="file"]');
            if(fileInput) fileInput.value = '';
        }
    }, [postToEdit, isOpen]);


    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) {
            setFile(null);
            setFileType(null);
            return;
        }

        setFile(selectedFile);

        if (selectedFile.type.startsWith('image/')) {
            setFileType('image');
        } else if (selectedFile.type.startsWith('video/')) {
            setFileType('video');
        } else {
            setFileType('attachment'); // Corrigido de 'file' para 'attachment'
        }
        };
    
    
    const handlePostSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        
        if (file && fileType === 'image') {
                formData.append('image', file);
            } else if (file && fileType === 'video') {
                formData.append('video', file);
            } else if (file && fileType === 'attachment') { // Corrigido de 'file'
                formData.append('attachment', file);
            }

        // --- 2. Lógica de Rota e Payload (Fase 3) ---
        const isEditMode = Boolean(postToEdit);
        let url;
        let method;

        if (isEditMode) {
            // Edição não muda o endpoint, apenas o método
            url = `/api/posts/${postToEdit.pk}/`;
            method = 'put';
        } else if (communityId) {
            // Criação DENTRO da comunidade
            url = `/api/communities/${communityId}/post/`;
            method = 'post';
            // A API (CommunityPostCreateView) ignora o campo 'community' no form-data
            // e usa o ID da URL, o que é mais seguro.
        } else {
            // Criação no Feed Global
            url = '/api/posts/';
            method = 'post';
        }
        // --- Fim da Lógica ---

        const promise = axiosInstance[method](url, formData);

        toast.promise(promise, {
            loading: 'Salvando seu post...',
            success: `Post ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`,
            error: 'Ocorreu um erro ao salvar seu post.',
        });

        try {
            await promise;
            onPostCreated(); 
            onClose();       
        } catch (error) {
            console.error("Erro ao enviar o post:", error);
        }
    };

    return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box w-11/12 max-w-2xl">
                <h3 className="font-bold text-lg">{postToEdit ? "Editar Post" : "Criar Novo Post"}</h3>
                {/* 3. Informa ao usuário onde ele está postando */}
                {communityId && !postToEdit && (
                    <p className="text-sm text-info py-2">Postando na comunidade...</p>
                )}

                <form onSubmit={handlePostSubmit} className="py-4 space-y-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Título</span></label>
                        <input
                            type="text"
                            placeholder="Título do seu post"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input input-bordered w-full"
                            required
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Conteúdo</span></label>
                        <textarea
                            placeholder="O que você está pensando?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="textarea textarea-bordered h-32 w-full"
                            required
                        ></textarea>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Arquivo (Opcional)</span></label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="file-input file-input-bordered w-full"
                        />
                    </div>

                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            {postToEdit ? "Salvar Alterações" : "Postar"}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default CreatePostModal;