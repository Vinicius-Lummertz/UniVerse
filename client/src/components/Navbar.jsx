// src/components/Navbar.jsx
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import SearchUser from './SearchUser'; 
import { FiBell } from 'react-icons/fi'; 

const Navbar = () => {
    const { user, logoutUser, unreadAnnouncements, unreadSocial } = useContext(AuthContext);

    // Se não estiver logado, renderiza uma navbar mínima
    if (!user) {
        return (
            <div className="navbar bg-base-200 shadow-lg sticky top-0 z-30">
                <div className="navbar-start">
                    <Link to="/" className="btn btn-ghost text-xl">UniVerse</Link>
                </div>
                <div className="navbar-center hidden lg:flex"></div>
                <div className="navbar-end">
                    <Link to="/login" className="btn bg-purple-400 text-white">Entrar</Link>
                </div>
            </div>
        );
    }

    // --- Lógica para usuário logado ---
    const profilePicUrl = user.profile?.profile_pic || '/avatar-default.svg';
    const username = user.username;
    const canAccessAdmin = user.is_staff || user.profile?.is_admin;

    const hasHighPriorityNotif = unreadAnnouncements > 0;
    const hasLowPriorityNotif = unreadSocial > 0;
    const showIndicator = hasHighPriorityNotif || hasLowPriorityNotif;
    
    const indicatorColor = hasHighPriorityNotif ? 'badge-error' : 'badge-secondary';

    return (
        <div className="navbar bg-base-200 shadow-lg sticky top-0 z-30">
            <div className="navbar-start">
                <Link to="/" className="btn btn-ghost text-xl">UniVerse</Link>
            </div>

            <div className="navbar-center hidden lg:flex"></div>

            <div className="navbar-end gap-2 items-center">
                <SearchUser />

                <Link to="/notifications" className="btn btn-ghost btn-circle">
                    <div className="indicator">
                        {showIndicator && (
                            <span className={`indicator-item badge badge-xs ${indicatorColor}`}></span>
                        )}
                        <FiBell size={20} />
                    </div>
                </Link>

                {/* Dropdown de Perfil */}
                <div className="dropdown dropdown-end">
                     <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full">
                            <img alt="User Avatar" src={profilePicUrl} />
                        </div>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-300 rounded-box w-52">
                        <li><Link to={`/profile/${username}`} className="justify-between">Perfil</Link></li>
                        <li><a>Configurações</a></li>
                        
                        {canAccessAdmin && (
                            <li><Link to="/admin" className="text-warning font-bold">Painel Admin</Link></li>
                        )}
                        
                        <li className="mt-1"><ThemeSwitcher /></li>
                        <li className="mt-1"><hr className="border-base-content/20" /></li>
                        <li><button onClick={logoutUser} className="text-error">Sair</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Navbar;