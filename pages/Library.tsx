
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { MusicTrack } from '../types';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { Play, Pause, ShoppingCart, Filter, ChevronDown, ChevronRight, ArrowRight, X, Mic2, ChevronLeft, Sparkles, Check, Trash2, LayoutList, LayoutGrid, Download, Zap, Loader2 } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { SEO } from '../components/SEO';
import { createSlug } from '../utils/slugUtils';
import { FavoriteButton } from '../components/FavoriteButton';

export const Library: React.FC = () => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDarkMode, currentTrack } = useStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25; 

  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [bpmRange, setBpmRange] = useState<'slow' | 'medium' | 'fast' | null>(null);

  const [availableInstruments, setAvailableInstruments] = useState<string[]>([]);

  useEffect(() => {
    if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
    }
  }, [tracks, currentPage, viewMode, loading]);

  useEffect(() => {
      const term = searchParams.get('search') || '';
      if (term !== searchTerm) {
        setSearchTerm(term);
      }
  }, [searchParams]);

  const genres = ['Cinematic', 'Corporate', 'Ambient', 'Rock', 'Pop', 'Electronic', 'Acoustic', 'Folk', 'Hip Hop', 'Jazz'];
  const moods = ['Inspiring', 'Happy', 'Dark', 'Emotional', 'Dramatic', 'Peaceful', 'Energetic', 'Corporate', 'Uplifting', 'Sad'];
  const seasons = ['Spring', 'Summer', 'Autumn', 'Winter', 'Christmas', 'Halloween'];
  
  useEffect(() => {
    setCurrentPage(1);
    fetchTracks();
  }, [selectedGenres, selectedMoods, selectedInstruments, selectedSeasons, bpmRange, searchTerm]);

  const fetchTracks = async () => {
    setLoading(true);
    
    const { data, error } = await supabase.from('squeeze_tracks').select('*').limit(1000);
    
    if (error) {
        console.error("Error fetching tracks:", error);
        setTracks([]);
    } else if (data) {
        const allTracks = data as MusicTrack[];
        for (let i = allTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
        }

        let filteredData = allTracks;

        if (availableInstruments.length === 0) {
            const instrumentCounts: Record<string, number> = {};

            (data as MusicTrack[]).forEach(track => {
                const addInst = (inst: string) => {
                    const i = inst.trim();
                    if (i) {
                        instrumentCounts[i] = (instrumentCounts[i] || 0) + 1;
                    }
                };

                if (Array.isArray(track.instrument)) {
                    track.instrument.forEach(addInst);
                } else if (typeof track.instrument === 'string' && track.instrument) {
                    addInst(track.instrument);
                }
            });

            const sortedInstruments = Object.entries(instrumentCounts)
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);

            setAvailableInstruments(sortedInstruments);
        }

        const normalize = (val: any) => String(val).toLowerCase().trim();

        const checkFilterMatch = (trackAttribute: string[] | string | null | undefined, selectedFilters: string[]) => {
            if (!trackAttribute) return false;
            const normalizedFilters = selectedFilters.map(normalize);
            if (Array.isArray(trackAttribute)) {
                return trackAttribute.some(attr => normalizedFilters.includes(normalize(attr)));
            }
            if (typeof trackAttribute === 'string') {
                return normalizedFilters.includes(normalize(trackAttribute));
            }
            return false;
        };

        if (searchTerm) {
            const terms = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            const fullTerm = searchTerm.toLowerCase().trim();

            filteredData = filteredData.filter(track => {
                const trackString = [
                    track.title,
                    track.artist_name,
                    JSON.stringify(track.credits),
                    JSON.stringify(track.tags),
                    JSON.stringify(track.genre),
                    JSON.stringify(track.mood),
                    JSON.stringify(track.instrument),
                    JSON.stringify(track.media_theme)
                ].join(' ').toLowerCase();
                return terms.some(t => trackString.includes(t));
            });

            filteredData.sort((a, b) => {
                const titleA = a.title.toLowerCase();
                const titleB = b.title.toLowerCase();

                if (titleA === fullTerm && titleB !== fullTerm) return -1;
                if (titleB === fullTerm && titleA !== fullTerm) return 1;

                const aStarts = titleA.startsWith(fullTerm);
                const bStarts = titleB.startsWith(fullTerm);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                const aContains = titleA.includes(fullTerm);
                const bContains = titleB.includes(fullTerm);
                if (aContains && !bContains) return -1;
                if (!aContains && bContains) return 1;

                return 0; 
            });
        }

        if (selectedGenres.length > 0) filteredData = filteredData.filter(track => checkFilterMatch(track.genre, selectedGenres));
        if (selectedMoods.length > 0) filteredData = filteredData.filter(track => checkFilterMatch(track.mood, selectedMoods));
        if (selectedInstruments.length > 0) filteredData = filteredData.filter(track => checkFilterMatch(track.instrument, selectedInstruments));
        if (selectedSeasons.length > 0) filteredData = filteredData.filter(track => checkFilterMatch(track.season, selectedSeasons));
        if (bpmRange) {
            filteredData = filteredData.filter(track => {
                if (!track.bpm) return false;
                if (bpmRange === 'slow') return track.bpm <= 70;
                if (bpmRange === 'medium') return track.bpm >= 71 && track.bpm <= 120;
                if (bpmRange === 'fast') return track.bpm > 120;
                return true;
            });
        }

        setTracks(filteredData);
    }
    setLoading(false);
  };

  const toggleFilter = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const findSimilar = (track: MusicTrack) => {
      setSearchTerm('');
      setSelectedSeasons([]);
      setSelectedInstruments([]);
      setBpmRange(null);
      setSearchParams({});

      let newGenres: string[] = [];
      if (Array.isArray(track.genre)) {
          newGenres = track.genre.slice(0, 3);
      } else if (typeof track.genre === 'string' && track.genre) {
          newGenres = [track.genre];
      }
      setSelectedGenres(newGenres);

      let newMoods: string[] = [];
      if (Array.isArray(track.mood)) {
          newMoods = track.mood.slice(0, 3);
      } else if (typeof track.mood === 'string' && track.mood) {
          newMoods = [track.mood];
      }
      setSelectedMoods(newMoods);

      const mainContainer = document.querySelector('main');
      if (mainContainer) {
          mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const clearAllFilters = () => {
      setSearchTerm('');
      setSelectedGenres([]);
      setSelectedMoods([]);
      setSelectedInstruments([]);
      setSelectedSeasons([]);
      setBpmRange(null);
      setSearchParams({}); 
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTracks = tracks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tracks.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
      setCurrentPage(pageNumber);
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
          mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const generatePagination = () => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, '...', totalPages];
    } else if (currentPage >= totalPages - 3) {
        return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
  };

  const hasActiveFilters = searchTerm || selectedGenres.length > 0 || selectedMoods.length > 0 || selectedInstruments.length > 0 || selectedSeasons.length > 0 || bpmRange;

  const getPageTitle = () => {
      if (searchTerm) return `"${searchTerm}" Search Results`;
      if (selectedGenres.length > 0) return `${selectedGenres.join(', ')} Royalty Free Music`;
      if (selectedMoods.length > 0) return `${selectedMoods.join(', ')} Royalty Free Music`;
      if (selectedInstruments.length > 0) return `${selectedInstruments.join(', ')} Royalty Free Music`;
      if (selectedSeasons.length > 0) return `${selectedSeasons.join(', ')} Royalty Free Music`;
      return "Music Library";
  };

  const sidebarHeightClass = currentTrack 
    ? 'lg:h-[calc(100vh-6rem-5rem)]' 
    : 'lg:h-[calc(100vh-6rem)]';
  
  const mobileContainerPadding = currentTrack ? 'pb-24' : 'pb-0';

  return (
    <div className="flex flex-col lg:flex-row lg:items-start relative">
      <SEO title={getPageTitle()} description={`Browse our library of ${tracks.length} high-quality royalty-free music tracks.`} />
      
      <button 
        className="lg:hidden m-4 p-3 bg-sky-600 text-white rounded-lg flex items-center justify-center gap-2"
        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
      >
        <Filter size={20}/> Filters
      </button>

      <div className={`
        lg:w-72 flex-shrink-0 border-r flex flex-col
        ${mobileFiltersOpen ? `fixed inset-0 z-40 overflow-hidden ${mobileContainerPadding}` : 'hidden lg:flex'}
        ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-100 bg-white'}
        lg:sticky lg:top-0 ${sidebarHeightClass} transition-all duration-300
      `}>
        
        {mobileFiltersOpen && (
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)}>
                    <X size={24} />
                </button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            <CollapsibleFilterSection 
                title="Genres" 
                items={genres} 
                selected={selectedGenres} 
                onChange={(i) => toggleFilter(selectedGenres, setSelectedGenres, i)} 
                linkTo="/categories/genres"
                isDark={isDarkMode}
            />
            
            <CollapsibleFilterSection 
                title="Moods" 
                items={moods} 
                selected={selectedMoods} 
                onChange={(i) => toggleFilter(selectedMoods, setSelectedMoods, i)} 
                linkTo="/categories/moods"
                isDark={isDarkMode}
            />

            {availableInstruments.length > 0 && (
                <CollapsibleFilterSection 
                    title="Instruments" 
                    items={availableInstruments} 
                    selected={selectedInstruments} 
                    onChange={(i) => toggleFilter(selectedInstruments, setSelectedInstruments, i)} 
                    linkTo="/categories/instruments"
                    isDark={isDarkMode}
                />
            )}
            
            <CollapsibleFilterSection 
                title="Tempo" 
                isDark={isDarkMode}
            >
                <div className="space-y-1 pb-4">
                    {['slow', 'medium', 'fast'].map(range => (
                        <button 
                            key={range} 
                            onClick={() => setBpmRange(bpmRange === range ? null : range as any)}
                            className={`
                                flex items-center justify-between w-full text-left px-4 py-2.5 rounded-full text-sm font-medium transition-all mb-1
                                ${bpmRange === range 
                                    ? 'bg-sky-500 text-white shadow-md transform scale-105' 
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                            `}
                        >
                            <span className="capitalize">{range}</span>
                            {bpmRange === range && <Check size={14} className="text-white"/>}
                        </button>
                    ))}
                </div>
            </CollapsibleFilterSection>

            <CollapsibleFilterSection 
                title="Seasonal Themes" 
                items={seasons} 
                selected={selectedSeasons} 
                onChange={(i) => toggleFilter(selectedSeasons, setSelectedSeasons, i)} 
                linkTo="/categories/seasonal"
                isDark={isDarkMode}
            />
        </div>

        {hasActiveFilters && (
            <div className="p-4 z-10">
                <div className={`
                    p-3 rounded-xl border animate-in slide-in-from-bottom-2 duration-300
                    shadow-xl
                    ${isDarkMode ? 'bg-zinc-800 border-zinc-700 shadow-black/50' : 'bg-white border-sky-100 shadow-sky-100'}
                `}>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12}/> ACTIVE FILTERS
                        </h4>
                        <button 
                            onClick={clearAllFilters}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-2 py-1 rounded transition-colors flex items-center gap-1 font-bold"
                        >
                            <Trash2 size={12} /> Clear All
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
                        {searchTerm && (
                            <ActiveFilterBadge label={`"${searchTerm}"`} onRemove={() => { setSearchTerm(''); setSearchParams({}); }} isDark={isDarkMode} />
                        )}
                        {bpmRange && (
                            <ActiveFilterBadge label={`BPM: ${bpmRange}`} onRemove={() => setBpmRange(null)} isDark={isDarkMode} />
                        )}
                        {selectedGenres.map(g => (
                            <ActiveFilterBadge key={g} label={g} onRemove={() => toggleFilter(selectedGenres, setSelectedGenres, g)} isDark={isDarkMode} />
                        ))}
                        {selectedMoods.map(m => (
                            <ActiveFilterBadge key={m} label={m} onRemove={() => toggleFilter(selectedMoods, setSelectedMoods, m)} isDark={isDarkMode} />
                        ))}
                        {selectedInstruments.map(i => (
                            <ActiveFilterBadge key={i} label={i} onRemove={() => toggleFilter(selectedInstruments, setSelectedInstruments, i)} isDark={isDarkMode} />
                        ))}
                        {selectedSeasons.map(s => (
                            <ActiveFilterBadge key={s} label={s} onRemove={() => toggleFilter(selectedSeasons, setSelectedSeasons, s)} isDark={isDarkMode} />
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="flex-1 p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                 <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Library</h2>
                 {tracks.length > 0 && <span className="text-sm font-normal opacity-50 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">{tracks.length} Tracks</span>}
            </div>

            <div className={`flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' : 'opacity-50 hover:opacity-100'}`}
                    title="List View"
                >
                    <LayoutList size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' : 'opacity-50 hover:opacity-100'}`}
                    title="Grid View"
                >
                    <LayoutGrid size={18} />
                </button>
            </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20 opacity-50">Loading tracks...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            {hasActiveFilters ? "No tracks found matching your filters." : "No tracks available."}
          </div>
        ) : (
          <>
            <div>
                {viewMode === 'list' ? (
                    <div className="flex flex-col gap-3">
                        {currentTracks.map(track => (
                            <TrackItem key={track.id} track={track} onFindSimilar={() => findSimilar(track)} playlist={tracks} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {currentTracks.map(track => (
                            <TrackGridItem key={track.id} track={track} onFindSimilar={() => findSimilar(track)} playlist={tracks} />
                        ))}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2">
                    <button 
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 disabled:opacity-30' : 'hover:bg-gray-100 disabled:opacity-30'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {generatePagination().map((page, index) => {
                            if (page === '...') {
                                return <span key={`ellipsis-${index}`} className="opacity-50 px-2 font-bold tracking-widest">...</span>;
                            }
                            return (
                                <button
                                    key={`page-${page}`}
                                    onClick={() => paginate(page as number)}
                                    className={`
                                        w-8 h-8 rounded-lg text-sm font-medium transition-all
                                        ${currentPage === page 
                                            ? 'bg-sky-600 text-white shadow-md' 
                                            : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-zinc-600')}
                                    `}
                                >
                                    {page}
                                </button>
                            )
                        })}
                    </div>

                    <button 
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 disabled:opacity-30' : 'hover:bg-gray-100 disabled:opacity-30'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
          </>
        )}
        
        <div className={`w-full transition-all duration-300 pointer-events-none ${currentTrack ? 'h-48' : 'h-24'}`} />

      </div>
    </div>
  );
};

const ActiveFilterBadge: React.FC<{ label: string, onRemove: () => void, isDark: boolean }> = ({ label, onRemove, isDark }) => (
    <span className={`
        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border shadow-sm
        ${isDark ? 'bg-sky-900/30 text-sky-200 border-sky-800 hover:bg-sky-900/50' : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'}
    `}>
        {label}
        <button onClick={onRemove} className="hover:opacity-60 p-0.5 ml-1">
            <X size={12} />
        </button>
    </span>
);

const CollapsibleFilterSection: React.FC<{ 
    title: string, 
    items?: string[], 
    selected?: string[], 
    onChange?: (item: string) => void, 
    linkTo?: string,
    isDark: boolean,
    children?: React.ReactNode
}> = ({ title, items, selected, onChange, linkTo, isDark, children }) => {
    const [isOpen, setIsOpen] = useState(false); 

    return (
        <div className={`mb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'} last:border-0 pb-4`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-2 font-bold text-xs uppercase opacity-70 hover:opacity-100 tracking-wider"
            >
                {title}
                {isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
            
            {isOpen && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children ? children : (
                        <div className="space-y-1">
                            {items?.slice(0, 8).map(item => {
                                const isSelected = selected?.includes(item);
                                return (
                                    <button 
                                        key={item} 
                                        onClick={() => onChange && onChange(item)}
                                        className={`
                                            flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                                            ${isSelected 
                                                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800' 
                                                : 'opacity-80 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}
                                        `}
                                    >
                                        {item}
                                        {isSelected && <Check size={14} className="text-sky-500"/>}
                                    </button>
                                );
                            })}
                            {linkTo && (
                                <Link 
                                    to={linkTo} 
                                    className={`
                                        flex items-center justify-center gap-2 text-xs font-bold mt-4 py-2 px-4 rounded-lg w-full transition-all
                                        ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-sky-50 hover:bg-sky-100 text-sky-600'}
                                    `}
                                >
                                    View all {title} <ArrowRight size={12} />
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TrackItem: React.FC<{ track: MusicTrack; playlist: MusicTrack[]; onFindSimilar?: () => void }> = ({ track, playlist, onFindSimilar }) => {
    const { playTrack, currentTrack, isPlaying, isDarkMode, session, ownedTrackIds } = useStore();
    const { isPro } = useSubscription();
    const [downloading, setDownloading] = useState(false);
    const navigate = useNavigate();
    const isCurrent = currentTrack?.id === track.id;
    const active = isCurrent && isPlaying;
    const hasAccess = ownedTrackIds.has(track.id) || isPro;

    const displayTitle = track.title.length > 22 ? track.title.substring(0, 22) + '...' : track.title;

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!session) {
            navigate('/auth');
            return;
        }
        setDownloading(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-download-url', {
                body: { trackId: track.id }
            });
            
            if (error) throw error;
            
            if (data?.downloadUrl) {
                const response = await fetch(data.downloadUrl);
                if (!response.ok) throw new Error('Download failed');
                
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = blobUrl;
                
                // Logica dinamica per estensione
                const extension = track.wav_r2_key?.toLowerCase().endsWith('.zip') ? '.zip' : '.wav';
                link.setAttribute('download', `${track.title}${extension}`);
                
                document.body.appendChild(link);
                link.click();
                
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } else {
                alert("Unable to retrieve download URL. Please ensure you have an active license.");
            }
        } catch (err) {
            console.error("Download error:", err);
            alert("An error occurred while preparing your download.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className={`
            flex items-center gap-3 p-2 md:p-3 rounded-xl transition-all duration-200
            ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 shadow-sm hover:shadow-md border'}
            ${active ? 'ring-1 ring-sky-500/50' : ''}
        `}>
            {/* Column 1: Cover Image */}
            <div 
                className="relative group w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => playTrack(track, playlist)}
            >
                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute inset-0 bg-sky-900/40 flex items-center justify-center transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {active ? <Pause className="text-white" size={18} /> : <Play className="text-white ml-1" size={18} />}
                </div>
            </div>

            {/* Column 2: Info (Title, Artist, Genre) */}
            <div className="flex-1 md:flex-none md:w-52 min-w-0">
                <Link to={`/track/${createSlug(track.id, track.title)}`} className="font-bold text-sm md:text-base hover:text-sky-500 transition-colors block truncate leading-tight" title={track.title}>{displayTitle}</Link>
                <div className="flex items-center gap-2">
                    <Link to={`/library?search=${encodeURIComponent(track.artist_name)}`} className="text-[10px] md:text-xs opacity-70 hover:underline truncate">{track.artist_name}</Link>
                    {track.lyrics && (
                        <span title="Has Lyrics" className="shrink-0">
                            <Mic2 size={10} className="text-sky-500 opacity-80" />
                        </span>
                    )}
                </div>
                <div className="mt-1">
                    {Array.isArray(track.genre) ? (
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 inline-block">{track.genre[0]}</span>
                    ) : track.genre ? (
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 inline-block">{track.genre}</span>
                    ) : null}
                </div>
            </div>

            {/* Hidden on Mobile: Waveform */}
            <div className="hidden md:flex flex-1 h-12 items-center px-2">
                <WaveformVisualizer 
                    track={track} 
                    height="h-10" 
                    barCount={200} 
                    interactive={true} 
                    enableAnalysis={active}
                />
            </div>

            {/* Column 3: Actions */}
            <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
                <div className="text-right text-[10px] opacity-60 font-mono hidden lg:block w-14 leading-tight">
                    <div>{track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}</div>
                    {track.bpm && <div>{track.bpm} BPM</div>}
                </div>
                
                <FavoriteButton trackId={track.id} />
                
                <button 
                    onClick={(e) => { e.stopPropagation(); onFindSimilar && onFindSimilar(); }}
                    className="p-1.5 md:p-2 rounded-full hover:bg-sky-100 dark:hover:bg-zinc-700 text-sky-500 transition-colors"
                    title="Find similar tracks"
                >
                    <Sparkles size={16} />
                </button>

                <div className="w-auto flex items-center justify-center">
                    {hasAccess ? (
                        <button 
                            onClick={handleDownload}
                            disabled={downloading}
                            className="p-1.5 md:p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all"
                            title="Download"
                        >
                            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        </button>
                    ) : (
                        <Link 
                            to={`/track/${createSlug(track.id, track.title)}`}
                            className={`p-1.5 md:p-2 rounded-full transition-all shadow-md ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-sky-900/40 hover:text-sky-400' : 'bg-gray-100 text-zinc-600 hover:bg-sky-100 hover:text-sky-600'}`}
                            title="View Purchase Options"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ShoppingCart size={16} />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

const TrackGridItem: React.FC<{ track: MusicTrack; playlist: MusicTrack[]; onFindSimilar?: () => void }> = ({ track, playlist, onFindSimilar }) => {
    const { playTrack, currentTrack, isPlaying, isDarkMode, session, ownedTrackIds } = useStore();
    const { isPro } = useSubscription();
    const [downloading, setDownloading] = useState(false);
    const navigate = useNavigate();
    const isCurrent = currentTrack?.id === track.id;
    const active = isCurrent && isPlaying;
    const hasAccess = ownedTrackIds.has(track.id) || isPro;

    const displayTitle = track.title.length > 22 ? track.title.substring(0, 22) + '...' : track.title;

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!session) {
            navigate('/auth');
            return;
        }
        setDownloading(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-download-url', {
                body: { trackId: track.id }
            });
            
            if (error) throw error;
            
            if (data?.downloadUrl) {
                const response = await fetch(data.downloadUrl);
                if (!response.ok) throw new Error('Download failed');
                
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = blobUrl;
                
                // Logica dinamica per estensione
                const extension = track.wav_r2_key?.toLowerCase().endsWith('.zip') ? '.zip' : '.wav';
                link.setAttribute('download', `${track.title}${extension}`);
                
                document.body.appendChild(link);
                link.click();
                
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } else {
                alert("Unable to retrieve download URL. Please ensure you have an active license.");
            }
        } catch (err) {
            console.error("Download error:", err);
            alert("An error occurred while preparing your download.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className={`
            group flex flex-col rounded-xl overflow-hidden border transition-all hover:shadow-xl hover:-translate-y-1
            ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}
        `}>
            <div 
                className="relative aspect-square cursor-pointer overflow-hidden group-hover:shadow-md"
            >
                <img 
                    src={track.cover_url} 
                    alt={track.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                
                <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); playTrack(track, playlist); }}
                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    >
                        {active ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                    </button>
                    
                    <div className="absolute bottom-4 flex gap-3">
                        <FavoriteButton trackId={track.id} />
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onFindSimilar && onFindSimilar(); }}
                            className="p-2 rounded-full bg-black/50 text-white hover:bg-sky-500 backdrop-blur-md transition-colors"
                            title="Find similar tracks"
                        >
                            <Sparkles size={16} />
                        </button>
                        
                        {hasAccess ? (
                            <button 
                                onClick={handleDownload}
                                disabled={downloading}
                                className="p-2 rounded-full bg-emerald-500 text-white shadow-lg backdrop-blur-md transition-colors"
                                title="Download"
                            >
                                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            </button>
                        ) : (
                            <Link 
                                to={`/track/${createSlug(track.id, track.title)}`}
                                className="p-2 rounded-full bg-black/50 text-white hover:bg-sky-500 backdrop-blur-md transition-colors"
                                title="View Purchase Options"
                            >
                                <ShoppingCart size={16} />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 text-center">
                <Link to={`/track/${createSlug(track.id, track.title)}`} className="font-bold text-sm truncate block hover:text-sky-500 transition-colors mb-1" title={track.title}>
                    {displayTitle}
                </Link>
                <Link 
                    to={`/library?search=${encodeURIComponent(track.artist_name)}`} 
                    className="text-xs opacity-60 truncate block transition-colors hover:text-sky-500"
                >
                    {track.artist_name}
                </Link>
                
                {track.lyrics && (
                    <div className="mt-1 flex justify-center" title="Has Lyrics">
                         <Mic2 size={10} className="text-sky-500 opacity-60" />
                    </div>
                )}
            </div>
        </div>
    );
};
