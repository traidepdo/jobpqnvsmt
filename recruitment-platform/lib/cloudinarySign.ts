import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary once
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function getCloudinaryPublicId(url: string, isRaw: boolean = false): string | null {
  try {
    const parts = url.split('/upload/');
    const authParts = url.split('/authenticated/');
    const separator = url.includes('/authenticated/') ? '/authenticated/' : '/upload/';
    const pathParts = separator === '/authenticated/' ? authParts : parts;
    
    if (pathParts.length < 2) return null;
    
    const pathAfterUpload = pathParts[1];
    const subParts = pathAfterUpload.split('/');
    
    // Strip signatures (starts with s-- and ends with --) or versions (starts with v followed by digits) from the front
    while (subParts.length > 0) {
      const first = subParts[0];
      if ((first.startsWith('s--') && first.endsWith('--')) || 
          (first.startsWith('v') && !isNaN(Number(first.substring(1))))) {
        subParts.shift();
      } else {
        break;
      }
    }
    
    const publicIdWithExt = subParts.join('/');
    if (isRaw) {
      return publicIdWithExt;
    }
    return publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
  } catch (e) {
    return null;
  }
}

export function signCloudinaryCvUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  if (!url.includes('cloudinary.com') || !url.includes('/raw/')) return url;
  
  try {
    const isAuthType = url.includes('/raw/authenticated/');
    const publicId = getCloudinaryPublicId(url, true);
    if (!publicId) return url;
    
    return cloudinary.utils.private_download_url(publicId, '', {
      resource_type: 'raw',
      type: isAuthType ? 'authenticated' : 'upload',
    });
  } catch (e) {
    console.error('Error signing Cloudinary URL:', e);
    return url;
  }
}
