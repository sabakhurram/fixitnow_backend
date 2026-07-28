const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,

    params: {
        folder: "FixItNow",
        allowed_formats: [
            "jpg",
            "jpeg",
            "png",
              "pdf",
            "webp",
            "mp4",
            "mov"
        ],
    },
});


const upload = multer({
    storage: storage,
});


module.exports = upload;