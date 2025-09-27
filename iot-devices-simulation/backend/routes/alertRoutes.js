import express from "express";
import { fetchLatestAlerts } from "../controllers/alertController.js";

const router = express.Router();

router.get("/alerts", fetchLatestAlerts);

export default router;
