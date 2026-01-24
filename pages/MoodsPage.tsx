
import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Link, useLocation } from 'react-router-dom';
import { Smile, ArrowLeft, Tag, Calendar, Briefcase, Music, Sun, Moon, Coffee, Film, Search, Heart, Globe, Sparkles, ChevronDown, CloudRain, Layers, Clapperboard, Disc3, Play, Pause, Download, Loader2, Music2, Zap } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';
import { MusicTrack } from '../types';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { createSlug } from '../utils/slugUtils';

type MoodCategory = {
  title: string;
  icon: React.ReactNode;
  submoods: string[];
};

export const MoodsPage: React.FC = () => {
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, ownedTrackIds } = useStore();
  const location = useLocation();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const gradients = [
    'bg-gradient-to-br from-emerald-500 to-green-600',
    'bg-gradient-to-br from-green-500 to-teal-600',
    'bg-gradient-to-br from-teal-500 to-cyan-600',
    'bg-gradient-to-br from-lime-600 to-green-700',
    'bg-gradient-to-br from-teal-600 to-emerald-700',
  ];

  const moodCategories: MoodCategory[] = [
    {
        title: "POSITIVE & BRIGHT",
        icon: <Sun size={24} />,
        submoods: [
            'happy', 'uplifting', 'positive', 'carefree', 'bright', 'bouncy', 
            'feel-good', 'vibrant', 'optimistic', 'joyous', 'delightful', 
            'exuberant', 'excited', 'exciting', 'hopeful', 'inspiring', 
            'sweet', 'upbeat', 'warm', 'celebratory', 'festive'
        ]
    },
    {
        title: "ENERGETIC & POWERFUL",
        icon: <Zap size={24} />,
        submoods: [
            'energetic', 'powerful', 'aggressive', 'epic', 'heroic', 'bold', 
            'dynamic', 'fast', 'triumphant', 'wild', 'confident', 'action', 
            'driving', 'enthusiastic', 'determined', 'rebellious', 'spirited',
            'urgent', 'lively'
        ]
    },
    {
        title: "DARK & SUSPENSE",
        icon: <Moon size={24} />,
        submoods: [
            'dark', 'scary', 'spooky', 'sinister', 'ominous', 'tense', 
            'suspenseful', 'menacing', 'creepy', 'eerie', 'horror', 'frightening',
            'disturbing', 'anxious', 'desperate', 'macabre', 'threatening'
        ]
    },
    {
        title: "RELAXED & PEACEFUL",
        icon: <Coffee size={24} />,
        submoods: [
            'calm', 'relaxed', 'peaceful', 'soothing', 'serene', 'cozy', 
            'tranquil', 'comforting', 'meditative', 'breezy', 'idyllic', 
            'laid-back', 'mellow', 'soft'
        ]
    },
    {
        title: "CINEMATIC & DRAMATIC",
        icon: <Film size={24} />,
        submoods: [
            'dramatic', 'emotional', 'majestic', 'atmospheric', 'cinematic', 
            'intense', 'chaotic', 'thrilling', 'storytelling', 'awe-inspiring', 
            'captivating', 'ethereal', 'magical', 'mysterious', 'spiritual',
            'adventurous', 'beautiful'
        ]
    },
    {
        title: "QUIRKY & FUN",
        icon: <Sparkles size={24} />,
        submoods: [
            'quirky', 'funny', 'whimsical', 'mischievous', 'amusing', 
            'eccentric', 'playful', 'humorous', 'sassy', 'comedic', 
            'ironic', 'fun', 'exotic', 'groovy', 'psychedelic', 'dancing', 'rhythmic'
        ]
    },
    {
        title: "ROMANTIC & SENSUAL",
        icon: <Heart size={24} />,
        submoods: [
            'romantic', 'sensual', 'intimate', 'sexy', 'seductive', 
            'elegant', 'flirtatious', 'tender', 'heartwarming', 'charming', 
            'chic', 'classy', 'glamorous', 'luxurious', 'passionate', 'seduction',
            'soulful', 'cool'
        ]
    },
    {
        title: "SAD & NOSTALGIC",
        icon: <CloudRain size={24} />,
        submoods: [
            'sad', 'melancholic', 'nostalgic', 'gloomy', 'sentimental', 
            'poignant', 'mournful', 'tragic', 'lonesome', 'hurt', 'somber', 
            'solemn', 'moody', 'noir'
        ]
    },
    {
        title: "BUSINESS & INNOVATION",
        icon: <Briefcase size={24} />,
        submoods: [
            'corporate', 'informative', 'intelligent', 'ambitious', 'focused', 
            'futuristic', 'modern', 'professional', 'sophisticated', 'serious',
            'thoughtful', 'creative', 'abstract', 'innovative', 'motivational'
        ]
    },
    {
        title: "CULTURE & HERITAGE",
        icon: <Globe size={24} />,
        submoods: [
            'noble', 'regal', 'royal', 'patriotic', 'historic', 'prestigious', 
            'proud', 'culture', 'heritage'
        ]
    },
    {
        title: "CONTEMPLATIVE",
        icon: <Search size={24} />,
        submoods: [
            'contemplative', 'introspective', 'reflective', 'pensive', 
            'curious', 'inquiring', 'intriguing', 'daydream', 'dreamy'
        ]
    }
];

  const [uncategorizedMoods, setUncategorizedMoods] = useState<string[]>([]);

  useEffect(() => {
    const fetchMoods = async () => {
      const { data } = await supabase.from('squeeze_tracks').select('mood');
      if (data) {
        const allDbMoods = (data as any[])
          .flatMap((track: any) => track.mood || [])
          .filter((m: any): m is string => typeof m === 'string' && m.length > 0);
        const uniqueDbMoods = Array.from(new Set(allDbMoods));
        const categorizedSet = new Set(moodCategories.flatMap(c => c.submoods.map(s => s.toLowerCase())));
        const leftovers = uniqueDbMoods.filter(m => !categorizedSet.has(m.toLowerCase())).sort();
        if (leftovers.length > 0) {
            setUncategorizedMoods(leftovers);
        }
      }
    };
    fetchMoods();
  }, []);

  useEffect(() => {
    if (selectedMood) {
        fetchTracksForMood(selectedMood);
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  }, [selectedMood]);

  const fetchTracksForMood = async (mood: string) => {
    setLoadingTracks(true);
    const { data, error } = await supabase.from('squeeze_tracks').select('*');
    if (!error && data) {
        const filtered = (data as MusicTrack[]).filter(track => {
            const trackMoods = Array.isArray(track.mood) ? track.mood : typeof track.mood === 'string' ? [track.mood] : [];
            return trackMoods.some(m => m.toLowerCase() === mood.toLowerCase());
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
        <SEO title="Browse Music by Mood" description="Filter royalty free music by emotion. Inspiring, Happy, Dark, Dramatic, and more." />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-12 w-full max-w-[1920px] mx-auto">
            <Link to="/library" className={getNavItemStyles('/library')}>
                <ArrowLeft size={16} />
                <span>Library</span>
            </Link>
            <Link to="/categories/genres" className={getNavItemStyles('/categories/genres')}>
                <Tag size={16} />
                <span>Genres</span>
            </Link>
            <Link to="/categories/instruments" className={getNavItemStyles('/categories/instruments')}>
                <Music size={16} />
                <span>Instruments</span>
            </Link>
            <Link to="/categories/seasonal" className={getNavItemStyles('/categories/seasonal')}>
                <Calendar size={16} />
                <span>Seasonal</span>
            </Link>
            <Link to="/categories/media-themes" className={getNavItemStyles('/categories/media-themes')}>
                <Clapperboard size={16} />
                <span>Media Themes</span>
            </Link>
            <Link to="/music-packs" className={getNavItemStyles('/music-packs')}>
                <Disc3 size={16} />
                <span>Music Packs</span>
            </Link>
        </div>

        <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 tracking-tight uppercase">
                <Smile className="text-emerald-500" size={32} /> Moods
            </h1>
            <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto font-medium">
                Find the perfect emotional tone. Hover over a category and select a mood to see matching tracks.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1440px] mx-auto">
            {moodCategories.map((category, index) => {
                const gradient = gradients[index % gradients.length];
                return (
                    <div 
                        key={category.title} 
                        className={`
                            group rounded-2xl overflow-hidden shadow-md transition-all duration-300 relative
                            ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}
                            hover:shadow-2xl hover:ring-2 hover:ring-emerald-500/30 hover:-translate-y-1
                        `}
                    >
                        <div className={`w-full h-20 flex items-center justify-between px-6 text-white transition-all ${gradient}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    {category.icon}
                                </div>
                                <h2 className="text-sm font-black text-left leading-tight drop-shadow-sm uppercase tracking-widest">
                                    {category.title}
                                </h2>
                            </div>
                            <ChevronDown size={18} className="text-white/60 transition-transform group-hover:rotate-180" />
                        </div>
                        
                        <div className="max-h-0 opacity-0 group-hover:max-h-[1000px] group-hover:opacity-100 transition-all duration-500 ease-in-out overflow-hidden">
                            <div className="p-5">
                                <div className="flex flex-wrap gap-1.5">
                                    {category.submoods.map((mood) => (
                                        <button
                                            key={mood}
                                            onClick={() => setSelectedMood(mood)}
                                            className={`
                                                px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-200 capitalize
                                                ${selectedMood === mood
                                                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg'
                                                    : isDarkMode 
                                                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500' 
                                                        : 'bg-gray-50 border-zinc-200 text-zinc-600 hover:text-white hover:bg-emerald-500 hover:border-emerald-500'}
                                            `}
                                        >
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {uncategorizedMoods.length > 0 && (
                <div className={`group rounded-2xl overflow-hidden shadow-md transition-all duration-300 relative ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'} hover:shadow-2xl hover:ring-2 hover:ring-emerald-500/30 hover:-translate-y-1`}>
                    <div className="w-full h-20 flex items-center justify-between px-6 text-white transition-all bg-gradient-to-br from-slate-500 to-zinc-600">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                <Layers size={24} />
                            </div>
                            <h2 className="text-sm font-black text-left leading-tight drop-shadow-sm uppercase tracking-widest">OTHER MOODS</h2>
                        </div>
                        <ChevronDown size={18} className="text-white/60 transition-transform group-hover:rotate-180" />
                    </div>
                    <div className="max-h-0 opacity-0 group-hover:max-h-[1000px] group-hover:opacity-100 transition-all duration-500 ease-in-out overflow-hidden">
                        <div className="p-5">
                            <div className="flex flex-wrap gap-1.5">
                                {uncategorizedMoods.map((mood) => (
                                    <button
                                        key={mood}
                                        onClick={() => setSelectedMood(mood)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-200 capitalize ${selectedMood === mood ? 'bg-emerald-500 border-emerald-400 text-white' : isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500' : 'bg-gray-50 border-zinc-200 text-zinc-600 hover:text-white hover:bg-emerald-500 hover:border-emerald-500'}`}
                                    >
                                        {mood}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div ref={resultsRef} className="mt-20 scroll-mt-24">
            {selectedMood && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 border-b pb-6 border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/20">
                                <Music2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                                    {selectedMood} Tracks
                                </h2>
                                <p className="text-sm opacity-50 font-medium">Found {tracks.length} matching recordings</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setSelectedMood(null)}
                            className="text-xs font-bold opacity-40 hover:opacity-100 flex items-center gap-1 uppercase tracking-widest"
                        >
                            Clear selection <ChevronDown size={14} className="rotate-90" />
                        </button>
                    </div>

                    {loadingTracks ? (
                        <div className="py-20 flex flex-col items-center gap-4 opacity-50">
                            <Loader2 className="animate-spin text-emerald-500" size={40} />
                            <p className="font-bold">Selecting the best {selectedMood} music...</p>
                        </div>
                    ) : tracks.length === 0 ? (
                        <div className="py-20 text-center opacity-40 italic">No tracks found.</div>
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
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className={`
            group flex items-center gap-4 p-3 rounded-xl border transition-all duration-300
            ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100 hover:shadow-md'}
            ${active ? 'ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/10' : ''}
        `}>
            <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden cursor-pointer" onClick={handlePlay}>
                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {active ? <Pause className="text-white fill-white" size={24} /> : <Play className="text-white fill-white ml-1" size={24} />}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <Link to={`/track/${createSlug(track.id, track.title)}`} className="font-bold text-base hover:text-emerald-500 transition-colors truncate block">
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
                    <button onClick={handleDownload} disabled={downloading} className="p-2.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                        {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                    </button>
                ) : (
                    <Link to={`/track/${createSlug(track.id, track.title)}`} className={`p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10' : 'bg-gray-100 text-zinc-600 hover:bg-emerald-500 hover:text-white'} shadow-sm`}>
                        <Tag size={16} />
                    </Link>
                )}
            </div>
        </div>
    );
};
