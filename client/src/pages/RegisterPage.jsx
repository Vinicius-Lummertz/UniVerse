import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast'; // Importar o toast para feedback

const RegisterPage = () => {
    const { registerUser } = useContext(AuthContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        const passwordConfirm = e.target.passwordConfirm.value;

        // Verificação de senha
        if (password !== passwordConfirm) {
            toast.error("As senhas não coincidem!");
            return;
        }

        // Você pode adicionar mais validações aqui (ex: tamanho da senha)

        registerUser(username, email, password);
    };

    return (
        // Usamos 'hero' para o fundo de tela cheia
        // A nova classe 'bg-register-galaxy' será definida no tailwind.config.js
        <div className="hero min-h-screen bg-[url(/enter.png)] bg-cover bg-center">
            {/* Camada de escurecimento para legibilidade */}
            
            {/* Conteúdo centralizado */}
            <div className="hero-content text-center">
                {/* Card de Registro com efeito de vidro */}
                <div className="card w-96 bg-base-400/70 backdrop-blur-sm shadow-xl border border-white/30">
                    
                    <form onSubmit={handleSubmit} className="card-body">
                        <h2 className="card-title justify-center text-2xl text-purple-100">Entrar no UniVerse</h2>
                        
                        <div className="form-control">
                            <label className="label"><span className="label-text text-black/80">Nome de Usuário</span></label>
                            <input 
                                type="text" 
                                name="username" 
                                placeholder="Seu @ de usuário" 
                                required 
                                className="input input-bordered bg-black/20 text-white placeholder:text-gray-300"
                            />
                        </div>

                        <div className="form-control">
                             <label className="label"><span className="label-text text-black/80">Email</span></label>
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="seu@email.com" 
                                required 
                                className="input input-bordered bg-black/20 text-white placeholder:text-gray-300"
                            />
                        </div>

                        <div className="form-control">
                             <label className="label"><span className="label-text text-black/80">Senha</span></label>
                            <input 
                                type="password" 
                                name="password" 
                                placeholder="••••••••" 
                                required 
                                className="input input-bordered bg-black/20 text-white placeholder:text-gray-300"
                            />
                        </div>

                         <div className="form-control">
                             <label className="label"><span className="label-text text-black/80">Confirmar Senha</span></label>
                            <input 
                                type="password"
                                name="passwordConfirm"
                                placeholder="••••••••" 
                                required
                                className="input input-bordered bg-black/20 text-white placeholder:text-gray-300"
                            />
                        </div>

                        <div className="form-control mt-6">
                            {/* Botão secundário (geralmente verde/aqua nos temas) */}
                            <button type="submit" className="btn btn-secondary">Criar Conta</button>
                        </div>

                        <p className="text-center text-gray-300 text-sm mt-4">
                            Já tem uma conta? 
                            <Link to="/login" className="link link-primary ml-1">Faça login</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;