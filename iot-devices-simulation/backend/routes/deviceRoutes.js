// routes/deviceRoutes.js
import express from "express";
import { postSensorData, getSensorData, switchDeviceStateHandler, manageFieldExclusions, simulateFailure } from "../controllers/deviceController.js";

const router = express.Router();

router.post("/sensor-data", postSensorData);
router.get("/sensor-data", getSensorData);
router.post("/device/switch", switchDeviceStateHandler);
router.post("/device/fields", manageFieldExclusions);
router.post("/device/simulate-failure", simulateFailure);


export default router;
