import sharp from "sharp";
import { objectStorageClient } from "./objectStorage";

// ── Derived from env vars set by setupObjectStorage() ────────────────────────
// PUBLIC_OBJECT_SEARCH_PATHS = "/bucket-id/public"
// Files stored at  gs://bucket-id/public/<folder>/<name>
// Served at        /api/storage/public-objects/<folder>/<name>

function parsedPublicPath(): { bucketName: string; folderPrefix: string } {
  const raw = (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "").split(",")[0].trim();
  // raw = "/replit-objstore-xxx/public"
  const parts = raw.replace(/^\//, "").split("/");
  const bucketName = parts[0] ?? "";
  // Sanitize folderPrefix to prevent path traversal
  const candidate = parts.slice(1).join("/");
  const sanitizedSegments = candidate
    .split("/")
    .filter((seg) => seg.length > 0 && seg !== "." && seg !== "..");
  const folderPrefix = sanitizedSegments.join("/");
  return { bucketName, folderPrefix };
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function processAndSaveImage(
  buffer: Buffer,
  folder: "listings" | "profiles",
  filename: string,
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, "_");
  const baseName = `${Date.now()}_${sanitizedFilename}`;
  const imageName = baseName.replace(/\.[^.]+$/, "") + "_display.webp";
  const thumbName  = baseName.replace(/\.[^.]+$/, "") + "_thumb.webp";

  const [displayBuf, thumbBuf] = await Promise.all([
    sharp(buffer)
      .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer(),
    sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer(),
  ]);

  const { bucketName, folderPrefix } = parsedPublicPath();
  const bucket = objectStorageClient.bucket(bucketName);

  const imageObject = `${folderPrefix}/${folder}/${imageName}`;
  const thumbObject  = `${folderPrefix}/${folder}/${thumbName}`;

  await Promise.all([
    bucket.file(imageObject).save(displayBuf, {
      metadata: { contentType: "image/webp" },
      resumable: false,
    }),
    bucket.file(thumbObject).save(thumbBuf, {
      metadata: { contentType: "image/webp" },
      resumable: false,
    }),
  ]);

  return {
    imageUrl:      `/api/storage/public-objects/${folder}/${imageName}`,
    thumbnailUrl:  `/api/storage/public-objects/${folder}/${thumbName}`,
  };
}
