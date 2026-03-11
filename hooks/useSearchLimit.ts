import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUIStore } from '../store/uiStore';

const CONFIG = {
  GUEST_SEARCH_LIMIT: 2
};

export function useSearchLimit() {
  const { user } = useAuth();
  const { 
    searchCount, 
    setSearchCount, 
    isLimitReached, 
    setIsLimitReached,
    incrementSearchCount 
  } = useUIStore();

  // Inicialização e Sincronização com LocalStorage
  useEffect(() => {
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
  }, [user, setSearchCount, setIsLimitReached]);

  // Sempre que o count mudar, atualiza o localStorage e verifica limite
  useEffect(() => {
    if (!user) {
      localStorage.setItem('guest_search_count', searchCount.toString());
      setIsLimitReached(searchCount >= CONFIG.GUEST_SEARCH_LIMIT);
    }
  }, [searchCount, user, setIsLimitReached]);

  const increment = () => {
    if (user) return true;
    
    if (searchCount >= CONFIG.GUEST_SEARCH_LIMIT) {
      setIsLimitReached(true);
      return false;
    }

    incrementSearchCount();
    return true;
  };

  const checkLimitBeforeSearch = () => {
    if (user) return true;
    return searchCount < CONFIG.GUEST_SEARCH_LIMIT;
  };

  const resetLimit = () => {
    setSearchCount(0);
    setIsLimitReached(false);
    localStorage.removeItem('guest_search_count');
  };

  return {
    isLimitReached,
    incrementSearch: increment,
    checkLimitBeforeSearch,
    resetLimit,
    limit: CONFIG.GUEST_SEARCH_LIMIT,
    currentCount: searchCount
  };
}