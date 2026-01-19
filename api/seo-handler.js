import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { type, slug } = req.query;

  // 1. Estrazione e validazione ID (gestisce i BigInt convertendo la stringa in numero)
  const idStr = slug?.split('-')[0];
  const id = parseInt(idStr);

  if (!slug || isNaN(id)) {
    return res.status(400).send('Invalid ID or Slug');
  }

  // 2. Mappatura dinamica: se l'URL usa "music-packs", puntiamo alla tabella "album"
  const isAlbum = type === 'music-packs' || type === 'album';
  const table = isAlbum ? 'album' : 'squeeze_tracks';
  
  const { data: item, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !item) {
    console.error("Supabase error:", error);
    return res.status(404).send('Content not found on Pinegroove');
  }

  // 3. Preparazione metadati differenziati
  // Gli album non hanno artist_name nella tua tabella, le tracce sì.
  const displayTitle = isAlbum 
    ? `${item.title} (Music Pack)` 
    : `${item.title} by ${item.artist_name}`;
    
  const title = `${displayTitle} | Pinegroove`;
  const description = item.description?.replace(/[#*]/g, '').substring(0, 160) || "Listen on Pinegroove";
  const image = item.cover_url;
  const url = `https://pinegroove.net/${type}/${slug}`;

  // 4. Dati Strutturati (JSON-LD) per Google
  const jsonLd = isAlbum 
    ? {
        "@context": "https://schema.org",
        "@type": "MusicAlbum",
        "name": item.title,
        "image": image,
        "description": description,
        "url": url,
        "offers": item.price ? {
          "@type": "Offer",
          "price": item.price,
          "priceCurrency": "USD",
          "url": item.gumroad_link
        } : undefined
      }
    : {
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        "name": item.title,
        "byArtist": { "@type": "MusicGroup", "name": item.artist_name },
        "image": image,
        "description": description,
        "url": url
      };

  // 5. Generazione HTML per i Crawler
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="description" content="${description}">
      
      <meta property="og:type" content="${isAlbum ? 'music.album' : 'music.song'}">
      <meta property="og:url" content="${url}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      
      <meta property="og:image" content="${image}">
      <meta property="og:image:secure_url" content="${image}">
      <meta property="og:image:type" content="image/jpeg">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:image:alt" content="Cover art for ${item.title}">

      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${description}">
      <meta name="twitter:image" content="${image}">

      <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
      <script>window.location.href = '${url}';</script>
    </head>
    <body><p>Redirecting...</p></body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  // Cache di 24 ore su Vercel Edge Network
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  return res.status(200).send(html);
}