
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { MusicTrack, SEOPlaylist, Album } from '../types';
import { useStore } from '../store/useStore';
import { SEO } from '../components/SEO';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { Play, Pause, Download, ShoppingCart, Loader2, ListMusic, Sparkles, Clock, Scissors, ArrowRight, Disc3, Disc } from 'lucide-react';
import { createSlug } from '../utils/slugUtils';

// Estendiamo il tipo MusicTrack per includere i dati dell'album caricati via join
interface TrackWithAlbum extends MusicTrack {
    album_tracks?: {
        album: Album;
    }[];
}

const getEditsCount = (cuts: any) => {
    if (!cuts) return 0;
    if (Array.isArray(cuts)) return cuts.length;
    if (typeof cuts === 'string') return cuts.split(',').filter(s => s.trim().length > 0).length;
    return 0;
};

const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PlaylistPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isDarkMode, playTrack, currentTrack, isPlaying, ownedTrackIds, session } = useStore();
  
  const [playlist, setPlaylist] = useState<SEOPlaylist | null>(null);
  const [tracks, setTracks] = useState<TrackWithAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [expandedTrackId, setExpandedTrackId] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    window.scrollTo(0, 0);
    fetchPlaylistData();
  }, [slug]);

  const fetchPlaylistData = async () => {
    setLoading(true);
    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from('seo_playlists')
        .select('*')
        .eq('slug', slug)
        .single();

      if (playlistError || !playlistData) throw playlistError;
      setPlaylist(playlistData);

      const tags = playlistData.category_tag;
      
      if (tags && Array.isArray(tags) && tags.length > 0) {
        const orConditions = tags.flatMap(tag => {
          const t = tag.trim();
          return [
            `genre.cs.["${t}"]`,
            `mood.cs.["${t}"]`,
            `media_theme.cs.["${t}"]`,
            `instrument.cs.["${t}"]`,
            `season.cs.["${t}"]`,
            `tags.cs.["${t}"]`
          ];
        }).join(',');

        // Query modificata per includere i dati dell'album tramite album_tracks
        const { data: tracksData, error: tracksError } = await supabase
          .from('squeeze_tracks')
          .select('*, album_tracks(album(*))')
          .or(orConditions);

        if (tracksError) throw tracksError;
        setTracks(tracksData || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (track: MusicTrack) => {
    if (!session) return;
    setDownloadingId(track.id);
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
      setDownloadingId(null);
    }
  };

  const jsonLd = useMemo(() => {
    if (!playlist || tracks.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "MusicPlaylist",
      "name": playlist.title,
      "description": playlist.description,
      "numTracks": tracks.length,
      "track": tracks.map((track, index) => ({
        "@type": "MusicRecording",
        "position": index + 1,
        "name": track.title,
        "byArtist": { "@type": "Person", "name": track.artist_name }
      }))
    };
  }, [playlist, tracks]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center opacity-50">
      <Loader2 className="animate-spin text-sky-500 mb-4" size={40} />
      <p className="font-bold uppercase tracking-widest text-xs">Curating your playlist...</p>
    </div>
  );

  if (!playlist) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Playlist not found</h2>
      <Link to="/library" className="text-sky-500 font-bold hover:underline">Back to Library</Link>
    </div>
  );

  return (
    <div className="pb-32">
      <SEO title={playlist.meta_title || playlist.title} description={playlist.meta_description || playlist.description} image={playlist.hero_image_url} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      {/* Hero Section */}
      <div className="relative pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={playlist.hero_image_url || "https://media.pinegroove.net/media/bg_pinegroove12.avif"} alt={playlist.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 backdrop-blur-md border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <ListMusic size={14} /> Curated Playlist
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight uppercase drop-shadow-2xl">{playlist.title}</h1>
          <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-sm">{playlist.description}</p>
        </div>
      </div>

      {/* Tracks List - Full Width Container */}
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 mt-12">
        <div className="flex items-center justify-between mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-500"><Sparkles size={24} /></div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Featured Tracks</h2>
          </div>
          <span className="text-xs font-bold opacity-40 uppercase tracking-widest">{tracks.length} recordings matched</span>
        </div>

        <div className="flex flex-col gap-4">
          {tracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const active = isCurrent && isPlaying;
            const hasAccess = ownedTrackIds.has(track.id);
            const editsCount = getEditsCount(track.edit_cuts);
            const primaryGenre = Array.isArray(track.genre) ? track.genre[0] : track.genre;
            
            // Estrazione album
            const linkedAlbum = track.album_tracks && track.album_tracks.length > 0 ? track.album_tracks[0].album : null;
            const isExpanded = expandedTrackId === track.id;

            return (
              <div key={track.id} className="flex flex-col gap-1">
                <div 
                    className={`
                    group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300
                    ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100 hover:shadow-xl hover:border-sky-100'}
                    ${active ? 'ring-1 ring-sky-500 shadow-xl shadow-sky-500/10' : ''}
                    ${isExpanded ? 'rounded-b-none border-b-0' : ''}
                    `}
                >
                    {/* 1. Play Button / Cover */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl overflow-hidden cursor-pointer" onClick={() => playTrack(track, tracks)}>
                    <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {active ? <Pause className="text-white fill-white animate-in zoom-in duration-200" size={32} /> : <Play className="text-white fill-white ml-1 animate-in zoom-in duration-200" size={32} />}
                    </div>
                    </div>

                    {/* 2. Info Block */}
                    <div className="flex-1 md:flex-none md:w-64 min-w-0">
                    <Link to={`/track/${createSlug(track.id, track.title)}`} className="font-bold text-base md:text-xl hover:text-sky-500 transition-colors truncate block leading-tight mb-1">{track.title}</Link>
                    <p className="text-xs md:text-sm opacity-50 font-medium truncate mb-2">{track.artist_name}</p>
                    
                    <div className="flex flex-wrap gap-1.5">
                        {primaryGenre && (
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${isDarkMode ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-50 text-sky-600 border border-sky-100'}`}>
                                {primaryGenre}
                            </span>
                        )}
                        {editsCount > 0 && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                <Scissors size={10} /> +{editsCount} EDITS
                            </span>
                        )}
                    </div>
                    </div>

                    {/* 3. Waveform (Desktop Only) */}
                    <div className="hidden lg:flex flex-1 h-14 items-center px-6">
                        <WaveformVisualizer 
                            track={track} 
                            height="h-10" 
                            barCount={160} 
                            interactive={true} 
                            enableAnalysis={active} 
                        />
                    </div>

                    {/* 4. Metadata & Actions */}
                    <div className="flex items-center gap-3 md:gap-4 lg:gap-6 shrink-0 ml-auto pr-2">
                    <div className="hidden sm:flex flex-col items-end opacity-40 font-mono text-[10px] md:text-xs">
                        <div className="flex items-center gap-1 font-bold">
                            <Clock size={12} /> {formatDuration(track.duration)}
                        </div>
                        {track.bpm && <div className="font-medium mt-0.5">{track.bpm} BPM</div>}
                    </div>

                    {/* NEW: Disc3 Icon for Music Packs (Desktop Only) */}
                    {linkedAlbum && (
                        <button 
                            onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
                            className={`hidden md:flex p-2.5 rounded-xl transition-all ${isExpanded ? 'bg-sky-500 text-white shadow-lg' : isDarkMode ? 'bg-zinc-800 text-sky-400 hover:bg-sky-500/10' : 'bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white'}`}
                            title="Included in Music Pack"
                        >
                            <Disc3 size={20} className={isExpanded ? 'animate-spin-slow' : ''} />
                        </button>
                    )}

                    {hasAccess ? (
                        <button 
                            onClick={() => handleDownload(track)} 
                            disabled={downloadingId === track.id} 
                            className="p-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            title="Download WAV"
                        >
                        {downloadingId === track.id ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                        </button>
                    ) : (
                        <Link 
                        to={`/track/${createSlug(track.id, track.title)}`} 
                        className={`p-3 rounded-full transition-all shadow-md active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10' : 'bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-500 hover:text-white'}`}
                        title="View Purchase Options"
                        >
                        <ShoppingCart size={20} />
                        </Link>
                    )}
                    </div>
                </div>

                {/* Expanded Section for Music Pack info */}
                {isExpanded && linkedAlbum && (
                    <div className={`
                        flex flex-col sm:flex-row items-center gap-6 p-6 rounded-b-2xl border-x border-b animate-in slide-in-from-top-4 duration-300
                        ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-sky-50/30 border-sky-100'}
                    `}>
                        <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-xl overflow-hidden shadow-2xl relative group">
                            <img src={linkedAlbum.cover_url} alt={linkedAlbum.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-sky-500/20 mix-blend-overlay"></div>
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <Disc className="text-sky-500" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Premium Music Pack Bundle</span>
                            </div>
                            <h4 className="text-lg md:text-xl font-black mb-2 tracking-tight">Included in "{linkedAlbum.title}"</h4>
                            <p className="text-sm opacity-70 max-w-2xl font-medium leading-relaxed">
                                This track is part of a curated collection. Save significantly by licensing the complete bundle instead of individual recordings.
                            </p>
                        </div>

                        <Link 
                            to={`/music-packs/${createSlug(linkedAlbum.id, linkedAlbum.title)}`}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap flex items-center gap-2"
                        >
                            View Bundle <ArrowRight size={18} />
                        </Link>
                    </div>
                )}
              </div>
            );
          })}
        </div>

        {tracks.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] opacity-30 italic flex flex-col items-center gap-4">
            <Sparkles size={48} />
            <p className="text-xl">No tracks currently match the theme of this collection.</p>
            <Link to="/library" className="not-italic font-black text-sky-500 hover:underline">Explore Full Library</Link>
          </div>
        )}

        <div className="mt-20 pt-16 border-t border-zinc-100 dark:border-zinc-800 text-center mb-10">
          <h3 className="text-3xl md:text-4xl font-black mb-8 uppercase tracking-tight">Discover More Sounds</h3>
          <Link 
            to="/library" 
            className="inline-flex items-center gap-3 bg-sky-600 hover:bg-sky-500 text-white font-black py-5 px-12 rounded-[2rem] shadow-2xl shadow-sky-500/20 transition-all transform hover:-translate-y-1 active:scale-95 text-lg"
          >
            Explore Complete Catalog <ArrowRight size={24} />
          </Link>
        </div>
      </div>

      <style>{`
        .animate-spin-slow {
            animation: spin 6s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
