// src/pages/LoginPage.jsx
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ServerStatusIndicator from '../components/ServerStatusIndicator'; // 1. Importar

const LoginPage = () => {
    const { loginUser } = useContext(AuthContext);
    
    const [isServerOnline, setIsServerOnline] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        if (username.length > 0) {
            loginUser(username, password);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="card w-full max-w-md bg-base-100 shadow-xl m-4">
                <div className="card-body">
                    
                    <div className="mb-4">
                        <ServerStatusIndicator 
                            onServerOnline={() => setIsServerOnline(true)} 
                        />
                    </div>
                    
                    <h2 className="card-title text-3xl justify-center font-bold">Entrar</h2>
                    
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Usuário</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Seu nome de usuário"
                                className="input input-bordered"
                                required
                                disabled={!isServerOnline} 
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Senha</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Sua senha"
                                className="input input-bordered"
                                required
                                disabled={!isServerOnline} 
                            />
                        </div>
                        <div className="form-control mt-6">
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={!isServerOnline} 
                            >
                                {isServerOnline ? "Login" : "Aguardando Servidor..."}
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-4">
                        <p>
                            Não tem uma conta?{' '}
                            <Link to="/register" className="link link-primary">
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;