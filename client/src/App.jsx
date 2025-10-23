// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './utils/PrivateRoute';
import { Toaster } from 'react-hot-toast'; // 1. Importe o Toaster

function App() {
  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
}

export default App;