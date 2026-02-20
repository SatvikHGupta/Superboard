// src/utils/drawing/imageCache.js
//
// B10: LRU (Least Recently Used) eviction — max 100 entries.
//
// How LRU works with JavaScript Map:
//   Map preserves insertion order. To mark an entry as "recently used",
//   we delete it then re-insert it — it moves to the END of the Map.
//   The FIRST entry (map.keys().next().value) is therefore always the
//   OLDEST (least recently used). When size > MAX we evict the first entry.

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