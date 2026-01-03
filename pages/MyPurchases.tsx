
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { MusicTrack, Album } from '../types';
import { useStore } from '../store/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { Download, ShoppingBag, ArrowRight, Loader2, Play, Pause, FileBadge, Info, Disc, LayoutGrid, LayoutList, Search, X, PackageOpen } from 'lucide-react';
import { SEO } from '../components/SEO';
import { createSlug } from '../utils/slugUtils';
import { SubscriptionDashboard } from '../components/SubscriptionDashboard';
import { WaveformVisualizer } from '../components/WaveformVisualizer';

interface PurchaseWithRelations {
  id: number | string; // ID can be synthetic for tracks from albums
  track_id: number | null;
  album_id: number | null;
  variant_id?: string;
  license_type?: string;
  created_at: string;
  squeeze_tracks?: MusicTrack;
  album?: Album;
  from_pack?: boolean;
}

export const MyPurchases: React.FC = () => {
  const { session, isDarkMode, playTrack, currentTrack, isPlaying } = useStore();
  const [displayItems, setDisplayItems] = useState<PurchaseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingLicenseId, setDownloadingLicenseId] = useState<number | string | null>(null);
  const navigate = useNavigate();

  const LEMON_SQUEEZY_ICON = "https://cdn.simpleicons.org/lemonsqueezy";

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      if (!loading) navigate('/auth');
      return;
    }

    const fetchMyCollection = async () => {
      setLoading(true);
      try {
        // 1. Fetch direct purchases
        const { data: rawPurchases, error } = await supabase
          .from('purchases')
          .select('*, squeeze_tracks(*), album(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (rawPurchases) {
            let finalItems: PurchaseWithRelations[] = [...rawPurchases];

            // 2. Explode albums to show tracks
            const purchasedAlbumIds = rawPurchases
                .filter(p => p.album_id !== null)
                .map(p => p.album_id);

            if (purchasedAlbumIds.length > 0) {
                const { data: albumTracks } = await supabase
                    .from('album_tracks')
                    .select('album_id, track_id, album(title), squeeze_tracks(*)')
                    .in('album_id', purchasedAlbumIds);
                
                if (albumTracks) {
                    albumTracks.forEach((at: any) => {
                        // Avoid duplicates if track was also bought individually
                        const alreadyInList = finalItems.some(item => item.track_id === at.track_id);
                        if (!alreadyInList && at.squeeze_tracks) {
                            const parentPurchase = rawPurchases.find(p => p.album_id === at.album_id);
                            finalItems.push({
                                id: `pack-track-${at.album_id}-${at.track_id}`,
                                track_id: at.track_id,
                                album_id: at.album_id,
                                license_type: parentPurchase?.license_type || 'Standard',
                                created_at: parentPurchase?.created_at || new Date().toISOString(),
                                squeeze_tracks: at.squeeze_tracks,
                                album: at.album, // Parent album info
                                from_pack: true
                            });
                        }
                    });
                }
            }

            // Sort everything by date
            finalItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setDisplayItems(finalItems);
        }
      } catch (err) {
        console.error("Error fetching purchases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCollection();
  }, [session, navigate]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return displayItems;
    const query = searchQuery.toLowerCase();
    return displayItems.filter(p => {
      const title = p.squeeze_tracks?.title || p.album?.title || '';
      const artist = p.squeeze_tracks?.artist_name || '';
      return title.toLowerCase().includes(query) || artist.toLowerCase().includes(query);
    });
  }, [displayItems, searchQuery]);

  const handleDownload = async (track: MusicTrack) => {
    if (!session) return;
    setDownloadingId(track.id);
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
        alert("Unable to retrieve download URL. Please contact support.");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("An error occurred while preparing your download.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadLicense = async (purchaseId: number | string) => {
    if (!session) return;
    setDownloadingLicenseId(purchaseId);
    
    // If it's a synthetic ID from a pack, we use the album_id part to get the real license
    const realPurchaseId = typeof purchaseId === 'string' && purchaseId.startsWith('pack-track-') 
        ? displayItems.find(i => i.id === purchaseId)?.album_id 
        : purchaseId;

    try {
      // Note: the function should handle album_id or purchase_id. 
      // For now we assume we need the actual purchase record ID from the DB
      const actualRecord = displayItems.find(i => i.id === purchaseId);
      const dbId = typeof actualRecord?.id === 'number' ? actualRecord.id : null;
      
      // Fallback: if it's from pack, we need to find the purchase ID of the album
      let targetId = dbId;
      if (!targetId && actualRecord?.from_pack) {
          const albumPurchase = displayItems.find(i => typeof i.id === 'number' && i.album_id === actualRecord.album_id);
          targetId = typeof albumPurchase?.id === 'number' ? albumPurchase.id : null;
      }

      if (!targetId) throw new Error("Could not find valid purchase ID");

      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { purchaseId: targetId }
      });

      if (error) throw error;
      if (!data) throw new Error("No data returned from function");

      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `License_Pinegroove_Order_${targetId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("License download error:", err);
      alert("An error occurred while generating your license certificate.");
    } finally {
      setDownloadingLicenseId(null);
    }
  };

  if (loading && !displayItems.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="opacity-60 font-medium">Loading your collection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      <SEO title="My Purchases" description="Access and download your licensed high-quality WAV files." />
      
      <SubscriptionDashboard />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <ShoppingBag className="text-sky-500" size={28} />
            My Collection
          </h1>
          <p className="opacity-60 text-lg">Your lifetime licenses that will always remain active.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
            {/* Search Bar */}
            <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                    type="text"
                    placeholder="Search tracks or packs..."
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

            {/* Invoices Button */}
            <div className="relative group">
                <a 
                    href="https://app.lemonsqueezy.com/my-orders" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-black shadow-sm'}`}
                >
                    <div 
                        className={`w-4 h-4 transition-colors duration-300 ${isDarkMode ? 'bg-white group-hover:bg-[#FFC233]' : 'bg-zinc-600 group-hover:bg-[#FFC233]'}`}
                        style={{
                            maskImage: `url(${LEMON_SQUEEZY_ICON})`,
                            WebkitMaskImage: `url(${LEMON_SQUEEZY_ICON})`,
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain'
                        }}
                    />
                    <span>Invoices</span>
                </a>
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl text-[10px] font-bold leading-tight opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 shadow-2xl z-50 text-center border transform translate-y-1 group-hover:translate-y-0 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-100 text-zinc-600 shadow-sky-100'}`}>
                    Download invoices from Lemon Squeezy portal.
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent ${isDarkMode ? 'border-t-zinc-800' : 'border-t-white'}`}></div>
                </div>
            </div>
            
            <div className={`px-4 py-2.5 rounded-xl text-sm font-bold border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 shadow-sm text-zinc-500'}`}>
                {displayItems.length} Items
            </div>
        </div>
      </div>

      {displayItems.length > 0 && (
          <div className={`mb-8 p-4 rounded-xl border flex items-start gap-3 text-sm ${isDarkMode ? 'bg-sky-900/10 border-sky-900/30 text-sky-400' : 'bg-sky-50 border-sky-100 text-sky-700'}`}>
              <Info className="shrink-0 mt-0.5" size={18} />
              <p>Items in this list are <strong>Lifetime Licenses</strong>. Tracks from purchased Music Packs are automatically unlocked for you.</p>
          </div>
      )}

      {displayItems.length === 0 ? (
        <div className={`text-center p-16 rounded-3xl border-2 border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-100 bg-gray-50'}`}>
          <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-4">Your collection is empty</h3>
          <p className="opacity-60 max-w-md mx-auto mb-8 text-lg">
            Once you purchase a track or a music pack, they will appear here for high-quality WAV download.
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
            <p className="text-xl font-bold">No items match your search.</p>
            <button onClick={() => setSearchQuery('')} className="text-sky-500 font-bold mt-2 hover:underline">Clear search</button>
        </div>
      ) : (
        <>
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredItems.map((item) => {
                    const isTrack = !!item.track_id;
                    const data = isTrack ? item.squeeze_tracks : item.album;
                    
                    if (!data) return null;

                    const isActive = isTrack && currentTrack?.id === data.id && isPlaying;
                    const isDownloading = isTrack && downloadingId === data.id;
                    const isDownloadingLicense = downloadingLicenseId === item.id;
                    
                    const rawLicense = item.license_type || 'standard';
                    const isExtended = rawLicense.toLowerCase().includes('extended');
                    const licenseDisplay = isExtended ? 'Extended License' : 'Standard License';

                    return (
                    <div 
                        key={item.id} 
                        className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-lg'}`}
                    >
                        <div className="relative aspect-square overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                        <img 
                            src={data?.cover_url} 
                            alt={data?.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        
                        {isTrack ? (
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button 
                                onClick={() => playTrack(data as MusicTrack)}
                                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/50 flex items-center justify-center text-white transform hover:scale-110 transition-transform"
                            >
                                {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>
                            </div>
                        ) : (
                            <Link 
                            to={`/music-packs/${createSlug(data.id, data.title)}`}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/50 flex items-center justify-center text-white transform hover:scale-110 transition-transform">
                                <Disc size={32} />
                            </div>
                            </Link>
                        )}
                        
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${isExtended ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'}`}>
                                <FileBadge size={12} />
                                {isTrack ? licenseDisplay : 'Music Pack'}
                            </div>
                            {item.from_pack && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 backdrop-blur-md shadow-sm">
                                    <PackageOpen size={10} />
                                    From Pack
                                </div>
                            )}
                        </div>
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold leading-tight line-clamp-1 mb-1 group-hover:text-sky-500 transition-colors">
                            <Link to={isTrack ? `/track/${createSlug(data.id, data.title)}` : `/music-packs/${createSlug(data.id, data.title)}`}>
                                {data?.title}
                            </Link>
                            </h2>
                            <p className="text-sm opacity-60 font-medium">
                            {isTrack ? (data as MusicTrack)?.artist_name : 'Bundle Collection'}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800">
                            {isTrack ? (
                            <button 
                                onClick={() => handleDownload(data as MusicTrack)}
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
                            ) : (
                            <Link 
                                to={`/music-packs/${createSlug(data.id, data.title)}`}
                                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95"
                            >
                                <Disc size={18} />
                                View Pack Content
                            </Link>
                            )}
                            
                            <button 
                            onClick={() => handleDownloadLicense(item.id)}
                            disabled={isDownloadingLicense}
                            className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600'}`}
                            >
                            {isDownloadingLicense ? (
                                <Loader2 className="animate-spin" size={14} />
                            ) : (
                                <FileBadge size={14} />
                            )}
                            {isDownloadingLicense ? 'Generating PDF...' : 'Download License'}
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
                        const isTrack = !!item.track_id;
                        const data = isTrack ? item.squeeze_tracks : item.album;
                        if (!data) return null;

                        const isActive = isTrack && currentTrack?.id === data.id && isPlaying;
                        const isDownloading = isTrack && downloadingId === data.id;
                        const isDownloadingLicense = downloadingLicenseId === item.id;
                        
                        const rawLicense = item.license_type || 'standard';
                        const isExtended = rawLicense.toLowerCase().includes('extended');
                        const licenseDisplay = isExtended ? 'Extended License' : 'Standard License';

                        return (
                            <div 
                                key={item.id}
                                className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-md ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80' : 'bg-white border-zinc-200'}`}
                            >
                                <div 
                                    className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden group cursor-pointer"
                                    onClick={() => isTrack ? playTrack(data as MusicTrack) : navigate(`/music-packs/${createSlug(data.id, data.title)}`)}
                                >
                                    <img src={data.cover_url} alt={data.title} className="w-full h-full object-cover" />
                                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {isTrack ? (
                                            isActive ? <Pause size={24} className="text-white"/> : <Play size={24} className="text-white ml-1"/>
                                        ) : (
                                            <Disc size={24} className="text-white" />
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="mb-1">
                                        <h3 className="font-bold text-lg truncate leading-tight">
                                            {data.title}
                                        </h2>
                                        <p className="text-xs opacity-50 font-medium">
                                            {isTrack ? (data as MusicTrack).artist_name : 'Bundle Collection'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isExtended ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                            <FileBadge size={10} />
                                            {licenseDisplay}
                                        </div>
                                        {item.from_pack && (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-500 border border-sky-500/20">
                                                <PackageOpen size={10} />
                                                From Pack: {item.album?.title}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isTrack && (
                                    <div className="hidden lg:flex flex-1 h-12 items-center px-4">
                                        <WaveformVisualizer track={data as MusicTrack} height="h-10" barCount={100} interactive={true} enableAnalysis={isActive} />
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                    {isTrack ? (
                                        <button 
                                            onClick={() => handleDownload(data as MusicTrack)}
                                            disabled={isDownloading}
                                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-sm active:scale-95"
                                        >
                                            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                            {isDownloading ? '...' : 'Download WAV'}
                                        </button>
                                    ) : (
                                        <Link 
                                            to={`/music-packs/${createSlug(data.id, data.title)}`}
                                            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-sm active:scale-95"
                                        >
                                            <Disc size={14} />
                                            View Content
                                        </Link>
                                    )}

                                    <button 
                                        onClick={() => handleDownloadLicense(item.id)}
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
    </div>
  );
};
