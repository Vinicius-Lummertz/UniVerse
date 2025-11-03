import { useState, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiTrash2, FiEdit3 } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import CreatePostModal from './CreatePostModal';
import ConfirmationModal from './ConfirmationModal';
import Reactions from './Reactions';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

const Feed = ({ endpoint, posts, setPosts, loading }) => {
    const { user, authTokens } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [postToDelete, setPostToDelete] = useState(null);

    const getPosts = useCallback(async () => {
        try {
            const response = await axiosInstance.get(endpoint);
            setPosts(response.data);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error("Não foi possível carregar os posts.");
            }
        }
    }, [endpoint, setPosts]);

    const handleEdit = (post) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPost(null);
    };

    const openDeleteModal = (postId) => {
        setPostToDelete(postId);
    };

    const closeDeleteModal = () => {
        setPostToDelete(null);
    };

    const confirmDelete = async () => {
        if (!postToDelete) return;

        const promise = axiosInstance.delete(`/api/posts/${postToDelete}/`);

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

    if (loading) {
        return <div className="flex justify-center items-center h-screen">
            <span className="loading loading-spinner loading-lg"></span>
        </div>;
    }

    return (
        <>
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center gap-6">
                    {posts.map(post => (
                        <div key={post.pk} className="bg-white rounded-lg shadow-md p-5 w-full max-w-2xl relative">
                            {user && user.username === post.owner && (
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button onClick={() => handleEdit(post)} className="text-gray-500 hover:text-blue-600">
                                        <FiEdit3 size={18} />
                                    </button>
                                    <button onClick={() => openDeleteModal(post.pk)} className="text-gray-500 hover:text-red-600">
                                        <FiTrash2 size={18} />
                                    </button>
                                </div>
                            )}
                            <Link to={`/profile/${post.owner}`} className="font-bold hover:underline">
                                {post.owner}
                            </Link>
                            <p className="font-semibold text-lg mt-1">{post.title}</p>
                            <p className="text-gray-600 mt-2">{post.content}</p>
                            {post.image && (
                                <figure>
                                    <img src={post.image} alt={post.title} className="w-full h-auto max-h-96 object-cover" />
                                </figure>
                            )}
                            {post.video && (
                                <figure>
                                    <video src={post.video} controls className="w-full h-auto max-h-96" />
                                </figure>
                            )}
                            {post.attachment && (
                                 <div className="mt-2 p-3 bg-base-200 rounded-lg">
                                    <a href={post.attachment} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                         📄 Ver Anexo
                                    </a>
                                 </div>
                            )}
                            <small className="text-gray-400 text-xs mt-3 block">
                                {new Date(post.createdAt).toLocaleString('pt-BR')}
                            </small>
                            <Reactions
                                postId={post.pk}
                                initialReactionsSummary={post.reactions_summary}
                                initialUserReaction={post.current_user_reaction}
                            />
                            <div className="divider my-1"></div>
                            <CommentList comments={post.comments} />
                            <CommentForm
                                postId={post.pk}
                                onCommentAdded={(newComment) => {
                                    setPosts(currentPosts => currentPosts.map(p =>
                                        p.pk === post.pk
                                            ? { ...p, comments: [...p.comments, newComment] }
                                            : p
                                    ));
                                }}
                            />
                        </div>
                    ))}
                </div>
            </main>

            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-20 right-5 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition z-20">
                <FiPlus size={24} />
            </button>

            <CreatePostModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onPostCreated={getPosts}
                postToEdit={editingPost}
            />

            <ConfirmationModal
                isOpen={!!postToDelete}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este post? Esta ação não pode ser desfeita."
            />
        </>
    );
};

export default Feed;
