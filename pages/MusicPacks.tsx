
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Album, MusicTrack } from '../types';
import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { Disc, AlertCircle, Tag, CheckCircle2, Zap, Play, Pause, Eye } from 'lucide-react';
import { SEO } from '../components/SEO';
import { createSlug } from '../utils/slugUtils';

interface AlbumWithDetails extends Album {
    track_count?: number;
    first_track?: MusicTrack | null;
}

export const MusicPacks: React.FC = () => {
  const [albums, setAlbums] = useState<AlbumWithDetails[]>([]);
  const { isDarkMode, session, purchasedTracks, isSubscriber, playTrack, currentTrack, isPlaying } = useStore();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbums = async () => {
      // Recuperiamo l'album, il count dei brani e i dati della prima traccia associata
      const { data, error } = await supabase
        .from('album')
        .select(`
          *,
          album_tracks(count),
          first_track_link:album_tracks(
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
        const mappedData = data.map((item: any) => {
            // Troviamo la traccia con track_order più basso (solitamente 1)
            const sortedLinks = item.first_track_link?.sort((a: any, b: any) => a.track_order - b.track_order) || [];
            const firstTrack = sortedLinks[0]?.squeeze_tracks || null;

            return {
                ...item,
                track_count: item.album_tracks?.[0]?.count || 0,
                first_track: firstTrack
            };
        });
        setAlbums(mappedData);
      }
      setLoading(false);
    };
    fetchAlbums();
  }, []);

  const handlePlayFirstTrack = (e: React.MouseEvent, track: MusicTrack | null | undefined) => {
      e.preventDefault();
      e.stopPropagation();
      if (track) {
          playTrack(track);
      }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-12 pb-32">
      <SEO title="Music Packs & Bundles" description="Get curated collections of high-quality music tracks at a discounted price. Perfect for game developers, video editors, and content creators." />
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-sky-500/10 rounded-lg">
            <Disc size={32} className="text-sky-500" />
        </div>
        <h1 className="text-4xl font-black tracking-tight uppercase">Music Packs</h1>
      </div>
      
      <p className="max-w-2xl mb-12 opacity-70 text-lg font-medium leading-relaxed">
        Curated collections of our best tracks. Get fully licensed albums for a fraction of the cost.
      </p>

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
      ) : albums.length === 0 ? (
         <div className="text-center py-20 opacity-50 flex flex-col items-center p-8 border border-dashed rounded-3xl border-zinc-300 dark:border-zinc-700">
            <Disc size={48} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">No music packs found</h3>
            <p className="max-w-md mx-auto text-sm">
                We couldn't find any albums in the database.
            </p>
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {albums.map(album => {
                const isPurchased = purchasedTracks.some(p => p.album_id === album.id);
                const hasAccess = isPurchased || isSubscriber;
                const isCurrentPackPlaying = album.first_track && currentTrack?.id === album.first_track.id && isPlaying;
                const packSlug = createSlug(album.id, album.title);

                return (
                    <div 
                        key={album.id} 
                        className={`
                            group rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full border
                            ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}
                        `}
                    >
                        {/* Cover with Overlay Commands */}
                        <div className="w-full aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                            <img 
                                src={album.cover_url} 
                                alt={album.title} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            />
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                                <div className="flex items-center gap-3">
                                    {/* Play First Track Button */}
                                    <button 
                                        onClick={(e) => handlePlayFirstTrack(e, album.first_track)}
                                        className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-95"
                                        title={isCurrentPackPlaying ? "Pause Track" : "Play First Track"}
                                    >
                                        {isCurrentPackPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                    </button>

                                    {/* View Details Button */}
                                    <Link 
                                        to={`/music-packs/${packSlug}`}
                                        className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-95"
                                        title="View Pack Details"
                                    >
                                        <Eye size={22} />
                                    </Link>
                                </div>
                                <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">
                                    {isCurrentPackPlaying ? 'Now Playing' : 'Preview Pack'}
                                </span>
                            </div>
                            
                            {/* Owned/PRO Badge */}
                            {hasAccess && (
                                <div className="absolute bottom-4 left-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white py-2 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    {isSubscriber && !isPurchased ? <Zap size={14} className="fill-white" /> : <CheckCircle2 size={14} />}
                                    <span className="font-black text-[10px] uppercase tracking-widest">{isSubscriber && !isPurchased ? 'PRO Access' : 'In Library'}</span>
                                </div>
                            )}

                            {/* Track Count Badge */}
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
    </div>
  );
};
