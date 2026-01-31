import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SEO } from '../components/SEO';
import { Check, Info, ShieldAlert, Tag, Zap, Crown, Globe, Tv, ArrowRight, Ticket, Copy, ShieldCheck, HelpCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Coupon, PricingItem } from '../types';

export const Pricing: React.FC = () => {
  const { isDarkMode, session, isSubscriber } = useStore();
  const { openSubscriptionCheckout } = useSubscription();
  const [pricingMode, setPricingMode] = useState<'pay-per-track' | 'subscription'>('pay-per-track');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pricingData, setPricingData] = useState<PricingItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  const couponGradients = [
    { bg: 'bg-gradient-to-br from-blue-600 to-sky-800', shadow: 'shadow-blue-500/20' },
    { bg: 'bg-gradient-to-br from-indigo-600 to-purple-800', shadow: 'shadow-purple-500/20' },
    { bg: 'bg-gradient-to-br from-zinc-800 to-zinc-950', shadow: 'shadow-zinc-500/20' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Coupons
      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .not('discount_code', 'is', null);
      if (couponData) setCoupons(couponData as Coupon[]);

      // Fetch dynamic prices
      const { data: pData } = await supabase
        .from('pricing')
        .select('*');
      if (pData) setPricingData(pData as PricingItem[]);
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

  // Pricing Helpers
  const getPrice = (type: string, defaultPrice: string) => {
    const item = pricingData.find(p => p.product_type === type);
    if (!item) return defaultPrice;
    return `${item.currency} ${item.price}`;
  };

  const payPerTrackItems = useMemo(() => [
    {
      title: "Standard Sync License",
      icon: <Globe className="text-sky-500" size={32} />,
      prices: [
        { label: "Single Track", value: getPrice('single_track_standard', '€ 9.99') },
        { label: "Music Pack", value: getPrice('music_pack_standard', '€ 49.99') }
      ],
      features: [
        "Web, Social Media & Podcast",
        "Personal & Client Use",
        "School Projects & Charity Films",
        "Monetize 1 Social Media Channel"
      ],
      footer: "Perpetual License - Re-download anytime from your account."
    },
    {
      title: "Extended Sync License",
      icon: <Tv className="text-amber-500" size={32} />,
      prices: [
        { label: "Single Track", value: getPrice('single_track_extended', '€ 39.99') },
        { label: "Music Pack", value: getPrice('music_pack_extended', '€ 69.99') }
      ],
      features: [
        "TV, Radio, Film & Apps",
        "Advertising & Games",
        "Industrial Use & OTT/VOD",
        "Unlimited DVD Distribution",
        "Monetize 5 Social Media Channels"
      ],
      footer: "Perpetual License - Re-download anytime from your account."
    }
  ], [pricingData]);

  const proPrice = useMemo(() => {
    const item = pricingData.find(p => p.product_type === 'full_catalog');
    if (!item) return "€ 99";
    return `${item.currency} ${item.price}`;
  }, [pricingData]);

  const prohibitedUses = [
    "Sell, resell, trade in, or give away the music to any other party or otherwise distribute the music \"as is.\"",
    "Create/produce new musical works based on the music (musical compositions, songs) or using AI tools to alter the music or for AI dataset learning.",
    "No Stand-alone use: You cannot use/include the music in music compilations (CDs, DVDs, or digital albums) or as stand-alone elements. This applies strictly to Podcasts: the music must be used as a background element synchronized with voice-over or other primary content.",
    "Record the music under any Content ID fingerprinting system such as AdRev, Identifyy, TuneCore, etc.",
    "Redistribute the music as a part of different multimedia templates (e.g., website templates, video templates, slideshow templates) subsequently offered to multiple end-users.",
    "Use or redistribute the music as a part of different multimedia templates (e.g., website templates, video templates, slideshow templates) subsequently offered to multiple end-users.",
    "Use or redistribute the music as a part of telephone or mobile phone ringtones."
  ];

  return (
    <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 pt-2 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SEO title="Pricing & Licenses" description="Clear and simple music licensing for your projects. Choose between lifetime pay-per-track licenses or an unlimited yearly subscription." />

      {/* Header with Overflowing Dynamic Logo - Background set to transparent */}
      <div className="relative rounded-3xl py-12 mb-10 group z-0 transition-all duration-500 bg-transparent">
        
        {/* Overflowing Logo Layer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[-1] pointer-events-none">
            <img 
                src="https://media.pinegroove.net/media/logo-pinegroove.svg" 
                alt="" 
                className={`
                  w-[800px] h-[800px] max-w-none transition-all duration-1000 ease-out
                  transform -rotate-12 group-hover:rotate-6 group-hover:scale-110
                  ${isDarkMode ? 'opacity-[0.18] group-hover:opacity-[0.28]' : 'opacity-[0.12] group-hover:opacity-[0.22]'}
                `}
            />
        </div>

        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-4 tracking-tight drop-shadow-sm uppercase">Licensing & Pricing</h1>
          <p className="text-xl md:text-2xl opacity-70 max-w-3xl mx-auto font-medium">Flexible options for creators, from single tracks to unlimited access.</p>
        </div>
      </div>

      {/* Toggle Container */}
      <div className="relative z-20 flex justify-center mb-16">
        <div className={`p-1.5 rounded-2xl flex items-center border ${isDarkMode ? 'bg-zinc-950 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <button
            onClick={() => setPricingMode('pay-per-track')}
            className={`
                relative px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                ${pricingMode === 'pay-per-track'
                    ? (isDarkMode ? 'bg-zinc-800 text-sky-400 shadow-md' : 'bg-zinc-100 text-sky-600 shadow-sm')
                    : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')
                }
            `}
          >
            Pay-Per-Track
          </button>
          <button
            onClick={() => setPricingMode('subscription')}
            className={`
                relative px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                ${pricingMode === 'subscription'
                    ? (isDarkMode ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20' : 'bg-sky-600 text-white shadow-lg shadow-sky-500/20')
                    : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')
                }
            `}
          >
            Pro Subscription
          </button>
        </div>
      </div>

      {/* Main Pricing Section */}
      <div className="relative z-20 mb-20 w-full">
        {pricingMode === 'pay-per-track' ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {payPerTrackItems.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-8 md:p-12 border flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-lg'
                }`}
              >
                <div className="mb-6 flex items-center justify-between">
                  {item.icon}
                  <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white shadow-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-500'}`}>
                      Lifetime License
                  </div>
                </div>
                <h3 className="text-3xl font-black mb-8 tracking-tight">{item.title}</h3>
                
                <div className="space-y-6 mb-10">
                  {item.prices.map((p, pIdx) => (
                    <div key={pIdx} className="flex items-end justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-sm opacity-60 font-black uppercase tracking-wider">{p.label}</span>
                      <span className="text-4xl font-black text-sky-600 dark:text-sky-400">{p.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 space-y-5 mb-12">
                  {item.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-4">
                      <div className="mt-1 p-1 bg-emerald-500/10 rounded-full">
                        <Check size={16} className="text-emerald-500 shrink-0" />
                      </div>
                      <span className="text-base font-medium opacity-80">{f}</span>
                    </div>
                  ))}
                </div>

                <div className={`p-6 rounded-2xl text-xs font-medium italic ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-50 text-zinc-600'}`}>
                  <div className="flex gap-3 items-start">
                    <Info size={16} className="shrink-0 mt-0.5 opacity-60 text-sky-500" />
                    <p>{item.footer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 p-8 md:p-16 text-white shadow-2xl transition-all hover:scale-[1.005]">
              <Crown className="absolute -right-12 -bottom-12 h-80 w-80 opacity-10 rotate-12" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest mb-8">
                  <Zap size={16} className="text-yellow-300" /> Full Access & Commercial Rights
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                  <div>
                    <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-4">PRO Subscription</h2>
                    <p className="text-xl opacity-80 font-medium max-w-xl">The ultimate toolkit for filmmakers, agencies and professional creators.</p>
                  </div>
                  <div className="text-6xl md:text-7xl font-black drop-shadow-xl text-right">
                    {proPrice} <span className="text-2xl opacity-70 font-bold">/ year</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-16 gap-y-6 mb-12 py-12 border-y border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl"><Check size={24} className="text-white" /></div>
                    <span className="text-lg font-bold">Full access to all catalog content</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl"><Check size={24} className="text-white" /></div>
                    <span className="text-lg font-bold">Web & Social (Unlimited Channels)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl"><Check size={24} className="text-white" /></div>
                    <span className="text-lg font-bold">Podcasts & Radio Broadcasting</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl"><Check size={24} className="text-white" /></div>
                    <span className="text-lg font-bold">TV, Film, Advertising & Games</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl"><Check size={24} className="text-white" /></div>
                    <span className="text-lg font-bold">OTT & VOD Platforms included</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl"><Check size={24} className="text-white" /></div>
                    <span className="text-lg font-bold">Includes all Extended license rights</span>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  {isSubscriber ? (
                    <button
                      onClick={() => navigate('/my-purchases')}
                      className="w-full py-6 bg-emerald-500 text-white font-black text-2xl rounded-2xl shadow-2xl transition-all hover:bg-emerald-400 active:scale-95 flex items-center justify-center gap-4"
                    >
                      <Crown size={28} />
                      Unlimited Access Unlocked
                      <ArrowRight size={24} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubscribeClick}
                      className="w-full py-6 bg-white text-sky-700 font-black text-2xl rounded-2xl shadow-2xl transition-all hover:bg-sky-50 active:scale-95"
                    >
                      Activate PRO Subscription
                    </button>
                  )}
                  <div className="flex items-start gap-3 text-xs opacity-80 italic max-w-2xl mx-auto text-center">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p>Upon subscription expiration, re-downloading tracks or licensing for new projects is not possible. Projects completed during an active subscription remain licensed forever.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Promos Section */}
      {coupons.length > 0 && (
        <div className="relative z-20 max-w-6xl mx-auto mb-16">
          <div className={`rounded-[2.5rem] p-8 md:p-14 border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-sky-500/10 rounded-2xl">
                <Ticket className="text-sky-500" size={32} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Active Promos</h2>
            </div>
            
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
          </div>
        </div>
      )}

      {/* Legal & Restrictions Section */}
      <div className="relative z-20 max-w-6xl mx-auto space-y-12">
        {/* Strictly Prohibited Uses - Updated to match UserLicenseAgreement style */}
        <div className={`rounded-[2.5rem] p-8 md:p-14 border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-red-500/10 rounded-2xl">
              <ShieldAlert className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Strictly Prohibited Uses</h2>
          </div>
          
          <p className="text-lg opacity-70 mb-10 font-medium max-w-3xl">Under any license type (Pay-per-track or Subscription), it is strictly forbidden to:</p>
          
          <div className="space-y-6">
            {prohibitedUses.map((text, idx) => (
              <div key={idx} className="flex gap-4 items-start group">
                <span className="font-black text-red-500 bg-red-500/10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    {String.fromCharCode(65 + idx)}
                </span>
                <p className={`text-base leading-relaxed font-medium opacity-80 pt-1.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-dashed border-zinc-300 dark:border-zinc-700 text-center">
            <p className="text-sm opacity-70 font-medium">Need a custom license or have specific questions about bulk licensing? <a href="mailto:info@pinegroove.net" className="text-sky-500 hover:underline font-black px-1">Contact our legal team</a>.</p>
          </div>
        </div>

        {/* Refund Policy Section */}
        <div id="refund-policy" className={`rounded-3xl p-8 md:p-10 border transition-all ${isDarkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-zinc-50/50 border-zinc-200'}`}>
          <div className="flex items-center gap-3 mb-6 opacity-80">
            <HelpCircle size={22} className="text-sky-500" />
            <h2 className="text-xl font-black tracking-tight uppercase">Refund Policy</h2>
          </div>
          
          <p className={`text-sm md:text-base leading-relaxed max-w-4xl ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Due to the digital nature of our products (audio files), <strong>all sales are final</strong>. 
            Once you have purchased a track or a subscription and gained access to the digital files, 
            we cannot offer refunds, returns, or exchanges. By completing your purchase, 
            you acknowledge and agree to this policy. We encourage you to listen to the full previews 
            available on our site before making a purchase. If you experience any technical issues with your download, 
            please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};