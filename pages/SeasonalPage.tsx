import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, ArrowLeft, Tag, Smile, Music, Clapperboard, Disc3, Waves, Globe, Sparkles, Gift, ChevronDown, Layers, Play, Pause, Download, Loader2, Music2, Scissors, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';
import { MusicTrack } from '../types';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { createSlug } from '../utils/slugUtils';

type SeasonalCategory = {
  title: string;
  icon: React.ReactNode;
  items: string[];
};

export const SeasonalPage: React.FC = () => {
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, ownedTrackIds } = useStore();
  const location = useLocation();
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [uncategorizedSeasons, setUncategorizedSeasons] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const gradients = [
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-purple-500 to-pink-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-sky-600 to-blue-700',
  ];

  const seasonalCategories: SeasonalCategory[] = [
    {
        title: "SEASONS",
        icon: <Waves size={20} />,
        items: ['Autumn', 'Spring', 'Summer', 'Winter']
    },
    {
        title: "RELIGIOUS & CULTURAL",
        icon: <Globe size={20} />,
        items: ['Chinese New Year', 'Christmas', 'Diwali', 'Hanukkah', 'Holi', 'Kwanzaa', 'Ramadan', 'Dia de los Muertos']
    },
    {
        title: "GLOBAL HOLIDAYS",
        icon: <Gift size={20} />,
        items: ['New Year', 'Halloween', "Valentine's Day", "St Patrick's Day", 'Carnival', 'Mardi Gras', 'Cinco de Mayo']
    },
    {
        title: "EVENTS & LIFESTYLE",
        icon: <Sparkles size={20} />,
        items: ['Anniversary', 'Wedding', 'Party', 'Prom', 'Back to School', 'Black Friday', 'Oktoberfest', 'Town Fair', 'Memorial Day', 'Independence Day']
    }
  ];

  useEffect(() => {
    const fetchSeasonsFromDb = async () => {
      const { data } = await supabase.from('squeeze_tracks').select('season');
      if (data) {
        const allDbValues = (data as any[]).flatMap(track => {
            const s = track.season;
            if (Array.isArray(s)) return s;
            if (typeof s === 'string' && s.trim().length > 0) return [s];
            return [];
        }).filter((s: any): s is string => typeof s === 'string' && s.length > 0).map(s => s.trim());
        const uniqueDbValues = Array.from(new Set(allDbValues));
        const categorizedSet = new Set(seasonalCategories.flatMap(c => c.items.map(s => s.toLowerCase())));
        const leftovers = uniqueDbValues.filter(s => !categorizedSet.has(s.toLowerCase())).sort();
        if (leftovers.length > 0) setUncategorizedSeasons(leftovers);
      }
    };
    fetchSeasonsFromDb();
  }, []);

  useEffect(() => {
    if (openCategory) {
        fetchTracksForSelection();
    } else {
        setTracks([]);
    }
  }, [openCategory, selectedSeason]);

  const fetchTracksForSelection = async () => {
    setLoadingTracks(true);
    const { data, error } = await supabase.from('squeeze_tracks').select('*');
    if (!error && data) {
        let targets: string[] = [];
        if (selectedSeason) {
            targets = [selectedSeason.toLowerCase()];
        } else if (openCategory === 'OTHER') {
            targets = uncategorizedSeasons.map(s => s.toLowerCase());
        } else {
            const cat = seasonalCategories.find(c => c.title === openCategory);
            if (cat) targets = cat.items.map(i => i.toLowerCase());
        }

        const filtered = (data as MusicTrack[]).filter(track => {
            const trackSeasons = Array.isArray(track.season) 
                ? track.season.map(s => s.toLowerCase()) 
                : typeof track.season === 'string' 
                    ? [track.season.toLowerCase()] 
                    : [];
            return trackSeasons.some(s => targets.includes(s));
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

  const toggleCategory = (title: string) => {
    if (openCategory === title) {
        setOpenCategory(null);
        setSelectedSeason(null);
    } else {
        setOpenCategory(title);
        setSelectedSeason(null);
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  };

  const handleSeasonClick = (item: string) => {
    setSelectedSeason(selectedSeason === item ? null : item);
  };

  const activeCategoryData = seasonalCategories.find(c => c.title === openCategory);

  return (
    <div className="container mx-auto px-4 pt-6 pb-32">
        <SEO title="Browse Music by Season & Holiday" description="Explore our catalog categorized by Seasons, Global Holidays, Cultural Events and more." />
        
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
            <h1 className="text-3xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 tracking-tight uppercase text-center">
                <Calendar className="text-sky-500" size={32} /> Seasonal Themes
            </h1>
            <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto font-medium text-center">
                Select a theme category to explore its tracks, then refine with tags.
            </p>
        </div>

        {/* Macro Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1200px] mx-auto mb-12">
            {seasonalCategories.map((category, index) => {
                const gradient = gradients[index % gradients.length];
                const isOpen = openCategory === category.title;
                return (
                    <button
                        key={category.title}
                        onClick={() => toggleCategory(category.title)}
                        className={`
                            relative h-24 px-6 rounded-[2rem] flex items-center justify-between text-white font-black text-xs md:text-sm tracking-widest uppercase transition-all duration-300 transform active:scale-95
                            ${isOpen ? 'ring-4 ring-sky-500 shadow-2xl scale-[1.05] z-10' : 'hover:scale-[1.02] shadow-md'}
                            ${gradient}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md text-white">
                                {category.icon}
                            </div>
                            <span className="text-left leading-tight drop-shadow-sm">{category.title}</span>
                        </div>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'opacity-40'}`} />
                    </button>
                );
            })}

            {uncategorizedSeasons.length > 0 && (
                <button
                    onClick={() => toggleCategory('OTHER')}
                    className={`
                        relative h-24 px-6 rounded-[2rem] flex items-center justify-between text-white font-black text-xs md:text-sm tracking-widest uppercase transition-all duration-300 transform active:scale-95
                        ${openCategory === 'OTHER' ? 'ring-4 ring-sky-500 shadow-2xl scale-[1.05] z-10' : 'hover:scale-[1.02] shadow-md'}
                        bg-gradient-to-br from-zinc-600 to-zinc-800
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                            <Layers size={20} />
                        </div>
                        <span>OTHER EVENTS</span>
                    </div>
                    <ChevronDown size={18} className={`transition-transform duration-300 ${openCategory === 'OTHER' ? 'rotate-180' : 'opacity-40'}`} />
                </button>
            )}
        </div>

        {openCategory && (
            <div className="max-w-[1440px] mx-auto animate-in fade-in slide-in-from-top-4 duration-500 scroll-mt-36">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* LEFT COLUMN: Tags (1/3) - LG ONLY STICKY - MODIFIED FOR ANNOUNCEMENT BAR */}
                    <div className={`w-full lg:w-1/3 p-8 md:p-10 rounded-[3rem] border lg:sticky lg:top-36 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl shadow-sky-500/5'}`}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-sky-500 rounded-2xl text-white shadow-xl">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight uppercase leading-none">{openCategory}</h2>
                                    <p className="text-[10px] opacity-50 font-black uppercase tracking-widest mt-2">Filter theme</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setOpenCategory(null); setSelectedSeason(null); }}
                                className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {(openCategory === 'OTHER' ? uncategorizedSeasons : activeCategoryData?.items || []).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => handleSeasonClick(item)}
                                    className={`
                                        px-5 py-2.5 rounded-2xl text-xs font-black border transition-all duration-200 capitalize tracking-wide
                                        ${selectedSeason === item
                                            ? 'bg-sky-500 border-sky-400 text-white shadow-xl scale-105'
                                            : isDarkMode 
                                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-sky-600 hover:border-sky-500' 
                                                : 'bg-white border-zinc-200 text-zinc-600 hover:text-white hover:bg-sky-500 hover:border-sky-500 shadow-sm'}
                                    `}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Tracks (2/3) - MODIFIED scroll-mt FOR ANNOUNCEMENT BAR */}
                    <div ref={resultsRef} className="w-full lg:w-2/3 scroll-mt-36">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b pb-4 border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-500">
                                    <Music2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight uppercase">
                                        {selectedSeason || openCategory} Tracks
                                    </h2>
                                    <p className="text-xs opacity-50 font-medium">Found {tracks.length} matching recordings</p>
                                </div>
                            </div>
                        </div>

                        {loadingTracks ? (
                            <div className="py-20 flex flex-col items-center gap-4 opacity-50">
                                <Loader2 className="animate-spin text-sky-500" size={40} />
                                <p className="font-bold">Gathering results...</p>
                            </div>
                        ) : tracks.length === 0 ? (
                            <div className="py-20 text-center opacity-40 italic border border-dashed rounded-3xl">No tracks found for this specific selection.</div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {tracks.map(track => (
                                    <TrackRow key={track.id} track={track} playlist={tracks} />
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        )}
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
            group flex items-center gap-4 p-2.5 rounded-xl border transition-all duration-300
            ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100 hover:shadow-md'}
            ${active ? 'ring-1 ring-sky-500 shadow-lg shadow-sky-500/10' : ''}
        `}>
            <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden cursor-pointer" onClick={handlePlay}>
                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {active ? <Pause className="text-white fill-white" size={24} /> : <Play className="text-white fill-white ml-1" size={24} />}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <Link to={`/track/${createSlug(track.id, track.title)}`} className="font-bold text-sm md:text-base hover:text-sky-500 transition-colors truncate block">
                    {track.title}
                </Link>
                <p className="text-[10px] opacity-50 font-medium truncate">{track.artist_name}</p>
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
                    <Link to={`/track/${createSlug(track.id, track.title)}`} className={`p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10' : 'bg-gray-100 text-zinc-600 hover:bg-sky-500 hover:text-white'} shadow-sm`}>
                        <Tag size={16} />
                    </Link>
                )}
            </div>
        </div>
    );
};