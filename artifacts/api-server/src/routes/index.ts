import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import authRouter from "./auth";
import usersRouter from "./users";
import listingsRouter from "./listings";
import categoriesRouter from "./categories";
import favouritesRouter from "./favourites";
import recentlyViewedRouter from "./recently_viewed";
import businessRouter from "./business";
import adminRouter from "./admin";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";
import membershipsRouter from "./memberships";
import seoRouter from "./seo";

const router: IRouter = Router();

// Public routes first — must come before adminRouter which has a global requireAuth middleware
router.use(seoRouter);
router.use(storageRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(listingsRouter);
router.use(categoriesRouter);
router.use(favouritesRouter);
router.use(recentlyViewedRouter);
router.use(businessRouter);
router.use(dashboardRouter);
router.use(paymentsRouter);
router.use(membershipsRouter);
// Admin router must come after public routes — it applies requireAuth to all requests
router.use(adminRouter);

export default router;
