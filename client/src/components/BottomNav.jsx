// src/components/BottomNav.jsx
import { NavLink } from 'react-router-dom';
import { FiHome, FiUser, FiMessageSquare, FiUsers } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { useContext } from 'react';


const BottomNav = () => {
    const { user } = useContext(AuthContext);

    // Classe base para todos os itens da nav
    const baseClasses = "flex flex-col items-center p-3 transition-colors duration-200";
    // Classes para o estado inativo
    const inactiveClasses = "text-gray-500 hover:text-blue-500";
    // Classes para o estado ativo
    const activeClasses = "text-blue-500";

    if (!user) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
            <div className="flex justify-around max-w-md mx-auto">
                
                <NavLink to="/" end className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiHome size={24} />
                    <span className="text-xs">Home</span>
                </NavLink>
                <NavLink to="/following" className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiUsers size={20} />
                    <span className="btm-nav-label">Seguindo</span>
                </NavLink>
                <NavLink to="/chat" className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiMessageSquare size={24} />
                    <span className="text-xs">Chat</span>
                </NavLink>
                
                <NavLink to={`/profile/${user.username}`} className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiUser size={24} />
                    <span className="text-xs">Perfil</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default BottomNav;