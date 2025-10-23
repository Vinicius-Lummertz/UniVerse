// src/pages/LoginPage.jsx

import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';
import UniVerseButton from '../components/UniButton'; // <-- CORREÇÃO 1: Caminho correto

const LoginPage = () => {
    const { loginUser } = useContext(AuthContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        loginUser(username, password);
    };

    return (
        // CORREÇÃO 3: Fundo de estrelas aplicado na div principal da tela
        <div className="flex items-center justify-center h-screen bg-stars">
            <form onSubmit={handleSubmit} className="p-8 bg-white/10 backdrop-blur-md rounded-lg shadow-xl w-96 border border-white/20">
                <h2 className="text-2xl font-bold text-center text-white mb-6">UniVerse Login</h2>
                <input 
                    type="text" 
                    name="username" 
                    placeholder="Usuário" 
                    required 
                    className="w-full p-3 mb-4 border border-white/30 bg-white/20 text-white rounded placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <input 
                    type="password" 
                    name="password" 
                    placeholder="Senha" 
                    required 
                    className="w-full p-3 mb-4 border border-white/30 bg-white/20 text-white rounded placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />

                {/* CORREÇÃO 2: Botão usado da forma correta dentro do form */}
                <div className="flex justify-center mt-4">
                  <UniVerseButton type="submit">
                      Entrar
                  </UniVerseButton>
                </div>

                <p className="text-center text-gray-300 mt-6">
                    Não tem uma conta? <Link to="/register" className="text-green-400 hover:underline">Crie uma aqui</Link>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;