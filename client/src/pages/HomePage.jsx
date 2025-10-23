// src/pages/HomePage.jsx

import { useEffect, useState, useContext, useCallback } from 'react'; // Adicione useCallback
import axios from 'axios';
import BottomNav from '../components/BottomNav';
import AuthContext from '../context/AuthContext';
import { FiPlus, FiTrash2, FiEdit3 } from 'react-icons/fi';
import CreatePostModal from '../components/CreatePostModal'; // 1. Importe o modal
import ConfirmationModal from '../components/ConfirmationModal'; // Importe o novo modal
import toast from 'react-hot-toast'; // Importe o toast

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const { authTokens, logoutUser, user } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false); // 2. Estado para controlar o modal
    const [editingPost, setEditingPost] = useState(null); // Estado para o post em edição
     const [postToDelete, setPostToDelete] = useState(null); // Guarda o ID do post a ser deletado    

    const getPosts = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/posts/', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authTokens.access}`
                }
            });
            setPosts(response.data);
        } catch (error) {
            console.error("Erro ao buscar posts", error);
            logoutUser();
        }
    }, [authTokens, logoutUser]);

    useEffect(() => {
        getPosts();
    }, [getPosts]);

const openDeleteModal = (postId) => {
        setPostToDelete(postId);
    };

    const closeDeleteModal = () => {
        setPostToDelete(null);
    };

    const confirmDelete = async () => {
        if (!postToDelete) return;

        const promise = axios.delete(`http://localhost:8000/api/posts/${postToDelete}/`, {
            headers: { 'Authorization': `Bearer ${authTokens.access}` }
        });

        toast.promise(promise, {
            loading: 'Excluindo post...',
            success: 'Post excluído com sucesso!',
            error: 'Não foi possível excluir o post.'
        });

        promise.then(() => {
            setPosts(posts.filter(p => p.pk !== postToDelete));
            closeDeleteModal();
        }).catch(err => {
            console.error(err);
            closeDeleteModal();
        });
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    // Função para abrir o modal em modo de criação
    const handleCreate = () => {
        setEditingPost(null); // Garante que não estamos em modo de edição
        setIsModalOpen(true);
    };
    
    // Função para fechar o modal e limpar o estado de edição
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPost(null);
    };


    return (
        <div className="pb-20">
            <header className="flex justify-between items-center p-4 bg-white shadow-md sticky top-0 z-10">
                <h1 className="text-xl font-bold text-blue-600">SocialApp</h1>
                <button onClick={logoutUser} className="text-sm bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600">Sair</button>
            </header>

            <main className="container mx-auto p-4">
                {/* Timeline */}
                <div className="flex flex-col items-center gap-6">
                    {posts.map(post => (
                        <div key={post.pk} className="bg-white rounded-lg shadow-md p-5 w-full max-w-2xl relative">
                            {console.log(post.owner)}
                           {user && user.username == post.owner && (
                            <div className="absolute top-3 right-3 flex gap-2">
                                <button onClick={() => handleEdit(post)} className="text-gray-500 hover:text-blue-600">
                                    <FiEdit3 size={18} />
                                </button>
                                <button  onClick={() => openDeleteModal(post.pk)} className="text-gray-500 hover:text-red-600">
                                    <FiTrash2 size={18} />
                                </button>
                            </div>
                        )}
                            <p className="font-bold text-gray-800">{post.owner}</p>
                            <p className="font-semibold text-lg mt-1" style={{width: '100%'}}>{post.title}</p>
                            <p className="text-gray-600 mt-2">{post.content}</p>
                            <small className="text-gray-400 text-xs mt-3 block">
                                {new Date(post.createdAt).toLocaleString('pt-BR')}
                            </small>
                        </div>
                    ))}
                </div>
            </main>

            {/* 4. O botão agora abre o modal */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-20 right-5 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition z-20">
                <FiPlus size={24} />
            </button>

            {/* 5. Renderizamos o modal condicionalmente */}
            {isModalOpen && (
                <CreatePostModal
                    onClose={handleCloseModal}
                    onPostCreated={getPosts}
                    postToEdit={editingPost}
                />
            )}

            <ConfirmationModal 
                isOpen={!!postToDelete}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este post? Esta ação não pode ser desfeita."
            />

            <BottomNav />
        </div>
    );
};

export default HomePage;