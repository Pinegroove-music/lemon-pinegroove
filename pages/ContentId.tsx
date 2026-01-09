import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ShieldCheck, Youtube, Loader2, CheckCircle, AlertCircle, Plus, Trash2, Calendar } from 'lucide-react';
import { SEO } from '../components/SEO';

export const ContentId: React.FC = () => {
  const { isDarkMode } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for dynamic video links (max 5)
  const [videoUrls, setVideoUrls] = useState<string[]>(['']);
  
  // State for license source to show/hide "Other" input
  const [licenseSource, setLicenseSource] = useState<string>('');

  // ---------------------------------------------------------
  // 🔑 CONFIGURATION: WEB3FORMS ACCESS KEY
  // ---------------------------------------------------------
  const WEB3FORMS_ACCESS_KEY = "8135d742-465a-4e21-87f7-2bf7b331009a"; 

  const handleAddVideo = () => {
    if (videoUrls.length < 5) {
      setVideoUrls([...videoUrls, '']);
    }
  };

  const handleRemoveVideo = (index: number) => {
    const newUrls = videoUrls.filter((_, i) => i !== index);
    setVideoUrls(newUrls.length ? newUrls : ['']); // Keep at least one
  };

  const handleVideoChange = (index: number, value: string) => {
    const newUrls = [...videoUrls];
    newUrls[index] = value;
    setVideoUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData(e.currentTarget);
      
      // Append Web3Forms specific fields
      formData.append("access_key", WEB3FORMS_ACCESS_KEY);
      formData.append("subject", "Content ID Clearance"); // Requested Subject
      formData.append("from_name", "Pinegroove Clearance Form");
      
      // Honeypot
      formData.append("botcheck", ""); 

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            setSubmitted(true);
        } else {
            console.error("Web3Forms Error:", data);
            setError(data.message || "Something went wrong. Please check your API Key or try again later.");
        }
      } catch (err) {
          console.error("Submission Error:", err);
          setError("Network error. Please check your connection and try again.");
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="pb-32">
        <SEO title="Clear YouTube Claims" description="Resolve YouTube Content ID claims for your licensed Pinegroove music quickly and easily." />
        {/* Hero Header */}
        <div className="relative h-[50vh] min-h-[400px] flex items-start pt-24 justify-center overflow-hidden">
            {/* Background Image - Videomaking/YouTube theme */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://media.pinegroove.net/media/copyright-comic.jpg" 
                    alt="Content ID Copyright" 
                    className="w-full h-full object-cover object-center"
                />
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 ${isDarkMode ? 'to-zinc-950' : 'to-white'}`}></div>
            </div>

            <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
                <ShieldCheck size={64} className="mx-auto text-sky-400 mb-6 drop-shadow-lg" />
                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-2xl">
                    YouTube <span className="text-red-500">Content ID</span> Removal
                </h1>
                <p className="text-xl opacity-90 font-medium tracking-wide drop-shadow-md">
                    Clear your copyright claims quickly and easily.
                </p>
            </div>
        </div>

      <div className="max-w-2xl mx-auto px-4 relative z-20 -mt-6 md:-mt-20">
        
        {/* Info Box */}
        <div className={`text-left p-8 rounded-2xl mb-8 border shadow-xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
            <h3 className="font-bold text-lg mb-2 text-sky-600 dark:text-sky-400 flex items-center gap-2">
                <Youtube size={24}/> What is Content ID?
            </h3>
            <p className="opacity-80 text-sm leading-relaxed">
                It's YouTube's automated system that scans videos for copyrighted audio. A claim simply means the system recognized the music. 
                <span className="font-bold"> It is not a copyright strike.</span> Please fill out the form below so we can clear (release) the claim for you.
            </p>
        </div>

        {!submitted ? (
            <form onSubmit={handleSubmit} className={`p-8 rounded-2xl shadow-xl border relative ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                
                {/* Hidden Honeypot Field */}
                <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

                <div className="space-y-6">
                    
                    {/* 1. Name / Company */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Your Name / Company <span className="text-red-500">*</span></label>
                        <input 
                            required 
                            type="text" 
                            name="name" 
                            placeholder="John Doe / Creative Studio" 
                            className={`w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2 focus:ring-sky-500 ${isDarkMode ? 'border-zinc-700 focus:border-sky-500' : 'border-zinc-300 focus:border-sky-500'}`}
                        />
                    </div>

                    {/* 2. Email */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Your Email <span className="text-red-500">*</span></label>
                        <input 
                            required 
                            type="email" 
                            name="email" 
                            placeholder="email@example.com" 
                            className={`w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2 focus:ring-sky-500 ${isDarkMode ? 'border-zinc-700 focus:border-sky-500' : 'border-zinc-300 focus:border-sky-500'}`}
                        />
                    </div>

                    {/* 3. License Source */}
                    <div>
                        <label className="block text-sm font-bold mb-2">License Source <span className="text-red-500">*</span></label>
                        <p className="text-xs opacity-60 mb-2">Where did you buy the track? (Includes past purchases)</p>
                        <select 
                            required 
                            name="license_source" 
                            value={licenseSource}
                            onChange={(e) => setLicenseSource(e.target.value)}
                            className={`w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2 focus:ring-sky-500 ${isDarkMode ? 'border-zinc-700 bg-zinc-900 focus:border-sky-500' : 'border-zinc-300 bg-white focus:border-sky-500'}`}
                        >
                            <option value="" disabled>Select a marketplace...</option>
                            <option value="Pinegroove">Pinegroove (Lemon Squeezy)</option>
                            <option value="Gumroad">Gumroad</option>
                            <option value="Fourthwall">Fourthwall (Youtube Shop)</option>
                            <option value="Audiojungle">Audiojungle</option>
                            <option value="Pond5">Pond5</option>
                            <option value="Luckstock">Luckstock</option>
                            <option value="Unity Asset Store">Unity Asset Store</option>
                            <option value="Fab">Fab (Unreal Asset Store)</option>
                            <option value="Other">Other (please specify below)</option>
                        </select>
                    </div>

                    {/* Conditional "Other" Input */}
                    {licenseSource === 'Other' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-bold mb-2">Please specify marketplace <span className="text-red-500">*</span></label>
                            <input 
                                required 
                                type="text" 
                                name="other_source_details" 
                                placeholder="e.g. Direct Purchase, Custom Invoice..." 
                                className={`w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2 focus:ring-sky-500 ${isDarkMode ? 'border-zinc-700 focus:border-sky-500' : 'border-zinc-300 focus:border-sky-500'}`}
                            />
                        </div>
                    )}

                    {/* 4. Date of Purchase (NEW) */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Date of Purchase <span className="text-red-500">*</span></label>
                        <p className="text-xs opacity-60 mb-2">Please be as accurate as possible: if you don't remember the exact date, just indicate the month or the year.</p>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 opacity-50" size={20} />
                            <input 
                                required 
                                type="date" 
                                name="purchase_date" 
                                className={`w-full p-3 pl-10 rounded-lg border bg-transparent outline-none transition-all focus:ring-2 focus:ring-sky-500 ${isDarkMode ? 'border-zinc-700 focus:border-sky-500 [color-scheme:dark]' : 'border-zinc-300 focus:border-sky-500'}`}
                            />
                        </div>
                    </div>

                    {/* 5. Video URLs (Dynamic) */}
                    <div>
                        <label className="block text-sm font-bold mb-2">YouTube Video Link(s) <span className="text-red-500">*</span></label>
                        <div className="space-y-3">
                            {videoUrls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Youtube className="absolute left-3 top-3.5 opacity-50" size={20}/>
                                        <input 
                                            required 
                                            type="url" 
                                            name="video_urls[]" 
                                            value={url}
                                            onChange={(e) => handleVideoChange(index, e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..." 
                                            className={`w-full p-3 pl-10 rounded-lg border bg-transparent outline-none transition-all focus:ring-2 focus:ring-sky-500 ${isDarkMode ? 'border-zinc-700 focus:border-sky-500' : 'border-zinc-300 focus:border-sky-500'}`}
                                        />
                                    </div>
                                    {videoUrls.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveVideo(index)}
                                            className="p-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove link"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {videoUrls.length < 5 && (
                            <button 
                                type="button" 
                                onClick={handleAddVideo}
                                className="mt-3 text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                            >
                                <Plus size={16} /> Add another video
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} /> Sending...
                                </>
                            ) : (
                                "Submit Clearance Request"
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-center opacity-50">
                        Your request will be sent to info@pinegroove.net
                    </p>
                </div>
            </form>
        ) : (
            <div className={`text-center p-10 rounded-2xl border shadow-sm animate-in fade-in zoom-in duration-300 ${isDarkMode ? 'bg-green-900/10 border-green-900/30 text-green-400' : 'bg-green-50 border-green-100 text-green-700'}`}>
                <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                <h3 className="font-bold text-2xl mb-2">Request Received!</h3>
                <p className="opacity-80 max-w-sm mx-auto mb-6 leading-relaxed">
                    Thank you. We have received your details and will process the claim release shortly. <br/><br/>
                    <strong>Please note:</strong> The removal process typically takes <strong>1-2 days</strong>, although it is usually much faster.
                </p>
                <button 
                    onClick={() => { setSubmitted(false); setVideoUrls(['']); setLicenseSource(''); }}
                    className="text-sm font-bold underline hover:no-underline opacity-60 hover:opacity-100"
                >
                    Submit another request
                </button>
            </div>
        )}
      </div>
    </div>
  );
};