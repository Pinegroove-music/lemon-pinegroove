
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Album, MusicTrack } from '../types';
import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { Disc, AlertCircle, Tag, CheckCircle2, Zap, Play, Pause, Search, X, Disc3, ArrowUpDown, LayoutGrid, LayoutList, ArrowRight, ListMusic } from 'lucide-react';
import { SEO } from '../components/SEO';
import { createSlug } from '../utils/slugUtils';

interface MusicTrackWithOrder extends MusicTrack {
    display_order?: number;
}

interface AlbumWithDetails extends Album {
    track_count?: number;
    first_track?: MusicTrackWithOrder | null;
    all_tracks?: MusicTrackWithOrder[];
}

// Internal component for draggable horizontal scrolling
const DraggableScroll: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    // Offset relative to the container
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className={`${className} cursor-grab active:cursor-grabbing select-none`}
    >
      {children}
    </div>
  );
};

export const MusicPacks: React.FC = () => {
  const [albums, setAlbums] = useState<AlbumWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isDarkMode, session, purchasedTracks, isSubscriber, playTrack, currentTrack, isPlaying } = useStore();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlbums();
  }, [sortBy]);

  const fetchAlbums = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('album')
      .select(`
        *,
        album_tracks(count),
        track_links:album_tracks(
          track_order,
          squeeze_tracks(*)
        )
      `)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching albums:', error);
      setErrorMsg(error.message);
    }
    
    if (data) {
      let mappedData = data.map((item: any) => {
          const sortedLinks = item.track_links?.sort((a: any, b: any) => a.track_order - b.track_order) || [];
          const allTracks = sortedLinks.map((link: any) => ({
              ...link.squeeze_tracks,
              display_order: link.track_order
          })).filter((t: any) => t.id !== undefined);
          
          const firstTrack = allTracks[0] || null;

          return {
              ...item,
              track_count: item.album_tracks?.[0]?.count || 0,
              first_track: firstTrack,
              all_tracks: allTracks
          };
      });

      if (sortBy === 'relevance') {
          for (let i = mappedData.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [mappedData[i], mappedData[j]] = [mappedData[j], mappedData[i]];
          }
      } else {
          mappedData.sort((a, b) => b.id - a.id);
      }

      setAlbums(mappedData);
    }
    setLoading(false);
  };

  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return albums;
    const query = searchQuery.toLowerCase();
    return albums.filter(album => 
      album.title.toLowerCase().includes(query) || 
      (album.description && album.description.toLowerCase().includes(query))
    );
  }, [albums, searchQuery]);

  const handlePlayPack = (e: React.MouseEvent, album: AlbumWithDetails) => {
      e.preventDefault();
      e.stopPropagation();
      if (album.first_track && album.all_tracks) {
          playTrack(album.first_track, album.all_tracks);
      }
  };

  const handlePlayTrack = (e: React.MouseEvent, track: MusicTrack, playlist: MusicTrack[]) => {
      e.preventDefault();
      e.stopPropagation();
      playTrack(track, playlist);
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-12 pb-32">
      <SEO title="Music Packs & Bundles" description="Get curated collections of high-quality music tracks at a discounted price. Perfect for game developers, video editors, and content creators." />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg">
              <Disc3 size={32} className="text-sky-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase">Music Packs</h1>
        </div>
        <p className="w-full opacity-70 text-lg font-medium leading-relaxed">
          Curated collections of our best tracks. Get fully licensed albums for a fraction of the cost.
        </p>
      </div>

      {/* UNIFIED CONTROL BOX */}
      <div className="w-full mb-12">
        <div className={`
            flex flex-col lg:flex-row items-stretch lg:items-center rounded-2xl border overflow-hidden transition-all duration-300 w-full
            ${isDarkMode ? 'bg-zinc-900 border-zinc-800 shadow-2xl shadow-black/20' : 'bg-white border-zinc-200 shadow-xl shadow-sky-500/5'}
        `}>
          
          {/* Search Part */}
          <div className="flex-1 relative group border-b lg:border-b-0 lg:border-r border-zinc-100 dark:border-zinc-800">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchQuery ? 'text-sky-500' : 'opacity-40'}`} size={20} />
            <input 
              type="text"
              placeholder="Search music packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-12 py-4 bg-transparent outline-none font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-60 hover:opacity-100"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Controls Part */}
          <div className="flex items-center divide-x divide-zinc-100 dark:divide-zinc-800 bg-black/5 dark:bg-white/5 lg:bg-transparent">
            
            {/* Sorting */}
            <div className="flex items-center px-4 py-2 min-w-[150px] group/sort">
              <ArrowUpDown size={16} className="opacity-40 mr-2 group-hover/sort:text-sky-500 transition-colors" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Sort By</span>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-4 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}
                >
                    <option value="newest" className={isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-black'}>Newest</option>
                    <option value="relevance" className={isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-black'}>Relevance</option>
                </select>
              </div>
            </div>

            {/* View Mode */}
            <div className="hidden sm:flex items-center p-1.5 gap-1.5 h-full">
              <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-sky-500 text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
                  title="Grid View"
              >
                  <LayoutGrid size={20} />
              </button>
              <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-sky-500 text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
                  title="List View"
              >
                  <LayoutList size={20} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <Disc size={48} className="animate-spin text-sky-500 mb-4" />
            <p className="font-bold">Loading premium packs...</p>
         </div>
      ) : errorMsg ? (
         <div className="text-center py-20 text-red-500 flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <p>Error loading albums: {errorMsg}</p>
         </div>
      ) : filteredAlbums.length === 0 ? (
         <div className="text-center py-24 opacity-50 flex flex-col items-center p-8 border border-dashed rounded-3xl border-zinc-300 dark:border-zinc-700 animate-in fade-in duration-500">
            <Search size={48} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">
              {searchQuery ? `No results found for "${searchQuery}"` : "No music packs found"}
            </h3>
            <p className="max-w-md mx-auto text-sm mb-6">
                Try adjusting your search terms or browse our full library for individual tracks.
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 bg-sky-500 text-white font-bold rounded-full hover:bg-sky-400 transition-all active:scale-95"
              >
                Clear Search
              </button>
            )}
         </div>
      ) : (
        <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500" 
            : "flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        }>
            {filteredAlbums.map(album => {
                const isPurchased = purchasedTracks.some(p => p.album_id === album.id);
                const hasAccess = isPurchased || isSubscriber;
                const isCurrentPackPlaying = album.first_track && currentTrack?.id === album.first_track.id && isPlaying;
                const packSlug = createSlug(album.id, album.title);

                if (viewMode === 'list') {
                    return (
                        <div 
                            key={album.id} 
                            className={`
                                group rounded-[1.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl flex flex-col md:flex-row border
                                ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}
                            `}
                        >
                            {/* COMPACT COVER - MAX 200px (md:w-52 = 208px) */}
                            <div className="w-full md:w-52 aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                                <img 
                                    src={album.cover_url} 
                                    alt={album.title} 
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                                    <button 
                                        onClick={(e) => handlePlayPack(e, album)}
                                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-95"
                                        title={isCurrentPackPlaying ? "Pause Track" : "Play Pack"}
                                    >
                                        {isCurrentPackPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                                    </button>
                                </div>
                                <div className="absolute top-3 left-3">
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 border border-white/10 shadow-lg">
                                        <Tag size={8} className="text-sky-400" /> 
                                        {album.track_count ? `${album.track_count} TRACKS` : 'ALBUM'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 md:p-6 flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    {hasAccess && (
                                        <div className="bg-emerald-500/10 text-emerald-500 py-0.5 px-2 rounded-lg flex items-center gap-1.5 border border-emerald-500/20">
                                            {isSubscriber && !isPurchased ? <Zap size={8} className="fill-emerald-500" /> : <CheckCircle2 size={8} />}
                                            <span className="font-black text-[8px] uppercase tracking-widest">{isSubscriber && !isPurchased ? 'PRO Access' : 'In Library'}</span>
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-xl lg:text-2xl font-black mb-2 leading-tight transition-colors group-hover:text-sky-500">
                                    <Link to={`/music-packs/${packSlug}`}>{album.title}</Link>
                                </h2>
                                {album.description && (
                                    <p className="text-sm opacity-60 leading-relaxed line-clamp-2 font-medium mb-4 w-full">
                                        {album.description}
                                    </p>
                                )}

                                {/* DRAGGABLE TRACK LIST - TIGHTER SPACING */}
                                {album.all_tracks && album.all_tracks.length > 0 && (
                                    <div className="mb-6">
                                        <DraggableScroll className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-fade">
                                            {album.all_tracks.map((track, idx) => {
                                                const isTrackActive = currentTrack?.id === track.id && isPlaying;
                                                const trackNumber = String(track.display_order || (idx + 1)).padStart(2, '0');
                                                
                                                return (
                                                    <button
                                                        key={track.id}
                                                        onClick={(e) => handlePlayTrack(e, track, album.all_tracks || [])}
                                                        className={`
                                                            whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-2 flex-shrink-0
                                                            ${isTrackActive 
                                                                ? 'bg-sky-500 border-sky-500 text-white shadow-md' 
                                                                : (isDarkMode ? 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-white hover:border-sky-300 hover:text-sky-700')}
                                                        `}
                                                    >
                                                        <span className={`opacity-40 font-mono text-[9px] ${isTrackActive ? 'text-white opacity-80' : ''}`}>{trackNumber}</span>
                                                        <span className="truncate max-w-[120px]">{track.title}</span>
                                                        {isTrackActive && <div className="w-1 h-1 bg-white rounded-full animate-pulse" />}
                                                    </button>
                                                );
                                            })}
                                        </DraggableScroll>
                                    </div>
                                )}
                                
                                {/* ACTIONS - REMOVED mt-auto TO PREVENT LARGE SPACE */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <Link 
                                        to={`/music-packs/${packSlug}`}
                                        className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-xl font-black transition-all shadow-md active:scale-95 text-[10px] uppercase tracking-widest flex items-center gap-1.5"
                                    >
                                        Buy Pack <ArrowRight size={14} />
                                    </Link>
                                    <button 
                                        onClick={(e) => handlePlayPack(e, album)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black transition-all border active:scale-95 text-[10px] uppercase tracking-widest ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800 text-white' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-800'}`}
                                    >
                                        {isCurrentPackPlaying ? <Pause size={14} /> : <Play size={14} />}
                                        {isCurrentPackPlaying ? 'Pause' : 'Listen'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div 
                        key={album.id} 
                        className={`
                            group rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full border
                            ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}
                        `}
                    >
                        <div className="w-full aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                            <img 
                                src={album.cover_url} 
                                alt={album.title} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                                {/* Play Pack Button */}
                                <button 
                                    onClick={(e) => handlePlayPack(e, album)}
                                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-95"
                                    title={isCurrentPackPlaying ? "Pause Track" : "Play Pack"}
                                >
                                    {isCurrentPackPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                </button>
                                
                                <div className="flex flex-col items-center gap-2.5">
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">
                                        {isCurrentPackPlaying ? 'Now Playing' : 'Preview Pack'}
                                    </span>
                                    
                                    <Link 
                                        to={`/music-packs/${packSlug}`}
                                        className="bg-sky-500 hover:bg-sky-400 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                                    >
                                        View Pack <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                            {hasAccess && (
                                <div className="absolute bottom-4 left-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white py-2 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    {isSubscriber && !isPurchased ? <Zap size={14} className="fill-white" /> : <CheckCircle2 size={14} />}
                                    <span className="font-black text-[10px] uppercase tracking-widest">{isSubscriber && !isPurchased ? 'PRO Access' : 'In Library'}</span>
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-white/10 shadow-lg">
                                    <Tag size={12} className="text-sky-400" /> 
                                    {album.track_count ? `${album.track_count} TRACKS` : 'ALBUM'}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                            <div className="mb-2">
                                <h2 className="text-2xl font-black mb-3 leading-tight transition-colors line-clamp-1 group-hover:text-sky-500">
                                    <Link to={`/music-packs/${packSlug}`}>{album.title}</Link>
                                </h2>
                                {album.description && (
                                    <p className="text-sm opacity-60 leading-relaxed line-clamp-3 font-medium">
                                        {album.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      <style>{`
        .mask-linear-fade {
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
