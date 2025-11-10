// src/components/admin/UserManagementTab.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import EditUserModal from './EditUserModal'; // O modal que criaremos a seguir
import { FiEdit, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const UserManagementTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Função para buscar os usuários
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('/api/admin/users/');
            setUsers(response.data);
        } catch (err) {
            console.error("Erro ao buscar usuários:", err);
            setError("Não foi possível carregar os usuários.");
            toast.error("Erro ao carregar usuários.");
        } finally {
            setLoading(false);
        }
    };

    // Busca inicial
    useEffect(() => {
        fetchUsers();
    }, []);

    // Abrir o modal para edição
    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    // Fechar o modal
    const handleCloseModal = () => {
        setSelectedUser(null);
        setIsModalOpen(false);
    };

    // Atualiza a lista local após a edição no modal
    const handleUserUpdated = (updatedUser) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        fetchUsers(); // Recarrega para garantir consistência
        handleCloseModal();
    };

    if (loading) return <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error) return <div className="text-error">{error}</div>;

    return (
        <div>
            <h2 className="card-title mb-4">Gerenciamento de Usuários</h2>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Email</th>
                            <th>Badges</th>
                            <th>É Staff?</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="hover">
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar avatar-xs">
                                            <div className="w-8 rounded-full">
                                                <img src={user.profile.profile_pic || '/avatar-default.svg'} alt={user.username} />
                                            </div>
                                        </div>
                                        {user.username}
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <div className="flex flex-wrap gap-1">
                                        {user.profile.badges.map(badge => (
                                            <div key={badge.id} className={`badge badge-${badge.color || 'neutral'} badge-sm`}>{badge.name}</div>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    {user.is_staff ? 
                                        <FiCheckCircle className="text-success" /> : 
                                        <FiXCircle className="text-error" />}
                                </td>
                                <td>
                                    <button className="btn btn-ghost btn-xs" onClick={() => handleEditClick(user)}>
                                        <FiEdit /> Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Edição */}
            {selectedUser && (
                <EditUserModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    userToEdit={selectedUser}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </div>
    );
};

export default UserManagementTab;