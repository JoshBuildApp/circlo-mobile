/**
 * Utility to optimize image URLs (Unsplash + Supabase Storage)
 * by rewriting size params and generating srcset for responsive images.
 */

const UNSPLASH_REGEX = /^https:\/\/images\.unsplash\.com\//;
const SUPABASE_STORAGE_REGEX = /\/storage\/v1\/object\/public\//;

/**
 * Rewrites an Unsplash URL to request a specific width.
 * Also rewrites Supabase Storage URLs to use image transforms.
 * Other URLs are returned unchanged.
 */
export function unsplashUrl(url: string, width: number, height?: number): string {
  if (UNSPLASH_REGEX.test(url)) {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    if (height) {
      u.searchParams.set("h", String(height));
    } else {
      u.searchParams.delete("h");
    }
    u.searchParams.set("fit", "crop");
    u.searchParams.set("auto", "format");
    u.searchParams.set("q", "75");
    return u.toString();
  }

  // Supabase Storage image transforms:
  // Replace /object/public/ with /render/image/public/ and add width/height params
  if (SUPABASE_STORAGE_REGEX.test(url)) {
    try {
      const u = new URL(url);
      u.pathname = u.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
      u.searchParams.set("width", String(width));
      if (height) u.searchParams.set("height", String(height));
      u.searchParams.set("quality", "75");
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Generates a srcset string for responsive images.
 * Works for Unsplash and Supabase Storage URLs.
 * Returns undefined for other URLs.
 */
export function unsplashSrcSet(url: string, widths: number[]): string | undefined {
  if (!UNSPLASH_REGEX.test(url) && !SUPABASE_STORAGE_REGEX.test(url)) return undefined;

  return widths
    .map((w) => `${unsplashUrl(url, w)} ${w}w`)
    .join(", ");
}

/**
 * Preset size configurations for common use cases
 */
export const IMAGE_SIZES = {
  /** Small avatar (36px displayed) */
  avatarSm: { width: 80, srcWidths: [80, 160] },
  /** Medium avatar (80-130px displayed) */
  avatarMd: { width: 200, srcWidths: [130, 260] },
  /** Thumbnail card (≈200px displayed) */
  thumbnail: { width: 300, srcWidths: [200, 400] },
  /** Medium card (≈400px displayed) */
  card: { width: 500, srcWidths: [300, 500, 800] },
  /** Large hero/featured (≈800px displayed) */
  hero: { width: 800, srcWidths: [400, 800, 1200] },
} as const;
