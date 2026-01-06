
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { MusicTrack, Album, Coupon } from '../types';
import { useStore } from '../store/useStore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Download, ShoppingBag, ArrowRight, Loader2, Play, Pause, FileBadge, Info, Disc, LayoutGrid, LayoutList, Search, X, Settings, LogOut, ExternalLink, Copy, Check, Shield, Fingerprint, Ticket, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/SEO';
import { createSlug } from '../utils/slugUtils';
import { SubscriptionDashboard } from '../components/SubscriptionDashboard';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

interface PurchaseWithRelations {
  id: number;
  track_id: number | null;
  album_id: number | null;
  variant_id?: string;
  license_type?: string;
  created_at: string;
  squeeze_tracks?: MusicTrack;
  album?: Album;
}

interface OwnedItem {
  track: MusicTrack;
  purchaseId: number;
  licenseType: string;
  fromAlbum?: Album;
  purchaseDate: string;
}

export const MyPurchases: React.FC = () => {
  const { session, isDarkMode, playTrack, currentTrack, isPlaying, ownedTrackIds } = useStore();
  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([]);
  const [recommendations, setRecommendations] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingLicenseId, setDownloadingLicenseId] = useState<number | null>(null);
  
  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // --- LOGICA PER DOWNLOAD AUTOMATICO DA EMAIL ---
  const [searchParams] = useSearchParams();
  const [autoProcessed, setAutoProcessed] = useState(false);

  useEffect(() => {
    // Se non abbiamo ancora caricato i prodotti o se abbiamo già processato l'auto-click, esci
    if (loading || ownedItems.length === 0 || autoProcessed) return;

    const orderId = searchParams.get('order');
    const action = searchParams.get('action');

    if (orderId && action) {
      // Troviamo l'item corrispondente nell'elenco dei prodotti posseduti
      // Usiamo l'ID ordine dell'email (stringa) confrontandolo con purchaseId (numero o stringa)
      const targetItem = ownedItems.find(item => String(item.purchaseId) === orderId);

      if (targetItem) {
        setAutoProcessed(true); // Evita loop infiniti
        
        if (action === 'download') {
          handleDownload(targetItem.track);
        } else if (action === 'license') {
          handleDownloadLicense(Number(orderId));
        }
        
        // Puliamo l'URL per non far ripartire il download al refresh
        navigate('/my-purchases', { replace: true });
      }
    }
  }, [loading, ownedItems, searchParams, autoProcessed]);
  // -----------------------------------------------

  // UI State for Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const navigate = useNavigate();

  const couponGradients = [
    { bg: 'bg-gradient-to-br from-blue-600 to-sky-800', shadow: 'shadow-blue-500/20' },
    { bg: 'bg-gradient-to-br from-indigo-600 to-purple-800', shadow: 'shadow-purple-500/20' },
    { bg: 'bg-gradient-to-br from-zinc-800 to-zinc-950', shadow: 'shadow-zinc-500/20' }
  ];

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchEverything = async () => {
      setLoading(true);
      try {
        const { data: purchases, error: purchaseError } = await supabase
          .from('purchases')
          .select('*, squeeze_tracks(*), album(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (purchaseError) throw purchaseError;
        
        const finalItems: OwnedItem[] = [];

        for (const purchase of (purchases as PurchaseWithRelations[])) {
          if (purchase.track_id && purchase.squeeze_tracks) {
            finalItems.push({
              track: purchase.squeeze_tracks,
              purchaseId: purchase.id,
              licenseType: purchase.license_type || 'standard',
              purchaseDate: purchase.created_at
            });
          } else if (purchase.album_id && purchase.album) {
            const { data: albumTracks, error: albumTracksError } = await supabase
              .from('album_tracks')
              .select('track_id')
              .eq('album_id', purchase.album_id);

            if (!albumTracksError && albumTracks && albumTracks.length > 0) {
              const trackIds = albumTracks.map(at => at.track_id);
              
              const { data: tracksData, error: tracksError } = await supabase
                .from('squeeze_tracks')
                .select('*')
                .in('id', trackIds);

              if (!tracksError && tracksData) {
                tracksData.forEach(track => {
                  finalItems.push({
                    track,
                    purchaseId: purchase.id,
                    licenseType: purchase.license_type || 'standard',
                    fromAlbum: purchase.album as Album,
                    purchaseDate: purchase.created_at
                  });
                });
              }
            }
          }
        }

        const seen = new Set();
        const uniqueItems = finalItems.filter(item => {
          const duplicate = seen.has(item.track.id);
          seen.add(item.track.id);
          return !duplicate;
        });

        uniqueItems.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        setOwnedItems(uniqueItems);

        // Fetch Coupons
        const { data: couponData } = await supabase
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .not('discount_code', 'is', null);
        if (couponData) setCoupons(couponData as Coupon[]);

        // Fetch Suggestions (Excluding owned tracks)
        const { data: suggestionData } = await supabase
          .from('squeeze_tracks')
          .select('*')
          .limit(50);
        
        if (suggestionData) {
          const filteredSuggestions = suggestionData
            .filter((t: MusicTrack) => !ownedTrackIds.has(t.id))
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);
          setRecommendations(filteredSuggestions);
        }

      } catch (err) {
        console.error("Error fetching purchases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEverything();
  }, [session, navigate, ownedTrackIds]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return ownedItems;
    const query = searchQuery.toLowerCase();
    return ownedItems.filter(item => {
      const title = item.track.title || '';
      const artist = item.track.artist_name || '';
      const album = item.fromAlbum?.title || '';
      return title.toLowerCase().includes(query) || 
             artist.toLowerCase().includes(query) || 
             album.toLowerCase().includes(query);
    });
  }, [ownedItems, searchQuery]);

  const handleDownload = async (track: MusicTrack) => {
    if (!session) return;
    setDownloadingId(track.id);
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
        link.setAttribute('download', `${track.title}.wav`);
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        alert("Unable to retrieve download URL. Please ensure your license is active.");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("An error occurred while preparing your download.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadLicense = async (purchaseId: number) => {
  if (!session) return;
  setDownloadingLicenseId(purchaseId);
  try {
    // 1. Invocazione della funzione con gestione esplicita del blob
    const { data, error } = await supabase.functions.invoke('generate-certificate', {
      body: { purchaseId },
      // Importante: forziamo il recupero come blob per evitare corruzione JSON
      headers: {
        "Accept": "application/pdf"
      }
    });

    if (error) throw error;
    if (!data) throw new Error("No data returned from function");

    // 2. Trasformazione in Blob (gestendo sia dati binari che stringhe base64 se presenti)
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });

    // 3. Controllo di sicurezza: se il file è troppo piccolo, potrebbe essere un errore testuale rinominato
    if (blob.size < 500) { 
        console.warn("Il file PDF sembra troppo piccolo, potrebbe essere corrotto.");
    }

    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `License_Pinegroove_Order_${purchaseId}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error("License download error:", err);
    alert("An error occurred while generating your license certificate.");
  } finally {
    setDownloadingLicenseId(null);
  }
};

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleResetPassword = async () => {
    if (!session?.user?.email) return;
    setIsResettingPassword(true);
    try {
      // Reindirizziamo all'origine del sito. Supabase aggiungerà l'hash del token.
      // HashRouter gestirà il caricamento degli asset correttamente perché l'URL rimane sulla radice.
      const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      console.error("Password reset error:", err);
      alert("Error sending the reset email.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyUidToClipboard = () => {
    if (!session?.user?.id) return;
    navigator.clipboard.writeText(session.user.id);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!session && !loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <SEO title="Log In to Access Your Purchases" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500" />
        <div className={`relative z-10 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex flex-col items-center mb-8">
            <img 
              src="https://pub-2da555791ab446dd9afa8c2352f4f9ea.r2.dev/media/logo-pinegroove.svg" 
              alt="Pinegroove Logo" 
              className="w-16 h-16 mb-4 drop-shadow-lg"
            />
            <h1 className="font-archivo uppercase text-2xl tracking-tight text-center">
              <span className={isDarkMode ? 'text-white' : 'text-black'}>PINE</span>
              <span className="text-[#0288c4]">GROOVE</span>
            </h1>
            <p className="text-sm opacity-60 mt-2 font-medium text-center">Log in to your account to access your downloads and licenses.</p>
          </div>

          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0288c4',
                    brandAccent: '#0ea5e9',
                    inputText: isDarkMode ? 'white' : 'black',
                    inputBackground: isDarkMode ? '#18181b' : '#f4f4f5',
                    inputBorder: isDarkMode ? '#27272a' : '#e4e4e7',
                    inputPlaceholder: '#71717a',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                  },
                  space: {
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                },
              },
            }}
            theme={isDarkMode ? 'dark' : 'light'}
            providers={[]}
          />
          
          <div className="mt-8 flex justify-center">
            <Link to="/" className="text-xs font-bold opacity-40 hover:opacity-100 flex items-center gap-1">
               <ArrowLeft size={12} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !ownedItems.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="opacity-60 font-medium">Loading your collection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      <SEO title="My Purchases" description="Access and download your high-quality WAV files and license certificates." />
      
      {/* Account Header Section */}
      <div className={`mb-8 p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800 shadow-xl shadow-black/20' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}`}>
          <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800' : 'bg-sky-50'}`}>
                  <Fingerprint className="text-sky-500" size={24} />
              </div>
              <div className="text-center md:text-left">
                  <h2 className="text-sm font-black uppercase tracking-widest opacity-40 mb-0.5">Welcome Back</h2>
                  <p className="font-bold text-lg md:text-xl truncate max-w-[250px] md:max-w-md">
                      Hello, {session?.user?.email}
                  </p>
              </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              <a 
                href="https://app.lemonsqueezy.com/my-orders" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-black shadow-sm'}`}
              >
                  <ShoppingBag size={14} />
                  My Orders
              </a>
              <a 
                href="https://pinegroove.lemonsqueezy.com/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-black shadow-sm'}`}
              >
                  <ExternalLink size={14} />
                  Billing
              </a>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-black shadow-sm'}`}
              >
                  <Settings size={14} />
                  Settings
              </button>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
              >
                  <LogOut size={14} />
                  Logout
              </button>
          </div>
      </div>

      <SubscriptionDashboard />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <ShoppingBag className="text-sky-500" size={28} />
            My Collection
          </h1>
          <p className="opacity-60 text-lg">Your lifetime licenses for individual tracks and Music Packs.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                    type="text"
                    placeholder="Search your collection..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-sky-500 text-white' : 'bg-white border-zinc-200 focus:border-sky-400 text-black shadow-sm'}`}
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-sky-500 text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
                    title="Grid View"
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-sky-500 text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
                    title="List View"
                >
                    <LayoutList size={20} />
                </button>
            </div>
            
            <div className={`px-4 py-2.5 rounded-xl text-sm font-bold border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 shadow-sm text-zinc-500'}`}>
                {ownedItems.length} Tracks
            </div>
        </div>
      </div>

      {ownedItems.length > 0 && (
          <div className={`mb-8 p-4 rounded-xl border flex items-start gap-3 text-sm ${isDarkMode ? 'bg-sky-900/10 border-sky-900/30 text-sky-400' : 'bg-sky-50 border-sky-100 text-sky-700'}`}>
              <Info className="shrink-0 mt-0.5" size={18} />
              <p>These are <strong>Lifetime Licenses</strong>. All tracks from your single purchases and Music Packs are listed here for your convenience.</p>
          </div>
      )}

      {ownedItems.length === 0 ? (
        <div className={`text-center p-16 rounded-3xl border-2 border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-100 bg-gray-50'}`}>
          <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-4">Your library is currently empty</h3>
          <p className="opacity-60 max-w-md mx-auto mb-8 text-lg">
            Purchase a license for an individual track or a Music Pack to see them appear here.
          </p>
          <Link 
            to="/library" 
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all transform hover:-translate-y-1"
          >
            Explore Library <ArrowRight size={20} />
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 opacity-50">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold">No results found.</p>
            <button onClick={() => setSearchQuery('')} className="text-sky-500 font-bold mt-2 hover:underline">Clear search</button>
        </div>
      ) : (
        <>
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredItems.map((item) => {
                    const track = item.track;
                    const isActive = currentTrack?.id === track.id && isPlaying;
                    const isDownloading = downloadingId === track.id;
                    const isDownloadingLicense = downloadingLicenseId === item.purchaseId;
                    
                    const isExtended = item.licenseType.toLowerCase().includes('extended');
                    const licenseDisplay = isExtended ? 'Extended License' : 'Standard License';

                    return (
                    <div 
                        key={`${item.purchaseId}-${track.id}`} 
                        className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-lg'}`}
                    >
                        <div className="relative aspect-square overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                        <img 
                            src={track.cover_url} 
                            alt={track.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                            onClick={() => playTrack(track)}
                            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/50 flex items-center justify-center text-white transform hover:scale-110 transition-transform"
                        >
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        </div>
                        
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${isExtended ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'}`}>
                                <FileBadge size={12} />
                                {licenseDisplay}
                            </div>
                            {item.fromAlbum && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border border-sky-500/30 bg-sky-500/20 text-sky-400">
                                    <Disc size={10} />
                                    {item.fromAlbum.title}
                                </div>
                            )}
                        </div>
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold leading-tight line-clamp-1 mb-1 group-hover:text-sky-500 transition-colors">
                            <Link to={`/track/${createSlug(track.id, track.title)}`}>
                                {track.title}
                            </Link>
                            </h2>
                            <p className="text-sm opacity-60 font-medium truncate">
                            {track.artist_name}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800">
                            <button 
                                onClick={() => handleDownload(track)}
                                disabled={isDownloading}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95"
                            >
                                {isDownloading ? (
                                <Loader2 className="animate-spin" size={18} />
                                ) : (
                                <Download size={18} />
                                )}
                                {isDownloading ? 'Preparing...' : 'Download WAV'}
                            </button>
                            
                            <button 
                            onClick={() => handleDownloadLicense(item.purchaseId)}
                            disabled={isDownloadingLicense}
                            className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600'}`}
                            >
                            {isDownloadingLicense ? (
                                <Loader2 className="animate-spin" size={14} />
                            ) : (
                                <FileBadge size={14} />
                            )}
                            {isDownloadingLicense ? 'Generating...' : 'Download License'}
                            </button>
                        </div>
                        </div>
                    </div>
                    );
                })}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredItems.map((item) => {
                        const track = item.track;
                        const isActive = currentTrack?.id === track.id && isPlaying;
                        const isDownloading = downloadingId === track.id;
                        const isDownloadingLicense = downloadingLicenseId === item.purchaseId;
                        
                        const isExtended = item.licenseType.toLowerCase().includes('extended');
                        const licenseDisplay = isExtended ? 'Extended' : 'Standard';

                        return (
                            <div 
                                key={`${item.purchaseId}-${track.id}`}
                                className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-md ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80' : 'bg-white border-zinc-200'}`}
                            >
                                <div 
                                    className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden group cursor-pointer"
                                    onClick={() => playTrack(track)}
                                >
                                    <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {isActive ? <Pause size={24} className="text-white"/> : <Play size={24} className="text-white ml-1"/>}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="mb-1">
                                        <h3 className="font-bold text-lg truncate leading-tight">
                                            {track.title}
                                        </h3>
                                        <p className="text-xs opacity-50 font-medium">
                                            {track.artist_name} {item.fromAlbum && `• From: ${item.fromAlbum.title}`}
                                        </p>
                                    </div>
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isExtended ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-50/10 text-emerald-500 border-emerald-500/20'}`}>
                                        <FileBadge size={10} />
                                        {licenseDisplay}
                                    </div>
                                </div>

                                <div className="hidden lg:flex flex-1 h-12 items-center px-4">
                                    <WaveformVisualizer track={track} height="h-10" barCount={100} interactive={true} enableAnalysis={isActive} />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                    <button 
                                        onClick={() => handleDownload(track)}
                                        disabled={isDownloading}
                                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-sm active:scale-95"
                                    >
                                        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        {isDownloading ? '...' : 'Download WAV'}
                                    </button>

                                    <button 
                                        onClick={() => handleDownloadLicense(item.purchaseId)}
                                        disabled={isDownloadingLicense}
                                        className={`flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-lg text-xs transition-all border active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600'}`}
                                    >
                                        {isDownloadingLicense ? <Loader2 size={14} className="animate-spin" /> : <FileBadge size={14} />}
                                        License PDF
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsSettingsOpen(false)}
              />
              
              <div className={`relative w-full max-w-md rounded-[2rem] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  <div className="p-6 md:p-8">
                      <div className="flex items-center justify-between mb-8">
                          <h2 className="text-2xl font-black tracking-tight">Account Settings</h2>
                          <button 
                            onClick={() => setIsSettingsOpen(false)}
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                          >
                              <X size={24} />
                          </button>
                      </div>

                      <div className="space-y-8">
                          {/* Reset Password Section */}
                          <section>
                              <div className="flex items-center gap-2 mb-4">
                                  <Shield className="text-sky-500" size={20} />
                                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60">Security</h3>
                              </div>
                              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                                  <p className="text-sm opacity-70 mb-4">You will receive a link via email to set a new password for your account.</p>
                                  <button 
                                    onClick={handleResetPassword}
                                    disabled={isResettingPassword || resetSent}
                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${resetSent ? 'bg-emerald-500 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/20'} disabled:opacity-50`}
                                  >
                                      {isResettingPassword ? <Loader2 className="animate-spin" size={18} /> : resetSent ? <Check size={18} /> : <Shield size={18} />}
                                      {resetSent ? 'Email Sent!' : 'Send Reset Email'}
                                  </button>
                              </div>
                          </section>

                          {/* Technical Section (UID) */}
                          <section>
                              <div className="flex items-center gap-2 mb-4">
                                  <Fingerprint className="text-zinc-400" size={20} />
                                  <h3 className="text-sm font-black uppercase tracking-widest opacity-40">Technical Support</h3>
                              </div>
                              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-black/40 border-zinc-800' : 'bg-gray-50 border-zinc-100'}`}>
                                  <div className="flex items-center justify-between gap-4">
                                      <div className="min-w-0">
                                          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">User ID (UID)</p>
                                          <code className="block text-[10px] font-mono opacity-50 truncate">
                                              {session?.user?.id}
                                          </code>
                                      </div>
                                      <button 
                                        onClick={copyUidToClipboard}
                                        className={`p-2 rounded-lg transition-all active:scale-90 flex-shrink-0 ${copiedUid ? 'bg-emerald-500 text-white' : (isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-white border border-zinc-200 text-zinc-500')}`}
                                        title="Copy UID"
                                      >
                                          {copiedUid ? <Check size={14} /> : <Copy size={14} />}
                                      </button>
                                  </div>
                              </div>
                              <p className="mt-3 text-[10px] text-center opacity-40 leading-relaxed">
                                  Copy and paste your UID if you need direct technical assistance from the Pinegroove team.
                              </p>
                          </section>
                      </div>
                  </div>

                  <div className={`p-4 text-center border-t ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-zinc-100'}`}>
                      <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="text-xs font-bold opacity-40 hover:opacity-100 transition-opacity"
                      >
                          Close Settings
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Active Promos Section */}
      {coupons.length > 0 && (
        <div className="mt-16 relative z-20 w-full">
          <div className={`rounded-[2.5rem] p-8 md:p-14 border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-sky-500/10 rounded-2xl">
                <Ticket className="text-sky-500" size={32} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Active Promos</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon, idx) => {
                const style = couponGradients[idx % couponGradients.length];
                return (
                  <div 
                    key={coupon.id} 
                    className={`
                      relative p-5 rounded-3xl border-2 border-dashed border-white/20 text-white transition-all duration-500 group
                      hover:-translate-y-1.5 hover:shadow-2xl overflow-hidden
                      ${style.bg} ${style.shadow}
                    `}
                  >
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className={`absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-dashed border-white/15 transition-colors ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`} />
                    <div className={`absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-dashed border-white/15 transition-colors ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`} />

                    <div className="relative z-10 flex justify-between items-start mb-3">
                      <div className="space-y-0.5">
                        <h3 className="font-black text-xl tracking-tight leading-tight group-hover:text-sky-200 transition-colors">
                            {coupon.discount_name}
                        </h3>
                        <div className="flex items-center gap-1.5 opacity-50 text-[9px] font-black uppercase tracking-widest">
                            <ShieldCheck size={10} /> Verified Offer
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl font-black text-xl md:text-2xl shadow-lg transform group-hover:scale-110 transition-transform">
                        -{coupon.discount_percent}%
                      </div>
                    </div>
                    
                    <p className="text-xs mb-5 leading-relaxed font-medium opacity-80 line-clamp-2 min-h-[2rem]">
                      {coupon.discount_description}
                    </p>

                    <div className="relative">
                      <button
                        onClick={() => handleCopyCode(coupon.discount_code)}
                        className={`
                          w-full p-3.5 rounded-xl font-mono font-black text-lg border-2 transition-all duration-300 flex items-center justify-between
                          ${copiedCode === coupon.discount_code 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' 
                            : 'bg-black/20 hover:bg-black/40 border-white/15 text-white'}
                        `}
                      >
                        <span className="tracking-widest">{copiedCode === coupon.discount_code ? 'COPIED!' : coupon.discount_code}</span>
                        <div className="flex items-center gap-2">
                          {copiedCode === coupon.discount_code ? (
                            <Check size={18} className="animate-bounce" />
                          ) : (
                            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-sans font-black uppercase tracking-tighter">Copy</span>
                                <Copy size={16} />
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <Info size={14} className="text-sky-500" />
              <p className="text-[11px] md:text-xs font-medium italic">
                How to use: click on "Add Discount Code" during checkout and enter the coupon code.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Section (Added after Active Promos) */}
      {recommendations.length > 0 && (
        <div className="mt-20 pt-12 border-t border-gray-200 dark:border-zinc-800">
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
                                <img src={rec.cover_url} alt={rec.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
            <div className="mt-10 text-center">
                <Link 
                    to="/library" 
                    className="inline-flex items-center gap-2 text-sky-500 hover:text-sky-400 font-bold transition-all group"
                >
                    Browse Full Catalog <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
      )}
    </div>
  );
};
