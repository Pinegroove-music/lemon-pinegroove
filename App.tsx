
import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { Auth } from './components/Auth';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { TrackDetail } from './pages/TrackDetail';
import { MusicPacks } from './pages/MusicPacks';
import { MusicPackDetail } from './pages/MusicPackDetail';
import { About } from './pages/About';
import { Faq } from './pages/Faq';
import { ContentId } from './pages/ContentId';
import { MyPurchases } from './pages/MyPurchases';
import { MyPlaylist } from './pages/MyPlaylist';
import { GenresPage } from './pages/GenresPage';
import { MoodsPage } from './pages/MoodsPage';
import { SeasonalPage } from './pages/SeasonalPage';
import { InstrumentsPage } from './pages/InstrumentsPage';
import { Pricing } from './pages/Pricing';
import { UserLicenseAgreement } from './pages/UserLicenseAgreement';
import { Privacy } from './pages/Privacy';
import { ResetPassword } from './pages/ResetPassword';
import { useStore } from './store/useStore';
import { Menu, Search, Music, User, X, Heart, LogOut } from 'lucide-react';
import { supabase } from './services/supabase';
import { createSlug } from './utils/slugUtils';
import { SEO } from './components/SEO';
import { AnnouncementBar } from './components/AnnouncementBar';

const Layout: React.FC = () => {
  const { isDarkMode, session, fetchPurchases, fetchProfile } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [suggestions, setSuggestions] = useState<{type: 'track' | 'artist', text: string, id?: number}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLFormElement>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthPage = location.pathname === '/auth';
  const isResetPasswordPage = location.pathname === '/reset-password';
  const hideSidebar = isAuthPage || isResetPasswordPage;

  // Sincronizzazione color-scheme per bloccare interferenze browser
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  // Sincronizza i preferiti salvati nel localStorage quando l'utente si logga
  const syncPendingFavorites = async (userId: string) => {
    const pending = JSON.parse(localStorage.getItem('pinegroove_pending_favorites') || '[]');
    if (pending.length === 0) return;

    try {
      const inserts = pending.map((trackId: number) => ({
        user_id: userId,
        track_id: trackId
      }));

      const { error } = await supabase
        .from('favorites')
        .upsert(inserts, { onConflict: 'user_id,track_id' });

      if (error) throw error;
      
      localStorage.removeItem('pinegroove_pending_favorites');
    } catch (err) {
      console.error("Error syncing pending favorites:", err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
      
      if (event === 'SIGNED_IN' && currentSession?.user?.id) {
        syncPendingFavorites(currentSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const initLemonSqueezy = () => {
      if (window.LemonSqueezy && typeof window.LemonSqueezy.Setup === 'function') {
        try {
          window.LemonSqueezy.Setup({
            eventHandler: (event: any) => {
              if (event.event === 'Checkout.Success') {
                fetchPurchases();
                fetchProfile();
              }
            }
          });
        } catch (e) {
          console.error("Error setting up Lemon Squeezy:", e);
        }
      }
    };

    initLemonSqueezy();
    const timer = setTimeout(initLemonSqueezy, 2000);
    return () => clearTimeout(timer);
  }, [fetchPurchases, fetchProfile]);

  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        setIsScrolled(mainContentRef.current.scrollTop > 50);
      }
    };

    const mainContainer = mainContentRef.current;
    if (mainContainer) {
      mainContainer.addEventListener('scroll', handleScroll);
    }

    if (mainContainer) {
        mainContainer.scrollTo(0, 0);
        setIsScrolled(false);
    }

    return () => {
      if (mainContainer) {
        mainContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [location.pathname]);

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

      if (globalSearch.length < 2) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
      }

      debounceTimeoutRef.current = setTimeout(async () => {
          const query = globalSearch.trim();
          
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
  }, [globalSearch]);

  const handleGlobalSearch = (e: React.FormEvent, overrideQuery?: string) => {
    e.preventDefault();
    const queryToUse = overrideQuery || globalSearch;
    
    if (queryToUse.trim()) {
      setShowSuggestions(false);
      navigate(`/library?search=${encodeURIComponent(queryToUse)}`);
      setGlobalSearch(queryToUse);
    }
  };

  const handleSuggestionClick = (item: {type: 'track' | 'artist', text: string, id?: number}) => {
      if (item.type === 'track' && item.id) {
          navigate(`/track/${createSlug(item.id, item.text)}`);
          setGlobalSearch('');
          setShowSuggestions(false);
      } else {
          setGlobalSearch(item.text);
          handleGlobalSearch({ preventDefault: () => {} } as React.FormEvent, item.text);
      }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isHomePage = location.pathname === '/';
  const isCategoryPage = location.pathname.startsWith('/categories/');
  const isContentIdPage = location.pathname === '/content-id';
  const isAboutPage = location.pathname === '/about';
  const isFaqPage = location.pathname === '/faq';
  const isLicenseAgreementPage = location.pathname === '/user-license-agreement';
  
  const hideSearchBarContent = isCategoryPage || isContentIdPage || isAboutPage || isFaqPage || isLicenseAgreementPage;
  const shouldHideHeaderFrame = isCategoryPage || isLicenseAgreementPage;
  const isHeroPage = isHomePage || isAboutPage || isContentIdPage || isFaqPage;

  let headerWrapperClasses = `z-50 w-full transition-all duration-500 `;
  if (shouldHideHeaderFrame) {
      headerWrapperClasses += 'md:hidden absolute pointer-events-none ';
  } else if (isHeroPage) {
      if (isScrolled) {
          headerWrapperClasses += 'sticky top-0 ';
      } else {
          headerWrapperClasses += 'absolute top-0 ';
      }
  } else {
      headerWrapperClasses += 'sticky top-0 ';
  }

  let internalHeaderClasses = `transition-all duration-500 `;
  if (isHeroPage) {
      if (isScrolled) {
          internalHeaderClasses += `border-b ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white/50 border-zinc-100'} backdrop-blur-xl shadow-sm `;
      } else {
          internalHeaderClasses += 'bg-transparent border-transparent ';
      }
  } else {
      internalHeaderClasses += `border-b ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'} `;
  }

  const showFooter = location.pathname !== '/library' && !isAuthPage && !isResetPasswordPage;

  return (
    <div className={`min-h-[100dvh] flex transition-colors duration-300 ${isDarkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'}`}>
      
      {!hideSidebar && <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}

      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
        
        {!hideSidebar && (
            <div className={headerWrapperClasses}>
                <AnnouncementBar />
                
                <header className={internalHeaderClasses}>
                    <div className="max-w-[1920px] mx-auto px-6 lg:px-10 py-4 flex items-center gap-4">
                        <button 
                            onClick={() => setMobileOpen(true)} 
                            className={`md:hidden p-2 flex-shrink-0 rounded-md pointer-events-auto ${isHeroPage && !isScrolled ? 'bg-black/20 text-white backdrop-blur-sm' : ''}`}
                        >
                            <Menu size={24} />
                        </button>
                        
                        {!hideSearchBarContent && (
                            <form 
                                ref={searchContainerRef}
                                onSubmit={handleGlobalSearch} 
                                className={`
                                    flex-1 transition-all duration-500 relative
                                    ${isHeroPage && !isScrolled ? 'opacity-0 translate-y-[-20px] pointer-events-none' : 'opacity-100 translate-y-0'}
                                `}
                            >
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-40" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search tracks, tags, artists, moods..." 
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                    onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                                    className={`
                                        w-full pl-10 pr-10 py-2.5 rounded-full text-sm outline-none border transition shadow-sm
                                        ${isDarkMode 
                                        ? 'bg-zinc-900/80 border-zinc-800 focus:border-sky-500 placeholder-zinc-500 text-white' 
                                        : 'bg-zinc-100/80 border-zinc-200 focus:border-sky-400 placeholder-zinc-400 text-black'}
                                    `}
                                />
                                
                                {globalSearch && (
                                    <button 
                                        type="button"
                                        onClick={() => { setGlobalSearch(''); setSuggestions([]); setShowSuggestions(false); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                                    >
                                        <X size={16} />
                                    </button>
                                )}

                                {showSuggestions && suggestions.length > 0 && (
                                    <div className={`
                                        absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden z-50
                                        ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}
                                    `}>
                                        <ul>
                                            {suggestions.map((item, index) => (
                                                <li key={index}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSuggestionClick(item)}
                                                        className={`
                                                            w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors
                                                            ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white' : 'hover:bg-sky-50 text-zinc-700 hover:text-sky-700'}
                                                        `}
                                                    >
                                                        <span className={`opacity-50 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
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
                        )}

                        <div className={`
                            flex items-center gap-3 ml-auto transition-all duration-500 pointer-events-auto
                            ${isHeroPage && !isScrolled ? 'text-white' : ''}
                        `}>
                            {!session ? (
                                <div className="flex items-center gap-4">
                                    <Link to="/auth?view=sign_in" className={`text-sm font-bold opacity-70 hover:opacity-100 transition-opacity ${isHeroPage && !isScrolled ? 'text-white' : ''}`}>
                                        Sign In
                                    </Link>
                                    <Link to="/auth?view=sign_up" className="px-5 py-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-md transition-all active:scale-95">
                                        Sign Up
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <Link to="/my-playlist" className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-100'} ${isHeroPage && !isScrolled ? 'hover:bg-white/10' : ''}`}>
                                        <Heart size={20} className="text-red-500" />
                                        <span className={`text-sm font-bold hidden sm:inline ${isHeroPage && !isScrolled ? 'text-white' : ''}`}>Wishlist</span>
                                    </Link>
                                    <Link to="/my-purchases" className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-100'} ${isHeroPage && !isScrolled ? 'hover:bg-white/10' : ''}`}>
                                        <User size={20} className="text-sky-500" />
                                        <span className={`text-sm font-bold hidden sm:inline ${isHeroPage && !isScrolled ? 'text-white' : ''}`}>Account</span>
                                    </Link>
                                    <button 
                                        onClick={handleSignOut}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all text-red-500 ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-100'} ${isHeroPage && !isScrolled ? 'hover:bg-white/10' : ''}`}
                                        title="Sign Out"
                                    >
                                        <LogOut size={20} />
                                        <span className={`text-sm font-bold hidden lg:inline ${isHeroPage && !isScrolled ? 'text-white' : ''}`}>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            </div>
        )}

        <main 
            id="main-content"
            ref={mainContentRef} 
            className="flex-1 overflow-y-auto scroll-smooth relative"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/categories/genres" element={<GenresPage />} />
            <Route path="/categories/moods" element={<MoodsPage />} />
            <Route path="/categories/seasonal" element={<SeasonalPage />} />
            <Route path="/categories/instruments" element={<InstrumentsPage />} />
            <Route path="/track/:slug" element={<TrackDetail />} />
            <Route path="/track/:id" element={<TrackDetail />} />
            <Route path="/music-packs" element={<MusicPacks />} />
            <Route path="/music-packs/:slug" element={<MusicPackDetail />} />
            <Route path="/music-packs/:id" element={<MusicPackDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/content-id" element={<ContentId />} />
            <Route path="/my-purchases" element={<MyPurchases />} />
            <Route path="/my-playlist" element={<MyPlaylist />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/user-license-agreement" element={<UserLicenseAgreement />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
          
          {showFooter && <Footer />}
        </main>

        <CookieConsent />
        {!hideSidebar && <Player />}
        
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const setSession = useStore((state) => state.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <Router>
      <Layout />
    </Router>
  );
};

export default App;
