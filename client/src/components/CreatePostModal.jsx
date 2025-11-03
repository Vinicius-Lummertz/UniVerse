// src/components/CreatePostModal.jsx

import { useState, useEffect, useContext, useRef } from 'react'; // Adicione useEffect
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast'; // Importe o toast
import axiosInstance from '../utils/axiosInstance';

// Agora recebe uma prop opcional 'postToEdit'
const CreatePostModal = ({ isOpen, onClose, onPostCreated, postToEdit }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [fileType, setFileType] = useState(null);
    const { authTokens } = useContext(AuthContext);
    const modalRef = useRef(null)
    // Se estiver em modo de edição, preenche o formulário com os dados do post
    useEffect(() => {
            if (isOpen) modalRef.current?.showModal();
            else modalRef.current?.close();
        }, [isOpen]);

    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title);
            setContent(postToEdit.content);
        } else {
            // Limpa o formulário ao abrir para criar um novo post
            setTitle('');
            setContent('');
            setFile(null);
            setFileType(null);
            // Reseta o input de arquivo (se necessário, pode exigir useRef)
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
            setFileType('attachment');
        }
        };
    
    
    const handlePostSubmit = async (e) => {
    e.preventDefault();

    // 1. Prepara o FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    // Adiciona a filem ao formData APENAS se uma nova filem foi selecionada
    if (file && fileType === 'image') {
            formData.append('image', file);
        } else if (file && fileType === 'video') {
            formData.append('video', file);
        } else if (file && fileType === 'file') {
            formData.append('attachment', file);
        }

    const isEditMode = Boolean(postToEdit);
    const url = isEditMode
        ? `/api/posts/${postToEdit.pk}/`
        : '/api/posts/';
    
    const method = isEditMode ? 'put' : 'post';

    const promise = axiosInstance[method](url, formData);

    toast.promise(promise, {
        loading: 'Salvando seu post...',
        success: `Post ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`,
        error: 'Ocorreu um erro ao salvar seu post.',
    });

    try {
        await promise;
        onPostCreated(); // Atualiza a timeline
        onClose();       // Fecha o modal
    } catch (error) {
        console.error("Erro ao enviar o post:", error);
    }
    };

return (
        <dialog ref={modalRef} className="modal">
            {/* Usa modal-box para o conteúdo */}
            <div className="modal-box w-11/12 max-w-2xl">
                {/* Título do modal */}
                <h3 className="font-bold text-lg">{postToEdit ? "Editar Post" : "Criar Novo Post"}</h3>

                {/* Formulário com classes DaisyUI */}
                <form onSubmit={handlePostSubmit} className="py-4 space-y-4">
                    {/* Input de Título */}
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

                    {/* Textarea de Conteúdo */}
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

                    {/* Ações do Modal */}
                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            {postToEdit ? "Salvar Alterações" : "Postar"}
                        </button>
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

export default CreatePostModal;