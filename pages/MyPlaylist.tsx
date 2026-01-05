
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { MusicTrack } from '../types';
import { useStore } from '../store/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Music, ArrowRight, Loader2, Play, Pause, LayoutGrid, LayoutList, Info } from 'lucide-react';
import { SEO } from '../components/SEO';
import { createSlug } from '../utils/slugUtils';
import { FavoriteButton } from '../components/FavoriteButton';
import { WaveformVisualizer } from '../components/WaveformVisualizer';

interface FavoriteWithTrack {
  track_id: number;
  squeeze_tracks: MusicTrack;
}

export const MyPlaylist: React.FC = () => {
  const { session, isDarkMode, playTrack, currentTrack, isPlaying } = useStore();
  const [favorites, setFavorites] = useState<FavoriteWithTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const navigate = useNavigate();

  useEffect(() => {
    if (!session?.user?.id) {
      navigate('/auth');
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('track_id, squeeze_tracks(*)')
          .eq('user_id', session.user.id);

        if (error) throw error;
        if (data) {
          // Filtriamo eventuali join falliti (brani eliminati dal catalogo)
          const validFavorites = (data as any[]).filter(f => f.squeeze_tracks) as FavoriteWithTrack[];
          setFavorites(validFavorites);
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session, navigate]);

  const handleRemoveFromList = (trackId: number) => {
    setFavorites(prev => prev.filter(f => f.track_id !== trackId));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="opacity-60 font-medium">Loading your playlist...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      <SEO title="My Wishlist" description="Your favorite tracks selected from the Pinegroove library." />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
            <Heart className="text-red-500 fill-red-500" size={36} />
            My Wishlist
          </h1>
          <p className="opacity-60 text-lg">Tracks you've saved for your future projects.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-sky-500 text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
                    title="Grid View"
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-sky-500 text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
                    title="List View"
                >
                    <LayoutList size={20} />
                </button>
            </div>
            
            <div className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 shadow-sm text-zinc-500'}`}>
              {favorites.length} {favorites.length === 1 ? 'Track' : 'Tracks'}
            </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className={`text-center p-16 rounded-3xl border-2 border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-100 bg-gray-50'}`}>
          <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-4">Your playlist is empty</h3>
          <p className="opacity-60 max-w-md mx-auto mb-8 text-lg">
            Start exploring the library and click the heart icon to add tracks to your personal selection.
          </p>
          <Link 
            to="/library" 
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all transform hover:-translate-y-1"
          >
            Go to Library <ArrowRight size={20} />
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {favorites.map((fav) => {
            const track = fav.squeeze_tracks;
            const isActive = currentTrack?.id === track.id && isPlaying;

            return (
              <div 
                key={track.id}
                className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-lg'}`}
              >
                <div className="relative aspect-square overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                  <img 
                    src={track.cover_url} 
                    alt={track.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button 
                      onClick={() => playTrack(track)}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/50 flex items-center justify-center text-white transform hover:scale-110 transition-transform"
                    >
                      {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                  </div>

                  <div className="absolute top-4 right-4">
                    <FavoriteButton 
                      trackId={track.id} 
                      onToggle={(isFav) => !isFav && handleRemoveFromList(track.id)} 
                      size={24}
                    />
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold leading-tight line-clamp-1 mb-1 group-hover:text-sky-500 transition-colors">
                      <Link to={`/track/${createSlug(track.id, track.title)}`}>
                        {track.title}
                      </Link>
                    </h2>
                    <p className="text-sm opacity-60 font-medium">
                      {track.artist_name}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex gap-2">
                        {Array.isArray(track.genre) ? track.genre.slice(0, 1).map(g => (
                            <span key={g} className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{g}</span>
                        )) : track.genre && (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{track.genre}</span>
                        )}
                    </div>
                    <Link 
                      to={`/track/${createSlug(track.id, track.title)}`}
                      className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-zinc-500'}`}
                    >
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="flex flex-col gap-4">
          {favorites.map((fav) => {
            const track = fav.squeeze_tracks;
            const isActive = currentTrack?.id === track.id && isPlaying;

            return (
              <div 
                key={track.id}
                className={`
                  flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300
                  ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'}
                  ${isActive ? 'ring-1 ring-sky-500' : ''}
                `}
              >
                {/* Cover & Play */}
                <div 
                  className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden group cursor-pointer shadow-md"
                  onClick={() => playTrack(track)}
                >
                  <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isActive ? <Pause size={28} className="text-white fill-white"/> : <Play size={28} className="text-white fill-white ml-1"/>}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/track/${createSlug(track.id, track.title)}`}
                    className="font-bold text-xl hover:text-sky-500 transition-colors truncate block"
                  >
                    {track.title}
                  </Link>
                  <p className="text-sm opacity-50 font-medium mb-2">{track.artist_name}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(track.genre) ? track.genre.slice(0, 1).map(g => (
                      <span key={g} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{g}</span>
                    )) : track.genre && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{track.genre}</span>
                    )}
                  </div>
                </div>

                {/* Waveform */}
                <div className="hidden lg:flex flex-[2] h-12 items-center px-6">
                  <WaveformVisualizer track={track} height="h-10" barCount={100} interactive={true} enableAnalysis={isActive} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <FavoriteButton 
                    trackId={track.id} 
                    onToggle={(isFav) => !isFav && handleRemoveFromList(track.id)} 
                    size={24}
                  />
                  <div className="hidden sm:block h-6 w-px bg-current opacity-10 mx-1"></div>
                  <Link 
                    to={`/track/${createSlug(track.id, track.title)}`}
                    className={`p-3 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-gray-100 text-zinc-500'}`}
                    title="View details"
                  >
                    <ArrowRight size={22} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
