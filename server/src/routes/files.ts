import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for file upload
const uploadDir = process.env.FILE_UPLOAD_PATH || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Allowed: PDF, DOC, XLS, JPG, PNG, GIF', 400));
    }
  }
});

// All file routes require authentication
router.use(authenticate);

/**
 * POST /api/files/upload
 * Upload a file
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      metadata
    }
  });
}));

/**
 * POST /api/files/upload-private
 * Upload a private file
 */
router.post('/upload-private', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

  res.json({
    success: true,
    message: 'Private file uploaded successfully',
    data: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      metadata,
      isPrivate: true
    }
  });
}));

/**
 * POST /api/files/signed-url
 * Create a signed URL for a file
 */
router.post('/signed-url', asyncHandler(async (req: Request, res: Response) => {
  const { filename, expiresIn } = req.body;

  if (!filename) {
    throw new AppError('Filename is required', 400);
  }

  // In a real implementation, this would create a time-limited signed URL
  // For now, we'll just return the file path
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found', 404);
  }

  res.json({
    success: true,
    data: {
      url: `/api/files/download/${filename}`,
      expiresIn: expiresIn || 3600
    }
  });
}));

/**
 * GET /api/files/download/:filename
 * Download a file
 */
router.get('/download/:filename', asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found', 404);
  }

  res.download(filePath);
}));

/**
 * POST /api/files/extract-data
 * Extract data from an uploaded file (placeholder)
 */
router.post('/extract-data', asyncHandler(async (req: Request, res: Response) => {
  const { filename, fileType } = req.body;

  // Placeholder implementation
  // In a real app, this would use libraries like pdf-parse, xlsx, etc.
  res.json({
    success: true,
    message: 'Data extraction not yet implemented',
    data: {
      filename,
      fileType,
      extractedData: null
    }
  });
}));

export default router;
