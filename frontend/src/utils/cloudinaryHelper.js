/**
 * Cloudinary URL transformation utilities for data-saving and fast loading.
 */
export const getThumbnailUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Compress to WebP, optimize quality and restrict width to 400px for feed
  return url.replace('/upload/', '/upload/c_limit,w_400,f_auto,q_auto/');
};

export const getFullImageUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  // High quality view with max width 1280px
  return url.replace('/upload/', '/upload/c_limit,w_1280,f_auto,q_auto/');
};
