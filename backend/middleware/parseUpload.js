import multer from "multer";

// Buffer goes straight to Cloudinary, nothing touches disk.
export const parseUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|heic|webp)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPEG, PNG, HEIC or WebP images are allowed"));
  },
}).single("file");

/** Returns multer errors as JSON, not HTML. */
export function uploadMiddleware(req, res, next) {
  parseUpload(req, res, (err) => {
    if (!err) return next();

    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Image must be under 8 MB" : err.message || "Upload failed";

    res.status(400).json({ error: message });
  });
}
