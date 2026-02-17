const imageCache = new Map();

export function getCachedImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

export function cacheImage(id, dataUrl) {
  if (imageCache.has(dataUrl)) return;
  const img = new Image();
  img.src = dataUrl;
  imageCache.set(dataUrl, img);
}
