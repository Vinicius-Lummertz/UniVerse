// src/pages/RegisterPage.jsx
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
    const { registerUser } = useContext(AuthContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        registerUser(username, email, password);
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-200">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center mb-6">Criar Conta</h2>
                <input type="text" name="username" placeholder="Usuário" required className="w-full p-3 mb-4 border rounded"/>
                <input type="email" name="email" placeholder="Email" required className="w-full p-3 mb-4 border rounded"/>
                <input type="password" name="password" placeholder="Senha" required className="w-full p-3 mb-4 border rounded"/>
                <button type="submit" className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600">Registrar</button>
                <p className="text-center mt-4">
                    Já tem uma conta? <Link to="/login" className="text-blue-500">Faça login</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;