import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description,
  image = "https://pub-2da555791ab446dd9afa8c2352f4f9ea.r2.dev/media/logo-pinegroove.svg", 
  url 
}) => {
  const siteTitle = "Pinegroove";
  const fullTitle = `${title} | ${siteTitle}`;
  
  // Use provided description, or fallback to default if it's undefined OR empty string
  const effectiveDescription = description || "Pinegroove offers a catalog of high-quality, royalty-free stock music perfect for videos, YouTube, social media, TV, and web projects. Find your perfect soundtrack here.";

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      {/* 
        Key attribute is CRITICAL here. 
        It ensures that this tag overrides any previous description tag.
      */}
      <meta name="description" content={effectiveDescription} key="description" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={effectiveDescription} key="og:description" />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={effectiveDescription} key="twitter:description" />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};