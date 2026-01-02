
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Album, MusicTrack } from '../types';
import { useStore } from '../store/useStore';
import { ShoppingCart, Disc, Play, Pause, Check, ArrowLeft, AlertTriangle, Sparkles, ArrowRight, CheckCircle2, Zap, Library, Download, Loader2 } from 'lucide-react';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { SEO } from '../components/SEO';
import { getIdFromSlug, createSlug } from '../utils/slugUtils';

export const MusicPackDetail: React.FC = () => {
  const { slug } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [relatedPacks, setRelatedPacks] = useState<Album[]>([]);
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, purchasedTracks, isSubscriber } = useStore();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingTrackId, setDownloadingTrackId] = useState<number | null>(null);
  const navigate = useNavigate();

  const LEMON_SQUEEZY_ICON = "https://cdn.simpleicons.org/lemonsqueezy";

  useEffect(() => {
    const id = getIdFromSlug(slug);

    if (id) {
      window.scrollTo(0, 0);

      const fetchData = async () => {
        setLoading(true);
        try {
            const { data: albumData, error: albumError } = await supabase
                .from('album')
                .select('*')
                .eq('id', id)
                .single();
            
            if (albumError) throw albumError;
            setAlbum(albumData);

            const { data: junctionData, error: junctionError } = await supabase
                .from('album_tracks')
                .select('track_id, track_order')
                .eq('album_id', id)
                .order('track_order', { ascending: true });

            if (junctionError) throw junctionError;

            if (junctionData && junctionData.length > 0) {
                const trackIds = junctionData.map(j => j.track_id);
                
                const { data: tracksData, error: tracksError } = await supabase
                    .from('squeeze_tracks')
                    .select('*')
                    .in('id', trackIds);

                if (tracksError) throw tracksError;

                if (tracksData) {
                    const sortedTracks = junctionData.map(j => 
                        tracksData.find(t => t.id === j.track_id)
                    ).filter(t => t !== undefined) as MusicTrack[];
                    
                    setTracks(sortedTracks);
                }
            } else {
                setTracks([]);
            }

            const { data: otherPacks } = await supabase
                .from('album')
                .select('*')
                .neq('id', id);
            
            if (otherPacks) {
                const shuffled = [...otherPacks].sort(() => 0.5 - Math.random());
                setRelatedPacks(shuffled.slice(0, 4));
            }

        } catch (err: any) {
            console.error("Error loading music pack:", err);
            setErrorMsg(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
      };
      fetchData();
    }
  }, [slug]);

  const handleBuy = () => {
    if (!album) return;
    
    const userId = session?.user?.id;
    if (!userId) {
      navigate('/auth');
      return;
    }
    
    if (!album.checkout_uuid) {
      alert("This pack is currently unavailable for purchase.");
      return;
    }

    const checkoutUrl = `https://pinegroove.lemonsqueezy.com/checkout/buy/${album.checkout_uuid}?embed=1&checkout[custom][user_id]=${userId}`;
    
    if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
        window.open(checkoutUrl, '_blank');
    }
  };

  const handleDownloadTrack = async (track: MusicTrack) => {
    if (!session) {
        navigate('/auth');
        return;
    }
    setDownloadingTrackId(track.id);
    try {
        const { data, error } = await supabase.functions.invoke('get-download-url', {
            body: { trackId: track.id }
        });

        if (error) throw error;

        if (data?.downloadUrl) {
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.setAttribute('download', `${track.title}.wav`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Unable to retrieve download URL. Please check your internet connection.");
        }
    } catch (err) {
        console.error("Download Error:", err);
        alert("An error occurred while preparing your download.");
    } finally {
        setDownloadingTrackId(null);
    }
  };

  if (loading) return <div className="p-20 text-center opacity-50">Loading album...</div>;
  if (errorMsg) return (
      <div className="p-20 text-center text-red-500 flex flex-col items-center">
          <AlertTriangle size={32} className="mb-2"/>
          <div>Error: {errorMsg}</div>
          <Link to="/music-packs" className="mt-4 underline">Back to Packs</Link>
      </div>
  );
  if (!album) return <div className="p-20 text-center opacity-50">Album not found.</div>;

  const isPurchased = purchasedTracks.some(p => p.album_id === album.id);
  const hasAccess = isPurchased || isSubscriber;

  const seoDescription = album.description 
    ? `Buy ${album.title} Music Pack. ${album.description.substring(0, 100)}...`
    : `Buy ${album.title}, a premium collection of royalty free music tracks by Francesco Biondi.`;

  const firstTrack = tracks.length > 0 ? tracks[0] : null;
  const isPlayingFirstTrack = firstTrack && currentTrack?.id === firstTrack.id && isPlaying;

  const handleAlbumPlay = () => {
    if (firstTrack) {
        playTrack(firstTrack);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
      <SEO title={album.title} description={seoDescription} image={album.cover_url} />

      <Link to="/music-packs" className="inline-flex items-center gap-2 opacity-60 hover:opacity-100 mb-8 transition-opacity">
        <ArrowLeft size={16} /> Back to Music Packs
      </Link>

      <div className="flex flex-col lg:flex-row gap-12 mb-16 items-start">
         
         <div 
            className="w-full lg:w-[400px] aspect-square rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 relative bg-zinc-200 dark:bg-zinc-800 group cursor-pointer"
            onClick={handleAlbumPlay}
         >
            <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
            
            <div className="absolute top-4 right-4 bg-sky-500 text-white font-bold px-4 py-2 rounded-full shadow-lg text-lg z-20">
                ${(album.price / 100).toFixed(2)}
            </div>

            {firstTrack && (
                <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 z-10 ${isPlayingFirstTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-lg transition-transform transform group-hover:scale-110">
                        {isPlayingFirstTrack ? (
                            <Pause size={40} className="text-white fill-white" />
                        ) : (
                            <Play size={40} className="text-white fill-white ml-2" />
                        )}
                    </div>
                </div>
            )}
         </div>

         <div className="flex-1 pt-4">
            <div className="flex items-center gap-2 text-sky-500 font-bold uppercase tracking-widest text-sm mb-4">
                <Disc size={18} /> Premium Music Pack
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">{album.title}</h1>
            
            {album.description && (
                <div className="text-lg opacity-80 mb-8 leading-relaxed max-w-2xl whitespace-pre-line">
                    {album.description}
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                {hasAccess ? (
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button 
                            onClick={() => navigate('/my-purchases')}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
                        >
                            {isSubscriber && !isPurchased ? <Zap /> : <CheckCircle2 />}
                            {isSubscriber && !isPurchased ? 'Download with PRO' : 'Purchased - In Your Library'}
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleBuy}
                        className="bg-sky-600 hover:bg-sky-500 text-white text-lg font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-sky-500/30 transition-all flex items-center gap-3 transform hover:-translate-y-1 group"
                    >
                        <div 
                          className="w-6 h-6 bg-white group-hover:bg-[#FFC233] transition-colors duration-300"
                          style={{
                            maskImage: `url(${LEMON_SQUEEZY_ICON})`,
                            WebkitMaskImage: `url(${LEMON_SQUEEZY_ICON})`,
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain'
                          }}
                        /> Buy Music Pack
                    </button>
                )}
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-sm opacity-70">
                <div className="flex items-center gap-2"><Check size={18} className="text-sky-500"/> One-time payment</div>
                <div className="flex items-center gap-2"><Check size={18} className="text-sky-500"/> 100% Royalty Free</div>
                <div className="flex items-center gap-2"><Check size={18} className="text-sky-500"/> WAV + MP3 Included</div>
                <div className="flex items-center gap-2"><Check size={18} className="text-sky-500"/> Commercial Use</div>
                <div className="flex items-center gap-2"><Check size={18} className="text-sky-500"/> YouTube Monetization</div>
                <div className="flex items-center gap-2"><Check size={18} className="text-sky-500"/> No Subscription</div>
            </div>
         </div>
      </div>

      <div className={`rounded-3xl p-6 md:p-10 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-gray-50'}`}>
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <span>Included Tracks</span>
            <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-full text-xs font-bold uppercase">{tracks.length} Tracks</span>
        </h3>
        
        {tracks.length === 0 ? (
            <div className="text-center opacity-50 py-10">No tracks linked to this album yet.</div>
        ) : (
            <div className="flex flex-col gap-2">
                {tracks.map((track, index) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const active = isCurrent && isPlaying;
                    const isDownloading = downloadingTrackId === track.id;
                    
                    return (
                        <div 
                            key={track.id}
                            className={`
                                flex items-center gap-4 p-3 rounded-xl transition-all
                                ${isDarkMode ? 'hover:bg-zinc-800' : 'bg-white border border-gray-100 hover:border-sky-200 hover:shadow-md'}
                                ${active ? 'ring-1 ring-sky-500 bg-sky-50 dark:bg-sky-900/20' : ''}
                            `}
                        >
                            <div className="hidden md:block w-8 text-center opacity-40 font-mono text-sm">{index + 1}</div>
                            
                            <div 
                                className="relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 group"
                                onClick={() => playTrack(track)}
                            >
                                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {active ? <Pause size={20} className="text-white"/> : <Play size={20} className="text-white ml-1"/>}
                                </div>
                            </div>

                            <div className="flex-1 md:flex-none md:w-64 min-w-0 px-2">
                                <Link to={`/track/${createSlug(track.id, track.title)}`} className={`font-bold text-lg truncate block ${active ? 'text-sky-600 dark:text-sky-400' : 'hover:text-sky-50'}`}>{track.title}</Link>
                                <div className="flex items-center gap-2">
                                    <Link 
                                        to={`/library?search=${encodeURIComponent(track.artist_name)}`} 
                                        className="text-sm opacity-60 truncate hover:underline hover:text-sky-500 transition-colors"
                                    >
                                        {track.artist_name}
                                    </Link>
                                </div>
                            </div>

                            <div className="hidden md:flex flex-1 h-10 items-center px-4 opacity-80">
                                <WaveformVisualizer track={track} height="h-8" barCount={100} />
                            </div>

                            <div className="hidden md:flex gap-2">
                                {Array.isArray(track.genre) ? (
                                    track.genre.slice(0, 2).map((g) => (
                                        <span key={g} className="text-[10px] px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 opacity-70 font-medium uppercase tracking-wide">{g}</span>
                                    ))
                                ) : track.genre ? (
                                    <span className="text-[10px] px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 opacity-70 font-medium uppercase tracking-wide">{track.genre}</span>
                                ) : null}
                            </div>

                            <div className="hidden md:block w-16 text-right font-mono text-sm opacity-50">
                                {track.duration ? `${Math.floor(track.duration / 60)}:${(Math.floor(track.duration % 60)).toString().padStart(2, '0')}` : '-'}
                            </div>

                            {hasAccess && (
                                <button 
                                    onClick={() => handleDownloadTrack(track)}
                                    disabled={isDownloading}
                                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    title="Download WAV"
                                >
                                    {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        )}
      </div>

      {relatedPacks.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200 dark:border-zinc-800">
             <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <Sparkles className="text-sky-500" size={24}/> Discover More Music Packs
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedPacks.map(pack => (
                     <div 
                        key={pack.id} 
                        className={`
                            group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full
                            ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-100 shadow-md'}
                        `}
                    >
                        <Link to={`/music-packs/${createSlug(pack.id, pack.title)}`} className="w-full aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 block">
                            <img 
                                src={pack.cover_url} 
                                alt={pack.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            />
                        </Link>

                        <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-bold text-lg mb-1 leading-tight group-hover:text-sky-500 transition-colors line-clamp-1">
                                <Link to={`/music-packs/${createSlug(pack.id, pack.title)}`}>{pack.title}</Link>
                            </h4>
                            
                            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                <div className="font-bold text-sky-600 dark:text-sky-400">
                                    ${(pack.price / 100).toFixed(2)}
                                </div>
                                
                                <Link 
                                    to={`/music-packs/${createSlug(pack.id, pack.title)}`}
                                    className={`p-2 rounded-full transition ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}
                                >
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
      )}
    </div>
  );
};
