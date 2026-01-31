
import React from 'react';
import { useStore } from '../store/useStore';
import { SEO } from '../components/SEO';
import { ShieldCheck, Mail, Lock, UserCheck, FileText, Send } from 'lucide-react';

export const Privacy: React.FC = () => {
  const { isDarkMode } = useStore();

  return (
    <div className="pb-32">
      <SEO title="Privacy Policy" description="Privacy Policy for Pinegroove and Francesco Biondi. Learn how we manage your personal data and newsletter preferences." />
      
      <div className={`relative h-[35vh] min-h-[300px] flex items-center justify-center overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-zinc-950' : 'bg-sky-50'}`}>
        <div className="absolute inset-0 z-0">
            <img 
                src="https://media.pinegroove.net/media/privacy-pinegroove.avif" 
                alt="Pinegroove Privacy" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 transition-colors duration-500"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <ShieldCheck size={48} className="mx-auto mb-4 text-emerald-400" />
          {/* Forced white color for header text on dark background image */}
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight uppercase !text-white drop-shadow-lg">Privacy Policy</h1>
          <p className="text-lg font-medium !text-white/70 drop-shadow-md">Minimalist Protection for Creative Professionals</p>
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-20 -mt-10">
        <div className={`max-w-3xl mx-auto rounded-3xl shadow-2xl border p-8 md:p-14 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-100 text-zinc-700'}`}>
          
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-10">
            
            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-sky-500">
                <UserCheck size={20} /> Data Controller
              </h2>
              <p>
                The Data Controller is <strong>Francesco Biondi</strong>, independent composer and producer based in Rome, Italy. 
                Contact email: <a href="mailto:info@pinegroove.net" className="text-sky-500 hover:underline font-bold">info@pinegroove.net</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-sky-500">
                <FileText size={20} /> What We Collect
              </h2>
              <p>We process only the minimum amount of data required to provide our services:</p>
              <ul className="list-disc pl-5 space-y-2 opacity-80">
                <li><strong>Account Information:</strong> Your email address and basic profile details provided via Supabase Authentication.</li>
                <li><strong>Purchase History:</strong> Records of music licenses and packs acquired, used to generate your official License Certificates.</li>
                <li><strong>Technical Data:</strong> Our website <strong>does not use tracking or profiling cookies</strong>. We only use essential technical cookies required for secure payments (Lemon Squeezy), session management, and ensuring a smooth user experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-sky-500">
                <Lock size={20} /> How We Use Your Data
              </h2>
              <p>Your information is used strictly for:</p>
              <ul className="list-disc pl-5 space-y-2 opacity-80">
                <li>Delivering the digital products and licenses you purchase.</li>
                <li>Authenticating your access to the premium library.</li>
                <li>Generating legally binding license certificates in your name.</li>
                <li>Sending occasional technical updates or support replies via email.</li>
              </ul>
              <p className="mt-4 italic">We do not sell, trade, or share your personal data with third parties for marketing purposes.</p>
            </section>

            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-sky-500">
                <Send size={20} /> Newsletter & Marketing
              </h2>
              <p>We value your privacy and hate spam as much as you do:</p>
              <ul className="list-disc pl-5 space-y-2 opacity-80">
                <li><strong>Voluntary Signup:</strong> We collect your email address for marketing purposes only if you voluntarily sign up via our subscription form.</li>
                <li><strong>Explicit Consent:</strong> Emails containing updates, new music drops, or exclusive discounts are sent strictly based on your explicit consent.</li>
                <li><strong>Right to Opt-Out:</strong> You can unsubscribe at any time by clicking the "unsubscribe" link at the bottom of any email or by sending a request to <a href="mailto:info@pinegroove.net" className="text-sky-500 font-bold hover:underline">info@pinegroove.net</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-sky-500">
                <ShieldCheck size={20} /> Security & Third Parties
              </h2>
              <p>We rely on world-class partners to ensure your data stays safe:</p>
              <ul className="list-disc pl-5 space-y-2 opacity-80">
                <li><strong>Supabase:</strong> Handles secure database storage and authentication.</li>
                <li><strong>Lemon Squeezy:</strong> Acts as the Merchant of Record, processing all payments and handling tax compliance with industry-standard security.</li>
                <li><strong>Cloudflare R2:</strong> Secures the high-quality audio file storage.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-sky-500">
                <Mail size={20} /> Your Rights
              </h2>
              <p>
                You have the right to access, rectify, or delete your personal data at any time. 
                You can manage your account directly from the <a href="#/my-purchases" className="text-sky-500 font-bold hover:underline">Account Page</a> or 
                contact us at <a href="mailto:info@pinegroove.net" className="text-sky-500 font-bold hover:underline">info@pinegroove.net</a> to request full data deletion.
              </p>
            </section>

            <div className="pt-10 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-sm opacity-50 text-center">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
