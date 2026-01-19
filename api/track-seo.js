// api/track-seo.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Estrai l'ID dallo slug (es. "89-sexy-blues" -> "89")
  const { slug } = req.query;
  const id = slug.split('-')[0];

  const { data: track, error } = await supabase
    .from('squeeze_tracks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !track) {
    return res.status(404).send('Track not found');
  }

  const title = `${track.title} by ${track.artist_name} | Pinegroove`;
  const description = track.description || "Listen to this track on Pinegroove";
  const image = track.cover_url;
  const url = `https://pinegroove.net/track/${slug}`;

  // HTML minimo con solo i meta tag necessari per i crawler
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="description" content="${description}">
      
      <meta property="og:type" content="music.song">
      <meta property="og:url" content="${url}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${image}">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">

      <meta property="twitter:card" content="summary_large_image">
      <meta property="twitter:url" content="${url}">
      <meta property="twitter:title" content="${title}">
      <meta property="twitter:description" content="${description}">
      <meta property="twitter:image" content="${image}">

      <script>window.location.href = '${url}';</script>
    </head>
    <body>
      <p>Redirecting to track...</p>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-maxage=86400');
  return res.status(200).send(html);
}