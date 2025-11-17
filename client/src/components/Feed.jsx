// src/components/Feed.jsx
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiEdit3, FiBookmark, FiMoreHorizontal, FiUsers } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import CreatePostModal from './CreatePostModal';
import ConfirmationModal from './ConfirmationModal';
import Reactions from './Reactions';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

const Feed = ({ posts, setPosts, loading, getPosts, emptyFeedMessage, showCreateWhenEmpty = false, communityId = null, isMember = true }) => {
    
    const { user, setUser } = useContext(AuthContext); 
    const navigate = useNavigate();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [postToDelete, setPostToDelete] = useState(null);

    const handleEdit = (post) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingPost(null);
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
            error: 'Erro ao excluir post.'
        });

        try {
            await promise;
            setPosts(posts.filter(post => post.pk !== postToDelete));
            closeDeleteModal();
        } catch (error) {
            console.error("Erro ao excluir:", error);
        }
    };

    const handleSavePost = async (postPk, isCurrentlySaved) => {
        try {
            const response = await axiosInstance.post(`/api/posts/${postPk}/save/`);
            
            const updatedSavedPosts = isCurrentlySaved
                ? user.profile.saved_posts.filter(id => id !== postPk)
                : [...user.profile.saved_posts, postPk];
            
            const updatedUser = {
                ...user,
                profile: {
                    ...user.profile,
                    saved_posts: updatedSavedPosts
                }
            };

            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            
            toast.success(response.data.status === 'adicionado aos salvos' ? 'Post salvo!' : 'Post removido dos salvos.');

        } catch (error) {
            console.error("Erro ao salvar post:", error);
            toast.error("Erro ao salvar post.");
        }
    };

    // Handler para links que exigem login (dentro do feed)
    const handleLinkClick = (e, message, path) => {
        if (!user) {
            e.preventDefault();
            toast.error(message);
            navigate(path || '/login');
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-10rem)]"> 
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <>
            <main className="container mx-auto p-4 pb-20">
                <div className="flex flex-col items-center gap-6">
                    
                    {!loading && posts.length === 0 && (
                        <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                            <div className="card-body items-center text-center">
                                <h2 className="card-title">Que silêncio...</h2>
                                <p>{emptyFeedMessage || "Não há nenhum post para mostrar aqui ainda."}</p>
                                
                                {user && showCreateWhenEmpty && (
                                    <div className="card-actions mt-4">
                                        <button className="btn btn-primary" onClick={handleCreate}>
                                            <FiPlus /> Seja o primeiro a postar!
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {posts.map(post => {
                        const isSaved = user?.profile?.saved_posts?.includes(post.pk);

                        const avatarSrc = post.owner_profile?.profile_pic
                            || (user && user.username === post.owner ? user.profile?.profile_pic : null)
                            || '/avatar-default.svg';

                        return (
                            <div key={post.pk} className="card w-full max-w-2xl bg-base-100 shadow-xl overflow-hidden">
                                <div className="card-body p-4 sm:p-6">
                                    <div className="flex justify-between items-start gap-2">
                                        
                                        <div className='flex items-center gap-3'>
                                            <div className="avatar">
                                                <div className="w-10 rounded-full">
                                                    <img src={avatarSrc} alt={post.owner} />
                                                </div>
                                            </div> 
                                            <div className='flex flex-col'>
                                                <Link
                                                    to={`/profile/${post.owner}`}
                                                    className="font-bold link link-hover text-lg leading-tight"
                                                    onClick={(e) => handleLinkClick(e, 'Faça login para ver perfis.')}
                                                >
                                                    {post.owner}
                                                </Link>
                                                
                                                {post.community && post.community_name && (
                                                    <Link
                                                        to={`/communities/${post.community}`}
                                                        className="text-xs text-info link link-hover flex items-center gap-1"
                                                        onClick={(e) => handleLinkClick(e, 'Faça login para ver comunidades.')}
                                                    >
                                                        <FiUsers size={12} /> {post.community_name}
                                                    </Link>
                                                )}
                                                
                                                <div className='flex flex-wrap gap-1 mt-1'>
                                                    {post.owner_badges?.map(badge => (
                                                        <div key={badge.name} className={`badge badge-${badge.color || 'neutral'} badge-xs`}>
                                                            {badge.icon && <span className='mr-1'>{badge.icon}</span>} {badge.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {user && (user.username === post.owner || user.profile?.is_admin) && (
                                            <div className="dropdown dropdown-end">
                                                <button tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                                                    <FiMoreHorizontal size={18} />
                                                </button>
                                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box w-32">
                                                    {user.username === post.owner && (
                                                        <li><button onClick={() => handleEdit(post)} className='w-full text-left'> <FiEdit3 className='mr-2'/> Editar</button></li>
                                                    )}
                                                    <li><button onClick={() => openDeleteModal(post.pk)} className='w-full text-left text-error'> <FiTrash2 className='mr-2'/> Excluir{user.profile?.is_admin && " (Admin)"}</button></li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="card-title mt-2">{post.title}</h2>
                                    <p className="mt-1 whitespace-pre-wrap">{post.content}</p>
                                    {post.image && (
                                        <figure><img src={post.image} alt={post.title} className="w-full h-auto max-h-96 object-center object-cover" /></figure>
                                    )}
                                    {post.video && (
                                        <figure><video src={post.video} controls className="w-full h-auto max-h-96" /></figure>
                                    )}
                                    {post.attachment && (
                                         <div className="mt-2 p-3 bg-base-200 rounded-lg">
                                            <a href={post.attachment} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                                 📄 Ver Anexo
                                            </a>
                                         </div>
                                    )}
                                    
                                    <small className="text-xs text-base-content/60 mt-3 block">
                                        {new Date(post.createdAt).toLocaleString('pt-BR')}
                                    </small>

                                    <div className="card-actions justify-between items-center mt-4">
                                        {user ? (
                                            <Reactions
                                                postId={post.pk}
                                                initialReactionsSummary={post.reactions_summary}
                                                initialUserReaction={post.current_user_reaction}
                                            />
                                        ) : (
                                            <div className="text-sm text-base-content/70">
                                                <Link to="/login" className="link link-primary">Faça login</Link> para reagir.
                                            </div>
                                        )}
                                        
                                        {user && (
                                            <button onClick={() => handleSavePost(post.pk, isSaved)} className="btn btn-ghost btn-sm">
                                                <FiBookmark size={18} className={isSaved ? 'fill-primary text-primary' : ''} />
                                                {isSaved ? 'Salvo' : 'Salvar'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="divider my-1"></div>

                                    <CommentList comments={post.comments} />
                                    
                                    {user ? (
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
                                    ) : (
                                        <div className="mt-4 p-3 rounded-lg bg-base-200 text-sm text-center">
                                            <Link to="/login" className="link link-primary font-semibold">Faça login</Link> para deixar um comentário.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {user && (communityId ? isMember : true) && (
                <button
                    onClick={handleCreate}
                    className="fixed bottom-20 right-5 btn btn-primary btn-circle shadow-lg z-20">
                    <FiPlus size={24} />
                </button>
            )}

            {user && (
                <>
                    <CreatePostModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onPostCreated={getPosts} 
                        postToEdit={editingPost}
                        communityId={communityId}
                    />
                    <ConfirmationModal
                        isOpen={!!postToDelete}
                        onClose={closeDeleteModal}
                        onConfirm={confirmDelete}
                        title="Confirmar Exclusão"
                        message="Você tem certeza que deseja excluir este post? Esta ação não pode ser desfeita."
                    />
                </>
            )}
        </>
    );
};

export default Feed;