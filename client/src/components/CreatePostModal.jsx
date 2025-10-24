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
    const [image, setImage] = useState(null)
    // Se estiver em modo de edição, preenche o formulário com os dados do post
    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title);
            setContent(postToEdit.content);
        }
    }, [postToEdit]);

    const handleImageChange = (e) => {
            setImage(e.target.files[0]); // Pega o primeiro arquivo selecionado
        };

const handlePostSubmit = async (e) => {
    e.preventDefault();

    // 1. Prepara o FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    // Adiciona a imagem ao formData APENAS se uma nova imagem foi selecionada
    if (image) {
        formData.append('image', image);
    }

    const isEditMode = Boolean(postToEdit);
    const url = isEditMode
        ? `http://localhost:8000/api/posts/${postToEdit.pk}/`
        : 'http://localhost:8000/api/posts/';
    
    // Para edição, o método PUT substitui o objeto inteiro. Se você não enviar uma imagem, 
    // a imagem existente pode ser removida. O método PATCH é melhor para atualizações parciais,
    // mas PUT funcionará com nosso setup. Usaremos 'put' por enquanto.
    const method = isEditMode ? 'put' : 'post';

    // 2. Cria a promise da requisição, passando o formData
    const promise = axios({
        method: method,
        url: url,
        data: formData, // <-- A CORREÇÃO PRINCIPAL: Enviando o formData
        headers: {
            'Authorization': `Bearer ${authTokens.access}`,
            // Não é necessário definir 'Content-Type': 'multipart/form-data'. 
            // O Axios faz isso automaticamente quando você passa um FormData.
        }
    });

    // 3. Usa o toast.promise para dar feedback ao usuário
    toast.promise(promise, {
        loading: 'Salvando seu post...',
        success: `Post ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`,
        error: 'Ocorreu um erro ao salvar seu post.',
    });

    // 4. Aguarda a promise ser resolvida para executar as ações de sucesso
    try {
        await promise;
        onPostCreated(); // Atualiza a timeline
        onClose();       // Fecha o modal
    } catch (error) {
        console.error("Erro ao enviar o post:", error);
        // O toast já vai exibir a mensagem de erro, aqui só logamos o detalhe
    }
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
                    <div className="form-control mt-4">
                        <label className="label"><span className="label-text">Imagem (Opcional)</span></label>
                        <input type="file" onChange={handleImageChange} className="file-input file-input-bordered w-full" />
                    </div>
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