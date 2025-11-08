// src/components/Navbar.jsx
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import SearchUser from './SearchUser'; // Importa o componente refatorado

const Navbar = () => {
    const { user, logoutUser } = useContext(AuthContext);
    // Estado para controlar se a busca está visível

    const profilePicUrl = user?.profile?.profile_pic || '/default-avatar.png';
    const username = user?.username;
    const isStaff = user?.is_staff;

    if (!user) return null;

    return (
        <div className="navbar bg-base-200 shadow-lg sticky top-0 z-30">
            {/* Start: Logo */}
            <div className="navbar-start">
                <Link to="/" className="btn btn-ghost text-xl">UniVerse</Link>
            </div>

            {/* Center: Vazio */}
            <div className="navbar-center hidden lg:flex"></div>

            {/* End: Busca e Perfil */}
            <div className="navbar-end gap-2 items-center"> {/* Garante alinhamento vertical */}

                {/* Renderiza o componente SearchUser diretamente */}
                <SearchUser />

                <div className="dropdown dropdown-end">
                     <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full">
                            <img alt="User Avatar" src={profilePicUrl} />
                        </div>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-300 rounded-box w-52">
                        <li><Link to={`/profile/${username}`} className="justify-between">Perfil</Link></li>
                        <li><a>Configurações</a></li>
                        {isStaff && (
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