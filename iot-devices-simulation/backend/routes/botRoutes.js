// routes/botRoutes.js
import express from "express";
import { getBotSensorStream } from "../controllers/botController.js";

const router = express.Router();

// Define the GET route for SSE stream
router.get("/bot-sensor-stream", getBotSensorStream);

export default router;
