// src/utils/AdminRoute.jsx
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const AdminRoute = () => {
    const { user } = useContext(AuthContext);
    
    // ATUALIZADO: Verifica a flag de permissão no perfil, 
    // que é controlada pelos Badges, ou se é Superusuário (is_staff).
    if (user && (user.profile?.is_admin || user.is_staff)) {
        return <Outlet />; // Permite o acesso à rota aninhada (AdminPage)
    } 
    
    if (user) {
        return <Navigate to="/" />; // Logado mas não é admin? Volta para Home.
    }
    
    return <Navigate to="/login" />; // Não está logado? Vai para o Login.
};

export default AdminRoute;