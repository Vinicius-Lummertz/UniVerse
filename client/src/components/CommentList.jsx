// src/components/CommentList.jsx
import { Link } from 'react-router-dom';

const CommentList = ({ comments }) => {
    if (!comments || comments.length === 0) {
        return <p className="text-sm text-base-content/60 mt-4">Nenhum comentário ainda.</p>;
    }

    return (
        <div className="mt-4 space-y-3">
            {comments.map(comment => (
                <div key={comment.id} className="chat chat-start"> {/* Use chat bubbles */}
                    <div className="chat-image avatar avatar-xs placeholder">
                       <div className="w-6 rounded-full">
                           <img src={comment.user_profile_pic || '/avatar-default.svg'} />
                       </div>
                    </div>
                    <div className="chat-header text-xs opacity-50">
                        <Link to={`/profile/${comment.user}`} className='link link-hover'>{comment.user}</Link>
                        <time className="ml-1">{new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                    <div className="chat-bubble text-sm">{comment.content}</div>
                </div>
            ))}
        </div>
    );
};
export default CommentList;