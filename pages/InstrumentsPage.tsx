import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
// Changed react-router to react-router-dom to fix hook issues and missing export errors
import { Link } from 'react-router-dom';
import { Music, ArrowLeft, Tag, Smile } from 'lucide-react';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';

export const InstrumentsPage: React.FC = () => {
  const { isDarkMode } = useStore();
  
  const defaultInstruments = [
    'Piano', 'Guitar', 'Strings', 'Synthesizer', 'Drums', 'Bass', 
    'Violin', 'Cello', 'Flute', 'Saxophone', 'Trumpet', 'Orchestra', 
    'Percussion', 'Acoustic Guitar', 'Electric Guitar', 'Pad', 'Drone', 'Vocal',
    'Brass', 'Woodwinds', 'Harp', 'Mallets', 'Organ', 'Clap'
  ];

  const [instruments, setInstruments] = useState<string[]>(defaultInstruments.sort());
  
  // Elegant Green/Teal/Emerald Gradients for Instruments
  const gradients = [
    'bg-gradient-to-br from-teal-500 to-emerald-600',
    'bg-gradient-to-br from-emerald-500 to-green-600',
    'bg-gradient-to-br from-cyan-500 to-teal-600',
    'bg-gradient-to-br from-green-500 to-emerald-700',
    'bg-gradient-to-br from-teal-600 to-cyan-700',
    'bg-gradient-to-br from-emerald-600 to-teal-700',
  ];

  useEffect(() => {
    const fetchInstruments = async () => {
      // Use the new squeeze_tracks table to fetch instrument metadata
      const { data } = await supabase.from('squeeze_tracks').select('instrument');

      if (data) {
        const allInstruments = (data as any[])
          .flatMap((track: any) => track.instrument || [])
          .filter((i: any): i is string => typeof i === 'string' && i.length > 0);
        
        const uniqueInstruments = Array.from(new Set([...defaultInstruments, ...allInstruments])).sort();
        if (uniqueInstruments.length > 0) setInstruments(uniqueInstruments);
      }
    };
    fetchInstruments();
  }, []);

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
        </div>
        
        <h1 className="text-4xl font-black mb-4 flex items-center gap-3 tracking-tight">
            <Music className="text-sky-500" size={36} /> ALL INSTRUMENTS
        </h1>
        <p className="text-lg opacity-70 mb-12 max-w-2xl">
            Looking for a specific sound? Browse our catalog by lead instrument to find the perfect texture for your production.
        </p>

        {/* Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {instruments.map((instrument, index) => {
                const gradient = Object.values(gradients)[index % gradients.length];
                return (
                <Link
                    key={instrument}
                    to={`/library?search=${encodeURIComponent(instrument)}`}
                    className={`
                        ${gradient} text-white
                        h-24 flex items-center justify-center text-center px-4
                        rounded-xl font-bold text-sm md:text-base uppercase tracking-widest 
                        transition-all transform hover:-translate-y-1 hover:shadow-lg hover:brightness-110 shadow-md
                    `}
                >
                    {instrument}
                </Link>
                )
            })}
        </div>
    </div>
  );
};
