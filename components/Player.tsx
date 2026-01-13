
import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { Play, Pause, ShoppingCart, Volume2, VolumeX, Volume1, ChevronDown, ChevronUp, Download, Loader2, X, Maximize2, SkipBack, SkipForward } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { WaveformVisualizer } from './WaveformVisualizer';
import { createSlug } from '../utils/slugUtils';
import { supabase } from '../services/supabase';

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const Player: React.FC = () => {
  const { currentTrack, playlist, isPlaying, togglePlay, playNext, playPrevious, isDarkMode, setProgress, volume, setVolume, seekTime, setSeekTime, progress, session, purchasedTracks, ownedTrackIds } = useStore();
  const { isPro } = useSubscription();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  const [isMobileMinimized, setIsMobileMinimized] = useState(false);
  const [isMobileMaximized, setIsMobileMaximized] = useState(false);

  // Determina se ci sono tracce prec/succ
  const currentIndex = currentTrack ? playlist.findIndex(t => t.id === currentTrack.id) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < playlist.length - 1;

  useEffect(() => {
    if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (currentTrack) {
        setIsMobileMinimized(false);
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.log("Playback prevented or interrupted:", e);
            });
        }
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
      if (seekTime !== null && audioRef.current && audioRef.current.duration) {
          const newTime = (seekTime / 100) * audioRef.current.duration;
          if (Number.isFinite(newTime)) {
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
          }
          setSeekTime(null);
      }
  }, [seekTime, setSeekTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);

        if (seekTime === null) {
            const p = (audio.currentTime / audio.duration) * 100;
            setProgress(p);
        }
      }
    };

    const handleEnded = () => {
        if (hasNext) {
          playNext();
        } else {
          useStore.getState().togglePlay();
          setProgress(0);
          setCurrentTime(0);
        }
    };

    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setProgress, currentTrack, seekTime, hasNext, playNext]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setProgress(val);
    
    if (audioRef.current && audioRef.current.duration) {
      const seekTime = (val / 100) * audioRef.current.duration;
      if (Number.isFinite(seekTime)) {
          audioRef.current.currentTime = seekTime;
          setCurrentTime(seekTime);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1);
  };

  const handleDownload = async () => {
    if (!currentTrack || !session) return;
    setDownloading(true);
    try {
        const { data, error } = await supabase.functions.invoke('get-download-url', {
          body: { trackId: currentTrack.id }
        });

        if (error) throw error;
        
        if (data?.downloadUrl) {
            const response = await fetch(data.downloadUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            
            // Logica dinamica per estensione
            const extension = currentTrack.wav_r2_key?.toLowerCase().endsWith('.zip') ? '.zip' : '.wav';
            link.setAttribute('download', `${currentTrack.title}${extension}`);
            
            document.body.appendChild(link); link.click(); 
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } else {
            alert("Unable to retrieve download URL.");
        }
    } catch (err) {
        console.error("Download Error:", err);
        alert("Errore nel download.");
    } finally {
        setDownloading(false);
    }
  };

  const handlePurchaseRedirect = () => {
    if (!currentTrack) return;
    setIsMobileMaximized(false);
    navigate(`/track/${createSlug(currentTrack.id, currentTrack.title)}`);
  };

  if (!currentTrack) return null;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const remainingTime = duration - currentTime;
  const isPurchased = ownedTrackIds.has(currentTrack.id);
  const hasAccess = isPurchased || isPro;
  const trackSlug = createSlug(currentTrack.id, currentTrack.title);

  return (
    <>
      {/* FULL SCREEN MOBILE PLAYER OVERLAY */}
      <div className={`
        fixed inset-0 z-[100] md:hidden flex flex-col transition-all duration-500 ease-in-out
        ${isMobileMaximized ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
        ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}
      `}>
        <div className="flex flex-col h-full px-8 pt-12 pb-10">
            <button 
                onClick={() => setIsMobileMaximized(false)}
                className="absolute top-6 left-6 p-2 rounded-full bg-black/5 dark:bg-white/5"
            >
                <ChevronDown size={28} />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                {/* Large Cover Image */}
                <Link 
                    to={`/track/${trackSlug}`} 
                    onClick={() => setIsMobileMaximized(false)}
                    className="w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 cursor-pointer block"
                >
                    <img 
                        src={currentTrack.cover_url} 
                        alt={currentTrack.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                </Link>

                {/* Info Text */}
                <div className="text-center w-full">
                    <Link 
                        to={`/track/${trackSlug}`} 
                        onClick={() => setIsMobileMaximized(false)}
                        className="text-2xl font-black mb-2 line-clamp-1 block hover:text-sky-500 transition-colors"
                    >
                        {currentTrack.title}
                    </Link>
                    <p className="text-lg opacity-60 font-medium line-clamp-1">{currentTrack.artist_name}</p>
                </div>

                {/* Large Waveform Visualizer */}
                <div className="w-full h-24 relative flex items-center">
                    <WaveformVisualizer 
                        track={currentTrack} 
                        height="h-full" 
                        barCount={100} 
                        enableAnalysis={true} 
                        interactive={true} 
                    />
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        value={progress} 
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                </div>

                <div className="flex justify-between w-full px-2 text-xs font-mono opacity-50">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(remainingTime)}</span>
                </div>

                {/* Main Controls Mobile FullScreen */}
                <div className="flex items-center justify-center gap-8">
                    <button 
                        onClick={playPrevious}
                        disabled={!hasPrevious}
                        className={`p-4 rounded-full transition-opacity ${!hasPrevious ? 'opacity-20' : 'opacity-100 active:scale-90'}`}
                    >
                        <SkipBack size={32} fill="currentColor" />
                    </button>

                    <button 
                        onClick={togglePlay}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition transform active:scale-90 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                    >
                        {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                    </button>

                    <button 
                        onClick={playNext}
                        disabled={!hasNext}
                        className={`p-4 rounded-full transition-opacity ${!hasNext ? 'opacity-20' : 'opacity-100 active:scale-90'}`}
                    >
                        <SkipForward size={32} fill="currentColor" />
                    </button>
                </div>
            </div>

            <div className="mt-auto pt-6 flex flex-col gap-4">
                {hasAccess ? (
                    <button 
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full bg-emerald-600 py-4 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95"
                    >
                        {downloading ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
                        {downloading ? 'Preparing...' : `Download ${currentTrack.wav_r2_key?.toLowerCase().endsWith('.zip') ? 'ZIP' : 'WAV'}`}
                    </button>
                ) : (
                    <button 
                        onClick={handlePurchaseRedirect}
                        className="w-full bg-sky-600 py-4 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95"
                    >
                        <ShoppingCart size={24} />
                        Get License
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* STANDARD BOTTOM PLAYER */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-[80] border-t 
        ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}
        shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.2)] 
        transition-all duration-300 ease-in-out
        ${isMobileMinimized ? 'h-6 cursor-pointer' : 'h-20'} md:h-20
      `}
        onClick={() => {
            if (isMobileMinimized) {
                setIsMobileMinimized(false);
            }
        }}
      >
        <audio 
          ref={audioRef} 
          src={currentTrack.mp3_url} 
          preload="metadata"
          crossOrigin="anonymous"
        />

        {isMobileMinimized && (
          <button 
              onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMinimized(false);
              }}
              className="md:hidden absolute inset-0 w-full h-full flex items-center justify-center z-50 opacity-60 hover:opacity-100"
          >
              <ChevronUp size={16} />
          </button>
        )}

        <div className={`absolute top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 pointer-events-none transition-opacity duration-300 ${isMobileMinimized ? 'opacity-100' : 'opacity-100 md:hidden'}`}>
           <div 
               className="h-full bg-sky-500 transition-all duration-100 ease-linear relative" 
               style={{ width: `${progress}%` }}
           >
           </div>
        </div>

        {!isMobileMinimized && (
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="0.1"
              value={progress}
              onChange={handleSeek}
              className="md:hidden absolute top-[-6px] left-0 right-0 h-4 w-full opacity-0 cursor-pointer z-50"
            />
        )}

        <div className={`
              flex w-full h-full items-center justify-between px-4
              transition-opacity duration-200
              ${isMobileMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
              md:opacity-100 md:pointer-events-auto
        `}>

            {/* Mobile Playback - Visible only on small screens */}
            <div className="md:hidden flex items-center gap-1 flex-shrink-0 mr-1">
              <button 
                onClick={(e) => { e.stopPropagation(); playPrevious(); }}
                disabled={!hasPrevious}
                className={`w-8 h-8 flex items-center justify-center transition-opacity ${!hasPrevious ? 'opacity-20' : 'opacity-100'}`}
              >
                <SkipBack size={18} fill="currentColor" />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className={`w-10 h-10 flex items-center justify-center rounded-full shadow-sm ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-black text-white'}`}
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1"/>}
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); playNext(); }}
                disabled={!hasNext}
                className={`w-8 h-8 flex items-center justify-center transition-opacity ${!hasNext ? 'opacity-20' : 'opacity-100'}`}
              >
                <SkipForward size={18} fill="currentColor" />
              </button>
            </div>

            {/* Combined Info + Controls (DESKTOP & MOBILE) */}
            <div className="flex flex-1 items-center justify-start gap-2 md:gap-4 min-w-0 px-1 md:px-0">
              
              {/* Track Info - Click redirects to Detail Page on all devices */}
              <div className="flex items-center gap-3 w-44 md:w-52 lg:w-60 flex-shrink-0 min-w-0">
                <Link 
                  to={`/track/${trackSlug}`} 
                  className="relative block flex-shrink-0"
                >
                  <img 
                    src={currentTrack.cover_url} 
                    alt={currentTrack.title} 
                    className="w-12 h-12 object-cover rounded shadow-sm block hover:scale-105 transition-transform"
                  />
                </Link>
                <div className="overflow-hidden min-w-0 flex flex-col justify-center text-left">
                  <Link 
                    to={`/track/${trackSlug}`}
                    className="font-bold text-sm truncate block hover:text-sky-500 transition-colors"
                    title={currentTrack.title}
                  >
                    {currentTrack.title}
                  </Link>
                  <span className="text-xs opacity-70 truncate block">
                    {currentTrack.artist_name}
                  </span>
                </div>
              </div>

              {/* Desktop Controls Block - MOVED LEFT & BROUGHT CLOSER */}
              <div className="hidden md:flex items-center gap-1.5 lg:gap-2.5 flex-shrink-0">
                  <button 
                    onClick={playPrevious}
                    disabled={!hasPrevious}
                    className={`w-8 h-8 flex items-center justify-center transition-all ${!hasPrevious ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100 active:scale-90'}`}
                    title="Previous"
                  >
                    <SkipBack size={18} fill="currentColor" />
                  </button>

                  <button 
                    onClick={togglePlay}
                    className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition hover:scale-105 shadow-sm ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                  >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                  </button>

                  <button 
                    onClick={playNext}
                    disabled={!hasNext}
                    className={`w-8 h-8 flex items-center justify-center transition-all ${!hasNext ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100 active:scale-90'}`}
                    title="Next"
                  >
                    <SkipForward size={18} fill="currentColor" />
                  </button>
              </div>

              {/* Waveform - Now centered and flexible */}
              <div className="hidden md:flex flex-1 items-center gap-4 min-w-0">
                  <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs font-mono opacity-50 min-w-[35px] text-right">
                          {formatTime(currentTime)}
                      </span>

                      <div className="relative flex-1 h-12 flex items-center group">
                            <div className="absolute inset-0 z-0 flex items-center">
                                <WaveformVisualizer 
                                    track={currentTrack} 
                                    height="h-full" 
                                    interactive={true} 
                                    enableAnalysis={true} 
                                />
                            </div>
                            
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                defaultValue={0} 
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                title="Seek"
                            />
                      </div>

                      <span className="text-xs font-mono opacity-50 min-w-[40px]">
                          -{formatTime(remainingTime)}
                      </span>
                  </div>
              </div>
            </div>

            {/* Right Controls (Volume, License, Download) */}
            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
              
              <div className="hidden md:flex items-center gap-2 group relative">
                  <button onClick={toggleMute} className="opacity-60 hover:opacity-100 transition p-2">
                      <VolumeIcon size={20} />
                  </button>
                  <div className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300 ease-in-out">
                      <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-sky-500 block"
                      />
                  </div>
              </div>

              <div className="relative">
                  {hasAccess ? (
                      <button 
                          onClick={handleDownload}
                          disabled={downloading}
                          className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-sm hover:scale-105"
                      >
                          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          <span>{downloading ? 'Preparing...' : `Download ${currentTrack.wav_r2_key?.toLowerCase().endsWith('.zip') ? 'ZIP' : 'WAV'}`}</span>
                      </button>
                  ) : (
                      !session ? (
                          <button 
                              onClick={() => navigate('/auth')}
                              className="hidden md:flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-sm hover:scale-105"
                          >
                              <ShoppingCart size={14} />
                              <span>Log in to Buy</span>
                          </button>
                      ) : (
                          <button 
                              onClick={handlePurchaseRedirect}
                              className="hidden md:flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-sm hover:scale-105"
                          >
                              <ShoppingCart size={14} />
                              <span>Buy License</span>
                          </button>
                      )
                  )}
              </div>

              <div className="md:hidden flex items-center gap-2">
                  <div className="relative">
                      {hasAccess ? (
                          <button 
                              onClick={handleDownload}
                              disabled={downloading}
                              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-colors"
                              title="Download"
                          >
                              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                          </button>
                      ) : (
                          !session ? (
                              <button 
                                  onClick={() => navigate('/auth')}
                                  className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-lg transition-colors"
                                  title="Log in to buy"
                              >
                                  <ShoppingCart size={18} />
                              </button>
                          ) : (
                              <button 
                                  onClick={() => setIsMobileMaximized(true)}
                                  className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-lg transition-colors"
                                  title="View Player"
                              >
                                  <Maximize2 size={18} />
                              </button>
                          )
                      )}
                  </div>

                  <button 
                      onClick={() => setIsMobileMinimized(true)}
                      className="p-1 opacity-60 hover:opacity-100"
                      title="Minimize Player"
                  >
                      <ChevronDown size={22} />
                  </button>
              </div>
            </div>
        </div>
      </div>
    </>
  );
};
