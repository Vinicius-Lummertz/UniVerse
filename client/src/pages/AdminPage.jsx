// src/pages/AdminPage.jsx
import React from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { FiUsers, FiFileText, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom'; 


const AdminPage = () => {
    return (
        <div className="pb-20">
            <Navbar />
            <main className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">Painel de Administração</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Card 1: Gerenciar Usuários */}
                    <div className="card w-full bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title">
                                <FiUsers className="text-primary" />
                                Gerenciar Usuários (Issue #1)
                            </h2>
                            <p>Pesquise, edite e atribua "Níveis de Acesso" (Badges) aos usuários, como "Professor" ou "Admin".</p>
                            <div className="card-actions justify-end mt-4">
                                <button className="btn btn-primary" onClick={() => alert("Em breve!")}>Gerenciar</button>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Gerenciar Posts */}
                    <div className="card w-full bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title">
                                <FiFileText className="text-secondary" />
                                Gerenciar Posts (Issue #2)
                            </h2>
                            <p>Visualize, edite ou exclua posts de qualquer usuário na plataforma.</p>
                             <div className="card-actions justify-end mt-4">
                                <button className="btn btn-secondary" onClick={() => alert("Em breve!")}>Moderar</button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Card 3: Outras Configurações */}
                    <div className="card w-full bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title">
                                <FiShield className="text-accent" />
                                Outras Configurações
                            </h2>
                            <p>Gerencie comunidades, anúncios globais e outras configurações do sistema.</p>
                             <div className="card-actions justify-end mt-4">
                                <button className="btn btn-accent" onClick={() => alert("Em breve!")}>Configurar</button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default AdminPage;