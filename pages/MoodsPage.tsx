import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
// Changed react-router to react-router-dom to fix hook issues and missing export errors
import { Link } from 'react-router-dom';
import { Smile, ArrowLeft, Tag, Calendar, Music, Sun, Moon, Coffee, Heart, Sparkles, ChevronDown, Layers } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';

// Define the Category Structure
type MoodCategory = {
  title: string;
  icon: React.ReactNode;
  submoods: string[];
};

export const MoodsPage: React.FC = () => {
  const { isDarkMode } = useStore();
  
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Green/Teal/Emerald Gradients
  const gradients = [
    'bg-gradient-to-br from-emerald-500 to-green-600',
    'bg-gradient-to-br from-green-500 to-teal-600',
    'bg-gradient-to-br from-teal-500 to-cyan-600',
    'bg-gradient-to-br from-lime-600 to-green-700',
    'bg-gradient-to-br from-teal-600 to-emerald-700',
  ];

  // 1. Define the Macro-Categories based on user input
  const moodCategories: MoodCategory[] = [
    {
        title: "Positive & Energetic",
        icon: <Sun size={24} />,
        submoods: [
            'Happy', 'Joyful', 'Joyous', 'Cheerful', 'Upbeat', 'Uplifting', 'Positive', 
            'Feel-good', 'Exuberant', 'Vibrant', 'Triumphant', 'Energetic', 'Dynamic', 
            'Fast', 'Lively', 'Hectic', 'Breezy', 'Carefree', 'Playful', 'Whimsical', 
            'Quirky', 'Sassy', 'Confident', 'Celebratory', 'Festive', 'Glamorous', 
            'Heroic', 'Inspirational', 'Inspiring', 'Motivational', 'Optimistic', 'Powerful'
        ]
    },
    {
        title: "Dark, Tense & Dramatic",
        icon: <Moon size={24} />,
        submoods: [
            'Tense', 'Suspenseful', 'Suspense', 'Mysterious', 'Intriguing', 'Curious', 
            'Dark', 'Sinister', 'Ominous', 'Menacing', 'Aggressive', 'Macabre', 
            'Creepy', 'Eerie', 'Spooky', 'Frightening', 'Disturbing', 'Horror', 
            'Dramatic', 'Intense', 'Chaotic', 'Thrilling', 'Wild', 'Epic'
        ]
    },
    {
        title: "Reflective & Contemplative",
        icon: <Coffee size={24} />,
        submoods: [
            'Calm', 'Tranquil', 'Serene', 'Peaceful', 'Relaxation', 'Relaxed', 'Relaxing', 
            'Soothing', 'Cozy', 'Comfortable', 'Meditative', 'Dreamy', 'Ethereal', 
            'Enchanting', 'Magical', 'Mystical', 'Atmospheric', 'Contemplative', 
            'Pensive', 'Reflective', 'Thoughtful', 'Introspective', 'Moody', 
            'Nostalgic', 'Melancholic', 'Melancholy', 'Gloomy', 'Lonesome', 'Hurt', 
            'Sad', 'Tragical'
        ]
    },
    {
        title: "Emotion & Passion",
        icon: <Heart size={24} />,
        submoods: [
            'Romantic', 'Emotional', 'Passionate', 'Erotic', 'Seductive', 'Sensual', 
            'Sexy', 'Flirtatious', 'Tender', 'Intimate', 'Heartwarming', 'Sentimental', 
            'Soulful'
        ]
    },
    {
        title: "Themes & Styles",
        icon: <Sparkles size={24} />,
        submoods: [
            'Adventure', 'Adventurous', 'Majestic', 'Groovy', 'Rhythmic', 'Percussion', 
            'Elegant', 'Chic', 'Cool', 'Charming', 'Luxurious', 'Regal', 'Beautiful', 
            'Exotic', 'Psychedelic', 'Experimental', 'Orchestral', 'Score', 'Synth', 
            'Corporate', 'Comedic', 'Funny', 'Humorous', 'Noire'
        ]
    }
  ];

  // State to hold moods found in DB that are NOT in the categories above
  const [uncategorizedMoods, setUncategorizedMoods] = useState<string[]>([]);

  useEffect(() => {
    const fetchMoods = async () => {
      // Use the new squeeze_tracks table to fetch moods
      const { data } = await supabase.from('squeeze_tracks').select('mood');
      if (data) {
        const allDbMoods = (data as any[])
          .flatMap((track: any) => track.mood || [])
          .filter((m: any): m is string => typeof m === 'string' && m.length > 0);
        
        const uniqueDbMoods = Array.from(new Set(allDbMoods));
        
        // Flatten all categorized moods for comparison (lowercase)
        const categorizedSet = new Set(moodCategories.flatMap(c => c.submoods.map(s => s.toLowerCase())));
        
        // Find leftovers
        const leftovers = uniqueDbMoods.filter(m => !categorizedSet.has(m.toLowerCase())).sort();
        
        if (leftovers.length > 0) {
            setUncategorizedMoods(leftovers);
        }
      }
    };
    fetchMoods();
  }, []);

  const toggleCategory = (title: string) => {
    if (expandedCategories.includes(title)) {
        setExpandedCategories(expandedCategories.filter(t => t !== title));
    } else {
        setExpandedCategories([...expandedCategories, title]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
        <SEO title="Browse Music by Mood" description="Filter royalty free music by emotion. Inspiring, Happy, Dark, Dramatic, and more." />
        
        {/* Navigation Header */}
        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm font-medium">
            <Link to="/library" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <ArrowLeft size={16} /> Back to Library
            </Link>
            <div className="h-4 w-px bg-current opacity-20 hidden sm:block"></div>
            <Link to="/categories/genres" className="flex items-center gap-2 text-sky-500 hover:text-sky-600 hover:underline">
                <Tag size={16} /> Browse by Genre
            </Link>
             <Link to="/categories/instruments" className="flex items-center gap-2 text-sky-500 hover:text-sky-600 hover:underline">
                <Music size={16} /> Browse by Instrument
            </Link>
            <Link to="/categories/seasonal" className="flex items-center gap-2 text-sky-500 hover:text-sky-600 hover:underline">
                <Calendar size={16} /> Browse by Season
            </Link>
        </div>

        <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 tracking-tight">
                <Smile className="text-emerald-500" size={40} /> MOODS
            </h1>
            <p className="text-xl opacity-70 max-w-2xl mx-auto">
                Find the perfect emotional tone for your project. Click a card to reveal specific moods.
            </p>
        </div>

        {/* Grid System matching GenresPage */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1920px] mx-auto">
            {moodCategories.map((category, index) => {
                const isExpanded = expandedCategories.includes(category.title);
                const gradient = Object.values(gradients)[index % gradients.length];
                
                return (
                    <div 
                        key={category.title} 
                        className={`
                            rounded-2xl overflow-hidden shadow-md transition-all duration-300
                            ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}
                            ${isExpanded ? 'ring-2 ring-emerald-500/50 shadow-xl' : 'hover:shadow-lg'}
                        `}
                    >
                        {/* Header Area (Clickable) */}
                        <button 
                            onClick={() => toggleCategory(category.title)}
                            className={`
                                w-full h-20 flex items-center justify-between px-6 text-white transition-all
                                ${gradient}
                                ${isExpanded ? 'brightness-110' : 'hover:brightness-105'}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    {category.icon}
                                </div>
                                <h2 className="text-lg md:text-xl font-bold text-left leading-tight drop-shadow-sm">
                                    {category.title}
                                </h2>
                            </div>
                            
                            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                <ChevronDown size={24} className="text-white/80" />
                            </div>
                        </button>

                        {/* Content Area (Collapsible) */}
                        <div 
                            className={`
                                overflow-hidden transition-all duration-300 ease-in-out
                                ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                            `}
                        >
                            <div className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {category.submoods.map((mood) => (
                                        <Link
                                            key={mood}
                                            to={`/library?search=${encodeURIComponent(mood)}`}
                                            className={`
                                                px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                                                ${isDarkMode 
                                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500' 
                                                    : 'bg-gray-50 border-zinc-200 text-zinc-600 hover:text-white hover:bg-emerald-500 hover:border-emerald-500'}
                                            `}
                                        >
                                            {mood}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* "More Moods" Card (Fallback) */}
            {uncategorizedMoods.length > 0 && (
                <div 
                    className={`
                        rounded-2xl overflow-hidden shadow-md transition-all duration-300
                        ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}
                        ${expandedCategories.includes('More Moods') ? 'ring-2 ring-emerald-500/50 shadow-xl' : 'hover:shadow-lg'}
                    `}
                >
                    <button 
                        onClick={() => toggleCategory('More Moods')}
                        className={`
                            w-full h-20 flex items-center justify-between px-6 text-white transition-all
                            bg-gradient-to-br from-slate-500 to-zinc-600
                            hover:brightness-105
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                <Layers size={24} />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-left leading-tight drop-shadow-sm">
                                More Moods
                            </h2>
                        </div>
                        <div className={`transform transition-transform duration-300 ${expandedCategories.includes('More Moods') ? 'rotate-180' : 'rotate-0'}`}>
                            <ChevronDown size={24} className="text-white/80" />
                        </div>
                    </button>

                    <div 
                        className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${expandedCategories.includes('More Moods') ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                        `}
                    >
                        <div className="p-6">
                            <div className="flex flex-wrap gap-2">
                                {uncategorizedMoods.map((mood) => (
                                    <Link
                                        key={mood}
                                        to={`/library?search=${encodeURIComponent(mood)}`}
                                        className={`
                                            px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                                            ${isDarkMode 
                                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500' 
                                                : 'bg-gray-50 border-zinc-200 text-zinc-600 hover:text-white hover:bg-emerald-500 hover:border-emerald-500'}
                                        `}
                                    >
                                        {mood}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
