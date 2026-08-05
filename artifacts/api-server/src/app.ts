import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import seoRouter from "./routes/seo";
import { logger } from "./lib/logger";
import { ensureUploadDir, UPLOAD_DIR } from "./lib/images";

const app: Express = express();

// Ensure upload directory exists
ensureUploadDir().catch((err) => logger.error({ err }, "Failed to create upload dirs"));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Root-level SEO routes (no /api prefix) ───────────────────────────────────
// These MUST be registered before the /api mount so the proxy can reach them
// at https://www.rentnearn.com/sitemap.xml and https://www.rentnearn.com/robots.txt

app.use("/", seoRouter);

// ── Legacy /api/uploads fallback ─────────────────────────────────────────────
// Old images stored on disk before GCS migration — serve as 404 so they never
// fall through to the auth-protected /api router and incorrectly return 401.
app.use("/api/uploads", (_req, res) => {
  res.status(404).json({ error: "Image not found" });
});

app.use("/api", router);

export default app;
