// routes/deviceRoutes.js
import express from "express";
import { postSensorData, getSensorData, switchDeviceState } from "../controllers/deviceController.js";

const router = express.Router();

router.post("/sensor-data", postSensorData);
router.get("/sensor-data", getSensorData);
router.post("/device/:id/switch", switchDeviceState);

export default router;
