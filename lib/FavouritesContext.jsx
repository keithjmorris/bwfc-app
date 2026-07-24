'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getTeamById } from '@/lib/allTeams';

const FavouritesContext = createContext([]);

export function FavouritesProvider({ children }) {
  const [favourites, setFavourites] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('fc_favourites');
    if (saved) {
      try {
        setFavourites(JSON.parse(saved));
      } catch {}
    }
  }, []);

  function updateFavourites(teams) {
    setFavourites(teams);
    localStorage.setItem('fc_favourites', JSON.stringify(teams));
  }

  return (
    <FavouritesContext.Provider value={{ favourites, updateFavourites }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}