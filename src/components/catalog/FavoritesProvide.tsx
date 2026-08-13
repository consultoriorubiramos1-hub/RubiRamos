"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FavoritesContextType {
  favorites: Set<number>;
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  const isFavorite = (productId: number) => favorites.has(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}