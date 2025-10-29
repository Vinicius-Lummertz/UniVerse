// src/pages/FollowingFeedPage.jsx
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import Navbar from '../components/NavBar';
import axiosInstance from '../utils/axiosInstance';

const FollowingFeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authTokens } = useContext(AuthContext);

    useEffect(() => {
        const getFollowingPosts = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get('/api/feed/following/');
                setPosts(response.data);
            } catch (error) {
                console.error("Erro ao buscar posts de quem você segue", error);
            } finally {
                setLoading(false);
            }
        };
        getFollowingPosts();
    }, [authTokens]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    return (
        <div className="pb-20">
            <Navbar/>

            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center gap-6">
                    {posts.map(post => (
                        <div key={post.pk} className="bg-white rounded-lg shadow-md p-5 w-full max-w-2xl relative">
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
                            <Link to={`/profile/${post.owner}`} className="font-bold hover:underline">
                                {post.owner}
                            </Link>                            
                            <p className="font-semibold text-lg mt-1" style={{width: '100%'}}>{post.title}</p>
                            <p className="text-gray-600 mt-2">{post.content}</p>
                            {post.image && (
                                <figure>
                                    <img src={post.image} alt={post.title} className="w-full h-auto max-h-96 object-cover" />
                                </figure>
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

            <BottomNav />
        </div>
    );
    
};

export default FollowingFeedPage;