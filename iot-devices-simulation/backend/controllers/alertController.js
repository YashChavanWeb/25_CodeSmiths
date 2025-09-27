import { getAlerts } from "../utils/alertStore.js";

export const fetchLatestAlerts = (req, res) => {
  try {
    const alerts = getAlerts();

    if (alerts.length === 0) {
      return res.status(404).json({ message: "No alerts found" });
    }

    res.status(200).json({ alerts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};
