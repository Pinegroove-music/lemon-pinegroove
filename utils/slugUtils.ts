
export const createSlug = (id: number, title: string) => {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Rimuove caratteri speciali
    .replace(/[\s_-]+/g, '-') // Sostituisce spazi con trattini
    .replace(/^-+|-+$/g, ''); // Rimuove trattini iniziali/finali
  return `${id}-${slug}`;
};

export const getIdFromSlug = (slug: string | undefined) => {
  if (!slug) return null;
  // Prende la parte prima del primo trattino
  const idPart = slug.split('-')[0];
  return /^\d+$/.test(idPart) ? idPart : null;
};
