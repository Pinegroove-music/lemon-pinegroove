
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'music.song' | 'music.album';
  // Dati extra per Schema.org
  trackData?: {
    artist: string;
    duration?: string;
    genre?: string;
    datePublished?: string;
  };
  albumData?: {
    artist: string;
    numTracks?: number;
    genre?: string;
  };
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description,
  image = "https://media.pinegroove.net/media/logo-pinegroove.svg", 
  url,
  type = 'website',
  trackData,
  albumData
}) => {
  const siteTitle = "Pinegroove";
  const fullTitle = `${title} | ${siteTitle}`;
  const effectiveDescription = description || "Pinegroove offers a catalog of high-quality, royalty-free stock music perfect for videos, YouTube, social media, TV, and web projects.";
  const currentUrl = url || window.location.href;

  // Costruzione JSON-LD per Google Search (Rich Snippets)
  const structuredData = () => {
    if (type === 'music.song' && trackData) {
      return {
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        "name": title,
        "image": image,
        "description": effectiveDescription,
        "url": currentUrl,
        "duration": trackData.duration,
        "genre": trackData.genre,
        "datePublished": trackData.datePublished,
        "byArtist": {
          "@type": "MusicGroup",
          "name": trackData.artist
        }
      };
    }
    if (type === 'music.album' && albumData) {
      return {
        "@context": "https://schema.org",
        "@type": "MusicAlbum",
        "name": title,
        "image": image,
        "description": effectiveDescription,
        "url": currentUrl,
        "genre": albumData.genre,
        "numTracks": albumData.numTracks,
        "byArtist": {
          "@type": "MusicGroup",
          "name": albumData.artist
        }
      };
    }
    return null;
  };

  const jsonLd = structuredData();

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={effectiveDescription} key="description" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={effectiveDescription} key="og:description" />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="Pinegroove" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={effectiveDescription} key="twitter:description" />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
