import express from "express";
const router = express.Router();
import indexRoutes from "./routes/index.routes.js";
const version = "/v1";

router.use(version, indexRoutes);

export default router;