// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './utils/PrivateRoute';
import { Toaster } from 'react-hot-toast'; // 1. Importe o Toaster
import ProfilePage from './pages/ProfilePage';
import FollowingFeedPage from './pages/FollowingFeedPage';
import ChatListPage from './pages/ChatListPage';
import ChatDetailPage from './pages/ChatDetailPage';
import AdminRoute from './utils/AdminRoute';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
          <Route path="/" element={<HomePage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/following" element={<FollowingFeedPage />} />
            <Route path="/chat" element={<ChatListPage />} />
            <Route path="/chat/:id" element={<ChatDetailPage />} />
            <Route element={<AdminRoute />} >
              <Route path='/admin' element={ <AdminPage /> } />
            </Route>
          </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
}

export default App;