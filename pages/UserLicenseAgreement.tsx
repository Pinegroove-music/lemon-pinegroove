
import React from 'react';
import { useStore } from '../store/useStore';
import { SEO } from '../components/SEO';
import { FileText, ShieldCheck, HelpCircle, Mail, BookOpen, Fingerprint, Youtube, CreditCard, ShieldAlert, Scale, Info, Gavel, Lock } from 'lucide-react';

export const UserLicenseAgreement: React.FC = () => {
  const { isDarkMode } = useStore();

  return (
    <div className="pb-32">
      <SEO title="User License Agreement" description="Pinegroove Synchronization License Agreement. Detailed terms and conditions for music usage and services." />
      
      {/* Hero Header */}
      <div className={`relative min-h-[400px] md:h-[45vh] flex items-center justify-center overflow-hidden transition-colors duration-500 pt-32 md:pt-40 pb-20 ${isDarkMode ? 'bg-zinc-950' : 'bg-sky-50'}`}>
        <div className="absolute inset-0 z-0">
            <img 
                src="https://media.pinegroove.net/media/agreement.avif" 
                alt="Pinegroove Agreement" 
                className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-black/60 transition-colors duration-500`}></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <FileText size={48} className="mx-auto mb-6 text-sky-400" />
          {/* Forced white color for header text on dark background image */}
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight uppercase !text-white drop-shadow-lg">
            Agreement
          </h1>
          <p className="text-xl font-medium tracking-wide !text-white/70 drop-shadow-md">
            User License and Services Agreement
          </p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-6 relative z-20 -mt-10 md:-mt-20">
        <div className={`max-w-4xl mx-auto rounded-[2.5rem] shadow-2xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-100 text-zinc-700'}`}>
          
          <div className="p-8 md:p-14 space-y-16">
            
            {/* Introduction */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 pb-10">
              <p className="text-lg leading-relaxed font-medium italic opacity-80">
                This User License and Services Agreement (the “Agreement”) is a legally binding contract between Francesco Biondi, composer and producer (“Licensor” or “Pinegroove”), and each client, individual, or entity (“Licensee” or “you”) accessing the website located at <a href="https://www.pinegroove.net" className="text-sky-500 hover:underline">www.pinegroove.net</a> (the “Website”) and using its services.
              </p>
            </header>

            {/* Section 1: Definitions */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <BookOpen size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">1. Definitions</h2>
              </div>
              <div className="grid gap-6">
                <DefinitionBox 
                  term="Music Track(s)" 
                  description="The sound recordings and underlying musical compositions (melody, arrangements, etc.) owned by the Licensor and made available on the Website."
                />
                <DefinitionBox 
                  term="License(s)" 
                  description="The Standard License, Extended License, and PRO Subscription plans offered by Pinegroove."
                />
                <DefinitionBox 
                  term="Project(s)" 
                  description="The specific activity or production (e.g., video, podcast, advertisement) where the Music Track is synchronized."
                />
                <DefinitionBox 
                  term="Materials" 
                  description="All content on the Website, including text, graphics, logos, software, and code."
                />
              </div>
            </section>

            {/* Section 2: Intellectual Property Rights */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">2. Intellectual Property Rights</h2>
              </div>
              <div className="space-y-6 text-base md:text-lg leading-relaxed">
                <p>
                  <strong className="text-sky-500">2.1 Ownership of Music Tracks:</strong> You acknowledge and agree that the Music Tracks available on the Website are licensed, not sold, to you. Francesco Biondi is the sole and exclusive owner (100%) of all intellectual property rights, including copyright and neighboring rights, in the compositions and master recordings.
                </p>
                <p>
                  <strong className="text-sky-500">2.2 Website Materials:</strong> All content, trademarks, logos, data, software, and algorithms (“Materials”) used on the Website are the exclusive property of Pinegroove. You may not reproduce, distribute, or copy the Materials by any means without prior written permission.
                </p>
                <p>
                  <strong className="text-sky-500">2.3 Reservation of Rights:</strong> All rights not expressly granted to you in this Agreement are reserved by the Licensor. You shall not acquire any right, title, or interest in Pinegroove’s Intellectual Property Rights.
                </p>
                <p className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <strong className="text-sky-500">2.4 Previews and Watermarks:</strong> All audio previews available on the Website are for audition purposes only. Licensee may not remove, bypass, or alter any audio watermarks or technical protections on these previews, nor use them in any final Project without purchasing the applicable License.
                </p>
              </div>
            </section>

            {/* Section 3: License Types and Perpetuity */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <Scale size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">3. License Types and Perpetuity</h2>
              </div>
              <p className="mb-8">Pinegroove grants you a non-exclusive, worldwide, and non-transferable right to use the Music Tracks as follows:</p>
              
              <div className="space-y-8">
                {/* 3.1 Pay-per-Track */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <h3 className="font-black text-xl mb-4 text-sky-500">3.1 Single Pay-per-Track & Music Packs</h3>
                  <ul className="space-y-4 text-sm md:text-base">
                    <li><strong>Perpetuity:</strong> Licenses purchased as a single track or via a Music Pack are perpetual. Once purchased, you may use the track in your Project indefinitely, provided you comply with the terms of the Standard or Extended License.</li>
                    <li><strong>License Certificate:</strong> For these purchases, a downloadable License Certificate is provided as formal proof of the granted synchronization rights.</li>
                  </ul>
                </div>

                {/* 3.2 PRO Subscription */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-50 border-sky-100'}`}>
                  <h3 className="font-black text-xl mb-4 text-indigo-500">3.2 PRO Subscription Plan</h3>
                  <ul className="space-y-4 text-sm md:text-base mb-6">
                    <li><strong>Validity:</strong> This plan provides access to the catalog during an active subscription.</li>
                    <li><strong>Perpetual Coverage for Projects:</strong> Projects completed and published while the subscription was active remain licensed forever.</li>
                    <li><strong>Post-Expiration:</strong> Once the subscription expires, you cannot download tracks for new Projects or create new productions using previously downloaded tracks.</li>
                    <li><strong>Proof of License:</strong> For the PRO Subscription, the purchase receipt serves as the official proof of license. Individual License Certificates are not issued for subscription downloads.</li>
                  </ul>
                  
                  <div className={`p-4 rounded-xl border flex items-start gap-3 bg-black/5 dark:bg-black/20 border-black/10 dark:border-white/5`}>
                    <Lock size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm m-0 italic">
                      <strong>3.2.1 Fair Use & Anti-Scraping:</strong> The PRO Subscription is intended for individual or corporate creative use. The use of automated systems, scripts, or bots to download Music Tracks in bulk is strictly prohibited. Pinegroove reserves the right to monitor download activity and suspend any account showing patterns of mass-downloading or abuse without notice or refund.
                    </p>
                  </div>
                </div>

                {/* 3.3 Synchronization Requirement */}
                <div className={`p-6 rounded-2xl border border-dashed ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <h3 className="font-black text-xl mb-4 text-sky-500">3.3 Synchronization Requirement</h3>
                  <p className="text-sm md:text-base leading-relaxed">
                    All Licenses are granted strictly for the synchronization of the Music Track(s) within a larger audio-visual or audio-only project (the 'Project'). Licensee is prohibited from using Music Tracks to create music-only content, such as 'relaxation music' channels, radio-style streams, or any use where the Music Track is the primary value of the content without significant creative integration.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Performance Royalties */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <Fingerprint size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">4. Performance Royalties (P.R.O.)</h2>
              </div>
              <div className="space-y-4">
                <p>The Licenses granted here cover synchronization rights only.</p>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <p><strong className="text-red-500">Exclusion:</strong> These licenses do not include public performance rights.</p>
                    <p><strong className="text-sky-500">Responsibility:</strong> If a Project is broadcast (TV, Radio, Public Venues), the broadcaster or organizer must pay the relevant royalties to their local Performance Rights Organization (PRO).</p>
                  </div>
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-black/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                    <h4 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">Cue Sheet Data</h4>
                    <div className="space-y-2 text-sm font-bold">
                      <p>Composer: <span className="text-sky-500">Francesco Biondi</span></p>
                      <p>P.R.O.: <span className="text-sky-500">BMI</span></p>
                      <p>IPI Number: <span className="text-sky-500 font-mono">00542050494</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: YouTube Content ID */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <Youtube size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">5. YouTube Content ID & Claims</h2>
              </div>
              <div className="space-y-6">
                <p>Pinegroove Music Tracks may be registered in content identification systems (e.g., YouTube Content ID).</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <p><strong>Claim Removal:</strong> Licensees have the right to request the removal of copyright claims by filling out the dedicated form at: <a href="https://pinegroove.net/content-id" className="text-sky-500 hover:underline">https://pinegroove.net/content-id</a>.</p>
                  </div>
                  <div className="flex-1">
                    <p><strong>Manual Dispute:</strong> You may also choose to dispute a claim directly via YouTube Studio by providing your License Certificate or Purchase Receipt as proof of license.</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl text-center border border-red-500/20 bg-red-500/5`}>
                  <p className="text-xs font-black uppercase tracking-widest text-red-500 m-0">
                    Restriction: You are strictly prohibited from registering our Music Tracks in any Content ID or fingerprinting system.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6: Merchant of Record */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <CreditCard size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">6. Payments and Merchant of Record</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/20">
                  <img 
                    src="https://pub-704d512baed74c069032320c83ebe2f7.r2.dev/lemon-squeezy-logo.svg" 
                    alt="Lemon Squeezy Logo" 
                    className="h-8 grayscale opacity-70"
                  />
                  <p className="m-0 font-bold">Lemon Squeezy serves as our official Merchant of Record (MoR).</p>
                </div>
                <p>
                  <strong>Billing & Support:</strong> Lemon Squeezy is responsible for the entire checkout process, tax collection, and payment security. All invoices and receipts are issued by Lemon Squeezy.
                </p>
                <div className={`p-6 rounded-2xl flex items-start gap-4 text-sm ${isDarkMode ? 'bg-zinc-800/50' : 'bg-sky-50'}`}>
                  <Info size={20} className="text-sky-500 shrink-0 mt-0.5" />
                  <p className="m-0 italic">
                    Pinegroove and Francesco Biondi assume no responsibility or liability for the payment process, technical checkout issues, or financial transactions. For any issues related to payments or billing, you must contact Lemon Squeezy Support directly.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7: Restrictions */}
            <section className={`p-8 md:p-12 rounded-[2.5rem] border transition-all ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800 shadow-2xl' : 'bg-red-50/30 border-red-100 shadow-xl shadow-red-500/5'}`}>
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-red-500/10 rounded-2xl">
                  <ShieldAlert className="text-red-500" size={32} />
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">7. Restrictions</h2>
              </div>
              
              <p className="text-lg opacity-70 mb-10 font-medium max-w-3xl">The Licensee may NOT:</p>
              
              <div className="space-y-6">
                <RestrictionItem id="A" text="Sell, sublicense, resell, share, trade, or give away the music as a stand-alone product;" />
                <RestrictionItem id="B" text="Create covers, remixes, adaptations, or derivative musical works;" />
                <RestrictionItem id="C" text="Include the music in music-only products, albums, or compilations;" />
                <RestrictionItem id="D" text="Register the music in any Content ID or automated copyright enforcement system;" />
                <RestrictionItem id="E" text="Redistribute the music as part of templates or stock products for multiple end users;" />
                <RestrictionItem id="F" text="Use the music for ringtones or similar telecommunication uses;" />
                <RestrictionItem id="G" text="AI Training / Machine Learning: Licensee may not use the licensed music to train, fine-tune, or improve artificial intelligence or machine learning models. This includes, but is not limited to, using the music as part of datasets, input data, or reference material for generating new AI-based content, music, or audio models." />
              </div>
            </section>

            {/* Section 8: Refund Policy */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <HelpCircle size={28} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">8. Refund Policy</h2>
              </div>
              <div className="space-y-6">
                <p className="leading-relaxed text-base md:text-lg">
                  Due to the digital nature of our products (audio files), <strong>all sales are final</strong>. Once you have purchased a track or a subscription and gained access to the digital files, we cannot offer refunds, returns, or exchanges. By completing your purchase, you acknowledge and agree to this policy. We encourage you to listen to the full previews available on our site before making a purchase.
                </p>
                <div className="flex items-center gap-3 text-sky-500 font-bold p-4 bg-sky-500/5 rounded-xl border border-sky-500/10 w-fit">
                  <Mail size={18} />
                  <a href="mailto:info@pinegroove.net" className="hover:underline">info@pinegroove.net</a>
                </div>
              </div>
            </section>

            {/* Section 9: Indemnification */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <Scale size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">9. Indemnification and Limitation of Liability</h2>
              </div>
              <div className="space-y-6">
                <p>
                  <strong className="text-sky-500">Indemnification:</strong> Licensee agrees to indemnify, defend, and hold Licensor harmless from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising from any breach of this Agreement.
                </p>
                <p>
                  <strong className="text-sky-500">Limitation of Liability:</strong> To the maximum extent permitted by law, Pinegroove’s total liability shall be limited to the total amount paid by the Licensee in the twelve (12) months preceding the claim. Pinegroove is not liable for any indirect, incidental, or consequential damages.
                </p>
              </div>
            </section>

            {/* Section 10: Governing Law */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                  <Gavel size={28} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">10. Governing Law and Jurisdiction</h2>
              </div>
              <p className="leading-relaxed text-base md:text-lg">
                This Agreement shall be governed by and construed in accordance with the laws of <strong>Italy</strong>. Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the <strong>Courts of Rome, Italy</strong>.
              </p>
            </section>

          </div>
          
          {/* Footer of the card */}
          <div className={`p-6 text-center border-t border-dashed ${isDarkMode ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
              © {new Date().getFullYear()} Francesco Biondi / Pinegroove
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const DefinitionBox: React.FC<{ term: string; description: string }> = ({ term, description }) => (
  <div className="flex flex-col md:flex-row gap-2 md:gap-8 items-start">
    <span className="text-sky-500 font-black uppercase text-xs tracking-widest min-w-[140px] pt-1">{term}</span>
    <p className="m-0 text-sm md:text-base leading-relaxed opacity-80">{description}</p>
  </div>
);

const RestrictionItem: React.FC<{ id: string; text: string }> = ({ id, text }) => (
  <div className="flex gap-4 items-start group">
    <span className="font-black text-red-500 bg-red-500/10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
      {id}
    </span>
    <p className={`text-base leading-relaxed font-medium opacity-80 pt-1.5`}>
      {text}
    </p>
  </div>
);
