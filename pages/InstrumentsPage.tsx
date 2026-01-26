import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Link, useLocation } from 'react-router-dom';
import { Music, ArrowLeft, Tag, Smile, Calendar, ChevronDown, Guitar, Mic2, Zap, Wind, Drum, Bell, Globe, Piano, Layers, Clapperboard, Disc3, Play, Pause, Download, Loader2, Music2, X, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';
import { MusicTrack } from '../types';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { createSlug } from '../utils/slugUtils';

type InstrumentCategory = {
  title: string;
  icon: React.ReactNode;
  items: string[];
};

export const InstrumentsPage: React.FC = () => {
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, ownedTrackIds } = useStore();
  const location = useLocation();
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [uncategorizedInstruments, setUncategorizedInstruments] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const gradients = [
    'bg-gradient-to-br from-sky-500 to-blue-600',
    'bg-gradient-to-br from-blue-500 to-teal-600',
    'bg-gradient-to-br from-teal-500 to-emerald-600',
    'bg-gradient-to-br from-indigo-500 to-sky-600',
    'bg-gradient-to-br from-cyan-600 to-blue-700',
    'bg-gradient-to-br from-sky-600 to-indigo-700',
    'bg-gradient-to-br from-blue-600 to-violet-700',
  ];

  const instrumentCategories: InstrumentCategory[] = [
    {
      title: "GUITARS",
      icon: <Guitar size={20} />,
      items: ['Acoustic Guitar', 'Electric Guitar', 'Guitar', 'Lap Steel Guitar', 'Resonator', 'Slide Guitar', 'Bass Guitar', 'Ukulele', 'Banjo', 'Mandolin']
    },
    {
      title: "ORCHESTRAL STRINGS",
      icon: <Music size={20} />,
      items: ['Cello', 'Double Bass', 'Fiddle', 'Pizzicato', 'String Orchestra', 'Upright Bass', 'Viola', 'Violin', 'Harp', 'Pizzicato strings']
    },
    {
      title: "KEYBOARD & ORGANS",
      icon: <Piano size={20} />,
      items: ['Accordion', 'Celesta', 'Celeste', 'Clavinet', 'Concertina', 'Electric organ', 'Electric piano', 'Hammond', 'Harpsichord', 'Organ', 'Piano']
    },
    {
      title: "WOODWINDS & BRASS",
      icon: <Wind size={20} />,
      items: ['Clarinet', 'Flute', 'Harmonica', 'Saxophone', 'Tin whistle', 'Trombone', 'Trumpet', 'Tuba', 'Whistle']
    },
    {
      title: "PERCUSSIONS",
      icon: <Drum size={20} />,
      items: ['Clap', 'Claps', 'Handclaps', 'Clave', 'Drum kit', 'Drums', 'Finger cymbals', 'Kick drum', 'Shaker', 'Sleigh bells', 'Snare', 'Snare drum', 'Tambourine', 'Toms']
    },
    {
      title: "MALLETS",
      icon: <Bell size={20} />,
      items: ['Bells', 'Mallet', 'Marimba', 'Music box', 'Timpani', 'Vibraphone', 'Xylophone']
    },
    {
      title: "ETHNIC",
      icon: <Globe size={20} />,
      items: ['Bagpipe', 'Balafon', 'Bansuri', 'Bodhran', 'Bongo', 'Bongos', 'Congas', 'Darbuka', 'Duduk', 'Erhu', 'Ehru', 'Guzheng', 'Koto', 'Mouth harp', 'Oud', 'Pipa', 'Riq', 'Santoor', 'Sitar', 'Tabla', 'Tablas', 'Taiko', 'Tanpura', 'Tumbi', 'Veena']
    },
    {
      title: "ELECTRONIC",
      icon: <Zap size={20} />,
      items: ['Pads', 'Synthesizer', 'Turntable', 'Drum machine']
    },
    {
      title: "VOCALS",
      icon: <Mic2 size={20} />,
      items: ['Vocals']
    }
  ];

  useEffect(() => {
    const fetchInstruments = async () => {
      const { data } = await supabase.from('squeeze_tracks').select('instrument');
      if (data) {
        const allDbInstruments = (data as any[]).flatMap(track => {
            const inst = track.instrument;
            if (Array.isArray(inst)) return inst;
            if (typeof inst === 'string' && inst.trim().length > 0) return [inst];
            return [];
        }).filter((i: any): i is string => typeof i === 'string' && i.length > 0);
        const uniqueDbInstruments = Array.from(new Set(allDbInstruments));
        const categorizedSet = new Set(instrumentCategories.flatMap(c => c.items.map(s => s.toLowerCase())));
        const leftovers = uniqueDbInstruments.filter(i => !categorizedSet.has(i.toLowerCase())).sort();
        if (leftovers.length > 0) setUncategorizedInstruments(leftovers);
      }
    };
    fetchInstruments();
  }, []);

  useEffect(() => {
    if (openCategory) {
        fetchTracksForSelection();
    } else {
        setTracks([]);
    }
  }, [openCategory, selectedInstrument]);

  const fetchTracksForSelection = async () => {
    setLoadingTracks(true);
    const { data, error } = await supabase.from('squeeze_tracks').select('*');
    if (!error && data) {
        let targets: string[] = [];
        if (selectedInstrument) {
            targets = [selectedInstrument.toLowerCase()];
        } else if (openCategory === 'OTHER') {
            targets = uncategorizedInstruments.map(i => i.toLowerCase());
        } else {
            const cat = instrumentCategories.find(c => c.title === openCategory);
            if (cat) targets = cat.items.map(i => i.toLowerCase());
        }

        const filtered = (data as MusicTrack[]).filter(track => {
            const trackInsts = Array.isArray(track.instrument) 
                ? track.instrument.map(i => i.toLowerCase()) 
                : typeof track.instrument === 'string' 
                    ? [track.instrument.toLowerCase()] 
                    : [];
            return trackInsts.some(i => targets.includes(i));
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
        setSelectedInstrument(null);
    } else {
        setOpenCategory(title);
        setSelectedInstrument(null);
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  };

  const handleInstrumentClick = (item: string) => {
    setSelectedInstrument(selectedInstrument === item ? null : item);
  };

  const activeCategoryData = instrumentCategories.find(c => c.title === openCategory);

  return (
    <div className="container mx-auto px-4 pt-6 pb-32">
      <SEO title="Browse Music by Instrument" description="Find royalty free music featuring specific instruments like Piano, Guitar, Strings, Drums, and more." />
      
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
        <h1 className="text-3xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 tracking-tight uppercase text-center">
          <Music className="text-sky-500" size={32} /> Instruments
        </h1>
        <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto font-medium">
          Select an instrument family to explore, then filter by specific sound.
        </p>
      </div>

      {/* Macro Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-[1440px] mx-auto mb-12">
        {instrumentCategories.map((category, index) => {
          const gradient = gradients[index % gradients.length];
          const isOpen = openCategory === category.title;
          return (
            <button
                key={category.title}
                onClick={() => toggleCategory(category.title)}
                className={`
                    relative h-20 px-4 rounded-2xl flex items-center justify-between text-white font-black text-[10px] md:text-xs tracking-widest uppercase transition-all duration-300 transform active:scale-95
                    ${isOpen ? 'ring-4 ring-sky-500 shadow-2xl scale-[1.05] z-10' : 'hover:scale-[1.02] shadow-md'}
                    ${gradient}
                `}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        {category.icon}
                    </div>
                    <span className="text-left leading-tight drop-shadow-sm">{category.title}</span>
                </div>
                <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'opacity-40'}`} />
            </button>
          );
        })}

        {uncategorizedInstruments.length > 0 && (
          <button
            onClick={() => toggleCategory('OTHER')}
            className={`
                relative h-20 px-4 rounded-2xl flex items-center justify-between text-white font-black text-[10px] md:text-xs tracking-widest uppercase transition-all duration-300 transform active:scale-95
                ${openCategory === 'OTHER' ? 'ring-4 ring-sky-500 shadow-2xl scale-[1.05] z-10' : 'hover:scale-[1.02] shadow-md'}
                bg-gradient-to-br from-zinc-600 to-zinc-800
            `}
          >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Layers size={20} />
                </div>
                <span>OTHER SOUNDS</span>
            </div>
            <ChevronDown size={18} className={`transition-transform duration-300 ${openCategory === 'OTHER' ? 'rotate-180' : 'opacity-40'}`} />
          </button>
        )}
      </div>

      {openCategory && (
        <div className="max-w-[1440px] mx-auto animate-in fade-in slide-in-from-top-4 duration-500 scroll-mt-36">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* LEFT COLUMN: Tags (1/3) - LG ONLY STICKY - MODIFIED FOR ANNOUNCEMENT BAR */}
                <div className={`w-full lg:w-1/3 p-8 md:p-10 rounded-[2.5rem] border lg:sticky lg:top-36 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl shadow-sky-500/5'}`}>
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
                            onClick={() => { setOpenCategory(null); setSelectedInstrument(null); }}
                            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(openCategory === 'OTHER' ? uncategorizedInstruments : activeCategoryData?.items || []).map((item) => (
                            <button
                                key={item}
                                onClick={() => handleInstrumentClick(item)}
                                className={`
                                    px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 capitalize tracking-wide
                                    ${selectedInstrument === item
                                        ? 'bg-sky-500 border-sky-400 text-white shadow-lg scale-105'
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

                {/* RIGHT COLUMN: Results (2/3) - MODIFIED scroll-mt FOR ANNOUNCEMENT BAR */}
                <div ref={resultsRef} className="w-full lg:w-2/3 scroll-mt-36">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b pb-4 border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-500">
                                <Music2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight uppercase">
                                    {selectedInstrument || openCategory} Tracks
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