const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const { requireAuth, requireRole } = require('../middleware/auth');

// Configure Cloudinary dynamically (supporting both unified URL and individual keys)
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // limit file size to 5MB
});

// Helper function to stream buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: "machine_cpq",
        resource_type: "auto"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Stream the file buffer
    const readable = new Readable();
    readable._read = () => {}; 
    readable.push(fileBuffer);
    readable.push(null); // Signals end of stream
    readable.pipe(stream);
  });
};

// POST /api/upload - Upload machine base image (Admin only)
router.post('/', requireAuth, requireRole(['admin']), upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided." });
  }

  // Verify Cloudinary is configured (via unified URL or individual keys)
  const isUrlConfigured = !!process.env.CLOUDINARY_URL;
  const isKeysConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

  if (!isUrlConfigured && !isKeysConfigured) {
    return res.status(500).json({ error: "Cloudinary is not configured. Add credentials in environment settings." });
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer);
    
    // Return the secure URL and public ID
    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ error: "Failed to upload image to Cloudinary." });
  }
});

module.exports = router;
