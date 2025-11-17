// src/components/BottomNav.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiMessageSquare, FiUsers } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { useContext } from 'react';
import toast from 'react-hot-toast';

const BottomNav = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const baseClasses = "flex flex-col items-center p-3 transition-colors duration-200";
    const inactiveClasses = "text-gray-500 hover:text-blue-500";
    const activeClasses = "text-blue-500";

    // Handler que previne navegação e avisa quando não logado
    const handleRequireLogin = (e) => {
        if (!user) {
            e.preventDefault();
            toast.error('Faça login para acessar esta página.');
            navigate('/login');
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
            <div className="flex justify-around max-w-md mx-auto">
                
                {/* --- CORREÇÃO: Removido o 'onClick' daqui --- */}
                <NavLink to="/" end className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiHome size={24} />
                    <span className="text-xs">Home</span>
                </NavLink>

                <NavLink to="/following" onClick={handleRequireLogin} className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiUsers size={20} />
                    <span className="btm-nav-label">Seguindo</span>
                </NavLink>

                <NavLink to="/communities" onClick={handleRequireLogin} className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiUsers size={24} />
                    <span className="text-xs">Comunidades</span>
                </NavLink>

                <NavLink to="/chat" onClick={handleRequireLogin} className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiMessageSquare size={24} />
                    <span className="text-xs">Chat</span>
                </NavLink>
                
                {/* O 'user?.username' previne erro, e o handler cuida do clique */}
                <NavLink to={`/profile/${user?.username || ''}`} onClick={handleRequireLogin} className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <FiUser size={24} />
                    <span className="text-xs">Perfil</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default BottomNav;