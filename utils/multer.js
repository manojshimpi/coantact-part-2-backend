const multer = require("multer");
const path = require("path");

// Setup multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Directory to save the file
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
  });
  
  const upload = multer({ storage: storage });
  
  module.exports = upload;