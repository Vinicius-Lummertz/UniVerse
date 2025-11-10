// src/components/admin/PostManagementTab.jsx
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import Feed from '../Feed'; // Reutilizamos o componente Feed

const PostManagementTab = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Esta é a função que o componente Feed usará para buscar os posts
    const fetchAdminPosts = useCallback(async () => {
        setLoading(true);
        try {
            // Usamos o endpoint de admin para ver TODOS os posts
            const response = await axiosInstance.get('/api/admin/posts/');
            setPosts(response.data);
        } catch (error) {
             if (error.response?.status !== 401) {
                toast.error("Não foi possível carregar os posts.");
             }
        } finally {
            setLoading(false);
        }
    }, []);

    // Busca inicial
    useEffect(() => {
        fetchAdminPosts();
    }, [fetchAdminPosts]);

    return (
        <div>
            <h2 className="card-title mb-4">Moderação de Conteúdo</h2>
            <p className="text-sm mb-4">
                Você está vendo <span className="font-bold">todos</span> os posts da plataforma.
                Graças à correção na permissão `IsOwnerOrReadOnly`, você agora pode excluir posts de qualquer usuário.
            </p>
            
            {/* Reutilizamos o componente Feed. Ele já tem toda a lógica 
                de delete (via ConfirmationModal) e a UI de posts.
                Nós apenas passamos a lista de posts de admin e a função de recarregar.
            */}
            <div className="max-h-[70vh] overflow-y-auto pr-2 -mr-4"> {/* Adiciona scroll se a lista for longa */}
                <Feed
                    posts={posts}
                    setPosts={setPosts}
                    loading={loading}
                    getPosts={fetchAdminPosts}
                    emptyFeedMessage="Nenhum post encontrado na plataforma."
                    showCreateWhenEmpty={false}
                />
            </div>
        </div>
    );
};

export default PostManagementTab;