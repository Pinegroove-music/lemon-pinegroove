
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { MusicTrack, Album } from '../types';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { Play, Pause, Clock, Music2, Calendar, FileText, Package, ArrowRight, Sparkles, ChevronDown, ChevronUp, Mic2, Download, FileBadge, Zap, CheckCircle2, Info, Loader2, ShoppingCart } from 'lucide-react';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { SEO } from '../components/SEO';
import { getIdFromSlug, createSlug } from '../utils/slugUtils';

type LicenseOption = 'standard' | 'extended' | 'pro';

export const TrackDetail: React.FC = () => {
  const { slug } = useParams();
  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [relatedAlbum, setRelatedAlbum] = useState<Album | null>(null);
  const [recommendations, setRecommendations] = useState<MusicTrack[]>([]);
  const { playTrack, currentTrack, isPlaying, isDarkMode, session, purchasedTracks } = useStore();
  const { isPro, openSubscriptionCheckout } = useSubscription();
  const [selectedLicense, setSelectedLicense] = useState<LicenseOption>('standard');
  const [downloadingWav, setDownloadingWav] = useState(false);
  const navigate = useNavigate();

  const PINEGROOVE_LOGO = "https://pub-2da555791ab446dd9afa8c2352f4f9ea.r2.dev/media/logo-pinegroove.svg";

  useEffect(() => {
    if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
    }
  }, [track]);

  useEffect(() => {
    const id = getIdFromSlug(slug);

    if (id) {
      window.scrollTo(0, 0); 
      
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

  const purchase = track ? purchasedTracks.find(p => p.track_id === track.id) : null;
  const isPurchased = !!purchase;
  const hasFullAccess = isPurchased || isPro;

  const handleDownloadMain = async () => {
    if (!track) return;
    
    if (hasFullAccess) {
        // Download High Quality WAV
        if (!session) {
            navigate('/auth');
            return;
        }
        setDownloadingWav(true);
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
            }
        } catch (err) {
            console.error("Download Error:", err);
            alert("An error occurred while fetching the download link.");
        } finally {
            setDownloadingWav(false);
        }
    } else {
        // Download MP3 Preview
        const link = document.createElement('a');
        link.href = track.mp3_url;
        link.setAttribute('download', `${track.title}_Preview.mp3`);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleAddToCart = () => {
    if (!track) return;
    if (!session?.user?.id) {
        navigate('/auth');
        return;
    }

    if (selectedLicense === 'pro') {
        openSubscriptionCheckout();
        return;
    }

    const variantId = selectedLicense === 'standard' ? track.variant_id_standard : track.variant_id_extended;
    if (!variantId) {
        alert("This license variant is currently unavailable for this track.");
        return;
    }

    const displayTitle = `${track.title} - ${selectedLicense === 'standard' ? 'Standard Sync License' : 'Extended Sync License'}`;
    const checkoutUrl = `https://pinegroove.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=${session.user.id}&checkout[custom][track_id]=${track.id}&checkout[custom][license_type]=${selectedLicense}&checkout[product_name]=${encodeURIComponent(displayTitle)}&checkout[product_description]=${encodeURIComponent(displayTitle)}&embed=1`;

    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.location.href = checkoutUrl;
    }
  };

  if (!track) return <div className="p-20 text-center opacity-50">Loading track details...</div>;

  const active = currentTrack?.id === track.id && isPlaying;
  
  // Checking specific license ownership for locking boxes
  const ownsStandard = isPurchased && purchase?.license_type?.toLowerCase().includes('standard');
  const ownsExtended = isPurchased && purchase?.license_type?.toLowerCase().includes('extended');

  const formatDescription = (desc: string | null) => {
    if (!desc) return null;
    return desc.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line}</p>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <SEO title={`${track.title} by ${track.artist_name}`} description={track.description?.substring(0, 150)} image={track.cover_url} />

        {/* Top Header Section */}
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
                    <span className="bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300 px-2 py-1 rounded">{(Array.isArray(track.genre) ? track.genre[0] : track.genre)}</span>
                    {track.bpm && <span className="flex items-center gap-1"><Music2 size={14}/> {track.bpm} BPM</span>}
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 tracking-tight">{track.title}</h1>
                <h2 className="text-2xl mb-6 font-medium">
                    <Link to={`/library?search=${encodeURIComponent(track.artist_name)}`} className="text-sky-600 dark:text-sky-400 hover:underline">
                        {track.artist_name}
                    </Link>
                </h2>

                <div className="h-32 w-full bg-zinc-50 dark:bg-zinc-900 rounded-xl mb-6 px-6 flex items-center gap-6 shadow-inner border border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => playTrack(track)} className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition hover:scale-105 shadow-md ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        {active ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                    </button>
                    <div className="flex-1 h-full flex items-center">
                        <WaveformVisualizer track={track} height="h-20" barCount={200} enableAnalysis={true} interactive={true} />
                    </div>
                </div>

                <button 
                    onClick={handleDownloadMain}
                    disabled={downloadingWav}
                    className={`w-full md:w-fit px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 ${hasFullAccess ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                >
                    {downloadingWav ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                    {hasFullAccess ? 'Download Track (WAV)' : 'Download Preview (MP3)'}
                </button>
            </div>
        </div>

        {/* Content Section: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Info & Details (7/12) */}
            <div className="lg:col-span-7 space-y-12">
                <section>
                    <h3 className="text-2xl font-black mb-6 border-b pb-2 border-sky-500/20">About this track</h3>
                    <div className="text-lg opacity-80 leading-relaxed">
                        {formatDescription(track.description)}
                    </div>
                </section>

                {/* Music Pack Card - Moved above Track Details, Tags, and Genres */}
                {relatedAlbum && (
                    <section>
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6 overflow-hidden relative group">
                            <div className="relative z-10 flex-1">
                                <div className="flex items-center gap-2 mb-2 opacity-90">
                                    <Package size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Music Pack</span>
                                </div>
                                <h4 className="font-bold text-xl mb-2">Included in: {relatedAlbum.title}</h4>
                                <p className="opacity-90 text-sm mb-4">Get this track plus many others and save by purchasing the complete bundle.</p>
                                <Link to={`/music-packs/${createSlug(relatedAlbum.id, relatedAlbum.title)}`} className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-2 rounded-full hover:bg-indigo-50 transition-colors shadow-sm text-sm">
                                    View Pack <ArrowRight size={16} />
                                </Link>
                            </div>
                            <img src={relatedAlbum.cover_url} alt="" className="w-24 h-24 rounded-lg object-cover shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500 shrink-0" />
                        </div>
                    </section>
                )}

                {/* Track Details Section - Positioned above Tags and Genres */}
                <section>
                    <h3 className="text-xl font-bold mb-6">Track Details</h3>
                    <div className={`p-6 rounded-2xl border space-y-4 text-sm ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
                        <DetailRow label="Duration" value={track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '-'} icon={<Clock size={16}/>} />
                        <DetailRow label="BPM" value={track.bpm} icon={<Music2 size={16}/>} />
                        <DetailRow label="Released" value={track.year} icon={<Calendar size={16}/>} />
                        <DetailRow label="ISRC" value={track.isrc} icon={<FileText size={16}/>} />
                        <DetailRow label="ISWC" value={track.iswc} icon={<FileText size={16}/>} />
                    </div>
                </section>

                {track.tags && Array.isArray(track.tags) && track.tags.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold mb-6">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {track.tags.map((tag: string, i: number) => (
                                <Link key={i} to={`/library?search=${encodeURIComponent(tag)}`} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}>
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {(Array.isArray(track.genre) ? track.genre : track.genre ? [track.genre] : []).length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold mb-4">Genres</h3>
                        <div className="flex flex-wrap gap-2">
                            {(Array.isArray(track.genre) ? track.genre : [track.genre as string]).map((g, i) => (
                                <Link key={i} to={`/library?search=${encodeURIComponent(g)}`} className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest bg-sky-500 text-white shadow-md hover:brightness-110">
                                    {g}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Right Column: Licensing Selection (5/12) */}
            <div className="lg:col-span-5 space-y-6">
                <h3 className="text-2xl font-black mb-6 border-b pb-2 border-sky-500/20">Select License</h3>
                
                <div className="space-y-4">
                    {/* Standard License Card */}
                    <LicenseCard 
                        id="standard"
                        title="Standard Sync License"
                        price="€9.99"
                        selected={selectedLicense === 'standard'}
                        locked={ownsStandard || ownsExtended || isPro}
                        onClick={() => setSelectedLicense('standard')}
                        features={[
                            "Web-based content, Social media, Podcasts",
                            "Personal and client projects",
                            "Educational projects, Charity films",
                            "Tutorials and online courses",
                            "Monetization of ONE (1) social channel"
                        ]}
                        infoLink="/user-license-agreement"
                        isDarkMode={isDarkMode}
                    />

                    {/* Extended License Card */}
                    <LicenseCard 
                        id="extended"
                        title="Extended Sync License"
                        price="€39.99"
                        selected={selectedLicense === 'extended'}
                        locked={ownsExtended || isPro}
                        onClick={() => setSelectedLicense('extended')}
                        features={[
                            "TV & Radio, Films, OTT / VOD",
                            "Advertising & Commercial campaigns",
                            "Video games & Interactive media",
                            "Mobile & Desktop applications",
                            "Industrial, Corporate & Institutional",
                            "Unlimited DVD / Blu-ray distribution",
                            "Monetization of Unlimited channels"
                        ]}
                        infoLink="/user-license-agreement"
                        isDarkMode={isDarkMode}
                    />

                    {/* PRO Subscription Card */}
                    <LicenseCard 
                        id="pro"
                        title="PRO Subscription"
                        price="€99/year"
                        selected={selectedLicense === 'pro'}
                        locked={isPro}
                        onClick={() => setSelectedLicense('pro')}
                        features={[
                            "Full access to ALL catalog content",
                            "Web & Social, Podcasts & Radio",
                            "TV, Film, Advertising & Games",
                            "OTT & VOD included",
                            "Includes all Extended license rights"
                        ]}
                        infoLink="/pricing"
                        highlight={true}
                        isDarkMode={isDarkMode}
                    />
                </div>

                <button 
                    onClick={handleAddToCart}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-2xl shadow-xl shadow-sky-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 text-xl mt-8"
                >
                    <ShoppingCart size={24} />
                    {selectedLicense === 'pro' ? 'Subscribe Now' : 'Add To Cart'}
                </button>
                
                <div className="space-y-4 mt-8">
                  <p className="text-center text-xs opacity-50 font-medium">
                      Secure transaction via Lemon Squeezy Merchant of Record.
                  </p>
                  
                  <div className={`p-4 rounded-xl border text-center ${isDarkMode ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-50 border-sky-100'}`}>
                    <p className="text-[10px] md:text-xs opacity-70 leading-relaxed font-medium">
                        By purchasing a license, you will receive a 44.1 kHz watermark-free .wav version of the track, downloadable at any time from your personal account area or from this page.
                    </p>
                  </div>
                </div>
            </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
            <div className="pt-12 mt-20 border-t border-gray-200 dark:border-zinc-800">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <Sparkles className="text-sky-500" size={24}/> You Might Also Like
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {recommendations.map(rec => {
                        const isRecPlaying = currentTrack?.id === rec.id && isPlaying;
                        return (
                            <div key={rec.id} className="group">
                                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 cursor-pointer shadow-md group-hover:shadow-xl transition-all" onClick={() => playTrack(rec)}>
                                    <img src={rec.cover_url} alt={rec.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isRecPlaying ? 'opacity-100' : ''}`}>
                                        {isRecPlaying ? <Pause className="text-white" size={32} /> : <Play className="text-white pl-1" size={32} />}
                                    </div>
                                </div>
                                <Link to={`/track/${createSlug(rec.id, rec.title)}`} className="block font-bold truncate hover:text-sky-500 transition-colors">{rec.title}</Link>
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

interface LicenseCardProps {
    id: LicenseOption;
    title: string;
    price: string;
    selected: boolean;
    locked: boolean;
    onClick: () => void;
    features: string[];
    infoLink: string;
    highlight?: boolean;
    isDarkMode: boolean;
}

const LicenseCard: React.FC<LicenseCardProps> = ({ title, price, selected, locked, onClick, features, infoLink, highlight, isDarkMode }) => {
    if (locked) {
        return (
            <div className={`relative p-6 rounded-2xl border-2 border-emerald-500/30 opacity-80 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-emerald-50/30'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-lg">{title}</h4>
                    <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2">License is active for this product</p>
                <Link to="/my-purchases" className="text-xs font-black uppercase tracking-widest text-sky-500 hover:underline">Go to My Purchases</Link>
            </div>
        );
    }

    return (
        <div 
            onClick={onClick}
            className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group
                ${selected 
                    ? (isDarkMode ? 'bg-sky-500/10 border-sky-500 shadow-xl shadow-sky-500/10 scale-[1.02]' : 'bg-sky-50 border-sky-500 shadow-xl shadow-sky-500/10 scale-[1.02]') 
                    : (isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600' : 'bg-white border-zinc-200 hover:border-zinc-300')}
                ${highlight && !selected ? 'ring-1 ring-amber-500/20' : ''}
            `}
        >
            {highlight && (
                <div className="absolute -top-3 right-4 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-lg">Best Value</div>
            )}
            
            <div className="flex items-center justify-between">
                <h4 className={`font-black text-lg leading-tight transition-colors duration-300 ${selected ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-900 dark:text-white'}`}>{title}</h4>
                <div className={`text-xl font-black transition-colors duration-300 ${selected ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-900 dark:text-white'}`}>{price}</div>
            </div>

            {selected && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <ul className="space-y-2 mb-4">
                        {features.map((f, i) => (
                            <li key={i} className="text-xs opacity-70 flex items-start gap-2">
                                <div className="mt-1 w-1 h-1 bg-current rounded-full shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    <Link 
                        to={infoLink} 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-sky-500 hover:underline group-hover:gap-2 transition-all"
                    >
                        More info <Info size={12} />
                    </Link>
                </div>
            )}
        </div>
    );
};
