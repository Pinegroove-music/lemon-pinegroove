import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  isTrack?: boolean;
  artistName?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description,
  image = "https://pub-2da555791ab446dd9afa8c2352f4f9ea.r2.dev/media/logo-pinegroove.svg", 
  url,
  isTrack = false,
  artistName
}) => {
  const siteTitle = "Pinegroove";
  const fullTitle = `${title} | ${siteTitle}`;
  const effectiveDescription = description || "Pinegroove offers high-quality, royalty-free stock music.";

  // Creazione dell'oggetto JSON-LD
  const structuredData = isTrack ? {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": title,
    "description": effectiveDescription,
    "image": image,
    "url": url,
    "byArtist": {
      "@type": "MusicGroup",
      "name": artistName || "Pinegroove"
    }
  } : null;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={effectiveDescription} key="description" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={isTrack ? "music.song" : "website"} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={effectiveDescription} key="og:description" />
      <meta property="og:image" content={image} />
      {url && <meta property="og:url" content={url} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={effectiveDescription} key="twitter:description" />
      <meta name="twitter:image" content={image} />

      {/* Google Rich Results (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};