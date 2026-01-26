
import React from 'react';
import { MusicTrack, PricingItem } from '../types';

interface TrackSchemaProps {
  track: MusicTrack;
  currentUrl: string;
  pricing: PricingItem[];
}

export const TrackSchema: React.FC<TrackSchemaProps> = ({ track, currentUrl, pricing }) => {
  // Conversione durata in ISO 8601 (es: PT3M45S)
  const getDurationISO = (seconds: number | null) => {
    if (!seconds) return undefined;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `PT${mins}M${secs}S`;
  };

  const personId = "https://www.pinegroove.net/about#francescobiondi";

  // Mapping dei generi come array di stringhe
  const genres = Array.isArray(track.genre) 
    ? track.genre 
    : (track.genre ? [track.genre] : []);

  // Costruzione delle offerte basate sulla tabella pricing
  const licenseOffers = pricing
    .filter(p => p.product_type === 'single_track_standard' || p.product_type === 'single_track_extended')
    .map(p => ({
      "@type": "Offer",
      "name": p.product_name, // Mantiene il nome specifico (Standard Sync License / Extended Sync License)
      "price": p.price,
      "priceCurrency": p.currency === '€' ? 'EUR' : p.currency, // Converte il simbolo in codice ISO standard
      "availability": "https://schema.org/InStock",
      "category": "Synchronization License",
      "url": currentUrl,
      "seller": {
        "@type": "Person",
        "@id": personId
      }
    }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `${currentUrl}#recording`,
    "name": track.title,
    "url": currentUrl,
    "image": track.cover_url,
    "genre": genres,
    "description": track.description || `Original music track "${track.title}" by Francesco Biondi.`,
    "duration": getDurationISO(track.duration),
    "isrcCode": track.isrc,
    "encodingFormat": "audio/wav", // Semplificato per compatibilità Google Search
    "byArtist": {
      "@type": "Person",
      "@id": personId,
      "name": "Francesco Biondi",
      "url": "https://www.pinegroove.net/about"
    },
    "recordingOf": {
      "@type": "MusicComposition",
      "name": track.title,
      "iswcCode": track.iswc,
      "composer": {
        "@type": "Person",
        "@id": personId
      }
    },
    "offers": licenseOffers.length > 0 ? licenseOffers : {
      "@type": "Offer",
      "url": currentUrl,
      "availability": "https://schema.org/InStock",
      "category": "Synchronization License",
      "seller": {
        "@type": "Person",
        "@id": personId
      }
    },
    "acquireLicensePage": currentUrl
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
