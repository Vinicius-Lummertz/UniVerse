// src/pages/PostDetailPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Feed from '../components/Feed';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

const PostDetailPage = () => {
    const { id: postId } = useParams();
    const navigate = useNavigate();
    
    // O Feed.jsx espera uma *array* de posts, então guardamos [post]
    const [post, setPost] = useState([]); 
    const [loading, setLoading] = useState(true);

    // Função para buscar o post individual
    const getPost = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/api/posts/${postId}/`);
            setPost([response.data]); // Coloca o post único em uma array
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error("Post não encontrado ou foi excluído.");
                navigate('/'); // Volta para home se o post não existir
            }
        } finally {
            setLoading(false);
        }
    }, [postId, navigate]);

    // Busca o post ao carregar
    useEffect(() => {
        getPost();
    }, [getPost]);

    return (
        <>
            <Navbar />
            <div className="pb-20">
                <main className="container mx-auto p-4">
                    
                    {/* Header da Página (Voltar) */}
                    <div className="max-w-2xl mx-auto mb-4">
                        <Link to="/" className="btn btn-ghost">
                            <FiArrowLeft /> Voltar
                        </Link>
                    </div>

                    {/* Reutilizamos o componente Feed. 
                      Ele já tem toda a lógica de reações, comentários,
                      edição e exclusão.
                    */}
                    <Feed
                        posts={post}
                        setPosts={setPost} // Permite que o Feed atualize seu próprio estado (ex: ao comentar)
                        loading={loading}
                        getPosts={getPost} // Passa a função para o modal de edição recarregar
                        emptyFeedMessage="Post não encontrado ou foi excluído."
                        showCreateWhenEmpty={false}
                    />
                </main>
            </div>
            <BottomNav />
        </>
    );
};

export default PostDetailPage;