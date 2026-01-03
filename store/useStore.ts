
import { create } from 'zustand';
import { MusicTrack } from '../types';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface PurchasedItem {
  track_id: number | null;
  album_id: number | null;
  license_type: string;
}

interface AppState {
  // Auth State
  session: Session | null;
  subscriptionStatus: string | null;
  isSubscriber: boolean;
  renewsAt: string | null;
  setSession: (session: Session | null) => void;
  purchasedTracks: PurchasedItem[]; // Tracks both single tracks and albums
  fetchPurchases: () => Promise<void>;
  fetchProfile: () => Promise<void>;

  // Audio Player State
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  seekTime: number | null;
  
  playTrack: (track: MusicTrack) => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  setProgress: (progress: number) => void;
  setSeekTime: (time: number | null) => void;
  
  // Theme State
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  session: null,
  subscriptionStatus: null,
  isSubscriber: false,
  renewsAt: null,
  setSession: (session) => {
    set({ session });
    if (session) {
      get().fetchPurchases();
      get().fetchProfile();
    } else {
      set({ purchasedTracks: [], subscriptionStatus: null, isSubscriber: false, renewsAt: null });
    }
  },
  purchasedTracks: [],
  fetchProfile: async () => {
    const session = get().session;
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, is_subscriber, renews_at')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error.message);
        return;
      }
      
      if (data) {
        set({ 
          subscriptionStatus: data.subscription_status,
          isSubscriber: data.is_subscriber === true,
          renewsAt: data.renews_at
        });
      }
    } catch (err: any) {
      console.error("Exception fetching profile:", err.message || err);
    }
  },
  fetchPurchases: async () => {
    const session = get().session;
    if (!session?.user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('track_id, album_id, license_type')
        .eq('user_id', session.user.id);
      
      if (error) {
        console.error("Error fetching purchases:", error.message);
        return;
      }
      
      if (data) {
        set({ purchasedTracks: data as PurchasedItem[] });
      }
    } catch (err: any) {
      console.error("Exception fetching purchases:", err.message || err);
    }
  },

  currentTrack: null,
  isPlaying: false,
  volume: 1,
  progress: 0,
  seekTime: null,
  
  playTrack: (track) => set((state) => {
    if (state.currentTrack?.id === track.id) {
      return { isPlaying: !state.isPlaying };
    }
    return { currentTrack: track, isPlaying: true, progress: 0 };
  }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setVolume: (vol) => set({ volume: vol }),
  setProgress: (progress) => set({ progress }),
  setSeekTime: (time) => set({ seekTime: time }),

  isDarkMode: false,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
