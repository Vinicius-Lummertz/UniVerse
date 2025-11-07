import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiTrash2, FiEdit3, FiBookmark, FiMoreHorizontal } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import CreatePostModal from './CreatePostModal';
import ConfirmationModal from './ConfirmationModal';
import Reactions from './Reactions';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

// O Feed agora recebe 'getPosts' como prop e não define mais seu próprio 'endpoint' ou 'getPosts'
const Feed = ({ posts, setPosts, loading, getPosts, emptyFeedMessage, showCreateWhenEmpty = false }) => {
    // 'user' e 'setUser' vêm do contexto para checagens de permissão e salvar posts
    // 'user' pode ser 'null' se o visitante não estiver logado
    const { user, setUser } = useContext(AuthContext); 
    
    // Os estados dos modais vivem dentro do Feed
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [postToDelete, setPostToDelete] = useState(null);

    // Funções de controle dos modais
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

    // Função de deletar (agora usa 'setPosts' da prop)
    const confirmDelete = async () => {
        if (!postToDelete) return;

        const promise = axiosInstance.delete(`/api/posts/${postToDelete}/`);
        toast.promise(promise, {
            loading: 'Excluindo post...',
            success: 'Post excluído com sucesso!',
            error: 'Não foi possível excluir o post.'
        });

        promise.then(() => {
            // Atualiza o estado da PÁGINA PAI
            setPosts(posts.filter(p => p.pk !== postToDelete));
            closeDeleteModal();
        }).catch(err => {
            console.error(err);
            closeDeleteModal();
        });
    };
    
    // Função de Salvar Post (usa 'user' e 'setUser' do contexto)
    const handleSavePost = async (postPk, isCurrentlySaved) => {
        if (!user) {
            toast.error("Você precisa estar logado para salvar posts.");
            return;
        }

        const promise = axiosInstance.post(`/api/posts/${postPk}/save/`);
        toast.promise(promise, {
            loading: 'Salvando...',
            success: isCurrentlySaved ? 'Post removido dos salvos!' : 'Post salvo!',
            error: 'Não foi possível salvar.'
        });

        try {
            await promise;
            // Atualiza o estado do 'user' no AuthContext para refletir a mudança
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
            
            setUser(updatedUser); // Atualiza o contexto
            localStorage.setItem('userInfo', JSON.stringify(updatedUser)); // Atualiza o storage
            
        } catch (error) {
            console.error("Erro ao salvar post:", error);
        }
    };


    // Exibição de Loading
    if (loading) {
        return (
            // Calcula altura para não ficar sob a navbar/bottomnav
            <div className="flex justify-center items-center h-[calc(100vh-10rem)]"> 
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <>
            {/* O padding para o BottomNav agora está aqui */}
            <main className="container mx-auto p-4 pb-20">
                <div className="flex flex-col items-center gap-6">
                    
                    {/* Mensagem se o feed estiver vazio */}
                    {!loading && posts.length === 0 && (
                        <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                            <div className="card-body items-center text-center">
                                <h2 className="card-title">Que silêncio...</h2>
                                {/* 2. Usa a prop da mensagem customizada */}
                                <p>{emptyFeedMessage || "Não há nenhum post para mostrar aqui ainda."}</p>
                                
                                {/* 3. Usa a prop booleana para mostrar o botão */}
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

                    {/* Loop dos Posts */}
                    {posts.map(post => {
                        // Verifica se o usuário logado salvou este post
                        const isSaved = user?.profile?.saved_posts?.includes(post.pk);

                        return (
                            // Card do Post (estrutura DaisyUI)
                            <div key={post.pk} className="card w-full max-w-2xl bg-base-100 shadow-xl overflow-hidden">
                                

                                <div className="card-body p-4 sm:p-6">
                                    <div className="flex justify-between items-start gap-2">
                                        {/* Informações do Autor (com Badges) */}
                                        <div className='flex items-center gap-3'>
                                            <div className="avatar">
                                                <div className="w-10 rounded-full">
                                                    
                                                    <img src={"pfp"} alt={post.owner} />
                                                </div>
                                            </div> 
                                            <div className='flex flex-col'>
                                                <Link to={`/profile/${post.owner}`} className="font-bold link link-hover text-lg leading-tight">
                                                    {post.owner}
                                                </Link>
                                                {/* Renderiza os Badges do autor */}
                                                <div className='flex flex-wrap gap-1 mt-1'>
                                                    {post.owner_badges?.map(badge => (
                                                        <div key={badge.name} className={`badge badge-${badge.color || 'neutral'} badge-xs`}>
                                                            {badge.icon && <span className='mr-1'>{badge.icon}</span>} {badge.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dropdown de Editar/Excluir (SÓ SE FOR DONO ou STAFF) */}
                                        {user && (user.username === post.owner || user.profile?.is_staff) && (
                                            <div className="dropdown dropdown-end">
                                                <button tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                                                    <FiMoreHorizontal size={18} />
                                                </button>
                                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box w-32">
                                                    {user.username === post.owner && (
                                                        <li><button onClick={() => handleEdit(post)} className='w-full text-left'> <FiEdit3 className='mr-2'/> Editar</button></li>
                                                    )}
                                                    {/* Admins e o dono podem excluir */}
                                                    <li><button onClick={() => openDeleteModal(post.pk)} className='w-full text-left text-error'> <FiTrash2 className='mr-2'/> Excluir{user.profile?.is_staff && " (Admin)"}</button></li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Conteúdo do Post */}
                                    <h2 className="card-title mt-2">{post.title}</h2>
                                    <p className="mt-1 whitespace-pre-wrap">{post.content}</p> {/* whitespace-pre-wrap respeita quebras de linha */}
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

                                    {/* Ações (Reações e Salvar) */}
                                    <div className="card-actions justify-between items-center mt-4">
                                        {/* Lógica condicional para Reações */}
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
                                        
                                        {/* Botão Salvar (SÓ SE ESTIVER LOGADO) */}
                                        {user && (
                                            <button onClick={() => handleSavePost(post.pk, isSaved)} className="btn btn-ghost btn-sm">
                                                <FiBookmark size={18} className={isSaved ? 'fill-primary text-primary' : ''} />
                                                {isSaved ? 'Salvo' : 'Salvar'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="divider my-1"></div>

                                    {/* Comentários */}
                                    <CommentList comments={post.comments} />
                                    
                                    {user ? (
                                        <CommentForm
                                            postId={post.pk}
                                            onCommentAdded={(newComment) => {
                                                // Atualiza o estado local para o novo comentário aparecer
                                                setPosts(currentPosts => currentPosts.map(p =>
                                                    p.pk === post.pk
                                                        ? { ...p, comments: [...p.comments, newComment] }
                                                        : p
                                                ));
                                            }}
                                        />
                                    ) : (
                                        // **CORRIGIDO: Removido 'Especialista em TI' e tag quebrada**
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

            {/* Botão Flutuante de Criar Post (SÓ SE ESTIVER LOGADO) */}
            {user && (
                <button
                    onClick={handleCreate}
                    className="fixed bottom-20 right-5 btn btn-primary btn-circle shadow-lg z-20">
                    <FiPlus size={24} />
                </button>
            )}

            {/* Modais (só renderizam se 'user' existir) */}
            {user && (
                <>
                    <CreatePostModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onPostCreated={getPosts} // 3. Usa o 'getPosts' recebido por prop
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
            )}
        </>
    );
};

export default Feed;