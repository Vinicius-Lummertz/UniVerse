// src/components/Reactions.jsx
import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

// Emojis permitidos
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const Reactions = ({ postId, initialReactionsSummary, initialUserReaction }) => {
    const { authTokens } = useContext(AuthContext);
    const [summary, setSummary] = useState(initialReactionsSummary || {});
    const [userReaction, setUserReaction] = useState(initialUserReaction);
    const [showPicker, setShowPicker] = useState(false);

    const handleReact = async (emoji) => {
        setShowPicker(false); // Fecha o picker

        // Lógica otimista (atualiza UI antes da API)
        const oldSummary = { ...summary };
        const oldUserReaction = userReaction;
        
        let newUserReaction = null;
        const newSummary = { ...summary };

        // Se o usuário já reagiu...
        if (userReaction) {
            // Remove a contagem da reação antiga
            newSummary[userReaction.emoji] = (newSummary[userReaction.emoji] || 1) - 1;
            if (newSummary[userReaction.emoji] <= 0) delete newSummary[userReaction.emoji];

            // Se clicou no mesmo emoji, remove a reação
            if (userReaction.emoji === emoji) {
                 newUserReaction = null; // Usuário removeu a reação
            } else {
                 // Se clicou em emoji diferente, adiciona a nova reação
                 newSummary[emoji] = (newSummary[emoji] || 0) + 1;
                 newUserReaction = { emoji: emoji, user: 'Você' }; // Simula a nova reação
            }
        } else {
            // Se não reagiu antes, apenas adiciona
            newSummary[emoji] = (newSummary[emoji] || 0) + 1;
            newUserReaction = { emoji: emoji, user: 'Você' };
        }

        setSummary(newSummary);
        setUserReaction(newUserReaction);


        // Chamada API
        try {
            const response = await axiosInstance.post(
                `/api/posts/${postId}/react/`,
                { emoji },
            );
            // Atualiza o estado com a resposta real da API (incluindo ID correto, se necessário)
            // Se a API retornar 204 (No Content) para delete, ajusta o estado
             if (response.status === 204) {
                 setUserReaction(null); // Confirma a remoção
             } else {
                 setUserReaction(response.data); // Confirma a adição/mudança
             }
             // Poderia re-buscar o summary aqui para ter 100% de certeza, mas a lógica otimista é mais rápida
            
        } catch (error) {
            console.error("Erro ao reagir:", error);
            toast.error("Erro ao reagir.");
            // Reverte a UI em caso de erro
            setSummary(oldSummary);
            setUserReaction(oldUserReaction);
        }
    };

    return (
        <div className="mt-4 flex items-center gap-4 relative">
            {/* Botão para adicionar/mudar reação */}
            <button
                className={`btn btn-xs ${userReaction ? 'btn-primary' : 'btn-outline btn-ghost'}`}
                onClick={() => setShowPicker(!showPicker)}
            >
                {userReaction ? userReaction.emoji : 'Reagir'}
            </button>

            {/* Mostra o resumo das reações */}
            <div className="flex gap-2">
                {Object.entries(summary)
                    .sort(([, countA], [, countB]) => countB - countA) // Ordena pelos mais populares
                    .map(([emoji, count]) => (
                        count > 0 && (
                            <div key={emoji} className="badge badge-outline gap-1 text-xs">
                                {emoji} {count}
                            </div>
                        )
                ))}
            </div>


            {/* Picker de Emojis (Dropdown) */}
            {showPicker && (
                <div className="absolute bottom-full mb-2 left-0 z-10 p-2 shadow bg-base-200 rounded-box flex gap-1">
                    {EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            className={`btn btn-sm btn-ghost ${userReaction?.emoji === emoji ? 'bg-primary text-primary-content' : ''}`}
                            onClick={() => handleReact(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
export default Reactions;