
import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Link, useLocation } from 'react-router-dom';
import { Clapperboard, ArrowLeft, Tag, Smile, Calendar, Music, Play, Pause, Download, Loader2, Music2, ChevronDown, Sparkles, Disc3 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';
import { MusicTrack } from '../types';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { createSlug } from '../utils/slugUtils';

export const MediaTheme: React.FC = () => {
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, ownedTrackIds } = useStore();
  const location = useLocation();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [themes, setThemes] = useState<string[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch all unique themes from the database
  useEffect(() => {
    const fetchThemes = async () => {
      setLoadingThemes(true);
      const { data } = await supabase.from('squeeze_tracks').select('media_theme');
      if (data) {
        const allThemes = (data as any[])
          .flatMap((track: any) => {
            const theme = track.media_theme;
            if (Array.isArray(theme)) return theme;
            if (typeof theme === 'string' && theme.trim().length > 0) return [theme];
            return [];
          })
          .filter((t: any): t is string => typeof t === 'string' && t.length > 0)
          .map(t => t.trim());
        
        const uniqueThemes = Array.from(new Set(allThemes)).sort();
        setThemes(uniqueThemes);
      }
      setLoadingThemes(false);
    };
    fetchThemes();
  }, []);

  // Fetch tracks when a theme is selected
  useEffect(() => {
    if (selectedTheme) {
      fetchTracksForTheme(selectedTheme);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedTheme]);

  const fetchTracksForTheme = async (theme: string) => {
    setLoadingTracks(true);
    const { data, error } = await supabase.from('squeeze_tracks').select('*');
    
    if (!error && data) {
      const filtered = (data as MusicTrack[]).filter(track => {
        const trackThemes = Array.isArray(track.media_theme) 
          ? track.media_theme 
          : typeof track.media_theme === 'string' 
            ? [track.media_theme] 
            : [];
        return trackThemes.some(t => t.toLowerCase() === theme.toLowerCase());
      });
      setTracks(filtered);
    }
    setLoadingTracks(false);
  };

  const getNavItemStyles = (path: string) => {
    const isActive = location.pathname === path;
    return `
      flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border transition-all duration-300 shadow-sm font-black uppercase tracking-widest text-[10px] md:text-xs active:scale-95
      ${isActive 
        ? 'bg-sky-500 border-sky-400 text-white shadow-sky-500/20' 
        : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-500 hover:text-sky-600 hover:border-sky-300')}
    `;
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-32">
      <SEO title="Browse Music by Media Theme" description="Find the perfect soundtrack for Advertising, Cinema, Video Games, and more." />
      
      {/* Navigation Header */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-12 w-full max-w-[1920px] mx-auto">
        <Link to="/library" className={getNavItemStyles('/library')}>
          <ArrowLeft size={16} />
          <span>Library</span>
        </Link>
        <Link to="/categories/genres" className={getNavItemStyles('/categories/genres')}>
          <Tag size={16} />
          <span>Genres</span>
        </Link>
        <Link to="/categories/moods" className={getNavItemStyles('/categories/moods')}>
          <Smile size={16} />
          <span>Moods</span>
        </Link>
        <Link to="/categories/instruments" className={getNavItemStyles('/categories/instruments')}>
          <Music size={16} />
          <span>Instruments</span>
        </Link>
        <Link to="/categories/seasonal" className={getNavItemStyles('/categories/seasonal')}>
          <Calendar size={16} />
          <span>Seasonal</span>
        </Link>
        <Link to="/music-packs" className={getNavItemStyles('/music-packs')}>
          <Disc3 size={16} />
          <span>Music Packs</span>
        </Link>
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 tracking-tight">
          <Clapperboard className="text-sky-500" size={32} /> MEDIA THEMES
        </h1>
        <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto">
          Explore music curated for specific project types. Click a tag to see matching recordings.
        </p>
      </div>

      {/* Tag Cloud Section */}
      <div className={`p-8 rounded-[2rem] border transition-all duration-500 ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}`}>
        {loadingThemes ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-sky-500" size={32} />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {themes.map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`
                  px-5 py-2.5 rounded-full text-sm font-bold border transition-all duration-300 transform active:scale-95
                  ${selectedTheme === theme
                    ? 'bg-sky-500 border-sky-400 text-white shadow-lg scale-105'
                    : isDarkMode 
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-sky-500 hover:bg-sky-500/10' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-sky-500 hover:text-sky-600 hover:bg-white'}
                `}
              >
                {theme}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div ref={resultsRef} className="mt-20 scroll-mt-24">
        {selectedTheme && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 border-b pb-6 border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500 rounded-2xl text-white shadow-xl shadow-sky-500/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                    {selectedTheme}
                  </h2>
                  <p className="text-sm opacity-50 font-medium">Found {tracks.length} results for this theme</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedTheme(null)}
                className="text-xs font-bold opacity-40 hover:opacity-100 flex items-center gap-1 uppercase tracking-widest"
              >
                Clear theme <ChevronDown size={14} className="rotate-90" />
              </button>
            </div>

            {loadingTracks ? (
              <div className="py-20 flex flex-col items-center gap-4 opacity-50">
                <Loader2 className="animate-spin text-sky-500" size={40} />
                <p className="font-bold">Filtering the catalog...</p>
              </div>
            ) : tracks.length === 0 ? (
              <div className="py-20 text-center opacity-40 italic">
                No tracks found for this specific media theme yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {tracks.map(track => (
                  <TrackRow key={track.id} track={track} playlist={tracks} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Track Row Component (Internal)
const TrackRow: React.FC<{ track: MusicTrack; playlist: MusicTrack[] }> = ({ track, playlist }) => {
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, ownedTrackIds } = useStore();
  const [downloading, setDownloading] = useState(false);
  const isCurrent = currentTrack?.id === track.id;
  const active = isCurrent && isPlaying;
  const hasAccess = ownedTrackIds.has(track.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTrack(track, playlist);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-download-url', {
        body: { trackId: track.id }
      });
      if (!error && data?.downloadUrl) {
        const response = await fetch(data.downloadUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const ext = track.wav_r2_key?.toLowerCase().endsWith('.zip') ? '.zip' : '.wav';
        link.setAttribute('download', `${track.title}${ext}`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`
      group flex items-center gap-4 p-3 rounded-xl border transition-all duration-300
      ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100 hover:shadow-md'}
      ${active ? 'ring-1 ring-sky-500 shadow-lg shadow-sky-500/10' : ''}
    `}>
      <div 
        className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden cursor-pointer"
        onClick={handlePlay}
      >
        <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {active ? <Pause className="text-white fill-white" size={24} /> : <Play className="text-white fill-white ml-1" size={24} />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <Link 
          to={`/track/${createSlug(track.id, track.title)}`} 
          className="font-bold text-base hover:text-sky-500 transition-colors truncate block"
        >
          {track.title}
        </Link>
        <p className="text-xs opacity-50 font-medium truncate">{track.artist_name}</p>
      </div>

      <div className="hidden md:flex flex-[2] h-10 items-center px-4">
        <WaveformVisualizer track={track} height="h-8" barCount={120} interactive={true} enableAnalysis={active} />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden sm:block text-[10px] font-mono opacity-40 uppercase tracking-widest">{track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : ''}</span>
        
        {hasAccess ? (
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="p-2.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            title="Download WAV"
          >
            {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          </button>
        ) : (
          <Link 
            to={`/track/${createSlug(track.id, track.title)}`}
            className={`p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10' : 'bg-gray-100 text-zinc-600 hover:bg-sky-500 hover:text-white'} shadow-sm`}
            title="View Purchase Options"
          >
            <Tag size={16} />
          </Link>
        )}
      </div>
    </div>
  );
};
