const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // You can set the file name here if needed
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
