import multer from 'multer';
import path from 'path';

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // We will save uploaded materials to a temporary 'uploads' directory
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate a unique file name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only PDFs for now
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and TXT are allowed.'));
  }
};

export const uploadMiddleWare = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});
