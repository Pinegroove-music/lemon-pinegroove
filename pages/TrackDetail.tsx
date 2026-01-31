import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { MusicTrack, Album, Coupon, PricingItem } from '../types';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { Play, Pause, Clock, Music2, Calendar, FileText, Package, ArrowRight, Sparkles, ChevronDown, ChevronUp, Mic2, Download, FileBadge, Zap, CheckCircle2, Info, Loader2, ShoppingCart, Heart, Ticket, Copy, Check, Scissors, ListMusic, Megaphone, RotateCcw, Radio, X, AudioWaveform, Blend } from 'lucide-react';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { SEO } from '../components/SEO';
import { getIdFromSlug, createSlug } from '../utils/slugUtils';
import { FavoriteButton } from '../components/FavoriteButton';
import { ShareButton } from '../components/ShareButton';
import { TrackSchema } from '../components/TrackSchema';

type LicenseOption = 'standard' | 'extended' | 'pro';

const EDIT_DESCRIPTIONS: Record<string, string> = {
  '60s Edit': 'Optimized for Radio & TV spots',
  '30s Edit': 'Perfect for Standard Social Ads',
  'Loop': 'Seamlessly repeatable background',
  'Stinger': 'Ideal for Logo reveals & Branding'
};

const getEditIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('loop')) return <RotateCcw size={16} />;
  if (n.includes('60s') || n.includes('30s')) return <Scissors size={16} />;
  if (n.includes('stinger')) return <Megaphone size={16} />;
  return <Music2 size={16} />;
};

export const TrackDetail: React.FC = () => {
  const { slug } = useParams();
  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [relatedAlbum, setRelatedAlbum] = useState<Album | null>(null);
  const [recommendations, setRecommendations] = useState<MusicTrack[]>([]);
  const [pricingData, setPricingData] = useState<PricingItem[]>([]);
  const { playTrack, currentTrack, isPlaying, isDarkMode, session, purchasedTracks, ownedTrackIds } = useStore();
  const { isPro, openSubscriptionCheckout } = useSubscription();
  const [selectedLicense, setSelectedLicense] = useState<LicenseOption>('standard');
  const [downloadingWav, setDownloadingWav] = useState(false);
  
  const [trackCoupon, setTrackCoupon] = useState<Coupon | null>(null);
  const [proCoupon, setProCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // New: Lyrics Modal State
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  
  const navigate = useNavigate();

  const PINEGROOVE_LOGO = "https://media.pinegroove.net/media/logo-pinegroove.svg";

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
        
      supabase.from('pricing').select('*')
        .then(({ data: pData }) => {
            if (pData) setPricingData(pData as PricingItem[]);
        });

      supabase.from('coupons')
        .select('*')
        .in('id', ['1cc9b63f-7a17-46c7-99b8-2d05d1bcc883', '6237aa1b-f40c-41c2-aac5-070fb0a11ba7'])
        .eq('is_active', true)
        .then(({ data }) => {
            if (data) {
                const tC = data.find(c => String(c.id) === '1cc9b63f-7a17-46c7-99b8-2d05d1bcc883');
                const pC = data.find(c => String(c.id) === '6237aa1b-f40c-41c2-aac5-070fb0a11ba7');
                if (tC) setTrackCoupon(tC as Coupon);
                if (pC) setProCoupon(pC as Coupon);
            }
        });
    }
  }, [slug]);

  const getDynamicPrice = (type: string, defaultPrice: string) => {
    const item = pricingData.find(p => p.product_type === type);
    if (!item) return defaultPrice;
    return `${item.currency} ${item.price}${type === 'full_catalog' ? '/year' : ''}`;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadMain = async () => {
    if (!track) return;
    
    setDownloadingWav(true);
    try {
      if (ownedTrackIds.has(track.id) || isPro) {
          if (!session) {
              navigate('/auth');
              return;
          }
          const { data, error } = await supabase.functions.invoke('get-download-url', {
            body: { trackId: track.id }
          });
          if (error) throw error;
          if (data?.downloadUrl) {
              const response = await fetch(data.downloadUrl);
              const blob = await response.blob();
              const blobUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl; 
              const extension = track.wav_r2_key?.toLowerCase().endsWith('.zip') ? '.zip' : '.wav';
              link.setAttribute('download', `${track.title}${extension}`);
              document.body.appendChild(link); link.click(); 
              document.body.removeChild(link);
              window.URL.revokeObjectURL(blobUrl);
          }
      } else {
          const response = await fetch(track.mp3_url);
          if (!response.ok) throw new Error("Download failed");
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', `${track.title}_Preview.mp3`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
        console.error("Download Error:", err);
        alert("An error occurred while fetching the download.");
    } finally {
        setDownloadingWav(false);
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

  const editCuts = useMemo(() => {
    if (!track?.edit_cuts) return [];
    if (Array.isArray(track.edit_cuts)) return track.edit_cuts;
    if (typeof track.edit_cuts === 'string') return track.edit_cuts.split(',').map(s => s.trim());
    return [];
  }, [track?.edit_cuts]);

  const currentPriceLabel = useMemo(() => {
    if (selectedLicense === 'standard') return getDynamicPrice('single_track_standard', '€9.99');
    if (selectedLicense === 'extended') return getDynamicPrice('single_track_extended', '€39.99');
    return getDynamicPrice('full_catalog', '€99/year');
  }, [selectedLicense, pricingData]);

  if (!track) return <div className="p-20 text-center opacity-50">Loading track details...</div>;

  const purchase = track ? purchasedTracks.find(p => p.track_id === track.id) : null;
  const isPurchased = track ? ownedTrackIds.has(track.id) : false;
  const hasFullAccess = isPurchased || isPro;
  const active = currentTrack?.id === track.id && isPlaying;
  const ownsStandard = isPurchased && purchase?.license_type?.toLowerCase().includes('standard');
  const ownsExtended = isPurchased && purchase?.license_type?.toLowerCase().includes('extended');

  const formatDescription = (desc: string | null) => {
    if (!desc) return null;
    return desc.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line}</p>
    ));
  };

  const durationISO = track.duration ? `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S` : undefined;
  const hasCredits = track.credits && Array.isArray(track.credits) && (track.credits as any[]).length > 0;

  const currentFullUrl = `https://www.pinegroove.net/track/${slug}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <SEO 
          title={`${track.title} by ${track.artist_name}`} 
          description={track.description?.substring(0, 150)} 
          image={track.cover_url}
          type="music.song"
          trackData={{
            artist: track.artist_name,
            duration: durationISO,
            genre: Array.isArray(track.genre) ? track.genre[0] : (track.genre || undefined),
            datePublished: track.year?.toString()
          }}
        />
        <TrackSchema track={track} currentUrl={currentFullUrl} pricing={pricingData} />

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-12 items-start">
            <div className="w-full max-w-md md:w-80 lg:w-96 flex-shrink-0 aspect-square rounded-2xl overflow-hidden shadow-2xl relative group mx-auto md:mx-0">
                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                <button 
                    onClick={() => playTrack(track, [track, ...recommendations])}
                    className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
                        {active ? <Pause size={40} className="text-white"/> : <Play size={40} className="text-white ml-2"/>}
                    </div>
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center w-full">
                <div className="flex flex-wrap items-center gap-4 mb-2 opacity-70 text-sm font-bold uppercase tracking-wider">
                    <span className="bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300 px-2 py-1 rounded">{(Array.isArray(track.genre) ? track.genre[0] : track.genre)}</span>
                    {track.bpm && <span className="flex items-center gap-1"><Music2 size={14}/> {track.bpm} BPM</span>}
                    
                    {/* Badge Edit Aggiuntivi */}
                    {editCuts.length > 0 && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-500 ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            <Scissors size={12} /> +{editCuts.length} EDITS INCLUDED
                        </span>
                    )}
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 tracking-tight">{track.title}</h1>
                <h2 className="text-2xl mb-6 font-medium flex items-center gap-2 flex-wrap">
                    <Link to={`/library?search=${encodeURIComponent(track.artist_name)}`} className="text-sky-600 dark:text-sky-400 hover:underline">
                        {track.artist_name}
                    </Link>
                    {track.artist_ipi && (
                        <span className="text-lg opacity-40 font-medium whitespace-nowrap">
                            (IPI: {track.artist_ipi})
                        </span>
                    )}
                </h2>

                <div className={`h-32 w-full rounded-xl mb-6 px-6 flex items-center gap-6 shadow-inner border transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <button onClick={() => playTrack(track, [track, ...recommendations])} className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition hover:scale-105 shadow-sm ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        {active ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                    </button>
                    <div className="flex-1 h-full flex items-center">
                        <WaveformVisualizer track={track} height="h-20" barCount={200} enableAnalysis={true} interactive={true} />
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-fit">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={handleDownloadMain}
                            disabled={downloadingWav}
                            className={`
                                flex items-center justify-center gap-3 font-bold transition-all shadow-lg active:scale-95
                                rounded-full
                                h-14 md:h-auto
                                flex-1 md:flex-none
                                p-3 md:px-10 md:py-4
                                ${hasFullAccess ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}
                            `}
                            title={hasFullAccess ? "Download Full Version" : "Download Preview"}
                        >
                            {downloadingWav ? <Loader2 className="animate-spin" size={24} /> : <Download size={28} className="md:w-5 md:h-5" />}
                            <span className="hidden md:inline text-lg">
                                {hasFullAccess ? `Download ${track.wav_r2_key?.toLowerCase().endsWith('.zip') ? 'ZIP' : 'WAV'}` : 'Download Preview'}
                            </span>
                        </button>
                        
                        <div className={`p-1.5 rounded-full border shadow-lg transition-transform hover:scale-110 active:scale-90 flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                            <FavoriteButton trackId={track.id} size={28} />
                        </div>

                        <div className={`p-1.5 rounded-full border shadow-lg transition-transform hover:scale-110 active:scale-90 flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                            <ShareButton 
                                title={track.title} 
                                text={`Check out this track by ${track.artist_name} on Pinegroove!`}
                                url={`/track/${slug}`}
                                size={28}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-12">
                <section>
                    <h3 className="text-2xl font-black mb-6 border-b pb-2 border-sky-500/20">About this track</h3>
                    <div className="text-lg opacity-80 leading-relaxed">
                        {formatDescription(track.description)}
                    </div>
                    
                    {/* View Lyrics Button */}
                    {track.lyrics && (
                      <div className="mt-8">
                        <button 
                          onClick={() => setIsLyricsOpen(true)}
                          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700' : 'bg-white hover:bg-gray-50 text-zinc-800 border border-zinc-200 shadow-sm'}`}
                        >
                          <Mic2 size={20} className="text-sky-500" />
                          View Lyrics
                        </button>
                      </div>
                    )}
                </section>

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
                            <Link 
                                to={`/music-packs/${createSlug(relatedAlbum.id, relatedAlbum.title)}`}
                                className="w-24 h-24 rounded-lg overflow-hidden shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500 shrink-0 hover:scale-105 active:scale-95"
                            >
                                <img src={relatedAlbum.cover_url} alt="" className="w-full h-full object-cover" />
                            </Link>
                        </div>
                    </section>
                )}

                <section className="mb-8">
                    <h3 className="text-xl font-bold mb-6">Track Details</h3>
                    <div className={`p-6 rounded-2xl border space-y-4 text-sm ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
                        <DetailRow label="Duration" value={track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '-'} icon={<Clock size={16}/>} />
                        <DetailRow label="BPM" value={track.bpm} icon={<Music2 size={16}/>} />
                        <DetailRow label="Released" value={track.year} icon={<Calendar size={16}/>} />
                        <DetailRow label="ISRC" value={track.isrc} icon={<FileText size={16}/>} />
                        <DetailRow label="ISWC" value={track.iswc} icon={<FileText size={16}/>} />
                        <DetailRow label="Sample Rate" value="16-Bit, 44.1 kHz" icon={<AudioWaveform size={16}/>} />

                        {hasCredits && (
                            <div className="pt-4 mt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                                <h4 className="font-black mb-3 text-[10px] uppercase tracking-[0.15em] opacity-40">Additional Credits</h4>
                                <div className="space-y-2.5">
                                    {(track.credits as any[]).map((credit: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <Link 
                                                to={`/library?search=${encodeURIComponent(credit.name)}`}
                                                className="font-bold opacity-90 hover:text-sky-500 transition-colors"
                                            >
                                                {credit.name}
                                            </Link>
                                            <span className="opacity-40 italic">{credit.role}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {editCuts.length > 0 && (
                        <div className={`mt-4 p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-emerald-50/30 border-emerald-100 shadow-sm shadow-emerald-500/5'}`}>
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <ListMusic size={18} /> Additional Edits Included in your License:
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                                {editCuts.map((cut, idx) => (
                                    <div key={idx} className="flex items-start gap-4 animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className={`p-2 rounded-xl shrink-0 ${isDarkMode ? 'bg-zinc-800 text-sky-400' : 'bg-white text-sky-600 shadow-sm border border-sky-100'}`}>
                                            {getEditIcon(cut)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm leading-none mb-1">{cut}</p>
                                            <p className="text-xs opacity-60 font-medium">{EDIT_DESCRIPTIONS[cut] || 'Alternative version for flexible editing'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-6 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center">
                                    All versions are included in the high-quality ZIP file after purchase.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {track.tags && Array.isArray(track.tags) && track.tags.length > 0 && (
                    <section className="mb-8">
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
                    <section className="mb-8">
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

            <div className="lg:col-span-5 space-y-6">
                <h3 className="text-2xl font-black mb-6 border-b pb-2 border-sky-500/20">Select License</h3>
                
                <div className="space-y-4">
                    <LicenseCard 
                        id="standard"
                        title="Standard Sync License"
                        price={getDynamicPrice('single_track_standard', '€9.99')}
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
                        coupon={trackCoupon}
                        onCopyCoupon={handleCopyCode}
                        copiedCode={copiedCode}
                    />

                    <LicenseCard 
                        id="extended"
                        title="Extended Sync License"
                        price={getDynamicPrice('single_track_extended', '€39.99')}
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
                        coupon={trackCoupon}
                        onCopyCoupon={handleCopyCode}
                        copiedCode={copiedCode}
                    />

                    <LicenseCard 
                        id="pro"
                        title="PRO Subscription"
                        price={getDynamicPrice('full_catalog', '€99/year')}
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
                        coupon={proCoupon}
                        onCopyCoupon={handleCopyCode}
                        copiedCode={copiedCode}
                    />
                </div>

                <button 
                    onClick={handleAddToCart}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-2xl shadow-xl shadow-sky-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 text-xl mt-8"
                >
                    <ShoppingCart size={24} />
                    <span>
                        {selectedLicense === 'pro' ? 'Subscribe Now' : 'Buy Now'} • {currentPriceLabel}
                    </span>
                </button>
                
                <div className="space-y-4 mt-8">
                  <p className="text-center text-xs opacity-50 font-medium">
                      Secure transaction via Lemon Squeezy Merchant of Record.
                  </p>
                  
                  <div className={`p-4 rounded-xl border text-center ${isDarkMode ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-50 border-sky-100'}`}>
                    <p className="text-[10px] md:text-xs opacity-70 leading-relaxed font-medium">
                    By purchasing a license, you agree to our <a href="https://pinegroove.net/user-license-agreement" className="underline hover:opacity-100">Terms of Service</a> and our no-refund policy for digital products as detailed in the User License Agreement.
                    </p>
                  </div>
                </div>
            </div>
        </div>

        {recommendations.length > 0 && (
            <div className="pt-12 mt-20 border-t border-gray-200 dark:border-zinc-800">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <Blend className="text-sky-500" size={24}/> You Might Also Like
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {recommendations.map(rec => {
                        const isRecPlaying = currentTrack?.id === rec.id && isPlaying;
                        return (
                            <div key={rec.id} className="group">
                                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 cursor-pointer shadow-md group-hover:shadow-xl transition-all" onClick={() => playTrack(rec, [track, ...recommendations])}>
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

        {/* Lyrics Modal */}
        {isLyricsOpen && track.lyrics && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setIsLyricsOpen(false)}
            />
            
            <div className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2.5rem] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
              <div className="p-6 md:p-8 border-b border-zinc-500/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg">
                    <Mic2 className="text-sky-500" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">Lyrics</h2>
                    <p className="text-[10px] md:text-xs opacity-50 font-black uppercase tracking-widest">{track.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLyricsOpen(false)}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-zinc-500'}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
                <div className="text-lg md:text-2xl leading-relaxed whitespace-pre-line font-medium opacity-90 text-center italic font-serif">
                  {track.lyrics}
                </div>
              </div>

              <div className={`p-4 text-center border-t border-zinc-500/10 shrink-0 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
                  &copy; {track.year || new Date().getFullYear()} {track.artist_name} / Pinegroove
                </p>
              </div>
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
    coupon?: Coupon | null;
    onCopyCoupon?: (code: string) => void;
    copiedCode?: string | null;
}

const LicenseCard: React.FC<LicenseCardProps> = ({ id, title, price, selected, locked, onClick, features, infoLink, highlight, isDarkMode, coupon, onCopyCoupon, copiedCode }) => {
    // Usiamo costanti di colore fisse basate sullo stato per prevenire sovrascritture del browser
    const titleColor = selected 
        ? 'text-sky-500' 
        : (isDarkMode ? 'text-white' : 'text-zinc-900');
    
    const priceColor = selected 
        ? 'text-sky-500' 
        : (isDarkMode ? 'text-white' : 'text-zinc-900');

    if (locked) {
        return (
            <div className={`relative p-6 rounded-2xl border-2 border-emerald-500/30 opacity-80 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-emerald-50/30'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-lg text-zinc-900 dark:text-white">{title}</h4>
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
                <h4 className={`font-black text-lg leading-tight transition-colors duration-300 ${titleColor}`}>{title}</h4>
                <div className={`text-xl font-black transition-colors duration-300 ${priceColor}`}>{price}</div>
            </div>

            {selected && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <ul className="space-y-2 mb-4">
                        {features.map((f, i) => (
                            <li key={i} className="text-xs opacity-70 flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                                <div className="mt-1 w-1 h-1 bg-current rounded-full shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center justify-between mb-4">
                        <Link 
                            to={infoLink} 
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-sky-500 hover:underline group-hover:gap-2 transition-all"
                        >
                            More info <Info size={12} />
                        </Link>
                    </div>

                    {coupon && (
                      <div className={`mt-4 animate-in fade-in slide-in-from-top-4 duration-500 p-4 rounded-xl border flex items-center gap-4 transition-all shadow-lg ${id === 'pro' ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-amber-950 border-amber-300/50' : 'bg-gradient-to-br from-purple-600 via-indigo-700 to-purple-800 text-white border-white/10'}`}>
                        <div className={`p-2 rounded-xl backdrop-blur-md ${id === 'pro' ? 'bg-black/10' : 'bg-white/10'}`}>
                          {id === 'pro' ? <Zap className="text-amber-900" size={18} /> : <Ticket className="text-purple-200" size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs font-bold leading-snug">
                            Save {coupon.discount_percent}% with code: <span className={`font-black tracking-widest ${id === 'pro' ? 'text-amber-950' : 'text-purple-200'}`}>{coupon.discount_code}</span>
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onCopyCoupon?.(coupon.discount_code); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${copiedCode === coupon.discount_code ? 'bg-emerald-500 text-white shadow-md' : (id === 'pro' ? 'bg-black/10 hover:bg-black/20 text-amber-950 border border-black/10' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20')}`}
                        >
                          {copiedCode === coupon.discount_code ? <Check size={12} /> : <Copy size={12} />}
                          {copiedCode === coupon.discount_code ? 'COPIED' : 'COPY'}
                        </button>
                      </div>
                    )}
                </div>
            )}
        </div>
    );
};