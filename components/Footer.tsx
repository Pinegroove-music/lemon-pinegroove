
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Youtube, Facebook, Instagram, Clapperboard, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { isDarkMode, session } = useStore();

  const browseLinks = [
    { label: 'Popular Searches', path: '/royalty-free-music/popular-searches' },
    { label: 'Browse Genres', path: '/categories/genres' },
    { label: 'Browse Moods', path: '/categories/moods' },
    { label: 'Browse Instruments', path: '/categories/instruments' },
    { label: 'Seasonal Themes', path: '/categories/seasonal' },
    { label: 'Media Themes', path: '/categories/media-themes' },
  ];

  const menuLinks = [
    { label: 'Home', path: '/' },
    { label: 'Library', path: '/library' },
    { label: 'About', path: '/about' },
    { label: 'Music Packs', path: '/music-packs' },
  ];

  const legalLinks = [
    { label: 'Pricing & Refund Policy', path: '/pricing' },
    { label: 'User License Agreement', path: '/user-license-agreement' },
    { label: 'Cookies and Privacy Policy', path: '/privacy' },
    { label: 'Content ID Clearance', path: '/content-id' },
    { label: 'FAQ', path: '/faq' },
  ];

  const handleLogoClick = () => {
    const mainContainer = document.getElementById('main-content');
    if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLinkClick = (path: string) => {
    if (path.includes('#')) {
      const [route, hash] = path.split('#');
      // Se siamo già sulla pagina pricing, scorri semplicemente
      if (window.location.hash.includes(route)) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
    }
  };

  return (
    <footer className={`
        w-full pt-12 pb-24 px-6 lg:px-10 border-t mt-auto
        ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-sky-50 border-sky-100 text-zinc-600'}
    `}>
      <div className="max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-10 xl:gap-20">
          
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4 lg:col-span-1">
              <Link 
                  to="/" 
                  onClick={handleLogoClick}
                  className="flex items-center gap-2 group w-fit cursor-pointer"
              >
                  <img 
                      src="https://media.pinegroove.net/media/logo-pinegroove.svg" 
                      alt="Pinegroove Logo" 
                      className="w-9 h-9 object-contain transition-transform duration-500 group-hover:scale-110 flex-shrink-0"
                  />
                  <span className="font-archivo uppercase text-xl tracking-tight">
                      <span className="text-black dark:text-white">PINE</span>
                      <span className="text-[#0288c4]">GROOVE</span>
                  </span>
              </Link>
              <div className="space-y-4 max-w-sm">
                  <p className="text-sm opacity-80 leading-snug font-medium">
                      Premium stock music library curated by composer Francesco Biondi. High-quality soundtracks for professional video projects, films, and media.
                  </p>
                  <div className="pt-2 space-y-2">
                      <p className="text-[10px] opacity-60 leading-tight font-black uppercase tracking-wider">
                          Secure Payments & Instant Delivery:
                      </p>
                      <img 
                          src="https://pub-704d512baed74c069032320c83ebe2f7.r2.dev/lemon-squeezy-logo.svg" 
                          alt="Lemon Squeezy Logo" 
                          className="h-6 object-contain opacity-70 hover:opacity-100 transition-all filter grayscale hover:grayscale-0"
                      />
                  </div>
              </div>
          </div>

          {/* Column 2: Discover */}
          <div className="xl:pl-4">
              <h4 className={`text-[11px] font-black uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>Discover</h4>
              <ul className="space-y-2 text-sm font-medium">
                  {browseLinks.map((link) => (
                      <li key={link.path}>
                          <Link to={link.path} className="hover:text-sky-500 transition-colors block py-0.5">
                              {link.label}
                          </Link>
                      </li>
                  ))}
              </ul>
          </div>

          {/* Column 3: Navigation */}
          <div>
              <h4 className={`text-[11px] font-black uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>Quick Links</h4>
              <ul className="space-y-2 text-sm font-medium">
                  {menuLinks.map((link) => (
                      <li key={link.path}>
                          <Link to={link.path} className="hover:text-sky-500 transition-colors block py-0.5">
                              {link.label}
                          </Link>
                      </li>
                  ))}
                  <li>
                      <Link 
                          to={session ? "/my-purchases" : "/auth"} 
                          className="hover:text-sky-500 transition-colors font-bold text-sky-600 dark:text-sky-400 block py-0.5"
                      >
                          {session ? "My Account" : "Sign In"}
                      </Link>
                  </li>
              </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
              <h4 className={`text-[11px] font-black uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>Legal & Help</h4>
              <ul className="space-y-2 text-sm font-medium">
                  {legalLinks.map((link) => (
                      <li key={link.label}>
                          <Link 
                            to={link.path} 
                            onClick={() => handleLinkClick(link.path)}
                            className="hover:text-sky-500 transition-colors block py-0.5"
                          >
                              {link.label}
                          </Link>
                      </li>
                  ))}
              </ul>
          </div>

          {/* Column 5: Connect */}
          <div className="space-y-6">
              <h4 className={`text-[11px] font-black uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>Connect</h4>
              <div className="flex flex-wrap gap-3">
                  <SocialLink href="https://www.instagram.com/pinegroovemusic/#" icon={<Instagram size={18}/>} label="Instagram" />
                  <SocialLink href="https://www.youtube.com/channel/UCZKEnVJQ5Hs1Y3HSvoDihkQ" icon={<Youtube size={18}/>} label="YouTube" />
                  <SocialLink href="https://www.facebook.com/pinegroovemusic/" icon={<Facebook size={18}/>} label="Facebook" />
                  <SocialLink href="https://www.imdb.com/it/name/nm10556240" icon={<Clapperboard size={18}/>} label="IMDb" />
              </div>
              <div className="space-y-3 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <a href="mailto:info@pinegroove.net" className="flex items-center gap-2.5 text-xs font-bold hover:text-sky-500 transition-colors group">
                      <div className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:bg-sky-500 group-hover:text-white transition-all">
                        <Mail size={14} />
                      </div>
                      info@pinegroove.net
                  </a>
                  <div className="flex items-center gap-2.5 text-xs opacity-70">
                      <div className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                        <MapPin size={14} />
                      </div>
                      Rome, Italy
                  </div>
              </div>
          </div>
        </div>

        <div className={`mt-16 pt-8 border-t text-center text-[10px] font-bold tracking-widest uppercase opacity-40 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          &copy; {new Date().getFullYear()} Francesco Biondi / Pinegroove. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

const SocialLink: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 transition-all text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700 hover:scale-110 active:scale-95"
        title={label}
    >
        {icon}
    </a>
);
