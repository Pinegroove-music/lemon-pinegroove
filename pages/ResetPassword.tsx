
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useStore } from '../store/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { SEO } from '../components/SEO';

export const ResetPassword: React.FC = () => {
  const { isDarkMode } = useStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Ascolta l'evento di recupero password specifico per prevenire redirect errati
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log("Password recovery flow detected.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setSuccess(true);
      
      // Opzionale: dopo il successo effettua il logout per forzare un login pulito
      // o attendi qualche secondo prima di navigare
    } catch (err: any) {
      console.error("Error updating password:", err);
      setError(err.message || "An error occurred while updating the password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <SEO title="Reset Your Password" description="Enter your new password for your Pinegroove account." />
      
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
      {!success && (
        <Link 
          to="/auth" 
          className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all shadow-xl"
        >
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Back to Login</span>
        </Link>
      )}

      {/* Reset Card */}
      <div className={`relative z-10 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl border animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-200'}`}>
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://pub-2da555791ab446dd9afa8c2352f4f9ea.r2.dev/media/logo-pinegroove.svg" 
            alt="Pinegroove Logo" 
            className="w-16 h-16 mb-4 drop-shadow-lg"
          />
          <h1 className="font-archivo uppercase text-2xl tracking-tight text-center">
            <span className={isDarkMode ? 'text-white' : 'text-black'}>PINE</span>
            <span className="text-[#0288c4]">GROOVE</span>
          </h1>
          <p className="text-sm opacity-60 mt-2 font-medium text-center">Update your password</p>
        </div>

        {!success ? (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border-2 transition-all ${isDarkMode ? 'bg-black border-zinc-800 focus:border-sky-500 text-white' : 'bg-gray-50 border-gray-200 focus:border-sky-500 text-black'}`}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-4 rounded-xl shadow-lg shadow-sky-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-emerald-500" size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Password Updated!</h2>
              <p className="text-sm opacity-60">Your password has been successfully changed. You can now access your library.</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
            >
              Go to Homepage
            </button>
          </div>
        )}
        
        <div className="mt-8 text-center">
            <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Pinegroove / Francesco Biondi
            </p>
        </div>
      </div>
    </div>
  );
};
