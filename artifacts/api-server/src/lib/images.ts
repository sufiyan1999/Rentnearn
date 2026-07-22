import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { logger } from "./logger";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(path.join(UPLOAD_DIR, "listings"), { recursive: true });
  await fs.mkdir(path.join(UPLOAD_DIR, "profiles"), { recursive: true });
}

export async function processAndSaveImage(
  buffer: Buffer,
  folder: "listings" | "profiles",
  filename: string
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  const baseName = `${Date.now()}_${filename.replace(/[^a-z0-9.]/gi, "_")}`;
  const imageName = baseName.replace(/\.[^.]+$/, "") + "_display.webp";
  const thumbName = baseName.replace(/\.[^.]+$/, "") + "_thumb.webp";

  const imageDir = path.join(UPLOAD_DIR, folder);
  const imagePath = path.join(imageDir, imageName);
  const thumbPath = path.join(imageDir, thumbName);

  await sharp(buffer)
    .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(imagePath);

  await sharp(buffer)
    .resize(400, 400, { fit: "cover" })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  const APP_URL = process.env.APP_URL ?? "";
  return {
    imageUrl: `${APP_URL}/api/uploads/${folder}/${imageName}`,
    thumbnailUrl: `${APP_URL}/api/uploads/${folder}/${thumbName}`,
  };
}

export function validateImageBuffer(buffer: Buffer, mimetype: string): void {
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimetype)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed");
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("Image must be less than 5 MB");
  }
}

export { UPLOAD_DIR };
