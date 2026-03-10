import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Configuração centralizada para fácil edição futura
const CONFIG = {
  GUEST_SEARCH_LIMIT: 2
};

export function useSearchLimit() {
  const { user } = useAuth();
  const [searchCount, setSearchCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    // Carregar contagem do localStorage apenas se não estiver logado
    if (!user) {
      const stored = localStorage.getItem('guest_search_count');
      if (stored) {
        const count = parseInt(stored, 10);
        setSearchCount(count);
        setIsLimitReached(count >= CONFIG.GUEST_SEARCH_LIMIT);
      }
    } else {
      setIsLimitReached(false);
    }
  }, [user]);

  const incrementSearch = () => {
    if (user) return true; // Logado não tem limite

    const newCount = searchCount + 1;
    if (newCount > CONFIG.GUEST_SEARCH_LIMIT) {
      setIsLimitReached(true);
      return false; // Bloqueado
    }

    setSearchCount(newCount);
    localStorage.setItem('guest_search_count', newCount.toString());
    
    if (newCount >= CONFIG.GUEST_SEARCH_LIMIT) {
      // O limite foi atingido APÓS essa busca
      // Mas permitimos a busca atual passar se for a segunda
    }
    
    return true;
  };

  const checkLimitBeforeSearch = () => {
    if (user) return true;
    return searchCount < CONFIG.GUEST_SEARCH_LIMIT;
  };

  return {
    isLimitReached,
    incrementSearch,
    checkLimitBeforeSearch,
    limit: CONFIG.GUEST_SEARCH_LIMIT
  };
}