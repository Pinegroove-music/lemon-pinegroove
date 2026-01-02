
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { MusicTrack } from '../types';
import { useStore } from '../store/useStore';

interface WaveformVisualizerProps {
  track: MusicTrack;
  height?: string;
  barCount?: number; 
  interactive?: boolean;
  enableAnalysis?: boolean; 
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ 
  track, 
  height = "h-12",
  interactive = false,
  enableAnalysis = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { isDarkMode, currentTrack, isPlaying, progress, setSeekTime, setProgress } = useStore();
  
  const isActive = currentTrack?.id === track.id;
  const currentProgress = isActive ? progress : 0;

  const progressRef = useRef(currentProgress);
  const isPlayingRef = useRef(isPlaying);
  const isActiveRef = useRef(isActive);
  
  // NEW: Ref to track the last update time for interpolation
  const lastFrameTimeRef = useRef<number>(0);
  // NEW: Ref to store the actual interpolated progress for smooth drawing
  const smoothProgressRef = useRef(currentProgress);

  const [realWaveformData, setRealWaveformData] = useState<number[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [transitionValue, setTransitionValue] = useState(0); 

  useEffect(() => {
    progressRef.current = currentProgress;
    isPlayingRef.current = isPlaying;
    isActiveRef.current = isActive;
    
    // If stopped or seeking (large jump), snap immediately, don't interpolate
    if (!isPlaying || Math.abs(smoothProgressRef.current - currentProgress) > 5) {
        smoothProgressRef.current = currentProgress;
    }
  }, [currentProgress, isPlaying, isActive]);

  // 1. FALLBACK SIMULATION
  const simulatedWaveformData = useMemo(() => {
    const data: number[] = [];
    let seed = track.id * 999; 
    const points = 100; 

    const getSectionEnergy = (pct: number) => {
        if (pct < 0.10) return 0.3; 
        if (pct < 0.30) return 0.5; 
        if (pct < 0.45) return 0.8; 
        if (pct < 0.60) return 0.5; 
        if (pct < 0.75) return 0.9; 
        if (pct < 0.85) return 0.6; 
        if (pct < 0.95) return 0.9; 
        return 0.2; 
    };

    for (let i = 0; i < points; i++) {
        const pct = i / points;
        const baseEnergy = getSectionEnergy(pct);
        const r1 = seededRandom(seed + i);
        const r2 = seededRandom(seed + i * 2);
        let val = baseEnergy * (0.6 + r1 * 0.4); 
        if (i % 4 === 0) val *= (1 + r2 * 0.3);
        val = Math.max(0.1, Math.min(1.0, val));
        data.push(val);
    }
    return data;
  }, [track.id]);

  // 2. REAL AUDIO ANALYSIS
  useEffect(() => {
      setRealWaveformData(null); 
      setAnalyzing(false);
      setTransitionValue(0); 
  }, [track.id]);

  useEffect(() => {
      if (enableAnalysis && !realWaveformData && !analyzing && track.mp3_url) {
          const analyzeAudio = async () => {
              setAnalyzing(true);
              try {
                  const response = await fetch(track.mp3_url);
                  const arrayBuffer = await response.arrayBuffer();
                  
                  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                  const audioContext = new AudioContextClass();
                  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                  
                  const rawData = audioBuffer.getChannelData(0); 
                  const samples = 80; 
                  const blockSize = Math.floor(rawData.length / samples);
                  const filteredData = [];

                  for (let i = 0; i < samples; i++) {
                      const start = i * blockSize;
                      let max = 0;
                      for (let j = 0; j < blockSize; j++) {
                          const val = Math.abs(rawData[start + j]);
                          if (val > max) max = val;
                      }
                      filteredData.push(max);
                  }

                  const multiplier = Math.max(...filteredData) || 1;
                  const normalized = filteredData.map(n => n / multiplier);
                  
                  setRealWaveformData(normalized);
                  let frame = 0;
                  const fade = () => {
                      frame += 0.05; 
                      if (frame >= 1) {
                          setTransitionValue(1);
                      } else {
                          setTransitionValue(frame);
                          requestAnimationFrame(fade);
                      }
                  };
                  requestAnimationFrame(fade);

              } catch (err) {
                  console.error("Error analyzing audio:", err);
              } finally {
                  setAnalyzing(false);
              }
          };
          analyzeAudio();
      }
  }, [track.mp3_url, enableAnalysis, realWaveformData, analyzing, track.id]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setProgress(val);
      setSeekTime(val);
      smoothProgressRef.current = val; // Snap visual immediately on seek
  };

  const preventProp = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
  };

  // Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (timestamp: number) => {
      const _isActive = isActiveRef.current;
      const _isPlaying = isPlayingRef.current;
      
      // Calculate delta time for smooth interpolation
      if (_isActive && _isPlaying) {
          const target = progressRef.current;
          const current = smoothProgressRef.current;
          smoothProgressRef.current = current + (target - current) * 0.2; 
      } else {
          smoothProgressRef.current = progressRef.current;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const barWidth = 3 * dpr; 
      const gap = 2 * dpr;
      const totalBarWidth = barWidth + gap;
      const numBars = Math.floor(width / totalBarWidth);
      
      const bgBarColor = isDarkMode ? 'rgb(82, 82, 91)' : 'rgb(212, 212, 216)';
      const activeBarColor = 'rgb(14, 165, 233)';

      ctx.clearRect(0, 0, width, height);

      const pulse = (_isActive && _isPlaying) 
        ? 1 + Math.sin(Date.now() / 150) * 0.02 
        : 1;

      const drawBars = (color: string) => {
          ctx.fillStyle = color;
          for (let i = 0; i < numBars; i++) {
            const simIndex = Math.floor((i / numBars) * simulatedWaveformData.length);
            const realIndex = realWaveformData ? Math.floor((i / numBars) * realWaveformData.length) : 0;
            
            const simAmp = simulatedWaveformData[simIndex] || 0.1;
            const realAmp = realWaveformData ? (realWaveformData[realIndex] || 0.1) : simAmp;
            
            let amplitude = simAmp * (1 - transitionValue) + realAmp * transitionValue;
            amplitude *= pulse;
            
            const barHeight = Math.max(2 * dpr, amplitude * height * 0.9); 
            const x = i * totalBarWidth;
            const y = centerY - barHeight / 2;
            
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, barWidth, barHeight, 2 * dpr);
            } else {
                ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
          }
      };

      drawBars(bgBarColor);

      if (_isActive) {
          ctx.save();
          // Use smooth interpolated progress
          const progressWidth = (smoothProgressRef.current / 100) * width;
          ctx.beginPath();
          ctx.rect(0, 0, progressWidth, height);
          ctx.clip();
          drawBars(activeBarColor);
          ctx.restore();
      }

      // Always animate loop to keep lerp active
      if ((_isActive && _isPlaying) || (transitionValue > 0 && transitionValue < 1)) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Kick off
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [simulatedWaveformData, realWaveformData, transitionValue, isDarkMode, isActive, isPlaying]);

  return (
    <div ref={containerRef} className={`w-full ${height} relative group`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
      
      {interactive && isActive && (
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="0.1"
            value={progress} 
            onChange={handleSeek}
            onClick={preventProp}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="Seek"
        />
      )}
    </div>
  );
};
