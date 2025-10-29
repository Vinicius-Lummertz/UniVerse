// src/components/SearchUser.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import { FiSearch, FiX } from 'react-icons/fi';
import axiosInstance from '../utils/axiosInstance';

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
                const response = await axiosInstance.get(`/api/users/search/?q=${debouncedQuery}`, {
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
                    ${isInputVisible ? 'w-48 md:w-64 opacity-100' : 'w-0 opacity-0'} 
                    overflow-hidden ml-px-30
                `}
            >
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar usuários..."
                    className={`
                        input input-bordered input-sm w-full pl-4 pr-8 
                        ${isInputVisible ? 'p-2' : 'p-0 border-0'} 
                    `} // Padding só quando visível
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsResultsOpen(true)}
                />
                 {/* Botão 'X' dentro do Input */}
                 {isInputVisible && (
                     <button
                         className="btn btn-ghost btn-xs btn-circle absolute right-1 top-1/2 -translate-y-1/2"
                         onClick={handleCloseAndClear}
                         aria-label="Limpar busca"
                     >
                         <FiX size={16}/>
                     </button>
                 )}

                 {/* Resultados da Busca (Dropdown) */}
                {isResultsOpen && results.length > 0 && (
                    <ul tabIndex={0} className="relative top-full left-0 mt-2 z-[10] menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto">
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
                     <div className="absolute top-full left-0 mt-2 z-[10] p-4 shadow bg-base-100 rounded-box w-full text-center text-sm text-base-content/70">
                         Nenhum usuário encontrado.
                     </div>
                )}
            </div>

             {/* Botão com Ícone de Busca (Sempre visível) */}
             {/* Adicionado ml-[-2.5rem] quando input visivel para sobrepor um pouco */}
             <button 
                 className={`btn btn-ghost btn-circle z-[5] transition-all duration-300 ${isInputVisible ? 'ml-[-0.1rem]' : 'ml-0'}`} 
                 onClick={handleIconClick}
                 aria-label="Abrir busca"
             >
                 <FiSearch size={20} />
             </button>
        </div>
    );
};

export default SearchUser;