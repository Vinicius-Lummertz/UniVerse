// src/pages/AdminPage.jsx
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { FiUsers, FiFileText, FiShield } from 'react-icons/fi';
import UserManagementTab from '../components/admin/UserManagementTab';
import PostManagementTab from '../components/admin/PostManagementTab';
import BadgeManagementTab from '../components/admin/BadgeManagementTab'; // 1. Importar nova aba

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'posts', ou 'badges'

    return (
        <div className="pb-20">
            <Navbar />
            <main className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">Painel de Administração</h1>

                {/* Abas de Navegação */}
                <div role="tablist" className="tabs tabs-lifted tabs-lg mb-6">
                    <a
                        role="tab"
                        className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <FiUsers className="mr-2" /> Usuários
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === 'posts' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <FiFileText className="mr-2" /> Posts
                    </a>
                    {/* 2. Nova Aba de Badges */}
                    <a
                        role="tab"
                        className={`tab ${activeTab === 'badges' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('badges')}
                    >
                        <FiShield className="mr-2" /> Badges (Permissões)
                    </a>
                </div>

                {/* Conteúdo das Abas */}
                <div className="card w-full bg-base-100 shadow-xl">
                    <div className="card-body">
                        {activeTab === 'users' && <UserManagementTab />}
                        {activeTab === 'posts' && <PostManagementTab />}
                        {activeTab === 'badges' && <BadgeManagementTab />} 
                    </div>
                </div>

            </main>
            <BottomNav />
        </div>
    );
};

export default AdminPage;