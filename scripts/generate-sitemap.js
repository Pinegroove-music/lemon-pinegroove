import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione Supabase
const supabaseUrl = 'https://byurfsmzxeemvmwbndif.supabase.co';
const supabaseKey = 'sb_publishable_VQZ3Eh0NKggW0bqL8Qu1BA_6eX0BZ_P';
const supabase = createClient(supabaseUrl, supabaseKey);

const DOMAIN = 'https://www.pinegroove.net';

const staticRoutes = [
  '',
  '/library',
  '/music-packs',
  '/categories/genres',
  '/categories/moods',
  '/categories/seasonal',
  '/categories/instruments',
  '/about',
  '/faq',
  '/content-id',
];

// Helper per creare lo slug (deve essere identico a quello in utils/slugUtils.ts)
const createSlug = (id, title) => {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${id}-${slug}`;
};

async function generateSitemap() {
  console.log('🔄 Inizio generazione Sitemap...');

  let urls = [];
  const currentDate = new Date().toISOString();

  staticRoutes.forEach(route => {
    urls.push({
      loc: `${DOMAIN}${route}`,
      changefreq: 'daily',
      priority: route === '' ? '1.0' : '0.8',
      lastmod: currentDate
    });
  });

  // 1. Fetch Tracks from the new squeeze_tracks table
  const { data: tracks, error: tracksError } = await supabase
    .from('squeeze_tracks')
    .select('id, title');

  if (tracksError) console.error('Errore tracks:', tracksError);
  else {
    console.log(`🎵 Trovate ${tracks.length} tracce.`);
    tracks.forEach(track => {
      urls.push({
        loc: `${DOMAIN}/track/${createSlug(track.id, track.title)}`,
        lastmod: currentDate, // Usiamo la data di generazione
        changefreq: 'weekly',
        priority: '0.7'
      });
    });
  }

  // 2. Fetch Albums (senza chiedere date specifiche per evitare errori)
  const { data: albums, error: albumsError } = await supabase
    .from('album')
    .select('id, title');

  if (albumsError) console.error('Errore albums:', albumsError);
  else {
    console.log(`💿 Trovati ${albums.length} album.`);
    albums.forEach(album => {
      urls.push({
        loc: `${DOMAIN}/music-packs/${createSlug(album.id, album.title)}`,
        lastmod: currentDate, // Usiamo la data di generazione
        changefreq: 'weekly',
        priority: '0.9'
      });
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  
  if (!fs.existsSync(publicDir)) {
      console.log('⚠️ Cartella public non trovata, provo a scrivere nella root...');
      fs.writeFileSync('sitemap.xml', sitemap);
  } else {
      fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  }

  console.log(`✅ Sitemap generata con successo con ${urls.length} URL!`);
}

generateSitemap();