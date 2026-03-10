import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CONFIG = {
  GUEST_SEARCH_LIMIT: 2
};

export function useSearchLimit() {
  const { user } = useAuth();
  const [searchCount, setSearchCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

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
  }, [user]);

  const incrementSearch = () => {
    if (user) return true;

    const newCount = searchCount + 1;
    setSearchCount(newCount);
    localStorage.setItem('guest_search_count', newCount.toString());
    
    if (newCount > CONFIG.GUEST_SEARCH_LIMIT) {
      setIsLimitReached(true);
      return false;
    }
    
    return true;
  };

  const checkLimitBeforeSearch = () => {
    if (user) return true;
    return searchCount < CONFIG.GUEST_SEARCH_LIMIT;
  };

  // Função exclusiva para teste
  const resetLimit = () => {
    setSearchCount(0);
    setIsLimitReached(false);
    localStorage.removeItem('guest_search_count');
  };

  return {
    isLimitReached,
    incrementSearch,
    checkLimitBeforeSearch,
    resetLimit,
    limit: CONFIG.GUEST_SEARCH_LIMIT
  };
}