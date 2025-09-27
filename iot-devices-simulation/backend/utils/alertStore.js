const alerts = []; // store alerts
const MAX_ALERTS = 4; // keep only the latest 4 alerts

export const addAlert = (alert) => {
  alerts.unshift(alert); // add to start of array

  if (alerts.length > MAX_ALERTS) {
    alerts.pop(); // remove oldest alert if exceeding limit
  }
};

export const getAlerts = () => {
  return alerts;
};
