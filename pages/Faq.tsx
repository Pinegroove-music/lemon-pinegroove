
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChevronDown, ChevronUp, HelpCircle, AlertCircle } from 'lucide-react';
// Changed react-router to react-router-dom to fix hook issues and missing export errors
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const Faq: React.FC = () => {
    const { isDarkMode } = useStore();

    const faqSections = [
        {
            title: "Platforms, Licenses & Purchases",
            items: [
                {
                    q: "Where can I buy a license?",
                    a: "This website serves as the primary portfolio and official catalog showcase. For secure license purchases, we use Lemon Squeezy, which acts as our Merchant of Record (MoR). While our music is also available through a wide network of distributors (such as Envato, Pond5, and Luckstock), purchasing directly via Lemon Squeezy on this site ensures you get the most competitive pricing and immediate access to your official license certificate."
                },
                {
                    q: "What does \"Merchant of Record\" mean for me?",
                    a: "Since Lemon Squeezy is the Merchant of Record, they handle all the complex aspects of the transaction, including global tax compliance (VAT/GST), payment security, and fraud prevention. This means your financial data is handled by a world-class payment processor, ensuring a safe and seamless checkout experience."
                },
                {
                    q: "Can I get an official invoice for my purchase?",
                    a: "Yes, absolutely. Immediately after your purchase, Lemon Squeezy will send an automated receipt to your email. From that receipt, you can generate a full tax invoice by adding your company details (name, address, and VAT number if applicable). This invoice is a valid document for accounting and business expense purposes worldwide."
                },
                {
                    q: "What kind of licenses are available?",
                    a: (
                        <div>
                            <p className="mb-3">We offer two main synchronization licenses designed to cover all professional needs:</p>
                            <ul className="space-y-3">
                                <li>
                                    <strong className="text-sky-600 dark:text-sky-400">Standard License:</strong> Ideal for Web, Social Media, Podcasts (monetized on 1 channel), School Projects, and Charity Films.
                                </li>
                                <li>
                                    <strong className="text-sky-600 dark:text-sky-400">Extended License:</strong> Required for Advertising, TV, Radio, Cinema, Games, Apps, and Industrial use. It allows monetization on multiple Social Media channels and unlimited DVD distribution. All technical details and specific terms are available in the License PDF, which can be downloaded immediately after purchase.
                                </li>
                            </ul>
                        </div>
                    )
                },
                {
                    q: "Do I get an official license certificate?",
                    a: (
                        <span>
                            Yes. Unlike other platforms, once your purchase is complete, you can log in to your <Link to="/my-purchases" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">My Purchases</Link> area on this website to download a digitally generated License Certificate. This document includes your order details, the specific terms of use, and serves as your official legal authorization (Licensee proof) to use the music.
                        </span>
                    )
                }
            ]
        },
        {
            title: "Usage, Rights & Restrictions",
            items: [
                {
                    q: "Can I edit the music tracks?",
                    a: "Absolutely. You can loop, cut, fade, and process the audio to fit your project's needs."
                },
                {
                    q: "What are the limits of the Synchronization License?",
                    a: (
                        <div>
                            <p className="mb-2">A Synchronization License grants the right to use the music in media but not ownership or the right to create a new derivative musical work for sale. This means it is <strong>not allowed</strong> to:</p>
                            <ul className="list-disc pl-5 space-y-1 opacity-90">
                                <li>Re-sing or modify the lyrics over an instrumental version of my songs.</li>
                                <li>Remix the music to create a new song for commercial sale.</li>
                                <li>Use the content to train Artificial Intelligence (AI).</li>
                            </ul>
                            <p className="mt-2">These actions require a separate Sampling License, which must be discussed and negotiated outside of the standard agreements.</p>
                        </div>
                    )
                }
            ]
        },
        {
            title: "Professional & TV Licensing",
            items: [
                {
                    q: "Do I need to purchase a license if I am a TV professional?",
                    a: "If you are a professional working in the TV industry (such as a TV producer, music supervisor, or editor), you do not need to purchase a license upfront. Since I earn performance royalties directly through my P.R.O. (BMI), you can contact me for a blanket license arrangement. I will send you the necessary music files and all data required for cue sheet compilation."
                }
            ]
        },
        {
            title: "Commissioned Work",
            items: [
                {
                    q: "Are you available for custom music work?",
                    a: (
                        <div>
                            <p className="mb-2">Yes, I am available for commissioned work. Please contact me directly for a project quote at <a href="mailto:info@pinegroove.net" className="text-sky-600 dark:text-sky-400 hover:underline">info@pinegroove.net</a>. I offer flexibility, including:</p>
                            <ul className="list-disc pl-5 space-y-1 opacity-90">
                                <li><strong>Non-Exclusive Tailored Tracks:</strong> Where I create custom music for your project but retain all rights, allowing me to resell the music later (more budget-friendly).</li>
                                <li><strong>Exclusive Contracts:</strong> Available for higher-budget projects requiring full, exclusive rights transfer.</li>
                            </ul>
                        </div>
                    )
                }
            ]
        },
        {
            title: "Claims & YouTube",
            items: [
                {
                    q: "Can I use the music for YouTube monetization?",
                    a: (
                        <span>
                            Yes! All our tracks are suitable for YouTube monetization. However, if the track is registered with Content ID, you might receive an automated copyright claim. Don't worry, this is not a strike. Simply use our <Link to="/content-id" className="text-sky-600 dark:text-sky-400 hover:underline">Content ID Removal form</Link> or clear the claim using your license certificate purchased on Lemon Squeezy.
                        </span>
                    )
                },
                {
                    q: "What happens if I get a copyright claim?",
                    a: (
                        <span>
                            A copyright claim on YouTube is an automated notice. It is <strong>NOT</strong> a strike against your channel. Since you have purchased a license, you have the right to use the music. You can remove the claim by forwarding your license details via our <Link to="/content-id" className="text-sky-600 dark:text-sky-400 hover:underline">Content ID page</Link>.
                        </span>
                    )
                }
            ]
        }
    ];

    return (
        <div className="pb-32">
            <SEO title="Frequently Asked Questions" description="Find answers to common questions about music licensing, usage rights, and purchasing options on Pinegroove." />

            <div className="relative h-[50vh] min-h-[400px] flex items-start pt-24 justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop" 
                        alt="Licensing Documents" 
                        className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 ${isDarkMode ? 'to-zinc-950' : 'to-white'}`}></div>
                </div>

                <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
                    <HelpCircle size={64} className="mx-auto text-sky-400 mb-6 drop-shadow-lg" />
                    <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-2xl">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl opacity-90 font-medium tracking-wide drop-shadow-md">
                        Everything you need to know about licensing, usage, and rights.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 relative z-20 -mt-6 md:-mt-20">
                <div className={`rounded-3xl p-8 md:p-12 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-100'}`}>
                    <div className="space-y-12">
                        {faqSections.map((section, sectionIdx) => (
                            <div key={sectionIdx}>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-zinc-800 text-sky-500">
                                    {section.title}
                                </h2>
                                <div className="space-y-4">
                                    {section.items.map((item, idx) => (
                                        <AccordionItem key={idx} question={item.q} answer={item.a} isDark={isDarkMode} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-16 pt-8 border-t border-gray-200 dark:border-zinc-800 opacity-60">
                        <p>Still have questions?</p>
                        <a href="mailto:info@pinegroove.net" className="text-sky-600 dark:text-sky-400 hover:underline font-bold mt-2 inline-block">Contact us directly</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AccordionItem: React.FC<{ question: string; answer: React.ReactNode; isDark: boolean }> = ({ question, answer, isDark }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-gray-50 border-zinc-200'} ${isOpen ? 'ring-1 ring-sky-500/30' : ''}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <span className="pr-4">{question}</span>
                {isOpen ? <ChevronUp className="text-sky-500 shrink-0" /> : <ChevronDown className="opacity-50 shrink-0" />}
            </button>
            
            <div 
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-5 pt-0 text-sm md:text-base leading-relaxed opacity-80 border-t border-dashed border-gray-200 dark:border-zinc-800 mt-2 pt-4 mx-5 mb-2">
                    {answer}
                </div>
            </div>
        </div>
    );
};
