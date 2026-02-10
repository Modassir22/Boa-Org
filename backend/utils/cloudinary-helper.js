const cloudinary = require('../config/cloudinary');

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if invalid
 */
const extractPublicId = (url) => {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }


    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/filename.ext
    // OR: https://res.cloudinary.com/cloud_name/raw/upload/v123456/folder/filename.ext
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) {
      return null;
    }

    // Get everything after 'upload/'
    const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remove version number (v123456) if present
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    
    // Remove file extension
    const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} url - Cloudinary URL
 * @param {string} resourceType - Resource type (image, raw, video, auto)
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromCloudinary = async (url, resourceType = 'image') => {
  try {
    
    const publicId = extractPublicId(url);
    
    if (!publicId) {
      console.warn('Could not extract public_id from URL:', url);
      return false;
    }

    
    // Try with specified resource type first
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    
    // If not found, try with 'raw' resource type (for PDFs, etc.)
    if (result.result === 'not found' && resourceType !== 'raw') {
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }
    
    if (result.result === 'ok') {
      return true;
    } else if (result.result === 'not found') {
      return true; // Consider this success since file doesn't exist
    } else {
      console.warn('✗ Cloudinary deletion returned unexpected result:', result);
      return false;
    }
  } catch (error) {
    console.error('✗ Cloudinary deletion error:', error);
    console.error('Error details:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name
    });
    return false;
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} urls - Array of Cloudinary URLs
 * @returns {Promise<{success: number, failed: number}>} - Deletion stats
 */
const deleteMultipleFromCloudinary = async (urls) => {
  const results = {
    success: 0,
    failed: 0
  };

  if (!Array.isArray(urls) || urls.length === 0) {
    return results;
  }

  for (const url of urls) {
    const deleted = await deleteFromCloudinary(url);
    if (deleted) {
      results.success++;
    } else {
      results.failed++;
    }
  }

  return results;
};

module.exports = {
  extractPublicId,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary
};
