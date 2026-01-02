import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Cookie, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDarkMode } = useStore();

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem('pinegroove_cookie_consent');
    if (!consent) {
      // Small delay for better UX entrance
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pinegroove_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
        className={`
            fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[60] 
            p-6 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-10 fade-in duration-500
            ${isDarkMode ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-800'}
            backdrop-blur-md
        `}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full shrink-0 ${isDarkMode ? 'bg-sky-900/30 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
            <Cookie size={24} />
        </div>
        
        <div className="flex-1">
            <h4 className="font-bold text-sm mb-1">We use cookies</h4>
            <p className="text-xs opacity-70 leading-relaxed mb-4">
                We use cookies to ensure you get the best experience on our website, including audio playback settings and cart functionality.
            </p>
            
            <div className="flex gap-2">
                <button 
                    onClick={handleAccept}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                    Accept
                </button>
                <button 
                    onClick={handleAccept} // Treating close as accept for simple compliance, or just dismiss
                    className={`px-3 py-2.5 rounded-lg border transition-colors ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'}`}
                    aria-label="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};