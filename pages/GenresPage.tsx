import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Link, useLocation } from 'react-router-dom';
import { Tag, ArrowLeft, Smile, Calendar, Music, Clapperboard, Briefcase, Zap, Guitar, Coffee, Globe, Cloud, Layers, ChevronDown, Waves, Play, Pause, Download, Loader2, Music2, Disc3, X, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';
import { MusicTrack } from '../types';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { createSlug } from '../utils/slugUtils';

type GenreCategory = {
  title: string;
  icon: React.ReactNode;
  subgenres: string[];
};

export const GenresPage: React.FC = () => {
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, ownedTrackIds } = useStore();
  const location = useLocation();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [uncategorizedGenres, setUncategorizedGenres] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const gradients = [
    'bg-gradient-to-br from-sky-500 to-blue-600',
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-indigo-500 to-violet-600',
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-sky-600 to-indigo-700',
    'bg-gradient-to-br from-blue-600 to-violet-700',
  ];

  const genreCategories: GenreCategory[] = [
    {
        title: "CINEMATIC & FILM SCORE",
        icon: <Clapperboard size={20} />,
        subgenres: ['Action', 'Adventure', 'Cinematic', 'Drama', 'Dramedy', 'Film Noir', 'Fantasy', 'Horror', 'Hybrid', 'Industrial', 'Military', 'Orchestral', 'Patriotic', 'Percussion', 'Quirky', 'Sci-Fi', 'Score', 'Sitcom', 'Spaghetti Western', 'Soundtrack', 'Thriller', 'Trailer', 'Comedy']
    },
    {
        title: "CORPORATE & BUSINESS",
        icon: <Briefcase size={20} />,
        subgenres: ['Corporate', 'Documentary', 'Future Garage', 'News']
    },
    {
        title: "POP & ELECTRONIC",
        icon: <Zap size={20} />,
        subgenres: ['Acapella', 'Ballad', 'Breakbeat', 'Dance', 'Electro', 'Electro Pop', 'Future', 'Glitch', 'House', 'Pop', 'Retrowave', 'Synthwave', 'Tropical House', 'Vaporwave', 'Vocals']
    },
    {
        title: "ROCK",
        icon: <Guitar size={20} />,
        subgenres: ['Alternative', 'Blues', 'Boogie Woogie', 'Doo-wop', 'Garage', 'Hard Rock', 'Indie', 'Jive', 'Psychedelia', 'Punk', 'Rock', "Rock'n'Roll", 'Rockabilly', 'Ska']
    },
    {
        title: "AMBIENT & CHILL",
        icon: <Cloud size={20} />,
        subgenres: ['Ambient', 'Chillout', 'Chillstep', 'Chillwave', 'Deep House', 'Downtempo', 'Easy Listening', 'Exotica', 'Lo-Fi', 'Lounge', 'Minimal', 'New Age', 'Piano', 'Smooth Jazz']
    },
    {
        title: "COUNTRY & FOLK",
        icon: <Coffee size={20} />,
        subgenres: ['Acoustic', 'Americana', 'Bavarian Folk', 'Bluegrass', 'Country', 'Western', 'Serenade', 'Folk', 'Polka', 'Traditional']
    },
    {
        title: "JAZZ",
        icon: <Music size={20} />, 
        subgenres: ['Bebop', 'Big Band', 'Charleston', 'Dixieland', 'Electro Swing', 'Swing', 'Gospel', 'Gypsy', 'Jazz', 'Ragtime']
    },
    {
        title: "CLASSICAL",
        icon: <Music size={20} />,
        subgenres: ['Ballet', 'Baroque', 'Cancan', 'Chamber Music', 'Choir', 'Classical', 'Concerto', 'March', 'Neoclassical', 'Opera', 'Orchestral', 'Requiem', 'Romanticism', 'Symphonic', 'Waltz']
    },
    {
        title: "FUNK & GROOVE",
        icon: <Zap size={20} />,
        subgenres: ['Disco', 'Funk', 'Hip Hop', 'Nu Disco', 'Rap', 'R&B', 'Soul']
    },
    {
        title: "WORLD",
        icon: <Globe size={20} />,
        subgenres: ['African', 'Arab', 'Asian', 'Balkan', 'Bhangra', 'Bollywood', 'Calypso', 'Celtic', 'Chinese', 'Ethno', 'French', 'Hawaiian', 'Jungle', 'Indian', 'Irish', 'Italian', 'Klezmer', 'Middle Eastern', 'Native American', 'Tarantella', 'Tribal', 'World']
    },
     {
        title: "LATIN",
        icon: <Waves size={20} />,
        subgenres: ['Bossa Nova', 'Cha-cha-cha', 'Cuban Son', 'Flamenco', 'Latin', 'Latin Jazz', 'Mambo', 'Mariachi', 'Mexican', 'Reggae', 'Reggaeton', 'Rhumba', 'Salsa', 'Samba', 'Tango', 'Tropical']
    },
    {
        title: "CHILDREN'S",
        icon: <Smile size={20} />,
        subgenres: ["Children's Music", "Lullaby", "Circus"]
    },
    {
        title: "HOLIDAY & SEASONAL",
        icon: <Calendar size={20} />,
        subgenres: ['Christmas', 'Halloween', 'Holiday Music', 'Marching band']
    }
  ];

  useEffect(() => {
    const fetchGenres = async () => {
      const { data } = await supabase.from('squeeze_tracks').select('genre');
      if (data) {
        const allDbGenres = (data as any[])
          .flatMap((track: any) => track.genre || [])
          .filter((g: any): g is string => typeof g === 'string' && g.length > 0);
        const uniqueDbGenres = Array.from(new Set(allDbGenres));
        const categorizedSet = new Set(genreCategories.flatMap(c => c.subgenres.map(s => s.toLowerCase())));
        const leftovers = uniqueDbGenres.filter(g => !categorizedSet.has(g.toLowerCase())).sort();
        if (leftovers.length > 0) {
            setUncategorizedGenres(leftovers);
        }
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    if (openCategory) {
        fetchTracksForSelection();
    } else {
        setTracks([]);
    }
  }, [openCategory, selectedGenre]);

  const fetchTracksForSelection = async () => {
    setLoadingTracks(true);
    const { data, error } = await supabase.from('squeeze_tracks').select('*');
    
    if (!error && data) {
        let targets: string[] = [];
        if (selectedGenre) {
            targets = [selectedGenre.toLowerCase()];
        } else if (openCategory === 'OTHER') {
            targets = uncategorizedGenres.map(g => g.toLowerCase());
        } else {
            const cat = genreCategories.find(c => c.title === openCategory);
            if (cat) targets = cat.subgenres.map(g => g.toLowerCase());
        }

        const filtered = (data as MusicTrack[]).filter(track => {
            const trackGenres = Array.isArray(track.genre) 
                ? track.genre.map(g => g.toLowerCase()) 
                : typeof track.genre === 'string' 
                    ? [track.genre.toLowerCase()] 
                    : [];
            return trackGenres.some(g => targets.includes(g));
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
        setSelectedGenre(null);
    } else {
        setOpenCategory(title);
        setSelectedGenre(null); 
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre);
  };

  const activeCategoryData = genreCategories.find(c => c.title === openCategory);

  return (
    <div className="container mx-auto px-4 pt-6 pb-32">
        <SEO title="Browse Music by Genre" description="Explore our catalog categorized by Cinematic, Corporate, Rock, Electronic, and more." />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-12 w-full max-w-[1920px] mx-auto">
            <Link to="/library" className={getNavItemStyles('/library')}>
                <ArrowLeft size={16} />
                <span>Library</span>
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
                <Tag className="text-sky-500" size={32} /> Genres
            </h1>
            <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto font-medium">
                Choose a macro-category to show its music. Refine your search with tags.
            </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-[1440px] mx-auto mb-12">
            {genreCategories.map((category, index) => {
                const gradient = gradients[index % gradients.length];
                const isOpen = openCategory === category.title;
                return (
                    <button
                        key={category.title}
                        onClick={() => toggleCategory(category.title)}
                        className={`
                            relative h-20 px-4 rounded-2xl flex items-center justify-between text-white font-black text-xs md:text-sm tracking-widest uppercase transition-all duration-300 transform active:scale-95
                            ${isOpen ? 'ring-4 ring-sky-500 shadow-2xl scale-[1.05] z-10' : 'hover:scale-[1.02] shadow-md'}
                            ${gradient}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                {category.icon}
                            </div>
                            <span className="text-left leading-tight drop-shadow-sm">{category.title}</span>
                        </div>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'opacity-40'}`} />
                    </button>
                );
            })}
            
            {uncategorizedGenres.length > 0 && (
                <button
                    onClick={() => toggleCategory('OTHER')}
                    className={`
                        relative h-20 px-4 rounded-2xl flex items-center justify-between text-white font-black text-xs md:text-sm tracking-widest uppercase transition-all duration-300 transform active:scale-95
                        ${openCategory === 'OTHER' ? 'ring-4 ring-sky-500 shadow-2xl scale-[1.05] z-10' : 'hover:scale-[1.02] shadow-md'}
                        bg-gradient-to-br from-zinc-600 to-zinc-800
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Layers size={20} />
                        </div>
                        <span>OTHER STYLES</span>
                    </div>
                    <ChevronDown size={18} className={`transition-transform duration-300 ${openCategory === 'OTHER' ? 'rotate-180' : 'opacity-40'}`} />
                </button>
            )}
        </div>

        {openCategory && (
            <div className="max-w-[1440px] mx-auto animate-in fade-in slide-in-from-top-4 duration-500 scroll-mt-36">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* LEFT COLUMN: Tags (1/3) - LG ONLY STICKY - MODIFIED FOR ANNOUNCEMENT BAR */}
                    <div className={`w-full lg:w-1/3 p-8 md:p-10 rounded-[2.5rem] border lg:sticky lg:top-36 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}`}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-sky-500 rounded-2xl text-white shadow-lg">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight uppercase leading-none">{openCategory}</h2>
                                    <p className="text-[10px] opacity-50 font-black uppercase tracking-widest mt-1">Filter Tags</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setOpenCategory(null); setSelectedGenre(null); }}
                                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(openCategory === 'OTHER' ? uncategorizedGenres : activeCategoryData?.subgenres || []).map((genre) => (
                                <button
                                    key={genre}
                                    onClick={() => handleGenreClick(genre)}
                                    className={`
                                        px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 capitalize tracking-wide
                                        ${selectedGenre === genre
                                            ? 'bg-sky-500 border-sky-400 text-white shadow-lg scale-105'
                                            : isDarkMode 
                                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-sky-600 hover:border-sky-500' 
                                                : 'bg-white border-zinc-200 text-zinc-600 hover:text-white hover:bg-sky-500 hover:border-sky-500 shadow-sm'}
                                    `}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Results (2/3) - MODIFIED scroll-mt FOR ANNOUNCEMENT BAR */}
                    <div ref={resultsRef} className="w-full lg:w-2/3 scroll-mt-36">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b pb-4 border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-500">
                                    <Music2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight uppercase">
                                        {selectedGenre || openCategory} Tracks
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
                            <div className="py-20 text-center opacity-40 italic border border-dashed rounded-3xl">No tracks found for this selection.</div>
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
            group flex items-center gap-4 p-2 rounded-xl border transition-all duration-300
            ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100 hover:shadow-md'}
            ${active ? 'ring-1 ring-sky-500 shadow-lg shadow-sky-500/10' : ''}
        `}>
            <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden cursor-pointer" onClick={handlePlay}>
                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {active ? <Pause className="text-white fill-white" size={20} /> : <Play className="text-white fill-white ml-0.5" size={20} />}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <Link to={`/track/${createSlug(track.id, track.title)}`} className="font-bold text-sm hover:text-sky-500 transition-colors truncate block">
                    {track.title}
                </Link>
                <p className="text-[10px] opacity-50 font-medium truncate">{track.artist_name}</p>
            </div>
            <div className="hidden md:flex flex-[2] h-8 items-center px-4">
                <WaveformVisualizer track={track} height="h-6" barCount={100} interactive={true} enableAnalysis={active} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:block text-[9px] font-mono opacity-40 uppercase tracking-widest">{track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : ''}</span>
                {hasAccess ? (
                    <button onClick={handleDownload} disabled={downloading} className="p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md active:scale-95 disabled:opacity-50">
                        {downloading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                    </button>
                ) : (
                    <Link to={`/track/${createSlug(track.id, track.title)}`} className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10' : 'bg-gray-100 text-zinc-600 hover:bg-sky-500 hover:text-white'} shadow-sm`}>
                        <Tag size={14} />
                    </Link>
                )}
            </div>
        </div>
    );
};