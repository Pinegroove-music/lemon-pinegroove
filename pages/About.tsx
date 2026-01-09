import React from 'react';
import { Mail, Globe, ExternalLink, MapPin } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SEO } from '../components/SEO';

export const About: React.FC = () => {
  const { isDarkMode } = useStore();

  return (
    <div className="pb-32">
      <SEO title="About Francesco Biondi" description="Meet Francesco Biondi, the composer and producer behind Pinegroove. Learn about his background, style, and professional experience." />
      
      {/* Hero Header with Background and Gradient Fade */}
      <div className="relative h-[60vh] min-h-[500px] flex items-start pt-32 justify-center overflow-hidden">
         {/* Background Image */}
         <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=2070&auto=format&fit=crop" 
                alt="Composer Studio Piano" 
                className="w-full h-full object-cover"
            />
            {/* Gradient Overlay for Fade Effect to Content */}
            <div className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 ${isDarkMode ? 'to-zinc-950' : 'to-white'}`}></div>
         </div>

         <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight drop-shadow-2xl">
                About <span className="text-[#0288c4]">Pinegroove</span>
            </h1>
            <p className="text-xl md:text-2xl opacity-80 font-medium font-serif italic tracking-wide">
                Meet the composer behind this premium music catalog
            </p>
         </div>
      </div>
      
      {/* Main Content with Overlap Effect */}
      <div className="container mx-auto px-6 relative z-20 -mt-32 md:-mt-48">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
            
            {/* Left Column: Sticky Portrait Image */}
            <div className="w-full lg:w-5/12 lg:sticky lg:top-28">
                <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl bg-black">
                    <img 
                        src="https://media.pinegroove.net/media/portrait.jpg" 
                        alt="Francesco Biondi" 
                        className="w-full h-auto max-h-[600px] object-cover object-top opacity-90 hover:opacity-100 transition-opacity duration-700" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent text-white">
                        <h2 className="text-2xl font-bold mb-1">Francesco Biondi</h2>
                        <h3 className="text-sky-400 font-bold tracking-widest uppercase text-xs mb-2">Composer & Producer</h3>
                        <div className="flex items-center gap-1.5 text-xs opacity-80 font-medium">
                            <MapPin size={12} className="text-white"/> Rome, Italy
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Bio Text (Inside a card for contrast over the overlap) */}
            <div className={`w-full lg:w-7/12 space-y-8 text-lg leading-relaxed p-8 rounded-2xl shadow-lg ${isDarkMode ? 'bg-zinc-900/80 backdrop-blur-md text-zinc-300' : 'bg-white/90 backdrop-blur-md text-zinc-700'}`}>
                <p>
                    <span className="text-4xl font-bold float-left mr-2 mt-[-6px] text-sky-500">B</span>ased in Rome, Francesco Biondi is a composer and music producer whose works have been featured in major media projects, including commercials, films, video games, mobile apps, and live performances.
                </p>
                <p>
                    Combining classical piano studies from the 90s with modern production techniques mastered since 2010, Francesco specializes in delivering high-end audio that ranges from massive orchestral scores to refined, intimate textures. Born near Bologna and driven by an insatiable curiosity for the entire musical universe, he works passionately to create sound that is both authentic and contemporary.
                </p>

                {/* Quote Block */}
                <blockquote className={`p-8 rounded-xl border-l-4 border-sky-500 my-8 italic font-serif text-xl ${isDarkMode ? 'bg-black/30' : 'bg-sky-50/50'}`}>
                    "I have always remained faithful to the power of melody. In an industry environment that often pushes for music to be an anonymous, non-intrusive background, I strive to keep the 'exuberance' of music alive.
                    <br/><br/>
                    I believe that melody is the element that gives color to sound. Despite the stock music industry’s tendency to reward familiarity and clean textures over lyricism, my work proves that emotional depth and commercial viability can coexist."
                    <footer className="mt-4 font-sans font-bold text-sm uppercase tracking-wider opacity-60 not-italic text-right">
                        — Francesco Biondi
                    </footer>
                </blockquote>

                <p>
                    In recent years, Francesco has evolved his workflow, transitioning from a solitary approach—where he managed every aspect of a track's production—to one of open collaboration. This pivotal shift involves working with phenomenal session artists across the globe, a practice that has significantly elevated the quality of his music thanks to the immense talent and depth of experience contributed by his international collaborators.
                </p>

                {/* Contact Cards */}
                <div className="pt-8 mt-8 border-t border-dashed border-gray-300 dark:border-zinc-700 grid md:grid-cols-2 gap-4">
                    <a 
                        href="mailto:info@pinegroove.net" 
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-md group ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-sky-500' : 'bg-white border-zinc-200 hover:border-sky-500'}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                            <Mail size={20}/>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold opacity-50">Email</div>
                            <div className="font-bold text-sm sm:text-base group-hover:text-sky-500 transition-colors">info@pinegroove.net</div>
                        </div>
                    </a>
                    
                    <a 
                        href="https://www.francescobiondimusic.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-md group ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-sky-500' : 'bg-white border-zinc-200 hover:border-sky-500'}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                            <Globe size={20}/>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold opacity-50">Personal Portfolio</div>
                            <div className="font-bold text-sm sm:text-base group-hover:text-sky-500 transition-colors flex items-center gap-1">
                                francescobiondimusic.com <ExternalLink size={12} className="opacity-50"/>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};