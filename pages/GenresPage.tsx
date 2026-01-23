import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
// Changed react-router to react-router-dom to fix hook issues and missing export errors
import { Link } from 'react-router-dom';
import { Tag, ArrowLeft, Smile, Calendar, Music, Clapperboard, Briefcase, Zap, Guitar, Coffee, Mic2, Globe, Cloud, Layers, Package, ChevronDown, ChevronUp, Waves } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';

// Define the Category Structure
type GenreCategory = {
  title: string;
  icon: React.ReactNode;
  subgenres: string[];
};

export const GenresPage: React.FC = () => {
  const { isDarkMode } = useStore();
  
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Blue/Purple/Sky Gradients (Matching Home Page)
  const gradients = [
    'bg-gradient-to-br from-sky-500 to-blue-600',
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-indigo-500 to-violet-600',
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-sky-600 to-indigo-700',
    'bg-gradient-to-br from-blue-600 to-violet-700',
  ];

  // 1. Define the Macro-Categories
  const genreCategories: GenreCategory[] = [
    {
        title: "Cinematic & Film Score",
        icon: <Clapperboard size={24} />,
        subgenres: ['Action', 'Adventure', 'Broadway', 'Cinematic', 'Epic', 'Drama', 'Dramedy', 'Film Noir', 'Fantasy', 'Horror', 'Hybrid', 'Industrial', 'Military', 'Orchestral', 'Patriotic', 'Quirky', 'Romantic', 'Sci-Fi', 'Score', 'Sitcom', 'Spaghetti Western', 'Soundtrack', 'Thriller', 'Trailer', 'Comedy']
    },
    {
        title: "Corporate & Business",
        icon: <Briefcase size={24} />,
        subgenres: ['Business', 'Corporate', 'Documentary', 'Inspiring', 'Motivational', 'News', 'Presentation', 'Tech']
    },
    {
        title: "Pop & Electronic",
        icon: <Zap size={24} />,
        subgenres: ["80's", 'Breakbeat', 'Club', 'Dance', 'EDM', 'Electro', 'Electronica', 'Electro Pop', 'Future', 'Glitch', 'House', 'Jungle', 'Pop', 'Pop Rock', 'Retrowave', 'Synthpop', 'Synthwave', 'Techno', 'Trance', 'Trap', 'Tropical House', 'Vaporwave', 'Vocals']
    },
    {
        title: "Rock",
        icon: <Guitar size={24} />,
        subgenres: ['Alternative', 'Blues', 'Boogie Woogie', 'Doo-wop', 'Garage', 'Grunge', 'Hard Rock', 'Indie', 'Jive', 'Metal', 'Psychedelia', 'Punk', 'Rock', "Rock'n'Roll", 'Rockabilly', 'Ska']
    },
    {
        title: "Ambient & Chill",
        icon: <Cloud size={24} />,
        subgenres: ['Ambient', 'Atmospheric', 'Chillhop', 'Chillout', 'Chillstep', 'Chillwave', 'Deep House', 'Downtempo', 'Drone', 'Easy Listening', 'Exotica', 'J-Pop', 'Lo-Fi', 'Lounge', 'Meditation', 'Minimal', 'New Age', 'Piano', 'Relaxing', 'Smooth Jazz', 'Trip Hop']
    },
    {
        title: "Country & Folk",
        icon: <Coffee size={24} />,
        subgenres: ['Acoustic', 'Americana', 'Bavarian Folk', 'Bluegrass', 'Country', 'Western', 'Serenade', 'Folk', 'Polka', 'Organic', 'Singer-Songwriter', 'Traditional']
    },
    {
        title: "Jazz",
        icon: (
            // Custom Trumpet Icon
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 8v8" />
                <path d="M9 8v8" />
                <path d="M13 8v8" />
                <path d="M2 12h3" />
                <path d="M13 11h2l5-4v10l-5-4h-2" />
            </svg>
        ), 
        subgenres: ['Bebop', 'Big Band', 'Charleston', 'Dixieland', 'Electro Swing', 'Swing', 'Gospel', 'Gypsy', 'Jazz', 'Musical', 'Ragtime', 'Swing']
    },
    {
        title: "Classical",
        icon: <Music size={24} />,
        subgenres: ['Ballet', 'Baroque', 'Cancan', 'Chamber Music', 'Choir', 'Classical', 'Concerto', 'Contemporary', 'Fanfare', 'Neoclassical', 'Opera', 'Orchestral', 'Requiem', 'Romanticism', 'Symphonic', 'Waltz']
    },
    {
        title: "Funk & Groove",
        icon: (
            // Custom Drum Icon
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="7" rx="10" ry="5" />
                <path d="M2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5v-10" />
            </svg>
        ),
        subgenres: ['Afro-Funk', 'Disco', 'Funk', 'Groove', 'Hip Hop', 'Nu Disco', 'Rap', 'R&B', 'Soul', 'Urban']
    },
    {
        title: "World",
        icon: <Globe size={24} />,
        subgenres: ['African', 'Afrobeat', 'Arabic', 'Asian', 'Balkan', 'Bhangra', 'Bollywood', 'Calypso', 'Celtic', 'Chinese', 'Ethnic', 'Ethno', 'French', 'Hawaiian', 'Indian', 'Indigenous', 'Irish', 'Italian', 'Italian Folk', 'Jig', 'Klezmer', 'Middle Eastern', 'Musette', 'Native American', 'Polynesian', 'Tarantella', 'Tribal', 'World']
    },
     {
        title: "Latin",
        icon: <Waves size={24} />,
        subgenres: ['Afro-Cuban', 'Bossa Nova', 'Caribbean', 'Cha-cha-cha', 'Cuban Son', 'Flamenco', 'Latin', 'Latin Jazz', 'Mambo', 'Mariachi', 'Mexican', 'Reggae', 'Reggaeton', 'Rhumba', 'Salsa', 'Samba', 'Tango', 'Tropical']
    },
    {
        title: "Children's",
        icon: <Smile size={24} />,
        subgenres: ["Anime", "Children's Music", "Lullaby", "Cartoon", "Circus"]
    },
    {
        title: "Holiday & Seasonal",
        icon: <Calendar size={24} />,
        subgenres: ['Christmas', 'Halloween', 'Holiday Music', 'Carol', 'Christian', 'Marching band']
    }
  ];

  // State to hold genres found in DB that are NOT in the categories above
  const [uncategorizedGenres, setUncategorizedGenres] = useState<string[]>([]);

  useEffect(() => {
    const fetchGenres = async () => {
      // Fetch genres from the new squeeze_tracks table
      const { data } = await supabase.from('squeeze_tracks').select('genre');

      if (data) {
        const allDbGenres = (data as any[])
          .flatMap((track: any) => track.genre || [])
          .filter((g: any): g is string => typeof g === 'string' && g.length > 0);
        
        const uniqueDbGenres = Array.from(new Set(allDbGenres));
        const categorizedSet = new Set(genreCategories.flatMap(c => c.subgenres.map(s => s.toLowerCase())));
        const leftovers = uniqueDbGenres.filter(g => !categorizedSet.has(g.toLowerCase())).sort();
        
        if (leftovers.length > 0) {
            setUncategorizedGenres(leftovers);
        }
      }
    };
    fetchGenres();
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
        <SEO title="Browse Music by Genre" description="Explore our catalog categorized by Cinematic, Corporate, Rock, Electronic, and more." />
        
        {/* Navigation Header */}
        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm font-medium">
            <Link to="/library" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <ArrowLeft size={16} /> Back to Library
            </Link>
            <div className="h-4 w-px bg-current opacity-20 hidden sm:block"></div>
            <Link to="/categories/moods" className="flex items-center gap-2 text-sky-500 hover:text-sky-600 hover:underline">
                <Smile size={16} /> Browse by Mood
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
                <Tag className="text-sky-500" size={40} /> GENRES
            </h1>
            <p className="text-xl opacity-70 max-w-2xl mx-auto">
                Explore our music library by category. Click a card to reveal subgenres.
            </p>
        </div>

        {/* 3-Column Grid for Desktop, 1-Column for Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1920px] mx-auto">
            {genreCategories.map((category, index) => {
                const isExpanded = expandedCategories.includes(category.title);
                const gradient = Object.values(gradients)[index % gradients.length];
                
                return (
                    <div 
                        key={category.title} 
                        className={`
                            rounded-2xl overflow-hidden shadow-md transition-all duration-300
                            ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}
                            ${isExpanded ? 'ring-2 ring-sky-500/50 shadow-xl' : 'hover:shadow-lg'}
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
                                ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                            `}
                        >
                            <div className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {category.subgenres.map((genre) => (
                                        <Link
                                            key={genre}
                                            to={`/library?search=${encodeURIComponent(genre)}`}
                                            className={`
                                                px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                                                ${isDarkMode 
                                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-sky-600 hover:border-sky-500' 
                                                    : 'bg-gray-50 border-zinc-200 text-zinc-600 hover:text-white hover:bg-sky-500 hover:border-sky-500'}
                                            `}
                                        >
                                            {genre}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* "More Genres" Card */}
            {uncategorizedGenres.length > 0 && (
                <div 
                    className={`
                        rounded-2xl overflow-hidden shadow-md transition-all duration-300
                        ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}
                        ${expandedCategories.includes('More Genres') ? 'ring-2 ring-sky-500/50 shadow-xl' : 'hover:shadow-lg'}
                    `}
                >
                    <button 
                        onClick={() => toggleCategory('More Genres')}
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
                                More Genres
                            </h2>
                        </div>
                        <div className={`transform transition-transform duration-300 ${expandedCategories.includes('More Genres') ? 'rotate-180' : 'rotate-0'}`}>
                            <ChevronDown size={24} className="text-white/80" />
                        </div>
                    </button>

                    <div 
                        className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${expandedCategories.includes('More Genres') ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                        `}
                    >
                        <div className="p-6">
                            <div className="flex flex-wrap gap-2">
                                {uncategorizedGenres.map((genre) => (
                                    <Link
                                        key={genre}
                                        to={`/library?search=${encodeURIComponent(genre)}`}
                                        className={`
                                            px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                                            ${isDarkMode 
                                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-sky-600 hover:border-sky-500' 
                                                : 'bg-gray-50 border-zinc-200 text-zinc-600 hover:text-white hover:bg-sky-500 hover:border-sky-500'}
                                        `}
                                    >
                                        {genre}
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
