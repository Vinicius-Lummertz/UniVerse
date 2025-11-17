// src/components/ServerStatusIndicator.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const ServerStatusIndicator = ({ onServerOnline }) => {
    // 'offline', 'ligando', 'online'
    const [status, setStatus] = useState('offline'); 
    const [loading, setLoading] = useState(false);

    // Função para "acordar" o servidor
    const wakeServer = async () => {
        if (loading) return; // Previne cliques duplos

        setStatus('ligando');
        setLoading(true);
        
        try {
            // A chamada para o endpoint leve.
            // Se o servidor estiver dormindo, esta chamada vai demorar 30-60s.
            await axiosInstance.get('/api/status/');
            
            // Se chegou aqui, o servidor acordou.
            setStatus('online');
            toast.success('Servidor conectado!');
            onServerOnline(); // Avisa a página de Login que pode continuar
            
        } catch (error) {
            // Se falhar (ex: 500 ou CORS após acordar)
            setStatus('offline');
            setLoading(false);
            toast.error('O servidor não respondeu. Tente novamente.');
        } 
        // Não usamos finally, pois o loading só deve parar se falhar.
        // Se tiver sucesso, o componente desaparece.
    };

    // Tenta acordar o servidor automaticamente ao carregar a página
    useEffect(() => {
        wakeServer();
    }, []); // O array vazio garante que isto só roda uma vez

    // Renderização baseada no status
    
    // 1. Servidor Online
    if (status === 'online') {
        return (
            <div className="flex justify-center items-center gap-2 p-2 bg-success/10 text-success rounded-lg border border-success/30">
                <span className="badge badge-success badge-xs"></span>
                <span>Servidor Online. Pode fazer login.</span>
            </div>
        );
    }
    
    // 2. Servidor Ligando (Loading)
    if (status === 'ligando') {
        return (
            <div className="flex justify-center items-center gap-2 p-2 bg-warning/10 text-warning rounded-lg border border-warning/30">
                <span className="loading loading-spinner loading-xs"></span>
                <span>Ligando servidor... (Isto pode levar até 60s)</span>
            </div>
        );
    }

    // 3. Servidor Offline (Estado inicial ou Falha)
    return (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 p-2 bg-error/10 text-error rounded-lg border border-error/30">
            <div className="flex items-center gap-2">
                <span className="badge badge-error badge-xs"></span>
                <span>Servidor offline.</span>
            </div>
            <button 
                className="btn btn-error btn-xs" 
                onClick={wakeServer}
                disabled={loading}
            >
                Ligar Servidor
            </button>
        </div>
    );
};

export default ServerStatusIndicator;