
import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { useStore } from '../store/useStore';

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
  size?: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ title, text, url, size = 20 }) => {
  const { isDarkMode } = useStore();
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const shareData = {
      title,
      text: text || `Check out this track on Pinegroove: ${title}`,
      url: url.startsWith('http') ? url : `${window.location.origin}${url}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share was cancelled or failed', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        className={`
          p-2.5 rounded-full transition-all duration-300 transform active:scale-90 flex items-center justify-center
          ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-white hover:bg-gray-100 text-zinc-600 shadow-sm border border-zinc-100'}
        `}
        title={copied ? "Copied!" : "Share"}
      >
        {copied ? (
          <Check size={size} className="text-emerald-500 animate-in zoom-in duration-200" />
        ) : (
          <Share2 size={size} className="transition-transform group-hover:scale-110" />
        )}
      </button>

      {/* Floating feedback label */}
      {copied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded shadow-xl animate-in fade-in slide-in-from-bottom-1 whitespace-nowrap z-50">
          Link Copied!
        </div>
      )}
    </div>
  );
};
