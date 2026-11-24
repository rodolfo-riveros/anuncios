/** Reduce y comprime una imagen a JPEG para guardarla en el navegador */
export async function compressImage(file: File, max = 1000, quality = 0.72): Promise<string> {
  const bmp = await createImageBitmap(file).catch(async () => {
    // Safari antiguo: usa <img>
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.src = src;
    await img.decode();
    URL.revokeObjectURL(src);
    return img;
  });
  const w0 = 'naturalWidth' in bmp ? bmp.naturalWidth : bmp.width;
  const h0 = 'naturalHeight' in bmp ? bmp.naturalHeight : bmp.height;
  const k = Math.min(1, max / Math.max(w0, h0));
  const w = Math.round(w0 * k);
  const h = Math.round(h0 * k);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  return c.toDataURL('image/jpeg', quality);
}

/** Patrón tipo QR determinista (solo visual, para la demo de Yape/Plin) */
export function fakeQr(seed: string, n = 25): boolean[][] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0), (h & 0xff) / 255);
  const g = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > 0.52));
  const finder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const edge = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        g[r + i]![c + j] = edge || core;
      }
    for (let i = -1; i <= 7; i++)
      for (const [a, b] of [[r - 1, c + i], [r + 7, c + i], [r + i, c - 1], [r + i, c + 7]] as const)
        if (g[a]?.[b] !== undefined) g[a]![b] = false;
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  return g;
}
