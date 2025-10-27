// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect, useMemo } from 'react';

// 1. Cria o Contexto
const ThemeContext = createContext();

// Lista de temas disponíveis (deve corresponder aos temas no tailwind.config.js)
const availableThemes = [
  "light", 
  "dark", 
  "cupcake", 
  "bumblebee", 
  "emerald", 
  "corporate", 
  "synthwave", 
  "retro", 
  "cyberpunk", 
  "valentine", 
  "halloween", 
  "garden", 
  "forest", 
  "aqua", 
  "lofi", 
  "pastel", 
  "fantasy", 
  "wireframe", 
  "black", 
  "luxury", 
  "dracula", 
  "cmyk", 
  "autumn", 
  "business", 
  "acid", 
  "lemonade", 
  "night", 
  "coffee", 
  "winter", 
  "dim", 
  "nord", 
  "sunset", 
  "caramellatte", 
  "abyss", 
  "silk" 
];

export const ThemeProvider = ({ children }) => {
    // 2. State para guardar o tema atual
    // Lê do localStorage ou usa 'night' como padrão inicial
    const [theme, setThemeState] = useState(() => {
        const storedTheme = localStorage.getItem('theme');
        return availableThemes.includes(storedTheme) ? storedTheme : 'night';
    });

    // 3. Efeito para aplicar o tema na tag <html>
    useEffect(() => {
        // Seleciona a tag <html>
        const htmlElement = document.documentElement;
        // Remove temas antigos (para garantir limpeza)
        availableThemes.forEach(t => htmlElement.classList.remove(t)); 
        // Define o atributo data-theme
        htmlElement.setAttribute('data-theme', theme);
        // Opcional: Adiciona a classe para seletores CSS mais complexos se necessário
        // htmlElement.classList.add(theme); 
        
        console.log(`Tema aplicado: ${theme}`); // Para debug
    }, [theme]); // Roda sempre que o state 'theme' mudar

    // 4. Função para mudar o tema (atualiza state e localStorage)
    const setTheme = (newTheme) => {
        if (availableThemes.includes(newTheme)) {
            setThemeState(newTheme);
            localStorage.setItem('theme', newTheme);
        } else {
            console.warn(`Tema '${newTheme}' não é válido.`);
        }
    };

    // O useMemo evita recriações desnecessárias do objeto de contexto
    const contextValue = useMemo(() => ({ theme, setTheme, availableThemes }), [theme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;