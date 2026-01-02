
import React, { useEffect, useState, useRef } from 'react';
import { MusicTrack, Client, Album, MediaTheme } from '../types';
import { supabase } from '../services/supabase';
import { useStore } from '../store/useStore';
import { Search, Play, ShoppingCart, Pause, ArrowRight, Sparkles, FileCheck, ShieldCheck, Lock, Disc, Mail, Clapperboard, Music, User, TicketPercent, Copy, Check, CreditCard, Download, ChevronDown } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode, playTrack, currentTrack, isPlaying, session, purchasedTracks, subscriptionStatus } = useStore();
  const navigate = useNavigate();
  
  const [suggestions, setSuggestions] = useState<{type: 'track' | 'artist', text: string, id?: number}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText('LATL4Z9');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (track: MusicTrack) => {
    if (!session) {
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
        alert("An error occurred during download.");
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

  const displayClients = clients.length > 0 ? [...clients, ...clients, ...clients, ...clients, ...clients, ...clients] : [];

  return (
    <div className="space-y-16 pb-20">
      <SEO title="Royalty Free Music for Video" />
      
      <div className="relative pt-28 text-center flex flex-col">
         <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
                src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop" 
                alt="Home Studio Background" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 transition-colors duration-500"></div>
         </div>

         <div className="relative z-30 w-full max-w-[1920px] mx-auto px-6 text-white mb-12 md:mb-16">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight drop-shadow-md leading-tight">
                Find the perfect sound for your story.
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-medium drop-shadow-sm">
                High-quality stock music by composer Francesco Biondi.
            </p>
            
            <form 
                ref={searchContainerRef}
                onSubmit={handleSearch} 
                className="max-w-xl mx-auto relative text-zinc-900"
            >
              <input 
                type="text" 
                placeholder="Search genre, mood, or instrument..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full p-4 pl-12 rounded-full shadow-2xl outline-none border border-transparent bg-white/95 focus:bg-white focus:ring-4 focus:ring-sky-500/30 transition-all backdrop-blur-sm"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-40 text-black" size={20} />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-white text-left shadow-2xl overflow-hidden z-50 border border-gray-100">
                    <ul>
                        {suggestions.map((item, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    onClick={() => handleSuggestionClick(item)}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors hover:bg-sky-50 text-zinc-700 hover:text-sky-700"
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
            
            <div className="mt-8">
                <Link 
                    to="/library" 
                    className="inline-flex items-center gap-2 text-sky-200 hover:text-white transition-colors font-medium text-sm group"
                >
                    Explore Full Catalog 
                    <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform"/>
                </Link>
            </div>
         </div>

         <div className="w-full bg-gradient-to-r from-red-600 to-rose-700 text-white py-3 px-4 shadow-md z-20 border-t border-white/20 relative">
            <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 text-sm md:text-base text-center sm:text-left">
                <div className="flex items-center gap-2 font-medium">
                    <TicketPercent size={18} className="animate-bounce" />
                    <span>Christmas Sale: Get <span className="font-bold text-red-50 bg-white/10 px-1 rounded">50% OFF</span> all licenses until Jan 4, 2026.</span>
                </div>
                
                <button 
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 bg-black/20 hover:bg-black/40 rounded-full pl-3 pr-2 py-1 transition-all group active:scale-95 border border-white/20"
                    title="Click to copy code"
                >
                    <span className="opacity-80 text-xs uppercase tracking-wide">Use code:</span>
                    <span className="font-mono font-bold tracking-wider text-yellow-300 group-hover:text-white transition-colors">LATL4Z9</span>
                    <div className={`p-1 rounded-full ${copied ? 'bg-white text-red-600' : 'bg-white/10 text-white group-hover:bg-white/20'}`}>
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                    </div>
                </button>
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
                        onClick={() => playTrack(track)}
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
                    <div 
                        className="relative w-64 h-64 md:w-80 md:h-80 rounded-xl shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500 border border-white/10 overflow-hidden group/cover cursor-pointer"
                        onClick={() => featuredTrack && playTrack(featuredTrack)}
                    >
                        <img 
                            src={featuredPack.cover_url} 
                            alt={featuredPack.title} 
                            className="w-full h-full object-cover"
                        />
                         {featuredTrack && (
                            <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${currentTrack?.id === featuredTrack.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}>
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-lg transition-transform transform hover:scale-110">
                                    {currentTrack?.id === featuredTrack.id && isPlaying ? (
                                        <Pause size={40} className="text-white fill-white" />
                                    ) : (
                                        <Play size={40} className="text-white fill-white ml-2" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left text-white flex-1">
                        <div className="inline-block px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-4 text-sky-400">
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
                    onClick={() => playTrack(track)}
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
                            {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '-'}
                        </div>
                        
                        {hasAccess ? (
                            <button 
                                onClick={() => handleDownload(track)}
                                className={`p-2 rounded-full transition flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white`}
                                title="Download WAV"
                            >
                                <Download size={18} />
                            </button>
                        ) : (
                            <div className="relative">
                                {!session ? (
                                    <button 
                                        onClick={() => navigate('/auth')}
                                        className={`p-2 rounded-full transition flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 hover:bg-sky-600 text-white' : 'bg-gray-100 hover:bg-sky-50 hover:text-white'}`}
                                        title="Log in to buy"
                                    >
                                        <ShoppingCart size={18} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handlePurchase(track.checkout_uuid, session.user.id)}
                                        className={`p-2 rounded-full transition flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 hover:bg-sky-600 text-white' : 'bg-gray-100 hover:bg-sky-50 hover:text-white'}`}
                                        title="Buy License"
                                    >
                                        <ShoppingCart size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-8">
        <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>

            <div className="absolute -right-16 -bottom-16 pointer-events-none">
                <CreditCard className="w-64 h-64 opacity-5 transform rotate-12" />
            </div>

            <div className="relative z-10 max-w-xl text-center md:text-left">
                <h2 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start gap-2">
                    <Mail className="text-sky-500"/> Subscribe for Updates
                </h2>
                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    We partner with <strong>Lemon Squeezy</strong> to ensure 100% secure licensing transactions and instant file delivery. Subscribe to get notified about new releases.
                </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input
                    type="email"
                    placeholder="Your email address"
                    className={`px-5 py-3.5 rounded-xl outline-none border-2 transition-all w-full sm:w-72 ${isDarkMode ? 'bg-black border-zinc-700 focus:border-sky-500 text-white' : 'bg-gray-50 border-gray-200 focus:border-sky-500 text-black'}`}
                />
                <button className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3.5 rounded-xl font-bold transition shadow-md hover:shadow-lg whitespace-nowrap">
                    Subscribe Now
                </button>
            </div>
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
                <p className="text-lg opacity-80 mb-8 max-w-lg mx-auto md:mx-0 font-medium leading-relaxed text-zinc-300">
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
                        src="https://pub-2da555791ab446dd9afa8c2352f4f9ea.r2.dev/media/Francesco-Biondi-profilo.jpg" 
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
