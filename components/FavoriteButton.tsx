
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

interface FavoriteButtonProps {
  trackId: number;
  onToggle?: (isFavorite: boolean) => void;
  size?: number;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ trackId, onToggle, size = 20 }) => {
  const { session, isDarkMode } = useStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('track_id', trackId)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      }
    };

    checkIfFavorite();
  }, [trackId, session?.user?.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!session?.user?.id) {
      // Memorizza l'intento nel localStorage per gli utenti non loggati
      const pendingFavorites = JSON.parse(localStorage.getItem('pinegroove_pending_favorites') || '[]');
      if (!pendingFavorites.includes(trackId)) {
        pendingFavorites.push(trackId);
        localStorage.setItem('pinegroove_pending_favorites', JSON.stringify(pendingFavorites));
      }
      
      // Reindirizza al login
      navigate('/auth');
      return;
    }

    setLoading(true);
    const prevStatus = isFavorite;
    
    // UI Ottimistica
    setIsFavorite(!prevStatus);

    try {
      if (prevStatus) {
        // Rimuovi dai preferiti
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('track_id', trackId);
        
        if (error) throw error;
      } else {
        // Aggiungi ai preferiti
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: session.user.id,
            track_id: trackId
          });
        
        if (error) throw error;
      }
      
      if (onToggle) onToggle(!prevStatus);
    } catch (err) {
      console.error("Error toggling favorite:", err);
      // Ripristina lo stato precedente in caso di errore
      setIsFavorite(prevStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`
        p-2 rounded-full transition-all duration-300 transform active:scale-90
        ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}
        ${loading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
      `}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={size}
        className={`transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-zinc-400 group-hover:text-red-400'}`}
      />
    </button>
  );
};
