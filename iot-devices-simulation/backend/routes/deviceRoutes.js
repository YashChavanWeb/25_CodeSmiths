// routes/deviceRoutes.js
import express from "express";
import { postSensorData, getSensorData, switchDeviceStateHandler } from "../controllers/deviceController.js";

const router = express.Router();

router.post("/sensor-data", postSensorData);
router.get("/sensor-data", getSensorData);
router.post("/device/:id/switch", switchDeviceStateHandler);


export default router;
