
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { X, Crown, ArrowRight, Zap } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { session, isSubscriber } = useStore();
  const { openSubscriptionCheckout } = useSubscription();
  const navigate = useNavigate();

  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      navigate('/auth');
    } else if (isSubscriber) {
      navigate('/my-purchases');
    } else {
      openSubscriptionCheckout();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 text-white relative z-[60] shadow-md border-b border-white/10 overflow-hidden animate-in slide-in-from-top duration-500">
      <div 
        className="max-w-[1920px] mx-auto px-4 py-2.5 flex items-center justify-center cursor-pointer group"
        onClick={handleSubscribeClick}
      >
        <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-wider">
          <div className="flex items-center gap-2 animate-pulse-slow">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
              <Crown size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white">PRO ACCESS</span>
            </div>
            
            <div className="flex items-center gap-2 transition-all duration-500">
              <span className="opacity-90">Unlock Unlimited Access to the entire catalog</span>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white text-sky-700 rounded-lg shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-[10px] font-black">{isSubscriber ? 'MANAGE PLAN' : 'GET STARTED'}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100"
          aria-label="Dismiss announcement"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Decorative pulse line */}
      <div className="absolute bottom-0 left-0 h-[1px] bg-white/20 w-full animate-shimmer" />
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
};
