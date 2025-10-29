// src/components/CommentForm.jsx
import { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';

const CommentForm = ({ postId, onCommentAdded }) => {
    const [content, setContent] = useState('');
    const { authTokens } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        const promise = axios.post(`${import.meta.env.VITE_API_URL || 'http://192.168.15.164:8000'}/api/posts/${postId}/comments/`,
            { content },
            { headers: { 'Authorization': `Bearer ${authTokens.access}` } }
        );

        toast.promise(promise, {
            loading: 'Enviando comentário...',
            success: 'Comentário adicionado!',
            error: 'Erro ao comentar.'
        });

        try {
            const response = await promise;
            onCommentAdded(response.data); // Envia o novo comentário para o pai
            setContent(''); // Limpa o input
        } catch (error) {
            console.error("Erro ao adicionar comentário:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Adicione um comentário..."
                className="input input-bordered input-sm flex-grow"
            />
            <button type="submit" className="btn btn-primary btn-sm">Enviar</button>
        </form>
    );
};
export default CommentForm;