/**
 * Storage serving route — public listing/profile images served from GCS.
 *
 * Mounted at /storage/public-objects (→ /api/storage/public-objects when the
 * router is mounted at /api).  Uses router.use() so Express handles prefix
 * matching without path-to-regexp wildcard syntax (which changed in v8).
 *
 * No authentication required — listing images are public.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.use(
  "/storage/public-objects",
  async (req: Request, res: Response): Promise<void> => {
    // req.path is the portion AFTER the mount point, e.g. "/listings/file.webp"
    const rawPath = req.path.replace(/^\/+/, "");

    if (!rawPath) {
      res.status(400).json({ error: "Missing object path" });
      return;
    }

    try {
      const file = await objectStorageService.searchPublicObject(rawPath);
      if (!file) {
        res.status(404).json({ error: "Object not found" });
        return;
      }

      const [metadata] = await file.getMetadata();
      const contentType = (metadata.contentType as string) || "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      if (metadata.size) res.setHeader("Content-Length", String(metadata.size));

      const nodeStream = file.createReadStream();
      nodeStream.on("error", () => { if (!res.headersSent) res.status(500).end(); });
      nodeStream.pipe(res);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Object not found" });
      } else {
        res.status(500).json({ error: "Failed to retrieve object" });
      }
    }
  },
);

export default router;
