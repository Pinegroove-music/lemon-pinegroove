
import React from 'react';
import { PricingItem } from '../types';

interface MusicPackSchemaProps {
  pack: {
    id: number;
    title: string;
    description: string | null;
    coverUrl: string;
  };
  tracks: {
    title: string;
    duration: number | null;
  }[];
  pricing: PricingItem[];
  currentUrl: string;
}

export const MusicPackSchema: React.FC<MusicPackSchemaProps> = ({ pack, tracks, pricing, currentUrl }) => {
  // Conversione durata in ISO 8601 (es: PT3M45S)
  const getDurationISO = (seconds: number | null) => {
    if (!seconds) return undefined;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `PT${mins}M${secs}S`;
  };

  const personId = "https://www.pinegroove.net/about#francescobiondi";
  const validUntilDate = "2026-12-31";

  // Costruzione delle offerte basate sulla tabella pricing per i pack
  const licenseOffers = pricing
    .filter(p => p.product_type === 'music_pack_standard' || p.product_type === 'music_pack_extended')
    .map(p => ({
      "@type": "Offer",
      "name": p.product_name,
      "price": p.price,
      "priceCurrency": p.currency === '€' ? 'EUR' : p.currency,
      "priceValidUntil": validUntilDate,
      "availability": "https://schema.org/InStock",
      "category": "Synchronization License Bundle",
      "url": currentUrl,
      "seller": {
        "@type": "Person",
        "@id": personId
      }
    }));

  const schema = {
    "@context": "https://schema.org",
    "@type": ["Product", "MusicAlbum"],
    "@id": `${currentUrl}#album`,
    "name": pack.title,
    "description": pack.description || `Premium music bundle "${pack.title}" curated by Francesco Biondi.`,
    "image": pack.coverUrl,
    "sku": `PG-PACK-${pack.id}`,
    "brand": {
      "@type": "Brand",
      "name": "Pinegroove"
    },
    "byArtist": {
      "@type": "Person",
      "@id": personId,
      "name": "Francesco Biondi",
      "url": "https://www.pinegroove.net/about"
    },
    "offers": licenseOffers.length > 0 ? licenseOffers : {
      "@type": "Offer",
      "url": currentUrl,
      "price": "49.99",
      "priceCurrency": "EUR",
      "priceValidUntil": validUntilDate,
      "availability": "https://schema.org/InStock",
      "category": "Synchronization License Bundle",
      "seller": {
        "@type": "Person",
        "@id": personId
      }
    },
    "track": {
      "@type": "ItemList",
      "numberOfItems": tracks.length,
      "itemListElement": tracks.map((t, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "MusicRecording",
          "name": t.title,
          "duration": getDurationISO(t.duration),
          "byArtist": {
            "@type": "Person",
            "@id": personId
          }
        }
      }))
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
