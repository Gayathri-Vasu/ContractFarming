const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/avatars directory exists
const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ext.toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for avatar'), false);
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
});

module.exports = uploadAvatar;

