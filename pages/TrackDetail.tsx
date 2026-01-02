
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { MusicTrack, Album } from '../types';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { Play, Pause, Clock, Music2, Calendar, FileText, Package, ArrowRight, Sparkles, ChevronDown, ChevronUp, Mic2, CreditCard, Download, FileBadge, Zap } from 'lucide-react';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { SEO } from '../components/SEO';
import { getIdFromSlug, createSlug } from '../utils/slugUtils';

export const TrackDetail: React.FC = () => {
  const { slug } = useParams();
  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [relatedAlbum, setRelatedAlbum] = useState<Album | null>(null);
  const [recommendations, setRecommendations] = useState<MusicTrack[]>([]);
  const { playTrack, currentTrack, isPlaying, isDarkMode, session, purchasedTracks } = useStore();
  const { isPro, openSubscriptionCheckout } = useSubscription();
  const [showLyrics, setShowLyrics] = useState(false);
  const navigate = useNavigate();

  const PINEGROOVE_LOGO = "https://pub-2da555791ab446dd9afa8c2352f4f9ea.r2.dev/media/logo-pinegroove.svg";
  const LEMON_SQUEEZY_ICON = "https://cdn.simpleicons.org/lemonsqueezy";

  useEffect(() => {
    if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
    }
  }, [track]);

  useEffect(() => {
    const id = getIdFromSlug(slug);

    if (id) {
      window.scrollTo(0, 0); 
      setShowLyrics(false); 
      
      supabase.from('squeeze_tracks').select('*').eq('id', id).single()
        .then(({ data: trackData }) => {
          if (trackData) {
            setTrack(trackData);

            supabase
                .from('album_tracks')
                .select('album(*)')
                .eq('track_id', trackData.id)
                .maybeSingle()
                .then(({ data: albumData }) => {
                    if (albumData && albumData.album) {
                        setRelatedAlbum(albumData.album as unknown as Album);
                    } else {
                        setRelatedAlbum(null);
                    }
                });

            supabase.from('squeeze_tracks').select('*').neq('id', trackData.id).limit(50)
                .then(({ data: allOtherTracks }) => {
                    if (allOtherTracks) {
                        let scored = allOtherTracks.map(t => {
                            let score = 0;
                            if (trackData.genre && t.genre) {
                                const intersection = (trackData.genre as string[]).filter((g:string) => (t.genre as string[]).includes(g));
                                score += intersection.length * 2;
                            }
                            if (trackData.mood && t.mood) {
                                const intersection = (trackData.mood as string[]).filter((m:string) => (t.mood as string[]).includes(m));
                                score += intersection.length;
                            }
                            return { track: t, score };
                        });
                        
                        scored.sort((a, b) => b.score - a.score);
                        setRecommendations(scored.slice(0, 4).map(s => s.track));
                    }
                });
          }
        });
    }
  }, [slug]);

  const handleDownload = async () => {
    if (!track || !session) {
      navigate('/auth');
      return;
    }
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
          alert("Unable to retrieve download URL. Please ensure you have an active license.");
        }
    } catch (err) {
        console.error("Download Error:", err);
        alert("An error occurred while fetching the download link.");
    }
  };

  const handlePurchase = (checkoutUuid: string | null, userId: string) => {
    if (!checkoutUuid) return;
    const checkoutUrl = `https://pinegroove.lemonsqueezy.com/checkout/buy/${checkoutUuid}?embed=1&checkout[custom][user_id]=${userId}`;

    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.location.href = checkoutUrl;
    }
  };

  if (!track) return <div className="p-20 text-center opacity-50">Loading track details...</div>;

  const active = currentTrack?.id === track.id && isPlaying;
  
  const purchase = purchasedTracks.find(p => p.track_id === track.id);
  const isPurchased = !!purchase;
  const hasAccess = isPurchased || isPro;

  const rawLicense = purchase?.license_type || (isPro ? 'pro subscription' : 'standard');
  const isExtended = rawLicense.toLowerCase().includes('extended');
  const licenseDisplay = isExtended ? 'Extended' : (isPro ? 'Pro Subscription' : 'Standard');

  const formatDescription = (desc: string | null) => {
    if (!desc) return null;
    return desc.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line}</p>
    ));
  };

  const seoTitle = `${track.title} by ${track.artist_name}`;
  const seoDescription = track.description?.substring(0, 150) || "Pinegroove Premium Audio";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 pb-32">
        <SEO title={seoTitle} description={seoDescription} image={track.cover_url} />

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-12 items-start">
            
            <div className="w-full max-w-md md:w-80 lg:w-96 flex-shrink-0 aspect-square rounded-2xl overflow-hidden shadow-2xl relative group mx-auto md:mx-0">
                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                <button 
                    onClick={() => playTrack(track)}
                    className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
                        {active ? <Pause size={40} className="text-white"/> : <Play size={40} className="text-white ml-2"/>}
                    </div>
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center w-full">
                <div className="flex items-center gap-4 mb-2 opacity-70 text-sm font-bold uppercase tracking-wider">
                    <span className="bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300 px-2 py-1 rounded">{(track.genre as string[])?.[0]}</span>
                    {track.bpm && <span className="flex items-center gap-1"><Music2 size={14}/> {track.bpm} BPM</span>}
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 tracking-tight">{track.title}</h1>
                
                <h2 className="text-2xl mb-6 font-medium">
                    <Link 
                        to={`/library?search=${encodeURIComponent(track.artist_name)}`} 
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-500 hover:underline transition-colors opacity-90"
                    >
                        {track.artist_name}
                    </Link>
                </h2>

                <div className="h-32 w-full bg-zinc-50 dark:bg-zinc-900 rounded-xl mb-8 px-6 flex items-center gap-6 shadow-inner border border-zinc-200 dark:border-zinc-800">
                    <button 
                        onClick={() => playTrack(track)}
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition hover:scale-105 shadow-md ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                    >
                        {active ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                    </button>

                    <div className="flex-1 h-full flex items-center">
                        <WaveformVisualizer 
                            track={track} 
                            height="h-20" 
                            barCount={200} 
                            enableAnalysis={true} 
                            interactive={true}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {hasAccess ? (
                        <button 
                            onClick={handleDownload}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 text-white text-lg font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Download /> Download WAV
                        </button>
                    ) : (
                        <div className="flex-1 flex flex-col sm:flex-row gap-4">
                            {!session ? (
                                <button 
                                    onClick={() => navigate('/auth')}
                                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 px-6 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 group"
                                >
                                    <div 
                                      className="w-5 h-5 bg-white group-hover:bg-[#FFC233] transition-colors duration-300"
                                      style={{
                                        maskImage: `url(${LEMON_SQUEEZY_ICON})`,
                                        WebkitMaskImage: `url(${LEMON_SQUEEZY_ICON})`,
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskSize: 'contain',
                                        WebkitMaskSize: 'contain'
                                      }}
                                    /> Log in to Buy License
                                </button>
                            ) : (
                                <>
                                  <button 
                                      onClick={() => handlePurchase(track.checkout_uuid, session.user.id)}
                                      className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 px-6 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 group"
                                  >
                                      <div 
                                        className="w-5 h-5 bg-white group-hover:bg-[#FFC233] transition-colors duration-300"
                                        style={{
                                          maskImage: `url(${LEMON_SQUEEZY_ICON})`,
                                          WebkitMaskImage: `url(${LEMON_SQUEEZY_ICON})`,
                                          maskRepeat: 'no-repeat',
                                          WebkitMaskRepeat: 'no-repeat',
                                          maskSize: 'contain',
                                          WebkitMaskSize: 'contain'
                                        }}
                                      /> Buy Single License
                                  </button>
                                  <button 
                                      onClick={openSubscriptionCheckout}
                                      className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-bold py-4 px-6 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                                  >
                                      <Zap size={20} /> Subscribe to Pro
                                  </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-12 mb-20">
            <div className="md:col-span-2">
                <h3 className="text-xl font-bold mb-4 border-b pb-2 border-sky-500/30 inline-block">About this track</h3>
                <div className="prose dark:prose-invert opacity-90 leading-relaxed mb-8">
                    {formatDescription(track.description)}
                </div>

                <div className={`${hasAccess ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800'} p-8 rounded-2xl border mb-8 relative overflow-hidden group`}>
                    <img 
                      src={PINEGROOVE_LOGO} 
                      className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 transform -rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-500" 
                      alt="" 
                    />

                    <div className="relative z-10">
                        {hasAccess ? (
                            <>
                                <h4 className="font-bold text-xl mb-3 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                    <FileBadge size={24} />
                                    {licenseDisplay} License active for this track
                                </h4>
                                <p className="opacity-80 mb-6 max-w-lg">You have access to this track via {isPro ? 'Pro Subscription' : 'purchase'}. You can download the high-quality WAV file below.</p>
                                <button 
                                    onClick={handleDownload}
                                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                >
                                    Download high-quality WAV <Download size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <h4 className="font-bold text-xl mb-3">Unlock this track</h4>
                                <p className="opacity-80 mb-6 max-w-lg">Acquire a royalty-free license to use this music in your video projects, podcasts, or commercial works. Secure transaction via Lemon Squeezy.</p>
                                <div className="flex flex-wrap gap-4">
                                    {!session ? (
                                        <button 
                                            onClick={() => navigate('/auth')}
                                            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 group"
                                        >
                                            <div 
                                              className="w-5 h-5 bg-white group-hover:bg-[#FFC233] transition-colors duration-300"
                                              style={{
                                                maskImage: `url(${LEMON_SQUEEZY_ICON})`,
                                                WebkitMaskImage: `url(${LEMON_SQUEEZY_ICON})`,
                                                maskRepeat: 'no-repeat',
                                                WebkitMaskRepeat: 'no-repeat',
                                                maskSize: 'contain',
                                                WebkitMaskSize: 'contain'
                                              }}
                                            /> Log in to Buy <ArrowRight size={18} />
                                        </button>
                                    ) : (
                                        <>
                                          <button 
                                              onClick={() => handlePurchase(track.checkout_uuid, session.user.id)}
                                              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 group"
                                          >
                                              <div 
                                                className="w-5 h-5 bg-white group-hover:bg-[#FFC233] transition-colors duration-300"
                                                style={{
                                                  maskImage: `url(${LEMON_SQUEEZY_ICON})`,
                                                  WebkitMaskImage: `url(${LEMON_SQUEEZY_ICON})`,
                                                  maskRepeat: 'no-repeat',
                                                  WebkitMaskRepeat: 'no-repeat',
                                                  maskSize: 'contain',
                                                  WebkitMaskSize: 'contain'
                                                }}
                                              /> Buy License <ArrowRight size={18} />
                                          </button>
                                          <button 
                                              onClick={openSubscriptionCheckout}
                                              className="inline-flex items-center gap-2 bg-zinc-800 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                          >
                                              Abbonati a Pro <Zap size={18} />
                                          </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {track.lyrics && (
                    <div className={`mb-8 rounded-xl border transition-all overflow-hidden ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
                        <button 
                            onClick={() => setShowLyrics(!showLyrics)}
                            className="w-full flex items-center justify-between p-5 font-bold text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                                <Mic2 size={20} /> Song Lyrics
                            </span>
                            {showLyrics ? <ChevronUp size={20} className="opacity-50"/> : <ChevronDown size={20} className="opacity-50"/>}
                        </button>
                        
                        {showLyrics && (
                            <div className="p-6 pt-0 border-t border-dashed border-gray-200 dark:border-zinc-800 mt-2">
                                <div className="italic text-lg leading-relaxed opacity-80 whitespace-pre-line font-serif pt-4">
                                    {track.lyrics}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {relatedAlbum && (
                    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl relative overflow-hidden group flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative z-10 flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 opacity-90">
                                <Package size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">Music Pack</span>
                            </div>
                            <h4 className="font-bold text-xl mb-2">This track is included in the {relatedAlbum.title}</h4>
                            <p className="opacity-90 text-sm mb-5 leading-relaxed">
                                Get this track plus many others and save money by purchasing the complete bundle.
                            </p>
                            
                            <Link 
                                to={`/music-packs/${createSlug(relatedAlbum.id, relatedAlbum.title)}`}
                                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-full hover:bg-indigo-50 transition-colors shadow-sm"
                            >
                                View Music Pack <ArrowRight size={16} />
                            </Link>
                        </div>
                        
                        <div className="relative z-10 flex-shrink-0">
                            <img 
                                src={relatedAlbum.cover_url} 
                                alt={relatedAlbum.title} 
                                className="w-32 h-32 rounded-lg object-cover shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500 border-2 border-white/20" 
                            />
                        </div>
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                    <h3 className="text-lg font-bold mb-6">Track Details</h3>
                    
                    <div className="space-y-4 text-sm">
                        <DetailRow label="Duration" value={track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '-'} icon={<Clock size={16}/>} />
                        <DetailRow label="BPM" value={track.bpm} icon={<Music2 size={16}/>} />
                        <DetailRow label="Released" value={track.year} icon={<Calendar size={16}/>} />
                        <DetailRow label="ISRC" value={track.isrc} icon={<FileText size={16}/>} />
                        <DetailRow label="ISWC" value={track.iswc} icon={<FileText size={16}/>} />
                        
                        {track.credits && Array.isArray(track.credits) && track.credits.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-zinc-700">
                                <h4 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-80">Credits</h4>
                                <div className="space-y-2">
                                    {track.credits.map((credit: any, i: number) => (
                                        <div key={i} className="text-sm">
                                            <Link 
                                                to={`/library?search=${encodeURIComponent(credit.name)}`}
                                                className="font-semibold opacity-90 hover:text-sky-500 hover:underline transition-colors"
                                            >
                                                {credit.name}
                                            </Link>
                                            <span className="opacity-50 mx-1">—</span>
                                            <span className="opacity-70">{credit.role}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {track.tags && Array.isArray(track.tags) && track.tags.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-zinc-700">
                                <h4 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-80">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {track.tags.map((tag: string, i: number) => (
                                        <Link 
                                            key={i}
                                            to={`/library?search=${encodeURIComponent(tag)}`}
                                            className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-sky-100 dark:hover:bg-sky-900/30 text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-300 px-2.5 py-1 rounded-md transition-colors"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(Array.isArray(track.genre) ? track.genre : track.genre ? [track.genre] : []).length > 0 && (
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-zinc-700">
                                <h4 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-80">Genres</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(track.genre) ? track.genre : [track.genre as string]).map((g, i) => (
                                        <Link 
                                            key={i}
                                            to={`/library?search=${encodeURIComponent(g)}`}
                                            className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-sky-100 dark:hover:bg-sky-900/30 text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-300 px-2.5 py-1 rounded-md transition-colors"
                                        >
                                            {g}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {recommendations.length > 0 && (
            <div className="pt-12 border-t border-gray-200 dark:border-zinc-800">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <Sparkles className="text-sky-500" size={24}/> You Might Also Like
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {recommendations.map(rec => {
                        const isRecPlaying = currentTrack?.id === rec.id && isPlaying;
                        return (
                            <div key={rec.id} className="group">
                                <div 
                                    className="relative aspect-square rounded-xl overflow-hidden mb-3 cursor-pointer shadow-md group-hover:shadow-xl transition-all"
                                    onClick={() => playTrack(rec)}
                                >
                                    <img 
                                        src={rec.cover_url} 
                                        alt={rec.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isRecPlaying ? 'opacity-100' : ''}`}>
                                        {isRecPlaying ? <Pause className="text-white" size={32} /> : <Play className="text-white pl-1" size={32} />}
                                    </div>
                                </div>
                                
                                <Link to={`/track/${createSlug(rec.id, rec.title)}`} className="block font-bold truncate hover:text-sky-500 transition-colors">
                                    {rec.title}
                                </Link>
                                <div className="text-sm opacity-60 truncate">{rec.artist_name}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string, value: any, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 opacity-60">
            {icon} <span>{label}</span>
        </div>
        <div className="font-mono font-medium">{value || 'N/A'}</div>
    </div>
);
