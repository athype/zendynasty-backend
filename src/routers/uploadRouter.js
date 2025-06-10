const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const middlewares = require('../middlewares');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  uploadCWLData,
  getUploadHistory
} = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `cwl-data-${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload CWL CSV endpoint
router.post('/cwl-csv', authenticate, requireAdmin, upload.single('csvFile'), uploadCWLData);

// Get upload status/history endpoint
router.get('/history', authenticate, getUploadHistory);

module.exports = router;