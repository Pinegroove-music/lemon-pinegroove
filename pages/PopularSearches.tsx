
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { SEOPlaylist } from '../types';
import { useStore } from '../store/useStore';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, ListMusic, Loader2 } from 'lucide-react';

export const PopularSearches: React.FC = () => {
  const { isDarkMode } = useStore();
  const [playlists, setPlaylists] = useState<SEOPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seo_playlists')
        .select('*')
        .eq('is_published', true)
        .order('title', { ascending: true });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (err) {
      console.error("Error fetching SEO playlists:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-32">
      <SEO 
        title="Popular Music Searches & Curated Playlists" 
        description="Explore our most popular royalty-free music categories. From cinematic scores to corporate backgrounds, find the perfect sound for your project."
      />

      {/* Hero Section */}
      <div className="relative pt-32 pb-16 md:pt-48 md:pb-24 overflow-hidden border-b border-zinc-100 dark:border-zinc-800">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 text-[10px] font-black uppercase tracking-widest mb-6">
            <Search size={14} /> Content Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight uppercase">
            Popular <span className="text-sky-500">Searches</span>
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-3xl mx-auto font-medium leading-relaxed">
            Quickly navigate through our most requested musical styles. Our curated playlists are designed to help you find the exact mood, genre, or theme for your professional video productions.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 mt-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="animate-spin text-sky-500 mb-4" size={40} />
            <p className="font-bold uppercase tracking-widest text-xs">Loading categories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {playlists.map((playlist) => (
              <Link 
                key={playlist.id}
                to={`/royalty-free-music/${playlist.slug}`}
                className={`
                  group relative aspect-[16/9] rounded-[2rem] overflow-hidden border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2
                  ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl shadow-sky-500/5'}
                `}
              >
                <img 
                  src={playlist.hero_image_url || "https://media.pinegroove.net/media/bg_pinegroove12.avif"} 
                  alt={playlist.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                {/* Overlay shadow for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all"></div>
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="flex items-center gap-2 text-sky-400 text-[10px] font-black uppercase tracking-widest mb-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <ListMusic size={14} /> View Collection
                    </div>
                    {/* Fixed white color using !important utility */}
                    <h2 className="text-2xl md:text-3xl font-black !text-white leading-tight drop-shadow-2xl transition-colors">
                        {playlist.title}
                    </h2>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* SEO Rich Text Section */}
        <div className={`mt-24 p-10 md:p-16 rounded-[3rem] border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-sky-500 rounded-2xl text-white shadow-lg shadow-sky-500/20">
                        <Sparkles size={24} />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">The Best Royalty Free Music Library</h3>
                </div>
                
                <div className={`prose prose-lg ${isDarkMode ? 'prose-invert' : ''} max-w-none opacity-80 leading-relaxed font-medium`}>
                    <p>
                        Searching for the perfect soundtrack can be overwhelming. That's why we've organized our catalog into <strong>popular searches</strong> and curated playlists, making it easier than ever to discover high-quality audio that fits your creative vision.
                    </p>
                    <p>
                        Whether you are a YouTube creator looking for <strong>vlog background music</strong>, a filmmaker in need of <strong>cinematic orchestral scores</strong>, or a marketing agency searching for <strong>inspiring corporate tracks</strong>, our collection offers diverse options with simple, clear licensing terms.
                    </p>
                    <p>
                        All tracks in these collections are meticulously composed and produced by Francesco Biondi, ensuring a consistent premium quality across the entire library. Each playlist is updated regularly with new releases, keeping your projects sounding fresh and contemporary.
                    </p>
                </div>

                <div className="pt-8 border-t border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-sm font-bold opacity-40 uppercase tracking-widest italic">
                        Quality you can hear. Licenses you can trust.
                    </p>
                    <Link to="/library" className="inline-flex items-center gap-2 text-sky-500 font-black uppercase tracking-widest text-sm group hover:underline">
                        Explore Full Catalog <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
