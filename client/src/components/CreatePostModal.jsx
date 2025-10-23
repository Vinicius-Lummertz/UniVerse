// src/components/CreatePostModal.jsx

import { useState, useEffect, useContext } from 'react'; // Adicione useEffect
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast'; // Importe o toast

// Agora recebe uma prop opcional 'postToEdit'
const CreatePostModal = ({ onClose, onPostCreated, postToEdit }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const { authTokens } = useContext(AuthContext);

    // Se estiver em modo de edição, preenche o formulário com os dados do post
    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title);
            setContent(postToEdit.content);
        }
    }, [postToEdit]);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        
        const promise = axios[postToEdit ? 'put' : 'post'](
            postToEdit ? `http://localhost:8000/api/posts/${postToEdit.pk}/` : 'http://localhost:8000/api/posts/',
            { title, content },
            { headers: { 'Authorization': `Bearer ${authTokens.access}` } }
        );

        toast.promise(promise, {
             loading: 'Salvando...',
             success: `Post ${postToEdit ? 'editado' : 'criado'} com sucesso!`,
             error: `Não foi possível salvar o post.`,
        });

        promise.then(() => {
            onPostCreated();
            onClose();
        }).catch(err => console.error(err));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Título dinâmico */}
                <h2 className="text-2xl font-bold mb-4">{postToEdit ? "Editar Post" : "Criar Novo Post"}</h2>
                <form onSubmit={handlePostSubmit}>
                    {/* ... campos de input e textarea (sem alteração) ... */}
                    <input
                        type="text"
                        placeholder="Título do seu post"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 mb-4 border rounded"
                        required
                    />
                    <textarea
                        placeholder="O que você está pensando?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-2 mb-4 border rounded h-32 resize-none"
                        required
                    ></textarea>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                            Cancelar
                        </button>
                        {/* Texto do botão dinâmico */}
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            {postToEdit ? "Salvar Alterações" : "Postar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;