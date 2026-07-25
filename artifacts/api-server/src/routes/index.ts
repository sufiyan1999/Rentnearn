import { Router, type IRouter } from "express";
import healthRouter from "./health";
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

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(listingsRouter);
router.use(categoriesRouter);
router.use(favouritesRouter);
router.use(recentlyViewedRouter);
router.use(businessRouter);
router.use(adminRouter);
router.use(dashboardRouter);
router.use(paymentsRouter);
router.use(membershipsRouter);

export default router;
