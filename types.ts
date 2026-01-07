
export interface MusicTrack {
  id: number;
  created_at: string;
  title: string;
  artist_name: string;
  mp3_url: string;
  cover_url: string;
  wav_r2_key: string | null;
  description: string | null;
  gumroad_link: string | null;
  variant_id_standard: string | null; 
  variant_id_extended: string | null; 
  checkout_uuid: string | null; // Nuova colonna per lo UUID Lemon Squeezy
  bpm: number | null;
  iswc: string | null;
  isrc: string | null;
  genre: string[] | string | null;
  mood: string[] | string | null;
  instrument: string[] | string | null;
  tags: string[] | string | null;
  credits: Record<string, any> | null;
  season: string[] | string | null;
  duration: number | null;
  year: number | null;
  lyrics: string | null;
  media_theme: string[] | string | null;
}

export interface Client {
  id: number;
  created_at: string;
  name: string;
  logo_url: string;
}

export interface Album {
  id: number;
  created_at?: string;
  title: string;
  cover_url: string;
  description: string | null;
  price: number;
  gumroad_link: string | null;
  checkout_uuid: string | null;
  variant_id_standard: string | null;
  variant_id_extended: string | null;
}

export interface MediaTheme {
  id: number;
  created_at: string;
  title: string;
  media_theme_pic: string;
}

export interface Coupon {
  id: number;
  created_at: string;
  discount_name: string;
  discount_description: string | null;
  discount_percent: number;
  discount_code: string;
  is_active: boolean;
}

export interface PricingItem {
  id: number;
  product_name: string;
  product_type: string;
  price: number;
  currency: string;
}

export interface FilterState {
  genres: string[];
  moods: string[];
  instruments: string[];
  seasons: string[];
  mediaThemes: string[];
  bpmRange: 'slow' | 'medium' | 'fast' | null;
  searchQuery: string;
}
