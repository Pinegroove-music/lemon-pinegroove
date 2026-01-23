import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { Music, ArrowLeft, Tag, Smile, Calendar, ChevronDown, Guitar, Mic2, Zap, Wind, Drum, Bell, Globe, Piano, Layers } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';

type InstrumentCategory = {
  title: string;
  icon: React.ReactNode;
  items: string[];
};

export const InstrumentsPage: React.FC = () => {
  const { isDarkMode } = useStore();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [uncategorizedInstruments, setUncategorizedInstruments] = useState<string[]>([]);

  const gradients = [
    'bg-gradient-to-br from-sky-500 to-blue-600',
    'bg-gradient-to-br from-blue-500 to-teal-600',
    'bg-gradient-to-br from-teal-500 to-emerald-600',
    'bg-gradient-to-br from-indigo-500 to-sky-600',
    'bg-gradient-to-br from-cyan-600 to-blue-700',
    'bg-gradient-to-br from-sky-600 to-indigo-700',
    'bg-gradient-to-br from-blue-600 to-violet-700',
  ];

  const instrumentCategories: InstrumentCategory[] = [
    {
      title: "Guitars",
      icon: <Guitar size={24} />,
      items: ['Acoustic Guitar', 'Electric Guitar', 'Guitar', 'Lap Steel Guitar', 'Resonator', 'Slide Guitar', 'Bass Guitar', 'Ukulele', 'Banjo', 'Mandolin']
    },
    {
      title: "Orchestral Strings",
      icon: <Music size={24} />,
      items: ['Cello', 'Double Bass', 'Fiddle', 'Pizzicato', 'String Orchestra', 'Upright Bass', 'Viola', 'Violin', 'Harp', 'Pizzicato strings']
    },
    {
      title: "Keyboard & Organs",
      icon: <Piano size={24} />,
      items: ['Accordion', 'Celesta', 'Celeste', 'Clavinet', 'Concertina', 'Electric organ', 'Electric piano', 'Hammond', 'Harpsichord', 'Organ', 'Piano']
    },
    {
      title: "Woodwinds & Brass",
      icon: <Wind size={24} />,
      items: ['Clarinet', 'Flute', 'Harmonica', 'Saxophone', 'Tin whistle', 'Trombone', 'Trumpet', 'Tuba', 'Whistle']
    },
    {
      title: "Percussions",
      icon: <Drum size={24} />,
      items: ['Clap', 'Claps', 'Handclaps', 'Clave', 'Drum kit', 'Drums', 'Finger cymbals', 'Kick drum', 'Shaker', 'Sleigh bells', 'Snare', 'Snare drum', 'Tambourine', 'Toms']
    },
    {
      title: "Mallets",
      icon: <Bell size={24} />,
      items: ['Bells', 'Mallet', 'Marimba', 'Music box', 'Timpani', 'Vibraphone', 'Xylophone']
    },
    {
      title: "Ethnic",
      icon: <Globe size={24} />,
      items: ['Bagpipe', 'Balafon', 'Bansuri', 'Bodhran', 'Bongo', 'Bongos', 'Congas', 'Darbuka', 'Duduk', 'Erhu', 'Ehru', 'Guzheng', 'Koto', 'Mouth harp', 'Oud', 'Pipa', 'Riq', 'Santoor', 'Sitar', 'Tabla', 'Tablas', 'Taiko', 'Tanpura', 'Tumbi', 'Veena']
    },
    {
      title: "Electronic",
      icon: <Zap size={24} />,
      items: ['Pads', 'Synthesizer', 'Turntable', 'Drum machine']
    },
    {
      title: "Vocals",
      icon: <Mic2 size={24} />,
      items: ['Vocals']
    }
  ];

  useEffect(() => {
    const fetchInstruments = async () => {
      const { data } = await supabase.from('squeeze_tracks').select('instrument');
      if (data) {
        const allDbInstruments = (data as any[])
          .flatMap((track: any) => {
            const inst = track.instrument;
            if (Array.isArray(inst)) return inst;
            if (typeof inst === 'string' && inst.trim().length > 0) return [inst];
            return [];
          })
          .filter((i: any): i is string => typeof i === 'string' && i.length > 0);
        
        const uniqueDbInstruments = Array.from(new Set(allDbInstruments));
        const categorizedSet = new Set(instrumentCategories.flatMap(c => c.items.map(s => s.toLowerCase())));
        const leftovers = uniqueDbInstruments.filter(i => !categorizedSet.has(i.toLowerCase())).sort();
        
        if (leftovers.length > 0) {
          setUncategorizedInstruments(leftovers);
        }
      }
    };
    fetchInstruments();
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
      <SEO title="Browse Music by Instrument" description="Find royalty free music featuring specific instruments like Piano, Guitar, Strings, Drums, and more." />
      
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center gap-4 mb-8 text-sm font-medium">
        <Link to="/library" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} /> Back to Library
        </Link>
        <div className="h-4 w-px bg-current opacity-20 hidden sm:block"></div>
        <Link to="/categories/genres" className="flex items-center gap-2 text-sky-500 hover:text-sky-600 hover:underline">
          <Tag size={16} /> Browse by Genre
        </Link>
        <Link to="/categories/moods" className="flex items-center gap-2 text-sky-500 hover:text-sky-600 hover:underline">
          <Smile size={16} /> Browse by Mood
        </Link>
        <Link to="/categories/seasonal" className="flex items-center gap-2 text-sky-500 hover:text-sky-600 hover:underline">
          <Calendar size={16} /> Browse by Season
        </Link>
      </div>
      
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 tracking-tight">
          <Music className="text-sky-500" size={40} /> INSTRUMENTS
        </h1>
        <p className="text-xl opacity-70 max-w-2xl mx-auto">
          Explore our catalog by instrument family. Click a card to reveal specific sounds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1920px] mx-auto">
        {instrumentCategories.map((category, index) => {
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

              <div 
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <Link
                        key={item}
                        to={`/library?search=${encodeURIComponent(item)}`}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                          ${isDarkMode 
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-sky-600 hover:border-sky-500' 
                            : 'bg-gray-50 border-zinc-200 text-zinc-600 hover:text-white hover:bg-sky-500 hover:border-sky-500'}
                        `}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dynamic Leftovers Card */}
        {uncategorizedInstruments.length > 0 && (
          <div 
            className={`
              rounded-2xl overflow-hidden shadow-md transition-all duration-300
              ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}
              ${expandedCategories.includes('More Instruments') ? 'ring-2 ring-sky-500/50 shadow-xl' : 'hover:shadow-lg'}
            `}
          >
            <button 
              onClick={() => toggleCategory('More Instruments')}
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
                  Other Sounds
                </h2>
              </div>
              <div className={`transform transition-transform duration-300 ${expandedCategories.includes('More Instruments') ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown size={24} className="text-white/80" />
              </div>
            </button>

            <div 
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${expandedCategories.includes('More Instruments') ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {uncategorizedInstruments.map((item) => (
                    <Link
                      key={item}
                      to={`/library?search=${encodeURIComponent(item)}`}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                        ${isDarkMode 
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-sky-600 hover:border-sky-500' 
                          : 'bg-gray-50 border-zinc-200 text-zinc-600 hover:text-white hover:bg-sky-500 hover:border-sky-500'}
                      `}
                    >
                      {item}
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
