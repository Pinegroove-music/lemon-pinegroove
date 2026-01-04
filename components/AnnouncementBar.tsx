
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Coupon } from '../types';
import { X, Ticket, Copy, Check, Zap } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Define a set of premium gradients to rotate through
  const gradients = [
    'from-sky-600 via-indigo-600 to-blue-700',
    'from-emerald-600 via-teal-600 to-cyan-700',
    'from-violet-600 via-purple-600 to-indigo-700',
    'from-rose-600 via-pink-600 to-orange-600',
    'from-amber-500 via-orange-600 to-red-600',
    'from-blue-700 via-sky-700 to-indigo-800'
  ];

  useEffect(() => {
    const fetchCoupons = async () => {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .not('discount_code', 'is', null)
        .order('discount_percent', { ascending: false });
      
      if (data && data.length > 0) {
        setCoupons(data as Coupon[]);
      }
    };
    fetchCoupons();
  }, []);

  // Rotate coupons if there are multiple
  useEffect(() => {
    if (coupons.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % coupons.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [coupons.length]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isVisible || coupons.length === 0) return null;

  const currentCoupon = coupons[currentIndex];
  const currentGradient = gradients[currentIndex % gradients.length];

  return (
    <div className={`bg-gradient-to-r ${currentGradient} text-white relative z-[60] shadow-md border-b border-white/10 overflow-hidden animate-in slide-in-from-top duration-500 transition-all duration-1000 ease-in-out`}>
      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex items-center justify-center gap-4 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-wider">
        <div className="flex items-center gap-3 animate-pulse-slow">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
            <Ticket size={14} className="text-white opacity-80" />
            <span className="hidden sm:inline">Active Promo:</span>
          </div>
          
          <div className="flex items-center gap-2 transition-all duration-500">
            <span className="opacity-90">Save {currentCoupon.discount_percent}% with code</span>
            <button 
              onClick={() => handleCopy(currentCoupon.discount_code)}
              className={`
                flex items-center gap-2 px-3 py-1 rounded-lg border-2 border-dashed transition-all active:scale-95
                ${copiedCode === currentCoupon.discount_code 
                  ? 'bg-emerald-500 border-emerald-400 text-white scale-105' 
                  : 'bg-black/20 border-white/30 hover:bg-black/40 text-white'}
              `}
              title="Click to copy code"
            >
              <span className="font-mono text-base tracking-[0.2em]">{currentCoupon.discount_code}</span>
              {copiedCode === currentCoupon.discount_code ? (
                <Check size={14} className="animate-bounce" />
              ) : (
                <Copy size={14} className="opacity-50" />
              )}
            </button>
          </div>
          
          <div className="hidden lg:flex items-center gap-1.5 opacity-60">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <span className="italic normal-case font-medium">{currentCoupon.discount_description}</span>
          </div>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
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
