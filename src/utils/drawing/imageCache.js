//loading faster

const MAX_CACHE_SIZE = 100;
const imageCache = new Map();

export function getCachedImage(src) {
  if (imageCache.has(src)) {
    // Move to end = mark as most recently used
    const img = imageCache.get(src);
    imageCache.delete(src);
    imageCache.set(src, img);
    return img;
  }

  const img = new Image();
  img.src = src;
  imageCache.set(src, img);

  // Evict least recently used entry if over limit
  if (imageCache.size > MAX_CACHE_SIZE) {
    const oldestKey = imageCache.keys().next().value;
    imageCache.delete(oldestKey);
  }

  return img;
}

// Alias kept for compatibility with existing callers (addImageElement pre-caches)
export function cacheImage(_id, dataUrl) {
  getCachedImage(dataUrl);
}

// Utility — clear all cached images (useful on board change or low-memory)
export function clearImageCache() {
  imageCache.clear();
}