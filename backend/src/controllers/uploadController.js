const cloudinary = require('../config/cloudinary');

/**
 * Generate Cloudinary signature for direct-from-browser uploads.
 * This completely bypasses the Node.js server for binary data transfer,
 * saving 100% of the backend bandwidth and memory.
 */
const getUploadSignature = async (req, res, next) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'anonymous_qna/questions';

    // Parameters to include in Cloudinary's cryptographic signature
    const paramsToSign = {
      folder,
      timestamp
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      success: true,
      data: {
        signature,
        timestamp,
        folder,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUploadSignature
};
