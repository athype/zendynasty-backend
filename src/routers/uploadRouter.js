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

/**
 * @swagger
 * /api/v1/upload/cwl-csv:
 *   post:
 *     summary: Upload CWL CSV data
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing CWL data
 *               season_year:
 *                 type: integer
 *                 description: Year of the CWL season
 *               season_month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Month of the CWL season
 *     responses:
 *       200:
 *         description: CSV uploaded and processed successfully
 *       400:
 *         description: Bad request - missing file or invalid data
 *       401:
 *         description: Unauthorized - admin access required
 *       403:
 *         description: Forbidden - admin role required
 */
router.post('/cwl-csv', authenticate, requireAdmin, upload.single('csvFile'), uploadCWLData);

/**
 * @swagger
 * /api/v1/upload/history:
 *   get:
 *     summary: Get upload history
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upload history data
 */
router.get('/history', authenticate, getUploadHistory);

module.exports = router;