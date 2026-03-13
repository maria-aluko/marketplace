/**
 * Insert Cloudinary transforms into a Cloudinary URL.
 * If the URL is not a Cloudinary URL, returns it unchanged.
 *
 * @example
 * cloudinaryTransform('https://res.cloudinary.com/demo/image/upload/v123/photo.jpg', 375, 200)
 * // → 'https://res.cloudinary.com/demo/image/upload/c_fill,w_375,h_200,f_auto,q_auto/v123/photo.jpg'
 */
export function cloudinaryTransform(url: string, width: number, height: number): string {
  if (!url.includes('res.cloudinary.com')) return url;

  const transforms = `c_fill,w_${width},h_${height},f_auto,q_auto`;
  return url.replace('/upload/', `/upload/${transforms}/`);
}
