import React from 'react';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { Crown, Settings, Zap, ArrowRight, Calendar } from 'lucide-react';

export const SubscriptionDashboard: React.FC = () => {
  const { isSubscriber, renewsAt, isDarkMode } = useStore();
  const { openSubscriptionCheckout } = useSubscription();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isSubscriber) {
    return (
      <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-8 md:p-10 shadow-2xl text-white">
          {/* Decorative Background Icon */}
          <Crown className="absolute -right-12 -bottom-12 h-64 w-64 opacity-10 rotate-12" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-widest mb-4">
                <Crown size={14} /> ACTIVE PRO PLAN
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight drop-shadow-md">
                Unlimited Access Unlocked
              </h2>
              <p className="text-lg opacity-90 max-w-xl font-medium leading-relaxed mb-6">
                You have unlimited access to the entire catalog. Download any file at no extra cost and use the music in your commercial projects.
              </p>
              
              <div className="flex items-center gap-2 text-sm font-bold bg-black/10 w-fit px-4 py-2 rounded-lg">
                <Calendar size={16} />
                <span>Next renewal: {formatDate(renewsAt)}</span>
              </div>
            </div>

            <div className="shrink-0">
              <a 
                href="https://pinegroove.lemonsqueezy.com/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-yellow-700 hover:bg-yellow-50 font-black px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 group"
              >
                <Settings size={20} className="group-hover:rotate-45 transition-transform" />
                Manage Subscription
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className={`relative overflow-hidden rounded-3xl border p-8 md:p-10 transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">Upgrade to PRO Subscription</h2>
            <p className={`text-lg opacity-70 max-w-xl leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Unlock the entire catalog with a single subscription. Unlimited high-quality WAV downloads and commercial licenses included.
            </p>
          </div>

          <div className="shrink-0">
            <button 
              onClick={openSubscriptionCheckout}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-black px-8 py-4 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Zap size={20} />
              Upgrade to PRO <ArrowRight size={18} />
            </button>
          </div>
        </div>
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
          <div className="grid grid-cols-6 gap-4 p-4 h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <Zap key={i} className="w-full h-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};