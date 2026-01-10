
import React, { useEffect } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../services/supabase';
import { useStore } from '../store/useStore';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Auth: React.FC = () => {
  const { isDarkMode, session } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determina la vista iniziale (sign_in o sign_up) in base al parametro URL
  const requestedView = searchParams.get('view') as any;
  const initialView = (requestedView === 'sign_up' || requestedView === 'sign_in') ? requestedView : 'sign_in';

  // Se l'utente è già loggato o si logga con successo, lo riportiamo in home.
  // TUTTAVIA: non reindirizziamo se stiamo gestendo un link di recupero password
  useEffect(() => {
    // Identifichiamo il recovery sia tramite hash (standard Supabase) sia tramite rotta interna
    const isRecovery = window.location.hash.includes('type=recovery') || 
                       window.location.hash.includes('reset-password');
    
    if (session && !isRecovery) {
      navigate('/');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background with Ambient Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop" 
          alt="Studio Background" 
          className="w-full h-full object-cover opacity-50 blur-sm"
        />
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-zinc-950/80' : 'bg-white/40'}`}></div>
      </div>

      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all shadow-xl"
      >
        <ArrowLeft size={18} />
        <span className="font-bold text-sm">Back to Home</span>
      </Link>

      {/* Auth Card */}
      <div className={`relative z-10 w-full max-w-md p-8 rounded-3xl shadow-2xl backdrop-blur-xl border ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-200'}`}>
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://media.pinegroove.net/media/logo-pinegroove.svg" 
            alt="Pinegroove Logo" 
            className="w-16 h-16 mb-4 drop-shadow-lg"
          />
          <h1 className="font-archivo uppercase text-2xl tracking-tight">
            <span className={isDarkMode ? 'text-white' : 'text-black'}>PINE</span>
            <span className="text-[#0288c4]">GROOVE</span>
          </h1>
          <p className="text-sm opacity-60 mt-2 font-medium">Log in to access the premium library</p>
        </div>

        <SupabaseAuth
          supabaseClient={supabase}
          view={initialView}
          // Usiamo l'origine del sito senza cancelletti. Supabase appenderà i parametri all'origine.
          // HashRouter gestirà il caricamento di index.html dalla radice.
          redirectTo={window.location.origin}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0288c4',
                  brandAccent: '#0ea5e9',
                  inputText: isDarkMode ? 'white' : 'black',
                  inputBackground: isDarkMode ? '#18181b' : '#f4f4f5',
                  inputBorder: isDarkMode ? '#27272a' : '#e4e4e7',
                  inputPlaceholder: '#71717a',
                },
                radii: {
                  borderRadiusButton: '12px',
                },
                space: {
                  buttonPadding: '10px 15px',
                  inputPadding: '10px 15px',
                },
              },
            },
          }}
          theme={isDarkMode ? 'dark' : 'light'}
          providers={[]}
        />
        
        <div className="mt-8 text-center">
            <p className="text-xs opacity-40">
                &copy; {new Date().getFullYear()} Francesco Biondi / Pinegroove
            </p>
        </div>
      </div>
    </div>
  );
};
