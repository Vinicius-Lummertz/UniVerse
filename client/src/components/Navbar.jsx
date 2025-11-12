// src/components/Navbar.jsx
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import SearchUser from './SearchUser'; 
import { FiBell } from 'react-icons/fi'; // 1. Importar o ícone de Sino

const Navbar = () => {
    // 2. Obter contagens do contexto
    const { user, logoutUser, unreadAnnouncements, unreadSocial } = useContext(AuthContext);

    const profilePicUrl = user?.profile?.profile_pic || '/avatar-default.svg';
    const username = user?.username;
    const canAccessAdmin = user?.is_staff || user?.profile?.is_admin;

    // 3. Lógica de prioridade da "bolinha"
    const hasHighPriorityNotif = unreadAnnouncements > 0;
    const hasLowPriorityNotif = unreadSocial > 0;
    const showIndicator = hasHighPriorityNotif || hasLowPriorityNotif;
    
    // Vermelho (badge-error) para recados, Roxo (badge-secondary) para social
    const indicatorColor = hasHighPriorityNotif ? 'badge-error' : 'badge-secondary';

    if (!user) return null;

    return (
        <div className="navbar bg-base-200 shadow-lg sticky top-0 z-30">
            <div className="navbar-start">
                <Link to="/" className="btn btn-ghost text-xl">UniVerse</Link>
            </div>

            <div className="navbar-center hidden lg:flex"></div>

            <div className="navbar-end gap-2 items-center">
                <SearchUser />

                {/* 4. NOVO ÍCONE DE SINO */}
                <Link to="/notifications" className="btn btn-ghost btn-circle">
                    {/* Usa o 'indicator' do DaisyUI */}
                    <div className="indicator">
                        {/* Define a cor da "bolinha" com base na prioridade */}
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
                        
                        {/* 5. REMOVIDO o link de Recados daqui */}
                        
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