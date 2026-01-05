
import React, { useState } from 'react';
// Changed react-router to react-router-dom to fix hook issues and missing export errors
import { Link, useLocation } from 'react-router-dom';
import { Home, Library, Info, HelpCircle, ShieldAlert, Music, X, Sun, Moon, ChevronLeft, ChevronRight, LogOut, User, ShoppingBag, Zap, Tag, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../services/supabase';

export const Sidebar: React.FC<{ mobileOpen: boolean; setMobileOpen: (open: boolean) => void }> = ({ mobileOpen, setMobileOpen }) => {
  const { isDarkMode, toggleTheme, session } = useStore();
  const { isPro, openSubscriptionCheckout } = useSubscription();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Main navigation items (general section)
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Library', path: '/library', icon: Library },
    { label: 'Music Packs', path: '/music-packs', icon: Music },
    { label: 'Pricing', path: '/pricing', icon: Tag },
    { label: 'About', path: '/about', icon: Info },
    { label: 'Content ID', path: '/content-id', icon: ShieldAlert },
    { label: 'FAQ', path: '/faq', icon: HelpCircle },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 transform transition-all duration-300 ease-in-out
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:translate-x-0 md:relative md:inset-0
    ${collapsed ? 'md:w-20' : 'md:w-64'} w-64
    ${isDarkMode ? 'bg-zinc-950 border-zinc-900 text-zinc-300' : 'bg-gray-100 border-gray-200 text-zinc-800'}
    border-r flex flex-col pb-24 shadow-md z-[70]
  `;

  const renderProgressiveText = (text: string, baseColor: string, startIndex: number) => {
    return text.split('').map((char, index) => (
      <span 
        key={index}
        className={`transition-colors duration-300 group-hover:text-sky-400 ${baseColor}`}
        style={{ transitionDelay: `${(startIndex + index) * 35}ms` }}
      >
        {char}
      </span>
    ));
  };

  const handleLogoClick = () => {
    setMobileOpen(false);
    const mainContainer = document.getElementById('main-content');
    if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Header */}
        <div className={`py-6 pl-3 pr-3 flex items-center relative h-20 ${collapsed ? 'justify-center pl-0 pr-0' : ''}`}>
          <Link 
            to="/" 
            onClick={handleLogoClick}
            className="flex items-center gap-1 group overflow-hidden"
          >
            <img 
                src="https://pub-2da555791ab446dd9afa8c2352f4f9ea.r2.dev/media/logo-pinegroove.svg" 
                alt="Pinegroove Logo" 
                className="w-12 h-12 object-contain transition-transform duration-500 group-hover:rotate-12 flex-shrink-0"
            />
            {!collapsed && (
                <span className="font-archivo uppercase text-xl tracking-tight origin-left whitespace-nowrap flex">
                    {renderProgressiveText("PINE", "text-black dark:text-white", 0)}
                    {renderProgressiveText("GROOVE", "text-[#0288c4]", 4)}
                </span>
            )}
          </Link>
          <button onClick={() => setMobileOpen(false)} className="md:hidden absolute right-4">
            <X size={24} />
          </button>

          <button 
                onClick={() => setCollapsed(!collapsed)}
                className={`hidden md:flex absolute -right-3 top-7 w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full items-center justify-center text-zinc-500 hover:text-sky-500 shadow-sm z-[80]`}
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? (isDarkMode ? 'bg-sky-900/20 text-sky-400' : 'bg-white text-sky-700 shadow-sm') 
                    : (isDarkMode ? 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100' : 'hover:bg-gray-200/50')}
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : ''}
              >
                <Icon size={22} className="flex-shrink-0" />
                {!collapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}

          {/* Pro Banner - Moved inside the scrollable nav list as requested */}
          {!collapsed && session && !isPro && (
            <div className="pt-4 pb-2">
              <button 
                onClick={openSubscriptionCheckout}
                className="w-full p-4 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg hover:brightness-110 transition-all flex flex-col items-center gap-2 group"
              >
                <Zap className="group-hover:animate-pulse" size={20} />
                <span className="text-xs font-black uppercase tracking-wider">Upgrade to Pro</span>
              </button>
            </div>
          )}
        </nav>

        {/* Bottom Controls */}
        <div className={`p-4 border-t space-y-1 ${isDarkMode ? 'border-zinc-900' : 'border-zinc-300'}`}>
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-gray-200/50 text-zinc-600 hover:text-black'} ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? (isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode') : ''}
            >
                {isDarkMode ? <Sun size={22} className="flex-shrink-0" /> : <Moon size={22} className="flex-shrink-0" />}
                {!collapsed && <span className="font-medium whitespace-nowrap">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            
            {session ? (
              <>
                {/* Playlist Section */}
                <Link 
                    to="/my-playlist"
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === '/my-playlist' ? (isDarkMode ? 'bg-sky-900/20 text-sky-400' : 'bg-white text-sky-700 shadow-sm') : (isDarkMode ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-gray-200/50 text-zinc-600 hover:text-black')} ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? 'My Wishlist' : ''}
                >
                    <Heart size={22} className="flex-shrink-0" />
                    {!collapsed && <span className="font-medium whitespace-nowrap">My Wishlist</span>}
                </Link>

                {/* Account Section */}
                <Link 
                    to="/my-purchases"
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === '/my-purchases' ? (isDarkMode ? 'bg-sky-900/20 text-sky-400' : 'bg-white text-sky-700 shadow-sm') : (isDarkMode ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-gray-200/50 text-zinc-600 hover:text-black')} ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? 'My Account' : ''}
                >
                    <User size={22} className="flex-shrink-0" />
                    {!collapsed && <span className="font-medium whitespace-nowrap">My Account</span>}
                </Link>

                {/* Sign Out */}
                <button 
                    onClick={handleSignOut}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-red-500 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? 'Sign Out' : ''}
                >
                    <LogOut size={22} className="flex-shrink-0" />
                    {!collapsed && <span className="font-medium whitespace-nowrap">Sign Out</span>}
                </button>
              </>
            ) : (
              <Link 
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sky-500 hover:bg-sky-500/10 ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? 'Sign In' : ''}
              >
                  <User size={22} className="flex-shrink-0" />
                  {!collapsed && <span className="font-medium whitespace-nowrap">Sign In</span>}
              </Link>
            )}
        </div>
      </aside>
    </>
  );
};
