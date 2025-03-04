const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use an absolute path relative to the project root
        const uploadPath = path.join(__dirname, '../../public/uploads/');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Keep original filename with a timestamp to avoid overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = path.extname(file.originalname);
        const fileName = path.basename(file.originalname, fileExt) + '-' + uniqueSuffix + fileExt;
        cb(null, fileName);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    console.log('Uploading file:', file.originalname);
    const filetypes = /json/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Only JSON are allowed!'), false); // Reject the file
    }
};

// Export the multer middleware
exports.uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Limit to 1 file per upload
    },
    fileFilter: fileFilter
});