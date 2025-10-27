// src/components/SearchUser.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchUser = () => {
    // Estado para controlar se o INPUT está visível
    const [isInputVisible, setIsInputVisible] = useState(false);
    
    // Estados da Busca
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const { authTokens } = useContext(AuthContext);
    
    // Refs
    const inputRef = useRef(null);
    const containerRef = useRef(null); // Para clique fora

    const debouncedQuery = useDebounce(query, 500);

    // Foca no input quando ele aparece
    useEffect(() => {
        if (isInputVisible) {
            inputRef.current?.focus();
        }
    }, [isInputVisible]);

    // Efeito para buscar
    useEffect(() => {
        const search = async () => {
             if (debouncedQuery.length < 2) {
                setResults([]);
                setIsResultsOpen(false);
                return;
            }
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/search/?q=${debouncedQuery}`, {
                    headers: { 'Authorization': `Bearer ${authTokens.access}` }
                });
                console.log(response.data)
                setResults(response.data);
                setIsResultsOpen(true); // Abre resultados ao encontrar
            } catch (error) {
                console.error("Erro na busca", error);
                setResults([]);
                setIsResultsOpen(false);
            }
        };
        // Só busca se o input estiver visível e tiver query
        if (isInputVisible) {
            search();
        } else {
            // Garante que resultados fechem se o input for escondido
            setResults([]);
            setIsResultsOpen(false);
        }
    }, [debouncedQuery, isInputVisible, authTokens]);

    // Efeito para fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsInputVisible(false); // Fecha o input
                setIsResultsOpen(false);
                setQuery(''); // Limpa a query
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Função para limpar e fechar
     const handleCloseAndClear = () => {
         setQuery('');
         setResults([]);
         setIsResultsOpen(false);
         setIsInputVisible(false); // Fecha o input
     };
     
    // Função para abrir/focar
    const handleIconClick = () => {
        setIsInputVisible(true);
    };

return (
    // Container relativo para posicionar resultados e detectar clique fora
    <div ref={containerRef} className="relative flex items-center">
        {/* Input de Busca com Animação */}
        <div
            className={`
                relative 
                transition-all duration-300 ease-in-out 
                ${isInputVisible ? 'w-48 md:w-64 opacity-100 z-10' : 'w-0 opacity-0 -z-10 pointer-events-none'} 
            `}
        >
            <input
                ref={inputRef}
                type="text"
                placeholder="Buscar usuários..."
                className={`
                    input input-bordered input-sm w-full pl-4 pr-8 
                    ${isInputVisible ? 'p-2' : 'p-0 border-0'} 
                `}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsResultsOpen(true)}
            />
             {/* Botão 'X' dentro do Input */}
             {isInputVisible && (
                 <button
                     className="btn btn-ghost btn-xs btn-circle absolute right-1 top-1/2 -translate-y-1/2 z-20" // Adicionado z-20
                     onClick={handleCloseAndClear}
                     aria-label="Limpar busca"
                 >
                     <FiX size={16}/>
                 </button>
             )}

             {/* Resultados da Busca (Dropdown) */}
            {isResultsOpen && results.length > 0 && (
                // Z-index alto para ficar sobre outros elementos da navbar
                <ul tabIndex={-1} className="absolute z-[100] top-full left-0 mt-2 menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto">
                    {results.map(userResult => (
                            <li key={userResult.username}>
                                <Link to={`/profile/${userResult.username}`} onClick={handleCloseAndClear}>
                                    <div className="avatar avatar-xs">
                                        <div className="w-6 rounded-full">
                                            <img src={userResult.profile?.profile_pic || '/avatar-default.svg'} />
                                        </div>
                                    </div>
                                    {userResult.username}
                                </Link>
                            </li>
                        ))}
                </ul>
            )}
            {/* Mensagem se não houver resultados */}
            {isResultsOpen && debouncedQuery.length >= 2 && results.length === 0 && (
                 <div className="absolute top-full left-0 mt-2 z-[30] p-4 shadow bg-base-100 rounded-box w-full text-center text-sm text-base-content/70">
                     Nenhum usuário encontrado.
                 </div>
            )}
        </div>

         {/* Botão com Ícone de Busca */}
         {/* Removido o z-[5] daqui, pois o input agora controla o z-index */}
         <button 
             className={`btn btn-ghost btn-circle transition-all duration-300 ${isInputVisible ? 'ml-[-1.75rem]' : 'ml-0'}`} // Ajuste a margem como antes
             onClick={handleIconClick}
             aria-label="Abrir busca"
         >
             <FiSearch size={20} />
         </button>
    </div>
);
};

export default SearchUser;