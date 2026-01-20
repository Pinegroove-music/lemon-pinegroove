
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Album, MusicTrack, Coupon, PricingItem } from '../types';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { ShoppingCart, Disc, Play, Pause, Check, ArrowLeft, AlertTriangle, Sparkles, ArrowRight, CheckCircle2, Zap, Library, Download, Loader2, Info, Ticket, Copy, Scissors, Share2 } from 'lucide-react';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { SEO } from '../components/SEO';
import { getIdFromSlug, createSlug } from '../utils/slugUtils';
import { ShareButton } from '../components/ShareButton';

type LicenseOption = 'standard' | 'extended' | 'pro';

const getEditsCount = (cuts: any) => {
    if (!cuts) return 0;
    if (Array.isArray(cuts)) return cuts.length;
    if (typeof cuts === 'string') return cuts.split(',').filter(s => s.trim().length > 0).length;
    return 0;
};

export const MusicPackDetail: React.FC = () => {
  const { slug } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [relatedPacks, setRelatedPacks] = useState<Album[]>([]);
  const [pricingData, setPricingData] = useState<PricingItem[]>([]);
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, purchasedTracks, isSubscriber, ownedTrackIds } = useStore();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingTrackId, setDownloadingTrackId] = useState<number | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<LicenseOption>('standard');
  
  const [packCoupon, setPackCoupon] = useState<Coupon | null>(null);
  const [proCoupon, setProCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const { isPro, openSubscriptionCheckout } = useSubscription();

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

            const { data: pData } = await supabase
                .from('pricing')
                .select('*');
            if (pData) setPricingData(pData as PricingItem[]);

            const { data: couponsData } = await supabase
              .from('coupons')
              .select('*')
              .in('id', ['1f77183d-462e-4ff6-bef0-25e440ba5d9a', '6237aa1b-f40c-41c2-aac5-070fb0a11ba7'])
              .eq('is_active', true);
            
            if (couponsData) {
                const pC = couponsData.find(c => String(c.id) === '1f77183d-462e-4ff6-bef0-25e440ba5d9a');
                const subC = couponsData.find(c => String(c.id) === '6237aa1b-f40c-41c2-aac5-070fb0a11ba7');
                if (pC) setPackCoupon(pC as Coupon);
                if (subC) setProCoupon(subC as Coupon);
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

  const handleAddToCart = () => {
    if (!album) return;
    if (!session?.user?.id) {
      navigate('/auth');
      return;
    }

    if (selectedLicense === 'pro') {
        openSubscriptionCheckout();
        return;
    }
    
    const variantId = selectedLicense === 'standard' ? album.variant_id_standard : album.variant_id_extended;
    if (!variantId) {
      alert("This license variant is currently unavailable for this pack.");
      return;
    }

    const checkoutUrl = `https://pinegroove.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=${session.user.id}&checkout[custom][license_type]=${selectedLicense}&checkout[custom][album_id]=${album.id}&embed=1`;
    
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

  const purchase = purchasedTracks.find(p => p.album_id === album.id);
  const isPurchased = !!purchase;
  const hasAccess = isPurchased || isPro;
  const firstTrack = tracks.length > 0 ? tracks[0] : null;
  const isPlayingFirstTrack = firstTrack && currentTrack?.id === firstTrack.id && isPlaying;
  const ownsStandard = isPurchased && purchase?.license_type?.toLowerCase().includes('standard');
  const ownsExtended = isPurchased && purchase?.license_type?.toLowerCase().includes('extended');

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      <SEO 
        title={album.title} 
        description={album.description || ''} 
        image={album.cover_url}
        type="music.album"
        albumData={{
            artist: "Francesco Biondi",
            numTracks: tracks.length,
            genre: tracks.length > 0 ? (Array.isArray(tracks[0].genre) ? tracks[0].genre[0] : (tracks[0].genre || undefined)) : undefined
        }}
      />

      <div className="flex items-center justify-between mb-8">
        <Link to="/music-packs" className="inline-flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <ArrowLeft size={16} /> Back to Music Packs
        </Link>
        <ShareButton 
            title={album.title}
            text={`Check out this music pack "${album.title}" on Pinegroove!`}
            url={`/music-packs/${slug}`}
            size={20}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-16 items-start">
         <div 
            className="w-full max-w-md md:w-80 lg:w-96 aspect-square rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 relative bg-zinc-200 dark:bg-zinc-800 group cursor-pointer"
            onClick={() => firstTrack && playTrack(firstTrack)}
         >
            <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 z-10 ${isPlayingFirstTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
                    {isPlayingFirstTrack ? <Pause size={40} className="text-white"/> : <Play size={40} className="text-white ml-2"/>}
                </div>
            </div>
         </div>

         <div className="flex-1 pt-4">
            <div className="flex items-center gap-2 text-sky-500 font-bold uppercase tracking-widest text-sm mb-4">
                <Disc size={18} /> Premium Music Pack
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight tracking-tight">{album.title}</h1>
            
            {album.description && (
                <div className="text-lg opacity-80 mb-8 leading-relaxed max-w-2xl whitespace-pre-line">
                    {album.description}
                </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-8">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 border-b pb-2 border-sky-500/20">
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
                        const hasTrackAccess = ownedTrackIds.has(track.id) || isPro;
                        const editsCount = getEditsCount(track.edit_cuts);
                        
                        return (
                            <div 
                                key={track.id}
                                className={`
                                    flex items-center gap-4 p-3 rounded-xl transition-all duration-300
                                    ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border border-gray-100 hover:border-sky-200 hover:shadow-md'}
                                    ${active ? `ring-1 ring-sky-500 ${isDarkMode ? 'bg-sky-900/20' : 'bg-sky-50'}` : ''}
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
                                    <Link to={`/track/${createSlug(track.id, track.title)}`} className={`font-bold text-lg truncate block ${active ? 'text-sky-600 dark:text-sky-400' : 'hover:text-sky-500 transition-colors'}`}>{track.title}</Link>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link 
                                            to={`/library?search=${encodeURIComponent(track.artist_name)}`} 
                                            className="text-sm opacity-60 truncate hover:underline hover:text-sky-500 transition-colors"
                                        >
                                            {track.artist_name}
                                        </Link>
                                        {editsCount > 0 && (
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                                <Scissors size={8} /> +{editsCount} EDITS
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-1 h-10 items-center px-4 opacity-80">
                                    <WaveformVisualizer track={track} height="h-8" barCount={100} enableAnalysis={active} />
                                </div>

                                <div className="hidden md:block w-16 text-right font-mono text-sm opacity-50">
                                    {track.duration ? `${Math.floor(track.duration / 60)}:${(Math.floor(track.duration % 60)).toString().padStart(2, '0')}` : '-'}
                                </div>

                                {hasTrackAccess && (
                                    <button 
                                        onClick={() => handleDownloadTrack(track)}
                                        disabled={isDownloading}
                                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                                        title="Download"
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

          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-2xl font-black mb-6 border-b pb-2 border-sky-500/20">Select License</h3>
            
            <div className="space-y-4">
                <LicenseCard 
                    id="standard"
                    title="Standard Pack License"
                    price={getDynamicPrice('music_pack_standard', '€49.99')}
                    selected={selectedLicense === 'standard'}
                    locked={ownsStandard || ownsExtended || isPro}
                    onClick={() => setSelectedLicense('standard')}
                    features={[
                        "Includes all tracks in the pack",
                        "Web, Social Media & Podcasts",
                        "Personal & client projects",
                        "Educational & Charity films",
                        "Monetization of 1 social channel"
                    ]}
                    infoLink="/user-license-agreement"
                    isDarkMode={isDarkMode}
                    coupon={packCoupon}
                    onCopyCoupon={handleCopyCode}
                    copiedCode={copiedCode}
                />

                <LicenseCard 
                    id="extended"
                    title="Extended Pack License"
                    price={getDynamicPrice('music_pack_extended', '€69.99')}
                    selected={selectedLicense === 'extended'}
                    locked={ownsExtended || isPro}
                    onClick={() => setSelectedLicense('extended')}
                    features={[
                        "TV, Radio, Films & OTT/VOD",
                        "Advertising & Commercial use",
                        "Video games & Mobile apps",
                        "Industrial & Corporate use",
                        "Monetization of Unlimited channels"
                    ]}
                    infoLink="/user-license-agreement"
                    isDarkMode={isDarkMode}
                    coupon={packCoupon}
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
                        "Includes all Extended license rights",
                        "TV, Film, Ads & Games included",
                        "Instant high-quality downloads"
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
                {selectedLicense === 'pro' ? 'Subscribe Now' : 'Buy Now'}
            </button>
            
            <div className="space-y-4 mt-8">
              <p className="text-center text-xs opacity-50 font-medium">
                  Secure transaction via Lemon Squeezy Merchant of Record.
              </p>
              
              <div className={`p-4 rounded-xl border text-center ${isDarkMode ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-50 border-sky-100'}`}>
                <p className="text-[10px] md:text-xs opacity-70 leading-relaxed font-medium">
                    By purchasing a license, you will receive watermark-free versions of all tracks in this pack, available in your personal account area.
                </p>
              </div>
            </div>
          </div>
      </div>

      {relatedPacks.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200 dark:border-zinc-800">
             <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <Sparkles className="text-sky-500" size={24}/> Discover More Music Packs
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedPacks.map(pack => (
                     <div 
                        key={pack.id} 
                        className={`
                            group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full
                            ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border border-zinc-100 shadow-md'}
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
                        </div>
                    </div>
                ))}
             </div>
          </div>
      )}
    </div>
  );
};

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
    // Forziamo i colori in base allo stato esplicito isDarkMode e selected
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
                      <div className={`mt-4 animate-in fade-in slide-in-from-top-4 duration-500 p-4 rounded-xl border flex items-center gap-4 transition-all shadow-lg ${id === 'pro' ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-amber-950 border-amber-300/50' : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white border-white/10'}`}>
                        <div className={`p-2 rounded-xl backdrop-blur-md ${id === 'pro' ? 'bg-black/10' : 'bg-white/10'}`}>
                          {id === 'pro' ? <Zap className="text-amber-900" size={18} /> : <Ticket className="text-emerald-100" size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs font-bold leading-snug">
                            Save {coupon.discount_percent}% with code: <span className={`font-black tracking-widest ${id === 'pro' ? 'text-amber-900' : 'text-emerald-100'}`}>{coupon.discount_code}</span>
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
