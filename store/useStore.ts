
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
  purchasedTracks: PurchasedItem[]; // Rows from purchases table
  ownedTrackIds: Set<number>; // Flat set of all owned track IDs (direct + via albums)
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
      set({ purchasedTracks: [], ownedTrackIds: new Set(), subscriptionStatus: null, isSubscriber: false, renewsAt: null });
    }
  },
  purchasedTracks: [],
  ownedTrackIds: new Set(),
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
    const userId = session?.user?.id;
    if (!userId) return;
    
    try {
      // 1. Get direct purchases from the purchases table
      // We strictly use squeeze_tracks as the source of truth
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('track_id, album_id, license_type')
        .eq('user_id', userId);
      
      if (purchaseError) {
        console.error("Error fetching purchases:", purchaseError.message);
        return;
      }
      
      const trackIds = new Set<number>();
      const albumIds: number[] = [];

      purchases?.forEach(p => {
        if (p.track_id) trackIds.add(p.track_id);
        if (p.album_id) albumIds.push(p.album_id);
      });

      // 2. Resolve tracks inside purchased albums (Music Packs)
      if (albumIds.length > 0) {
        const { data: albumTracks, error: albumTracksError } = await supabase
          .from('album_tracks')
          .select('track_id')
          .in('album_id', albumIds);

        if (!albumTracksError && albumTracks) {
          albumTracks.forEach(at => trackIds.add(at.track_id));
        }
      }
      
      set({ 
        purchasedTracks: (purchases || []) as PurchasedItem[],
        ownedTrackIds: trackIds
      });
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
