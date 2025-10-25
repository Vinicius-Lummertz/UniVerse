// src/components/SearchUser.jsx
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';

const SearchUser = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { authTokens } = useContext(AuthContext);

    // Usa o debounce! A busca só roda 500ms após o usuário parar de digitar
    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        const search = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }
            try {
                const response = await axios.get(`http://localhost:8000/api/users/search/?q=${debouncedQuery}`, {
                    headers: { 'Authorization': `Bearer ${authTokens.access}` }
                });
                setResults(response.data);
                setIsOpen(true);
            } catch (error) {
                console.error("Erro na busca", error);
            }
        };
        search();
    }, [debouncedQuery, authTokens]);

    return (
        <div className="dropdown w-full md:w-auto">
            <input 
                type="text" 
                placeholder="Buscar usuários..." 
                className="input input-bordered w-full md:w-auto"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Fecha ao perder foco
                onFocus={() => query.length > 1 && setIsOpen(true)} // Reabre ao focar
            />
            {isOpen && results.length > 0 && (
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full md:w-52 mt-2">
                    {results.map(user => (
                        <li key={user.username}>
                            <Link to={`/profile/${user.username}`} onClick={() => setIsOpen(false)}>
                                <div className="avatar avatar-xs">
                                    <div className="w-6 rounded-full">
                                        <img src={user.profile?.profile_pic || '/avatar-default.svg'} />
                                    </div>
                                </div>
                                {user.username}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchUser;