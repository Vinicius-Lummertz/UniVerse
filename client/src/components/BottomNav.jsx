// src/components/BottomNav.jsx
import { Link } from 'react-router-dom';
import { FiHome, FiUser, FiMessageSquare } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { useContext } from 'react';


const BottomNav = () => {

    const { user } = useContext(AuthContext)

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
            <div className="flex justify-around max-w-md mx-auto">
                <Link to="/" className="flex flex-col items-center p-3 text-blue-500">
                    <FiHome size={24} />
                    <span className="text-xs">Home</span>
                </Link>
                <Link to="/chat" className="flex flex-col items-center p-3 text-gray-500 hover:text-blue-500">
                    <FiMessageSquare size={24} />
                    <span className="text-xs">Chat</span>
                </Link>
                <Link to={`/profile/${user.username}`} className="flex flex-col items-center p-3 text-gray-500 hover:text-blue-500">
                    <FiUser size={24} />
                    <span className="text-xs">Perfil</span>
                </Link>
            </div>
        </nav>
    );
};

export default BottomNav;