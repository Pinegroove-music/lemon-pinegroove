import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MusicTrack, Client, Album, MediaTheme, Coupon, PricingItem } from '../types';
import { supabase } from '../services/supabase';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { Search, Play, ShoppingCart, Pause, ArrowRight, Sparkles, FileCheck, ShieldCheck, Lock, Disc, Mail, Clapperboard, Music, User, CreditCard, Download, ChevronDown, Loader2, AlertCircle, Check, Ticket, Copy, Info, Zap, Globe, Tv, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { SEO } from '../components/SEO';
import { createSlug } from '../utils/slugUtils';

declare global {
  interface Window {
    LemonSqueezy: any;
    createLemonSqueezy: any;
  }
}

export const Home: React.FC = () => {
  const [discoverTracks, setDiscoverTracks] = useState<MusicTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<MusicTrack[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [featuredPack, setFeaturedPack] = useState<Album | null>(null);
  const [featuredTrack, setFeaturedTrack] = useState<MusicTrack | null>(null);
  const [mediaThemes, setMediaThemes] = useState<MediaTheme[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pricingData, setPricingData] = useState<PricingItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, purchasedTracks, subscriptionStatus, isSubscriber } = useStore();
  const { openSubscriptionCheckout } = useSubscription();
  const navigate = useNavigate();
  
  // Newsletter States
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterFirstName, setNewsletterFirstName] = useState('');
  const [newsletterLastName, setNewsletterLastName] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [suggestions, setSuggestions] = useState<{type: 'track' | 'artist', text: string, id?: number}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [downloadingTrackId, setDownloadingTrackId] = useState<number | null>(null);

  const clientsScrollRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLFormElement>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const popularGenres = [
    'Cinematic', 'Corporate', 'Ambient', 'Rock', 'Pop', 'Electronic',
    'Acoustic', 'Folk', 'Hip Hop', 'Jazz', 'Classical', 'Funk'
  ];

  const gradients = [
    'bg-gradient-to-br from-sky-500 to-blue-600',
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-indigo-500 to-violet-600',
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-sky-600 to-indigo-700',
    'bg-gradient-to-br from-blue-600 to-violet-700',
  ];

  const couponGradients = [
    { bg: 'bg-gradient-to-br from-blue-600 to-sky-800', shadow: 'shadow-blue-500/20' },
    { bg: 'bg-gradient-to-br from-indigo-600 to-purple-800', shadow: 'shadow-purple-500/20' },
    { bg: 'bg-gradient-to-br from-zinc-800 to-zinc-950', shadow: 'shadow-zinc-500/20' }
  ];

  useEffect(() => {
    if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
    }
  }, [trendingTracks, discoverTracks]);

  const getCurrentSeasonalKeywords = () => {
    const month = new Date().getMonth();
    
    switch (month) {
        case 9: return ['Halloween', 'Autumn', 'Spooky', 'Dark'];
        case 10: 
        case 11: return ['Christmas', 'Holiday', 'Winter', 'Xmas', 'Jingle'];
        case 0: return ['Winter', 'Ramadan', "Valentine's Day", 'New Year'];
        case 1: 
        case 2: return ["Valentine's Day", 'Holi', "St. Patrick's Day", 'Spring'];
        case 3: 
        case 4: return ['Spring', 'Cinco de Mayo', 'Memorial Day'];
        case 5: 
        case 6: 
        case 7: return ['Summer', 'Party', 'Beach', 'Sunny'];
        default: return ['Autumn'];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: allTracks } = await supabase.from('squeeze_tracks').select('*').limit(200);
      
      if (allTracks) {
        const shuffled = [...allTracks].sort(() => 0.5 - Math.random());
        setDiscoverTracks(shuffled.slice(0, 12));

        const seasonKeywords = getCurrentSeasonalKeywords();
        const keywordsLower = seasonKeywords.map(k => k.toLowerCase());

        const seasonalMatches = allTracks.filter(track => {
            if (track.season) {
                if (typeof track.season === 'string') {
                    if (keywordsLower.includes(track.season.toLowerCase())) return true;
                } else if (Array.isArray(track.season)) {
                    if (track.season.some((s: any) => typeof s === 'string' && keywordsLower.includes(s.toLowerCase()))) return true;
                }
            }
            if (track.tags && Array.isArray(track.tags)) {
                if (track.tags.some(tag => keywordsLower.some(k => tag.toLowerCase().includes(k)))) return true;
            }
            if (keywordsLower.some(k => track.title.toLowerCase().includes(k))) return true;
            if (track.mood && Array.isArray(track.mood)) {
                if (track.mood.some(m => keywordsLower.includes(m.toLowerCase()))) return true;
            }
            return false;
        });

        let finalTrending = seasonalMatches;

        if (finalTrending.length < 10) {
            const usedIds = new Set(finalTrending.map(t => t.id));
            const remaining = allTracks.filter(t => !usedIds.has(t.id));
            const shuffledRemaining = remaining.sort(() => 0.5 - Math.random());
            finalTrending = [...finalTrending, ...shuffledRemaining.slice(0, 10 - finalTrending.length)];
        } else {
            finalTrending = finalTrending.sort(() => 0.5 - Math.random()).slice(0, 10);
        }

        setTrendingTracks(finalTrending);
      }

      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .not('discount_code', 'is', null);
      if (couponData) setCoupons(couponData as Coupon[]);

      const { data: pricing } = await supabase.from('pricing').select('*');
      if (pricing) setPricingData(pricing as PricingItem[]);

      const { data: clientData } = await supabase.from('clients').select('*');
      if (clientData) setClients(clientData);

      const { data: packs } = await supabase.from('album').select('*').limit(20);
      if (packs && packs.length > 0) {
        const randomPack = packs[Math.floor(Math.random() * packs.length)];
        setFeaturedPack(randomPack);

        const { data: trackLink } = await supabase
            .from('album_tracks')
            .select('track_id')
            .eq('album_id', randomPack.id)
            .order('track_order', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (trackLink) {
            const { data: fullTrack } = await supabase
                .from('squeeze_tracks')
                .select('*')
                .eq('id', trackLink.track_id)
                .single();
            
            if (fullTrack) setFeaturedTrack(fullTrack);
        }
      }

      const { data: themes } = await supabase.from('media_theme').select('*');
      if (themes && themes.length > 0) {
        const shuffledThemes = [...themes].sort(() => 0.5 - Math.random());
        setMediaThemes(shuffledThemes.slice(0, 4));
      }
    };

    fetchData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubscribeClick = () => {
    if (!session) {
      navigate('/auth');
    } else if (isSubscriber) {
      navigate('/my-purchases');
    } else {
      openSubscriptionCheckout();
    }
  };

  useEffect(() => {
    if (clients.length === 0) return;

    const interval = setInterval(() => {
        const container = clientsScrollRef.current;
        if (container) {
            const { scrollLeft, scrollWidth } = container;
            const singleSetWidth = scrollWidth / 6; 
            
            if (scrollLeft >= singleSetWidth * 3) {
                container.scrollLeft = scrollLeft - singleSetWidth;
            }

            const item = container.firstElementChild?.firstElementChild as HTMLElement;
            const moveAmount = item ? item.offsetWidth + 64 : 200;
            container.scrollBy({ left: moveAmount, behavior: 'smooth' });
        }
    }, 2500);

    return () => clearInterval(interval);
  }, [clients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
      }

      if (searchQuery.length < 2) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
      }

      debounceTimeoutRef.current = setTimeout(async () => {
          const query = searchQuery.trim();
          
          const [titlesRes, artistsRes] = await Promise.all([
             supabase.from('squeeze_tracks').select('id, title').ilike('title', `%${query}%`).limit(4),
             supabase.from('squeeze_tracks').select('artist_name').ilike('artist_name', `%${query}%`).limit(2)
          ]);

          const newSuggestions: {type: 'track' | 'artist', text: string, id?: number}[] = [];
          const uniqueKeys = new Set<string>();

          if (titlesRes.data) {
              titlesRes.data.forEach(t => {
                  if (!uniqueKeys.has(t.title)) {
                      uniqueKeys.add(t.title);
                      newSuggestions.push({ type: 'track', text: t.title, id: t.id });
                  }
              });
          }

          if (artistsRes.data) {
              artistsRes.data.forEach(a => {
                  if (!uniqueKeys.has(a.artist_name)) {
                      uniqueKeys.add(a.artist_name);
                      newSuggestions.push({ type: 'artist', text: a.artist_name });
                  }
              });
          }

          setSuggestions(newSuggestions);
          setShowSuggestions(newSuggestions.length > 0);

      }, 300);

      return () => {
          if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent, overrideQuery?: string) => {
    e.preventDefault();
    const queryToUse = overrideQuery || searchQuery;
    if (queryToUse.trim()) {
      setShowSuggestions(false);
      navigate(`/library?search=${encodeURIComponent(queryToUse)}`);
      setSearchQuery(queryToUse);
    }
  };

  const handleSuggestionClick = (item: {type: 'track' | 'artist', text: string, id?: number}) => {
      if (item.type === 'track' && item.id) {
          navigate(`/track/${createSlug(item.id, item.text)}`);
          setSearchQuery('');
          setShowSuggestions(false);
      } else {
          setSearchQuery(item.text);
          handleSearch({ preventDefault: () => {} } as React.FormEvent, item.text);
      }
  };

  const handleDownload = async (track: MusicTrack) => {
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
            if (!response.ok) throw new Error("Download failed");
            
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
          alert("Unable to retrieve download URL. Please ensure you have an active license.");
        }
    } catch (err) {
        console.error("Download Error:", err);
        alert("An error occurred during download.");
    } finally {
        setDownloadingTrackId(null);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterFirstName || !newsletterLastName || !newsletterConsent) return;

    setIsSubmittingNewsletter(true);
    setNewsletterStatus('idle');

    try {
      const { data, error } = await supabase.functions.invoke('sender-newsletter', {
        body: {
          email: newsletterEmail,
          firstname: newsletterFirstName,
          lastname: newsletterLastName
        }
      });

      if (error) throw error;

      setNewsletterStatus('success');
      setNewsletterEmail('');
      setNewsletterFirstName('');
      setNewsletterLastName('');
      setNewsletterConsent(false);
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      setNewsletterStatus('error');
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  const isNewsletterValid = newsletterEmail.includes('@') && newsletterFirstName.trim() && newsletterLastName.trim() && newsletterConsent;

  const displayClients = clients.length > 0 ? [...clients, ...clients, ...clients, ...clients, ...clients, ...clients] : [];

  // Pricing Helpers
  const getPriceStr = (type: string, defaultVal: string) => {
    const item = pricingData.find(p => p.product_type === type);
    if (!item) return defaultVal;
    return `${item.currency} ${item.price}`;
  };

  return (
    <div className="space-y-16 pb-20">
      <SEO title="Royalty Free Music for Video" />
      
      {/* Hero Section - Compact height & Content shifted low */}
      <div className="relative pt-40 pb-8 md:pt-48 md:pb-12 text-center flex flex-col items-center justify-end min-h-[340px] md:min-h-[380px]">
         <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
                src="https://media.pinegroove.net/media/bg-pinegroove.avif" 
                alt="Home Studio Background" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 transition-colors duration-500"></div>
         </div>

         <div className="relative w-full max-w-[1920px] mx-auto px-6 text-white mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight drop-shadow-md leading-tight max-w-4xl mx-auto">
                Find the perfect sound for your story.
            </h1>
            <p className="text-sm md:text-base mb-6 opacity-90 max-w-2xl mx-auto font-medium drop-shadow-sm">
                High-quality stock music by composer Francesco Biondi.
            </p>
            
            <form 
                ref={searchContainerRef}
                onSubmit={handleSearch} 
                className="max-w-md mx-auto relative text-zinc-900"
            >
              <input 
                type="text" 
                placeholder="Search genre, mood, or instrument..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full p-3 pl-11 rounded-full shadow-2xl outline-none border border-transparent bg-white/95 focus:bg-white focus:ring-4 focus:ring-sky-500/30 transition-all backdrop-blur-sm text-sm"
              />
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 opacity-40 text-black" size={18} />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white text-left shadow-2xl overflow-hidden z-50 border border-gray-100">
                    <ul>
                        {suggestions.map((item, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    onClick={() => handleSuggestionClick(item)}
                                    className="w-full text-left px-5 py-3 flex items-center gap-3 text-sm transition-colors hover:bg-sky-50 text-zinc-700 hover:text-sky-700"
                                >
                                    <span className="opacity-50 text-zinc-400">
                                        {item.type === 'track' ? <Music size={14} /> : <User size={14} />}
                                    </span>
                                    <span className="font-medium truncate">{item.text}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
              )}
            </form>
            
            <div className="mt-6">
                <Link 
                    to="/library" 
                    className="inline-flex items-center gap-2 text-sky-200 hover:text-white transition-colors font-bold text-xs md:text-sm group"
                >
                    Explore Full Catalog 
                    <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform"/>
                </Link>
            </div>
         </div>
      </div>

      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-sky-500">✦</span> Discover New Music
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {discoverTracks.map(track => {
              const active = currentTrack?.id === track.id && isPlaying;
              return (
                <div key={track.id} className="group flex flex-col text-center">
                    <div 
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-md mb-3" 
                        onClick={() => playTrack(track, discoverTracks)}
                    >
                        <img 
                            src={track.cover_url} 
                            alt={track.title} 
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-110" 
                        />
                        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {active ? <Pause size={32} className="text-white fill-white" /> : <Play size={32} className="text-white fill-white ml-1" />}
                        </div>
                    </div>
                    
                    <Link 
                        to={`/track/${createSlug(track.id, track.title)}`} 
                        className="font-bold text-sm truncate block hover:text-sky-500 transition-colors"
                        title={track.title}
                    >
                        {track.title}
                    </Link>
                    <Link 
                        to={`/library?search=${encodeURIComponent(track.artist_name)}`} 
                        className="text-xs opacity-70 truncate block hover:underline transition-colors"
                        title={track.artist_name}
                    >
                        {track.artist_name}
                    </Link>
                </div>
            )
          })}
        </div>
        
        <div className="mt-8 flex justify-end">
            <Link 
                to="/library" 
                className={`
                    inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                    ${isDarkMode 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700' 
                        : 'bg-white hover:bg-sky-50 text-sky-600 border border-sky-100'}
                `}
            >
                Explore Full Catalog <ArrowRight size={16} />
            </Link>
        </div>
      </section>

      {coupons.length > 0 && (
        <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Ticket className="text-sky-500" size={24} /> Active Promos
          </h2>
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
                  
                  <div className={`absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-dashed border-white/15 transition-colors ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`} />
                  <div className={`absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-dashed border-white/15 transition-colors ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`} />

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
        </section>
      )}

      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Sparkles size={28} />,
              title: "Premium Quality",
              desc: "Meticulously composed tracks featuring real instruments and high-end production."
            },
            {
              icon: <FileCheck size={28} />,
              title: "Simple Licensing",
              desc: "Pay once, use forever. No recurring fees, no hidden costs. Simple royalty-free licenses."
            },
            {
              icon: <ShieldCheck size={28} />,
              title: "Content ID Safe",
              desc: "100% safe for YouTube. Fast Content ID clearance for every license purchased."
            },
            {
              icon: <Lock size={28} />,
              title: "Secure Transactions",
              desc: "Powered by Lemon Squeezy for 100% secure payments and instant automated delivery."
            }
          ].map((feature, idx) => (
             <div key={idx} className={`p-6 rounded-2xl border text-center flex flex-col items-center transition hover:shadow-lg hover:-translate-y-1 transform duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-sky-50 border-sky-200 shadow-sm'}`}>
                <div className={`mb-4 text-sky-500 p-4 rounded-full ${isDarkMode ? 'bg-sky-900/20' : 'bg-white'}`}>
                    {feature.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm opacity-70 leading-relaxed">{feature.desc}</p>
             </div>
          ))}
        </div>
      </section>

      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 text-center">
        <h2 className="text-2xl font-bold mb-6 flex items-center justify-start gap-2">
          <span className="text-sky-500">✦</span> Browse By Genre
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularGenres.map((genre, index) => {
            const gradient = gradients[index % gradients.length];
            return (
              <Link
                key={genre}
                to={`/library?search=${encodeURIComponent(genre)}`}
                className={`
                  ${gradient} text-white
                  h-16 flex items-center justify-center text-center px-2
                  rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider 
                  transition-all transform hover:-translate-y-1 hover:shadow-lg hover:brightness-110 shadow-md
                `}
              >
                {genre}
              </Link>
            )
          })}
        </div>
        
        <Link 
            to="/categories/genres"
            className={`
                inline-flex items-center gap-2 mt-10 px-8 py-3 rounded-full font-bold text-sm transition-all transform hover:-translate-y-0.5 hover:shadow-md
                ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}
            `}
        >
            View All Genres <ArrowRight size={16} />
        </Link>
      </section>

      {featuredPack && (
        <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Disc className="text-sky-500" size={24}/> Featured Music Pack
            </h2>
            
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 z-0">
                    <img 
                        src={featuredPack.cover_url} 
                        alt="" 
                        className="w-full h-full object-cover blur-[80px] scale-125 opacity-70 dark:opacity-50 brightness-75 transition-transform duration-[20s] ease-in-out group-hover:scale-150"
                        aria-hidden="true"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 p-8 md:p-14 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                    {/* Featured Pack Cover with Play Button */}
                    <div 
                        className="relative w-64 h-64 md:w-80 md:h-80 rounded-xl shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500 border border-white/10 overflow-hidden group/cover cursor-pointer"
                        onClick={() => featuredTrack && playTrack(featuredTrack)}
                    >
                        <img 
                            src={featuredPack.cover_url} 
                            alt={featuredPack.title} 
                            className="w-full h-full object-cover"
                        />
                         {/* Play Button Overlay */}
                         {featuredTrack && (
                            <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${currentTrack?.id === featuredTrack.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}>
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-lg transition-transform transform hover:scale-110">
                                    {currentTrack?.id === featuredTrack.id && isPlaying ? (
                                        <Pause size={32} className="text-white fill-white" />
                                    ) : (
                                        <Play size={32} className="text-white fill-white ml-1" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left text-white flex-1">
                        <div className="inline-block px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-4">
                            Premium Collection
                        </div>
                        <h3 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight drop-shadow-lg leading-tight">
                            {featuredPack.title}
                        </h3>
                        
                        {featuredPack.description && (
                            <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto md:mx-0 font-medium leading-relaxed drop-shadow-sm line-clamp-3">
                                {featuredPack.description}
                            </p>
                        )}
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <Link 
                                to={`/music-packs/${createSlug(featuredPack.id, featuredPack.title)}`} 
                                className="bg-white text-black hover:bg-gray-100 px-8 py-3.5 rounded-full font-bold transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <Disc size={20}/> View Pack
                            </Link>
                            <Link 
                                to="/music-packs" 
                                className="px-8 py-3.5 rounded-full font-bold border border-white/30 hover:bg-white/10 backdrop-blur-sm transition-colors flex items-center gap-2"
                            >
                                View All Packs <ArrowRight size={18}/>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* NEW Pricing Section */}
      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase">Simple Pricing, Total Freedom</h2>
          <p className="text-lg md:text-xl opacity-60 max-w-3xl mx-auto font-medium leading-relaxed">
            Your music, your rules. Buy exactly what you need with individual licenses or unlock everything with our PRO Subscription. Maximum flexibility, no strings attached.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Single Track */}
          <div className={`p-8 md:p-10 rounded-[2.5rem] border flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}`}>
            <div className="mb-8 flex items-center justify-between">
              <Globe className="text-sky-500" size={32} />
              <div className="text-[10px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-600 px-3 py-1.5 rounded-full">Single Access</div>
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">Single Track</h3>
            <p className="text-sm opacity-60 mb-8 font-medium">Cherry-pick your favorite tracks for specific projects.</p>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-end justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs opacity-50 font-black uppercase tracking-wider">Standard</span>
                <span className="text-3xl font-black text-sky-600 dark:text-sky-400">{getPriceStr('single_track_standard', '€ 9.99')}</span>
              </div>
              <div className="flex items-end justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs opacity-50 font-black uppercase tracking-wider">Extended</span>
                <span className="text-3xl font-black text-sky-600 dark:text-sky-400">{getPriceStr('single_track_extended', '€ 39.99')}</span>
              </div>
            </div>

            <Link to="/library" className={`mt-auto w-full py-4 rounded-2xl font-black text-center transition-all ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-sky-50 hover:bg-sky-100 text-sky-600'}`}>
              Browse Tracks
            </Link>
          </div>

          {/* Card 2: Music Packs */}
          <div className={`p-8 md:p-10 rounded-[2.5rem] border flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}`}>
            <div className="mb-8 flex items-center justify-between">
              <Tv className="text-indigo-500" size={32} />
              <div className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 px-3 py-1.5 rounded-full">Best Value Bundle</div>
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">Music Packs</h3>
            <p className="text-sm opacity-60 mb-8 font-medium">Thematic bundles for consistent storytelling across projects.</p>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-end justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs opacity-50 font-black uppercase tracking-wider">Standard Pack</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{getPriceStr('music_pack_standard', '€ 49.99')}</span>
              </div>
              <div className="flex items-end justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs opacity-50 font-black uppercase tracking-wider">Extended Pack</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{getPriceStr('music_pack_extended', '€ 69.99')}</span>
              </div>
            </div>

            <Link to="/music-packs" className={`mt-auto w-full py-4 rounded-2xl font-black text-center transition-all ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}>
              View All Packs
            </Link>
          </div>

          {/* Card 3: PRO Subscription */}
          <div className="relative group">
            <div className="absolute inset-0 bg-sky-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative h-full p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex flex-col shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <Crown className="absolute -right-8 -bottom-8 h-48 w-48 opacity-10 rotate-12" />
              
              <div className="mb-8 flex items-center justify-between">
                <Zap className="text-yellow-300" size={32} />
                <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">Unlimited Access</div>
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tight">PRO Subscription</h3>
              <p className="text-sm opacity-80 mb-10 font-medium">Access the entire Pinegroove catalog and use our music without limits.</p>
              
              <div className="mb-12">
                <div className="text-5xl font-black mb-1">{getPriceStr('full_catalog', '€ 99')}</div>
                <div className="text-sm opacity-70 font-bold uppercase tracking-widest">Per Year • All Tracks</div>
              </div>

              <button 
                onClick={handleSubscribeClick}
                className="mt-auto w-full py-5 rounded-2xl bg-white text-sky-700 font-black text-center shadow-xl hover:bg-sky-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubscriber ? 'Manage Subscription' : 'Unlock Everything'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-xs opacity-40 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-sky-500" /> Secure Payments & Global Tax Compliance by Lemon Squeezy
            </p>
        </div>
      </section>

      {mediaThemes.length > 0 && (
        <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clapperboard className="text-sky-500" size={24}/> Browse by Media Theme
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mediaThemes.map(theme => (
                    <Link 
                        key={theme.id}
                        to={`/library?search=${encodeURIComponent(theme.title)}`}
                        className="group relative h-48 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                        <img 
                            src={theme.media_theme_pic} 
                            alt={theme.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <h3 className="text-white font-bold text-xl drop-shadow-md">{theme.title}</h3>
                            <span className="text-white/80 text-xs font-medium uppercase tracking-wider mt-1 inline-flex items-center gap-1 group-hover:text-sky-300 transition-colors">
                                Explore <ArrowRight size={12}/>
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
      )}

      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10">
        <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {trendingTracks.map((track) => {
             const isCurrent = currentTrack?.id === track.id;
             const isPurchased = purchasedTracks.some(p => p.track_id === track.id);
             const isSubscribed = subscriptionStatus === 'active';
             const hasAccess = isPurchased || isSubscribed;
             const isDownloading = downloadingTrackId === track.id;

             return (
              <div 
                key={track.id} 
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition hover:shadow-md
                  ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100 hover:bg-sky-50'}
                  ${isCurrent && isPlaying ? 'border-sky-500' : ''}
                `}
              >
                <div 
                    className="relative w-12 h-12 flex-shrink-0 cursor-pointer rounded overflow-hidden"
                    onClick={() => playTrack(track, trendingTracks)}
                >
                    <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center ${isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                        {isCurrent && isPlaying ? <div className="w-3 h-3 bg-sky-400 rounded-full animate-pulse"/> : <Play size={20} className="text-white fill-white"/>}
                    </div>
                </div>

                <div className="flex-1 min-w-0 sm:flex-none sm:w-48 lg:w-40 xl:w-64">
                  <Link to={`/track/${createSlug(track.id, track.title)}`} className="font-bold truncate block hover:text-sky-500">{track.title}</Link>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <span className="truncate">{track.artist_name}</span>
                    {track.genre && track.genre.length > 0 && (
                        <>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">{track.genre[0]}</span>
                        </>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex flex-1 h-full items-center px-4">
                    <WaveformVisualizer track={track} height="h-8" barCount={80} />
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
                    <div className="text-sm font-mono opacity-60 text-right whitespace-nowrap hidden sm:block">
                        {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '-'}
                    </div>

                    <div className="flex items-center gap-3">
                         <div className="text-xs font-mono opacity-60 sm:hidden">
                            {track.duration ? `${Math.floor(track.duration / 60)}:${(Math.floor(track.duration % 60)).toString().padStart(2, '0')}` : '-'}
                        </div>
                        
                        {hasAccess ? (
                            <button 
                                onClick={() => handleDownload(track)}
                                disabled={isDownloading}
                                className={`p-2 rounded-full transition flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 disabled:opacity-50`}
                                title="Download WAV"
                            >
                                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            </button>
                        ) : (
                            <Link 
                                to={`/track/${createSlug(track.id, track.title)}`}
                                className={`p-2 rounded-full transition flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-zinc-600 hover:bg-sky-100 hover:text-sky-600'}`}
                                title="View Purchase Options"
                            >
                                <ShoppingCart size={18} />
                            </Link>
                        )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-8">
        <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-12 border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>

            <div className="absolute -right-16 -bottom-16 pointer-events-none">
                <CreditCard className="w-64 h-64 opacity-5 transform rotate-12" />
            </div>

            <div className="relative z-10 max-w-xl text-center md:text-left">
                <h2 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start gap-2">
                    <Mail className="text-sky-500"/> Subscribe for Updates
                </h2>
                <p className={`text-lg leading-relaxed mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Stay in the loop. Subscribe to receive exclusive coupon codes, early access to new music drops, and news about our latest placements in films and media. No spam, just pure inspiration.
                </p>
                {newsletterStatus === 'success' && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-500 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <Check size={18} /> Subscription successful!
                    </div>
                )}
                {newsletterStatus === 'error' && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} /> Error subscribing. Please try again.
                    </div>
                )}
            </div>

            <form onSubmit={handleNewsletterSubmit} className="relative z-10 flex flex-col gap-4 w-full md:w-auto max-w-md">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                      required
                      type="text"
                      placeholder="First Name"
                      value={newsletterFirstName}
                      onChange={(e) => setNewsletterFirstName(e.target.value)}
                      className={`px-5 py-3.5 rounded-xl outline-none border-2 transition-all w-full sm:w-1/2 ${isDarkMode ? 'bg-black border-zinc-700 focus:border-sky-500 text-white' : 'bg-gray-50 border-gray-200 focus:border-sky-500 text-black'}`}
                  />
                  <input
                      required
                      type="text"
                      placeholder="Last Name"
                      value={newsletterLastName}
                      onChange={(e) => setNewsletterLastName(e.target.value)}
                      className={`px-5 py-3.5 rounded-xl outline-none border-2 transition-all w-full sm:w-1/2 ${isDarkMode ? 'bg-black border-zinc-700 focus:border-sky-500 text-white' : 'bg-gray-50 border-gray-200 focus:border-sky-500 text-black'}`}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                      required
                      type="email"
                      placeholder="Your email address"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className={`px-5 py-3.5 rounded-xl outline-none border-2 transition-all w-full sm:w-72 ${isDarkMode ? 'bg-black border-zinc-700 focus:border-sky-500 text-white' : 'bg-gray-50 border-gray-200 focus:border-sky-500 text-black'}`}
                  />
                  <button 
                    type="submit"
                    disabled={!isNewsletterValid || isSubmittingNewsletter}
                    className={`bg-sky-600 hover:bg-sky-500 text-white px-8 py-3.5 rounded-xl font-bold transition shadow-md hover:shadow-lg whitespace-nowrap flex items-center justify-center gap-2 ${(!isNewsletterValid || isSubmittingNewsletter) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                      {isSubmittingNewsletter ? <Loader2 size={18} className="animate-spin" /> : 'Subscribe Now'}
                  </button>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <input 
                      required
                      type="checkbox" 
                      checked={newsletterConsent}
                      onChange={(e) => setNewsletterConsent(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className={`text-xs font-medium leading-snug ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      I would like to receive newsletter and promotions
                    </span>
                </label>
            </form>
        </div>
      </section>

      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-8">
        <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 ${isDarkMode ? 'bg-black border border-zinc-800' : 'bg-zinc-900 text-white'}`}>
            
            <div className="flex-1 text-center md:text-left z-10">
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-4 text-sky-400">
                    The Artist
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight text-white">
                    One Composer, <br/>Countless Sounds
                </h2>
                <p className="text-lg opacity-80 mb-8 max-lg mx-auto md:mx-0 font-medium leading-relaxed text-zinc-300">
                    Meet Francesco Biondi, the composer and producer behind Pinegroove.
                </p>
                
                <Link 
                    to="/about" 
                    className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-3.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                    Read Biography <ArrowRight size={18}/>
                </Link>
            </div>

            <div className="relative z-10">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl relative group">
                    <img 
                        src="https://media.pinegroove.net/media/Francesco-Biondi-profilo.jpg" 
                        alt="Francesco Biondi" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                </div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-sky-500/20 blur-[80px] rounded-full -z-10 pointer-events-none"></div>
            </div>
        </div>
      </section>

      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-10 overflow-hidden">
        <h3 className="text-center text-sm uppercase tracking-widest opacity-50 mb-8 font-bold">Trusted By</h3>
        
        {displayClients.length > 0 ? (
            <div 
                ref={clientsScrollRef}
                className="w-full overflow-x-auto no-scrollbar whitespace-nowrap"
            >
                <div className="flex items-center gap-16 px-4">
                    {displayClients.map((client, index) => (
                        <div key={`${client.id}-${index}`} className="flex-shrink-0 w-32 md:w-40 flex items-center justify-center h-20">
                            <img 
                                src={client.logo_url} 
                                alt={client.name} 
                                className="max-w-full max-h-full object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500" 
                            />
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="flex justify-center flex-wrap gap-16 items-center">
                {[1,2,3,4,5].map(i => <div key={i} className="h-8 w-32 bg-current rounded animate-pulse opacity-20"></div>)}
            </div>
        )}
      </section>

    </div>
  );
};