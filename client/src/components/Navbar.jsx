// src/components/Navbar.jsx

import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const { logoutUser } = useContext(AuthContext);

    return (
        <header className="p-4 bg-space-dark bg-stars border-b border-slate-700 shadow-lg flex justify-between items-center sticky top-0 z-20">
            <h1 className="text-xl font-bold text-white">UniVerse</h1>
            <button onClick={logoutUser}>
                Sair
            </button>
        </header>
    );
};

export default Navbar;