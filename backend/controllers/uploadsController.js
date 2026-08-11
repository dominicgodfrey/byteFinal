import cloudinary, { cloudinaryConfigured } from "../config/cloudinary.js";

/** POST /api/uploads. Multipart image in, URL out. */
export async function uploadImage(req, res) {
  if (!cloudinaryConfigured) {
    return res.status(503).json({ error: "Image uploads are not configured on this server" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `bytes/${req.userId}`,
      resource_type: "image",
      transformation: [{ width: 1400, height: 1400, crop: "limit", quality: "auto" }],
    });

    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("uploadImage:", err);
    res.status(500).json({ error: "Server error while uploading the image" });
  }
}
