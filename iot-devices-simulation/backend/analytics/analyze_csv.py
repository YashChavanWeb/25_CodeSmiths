import pandas as pd
import numpy as np
import json
from sklearn.ensemble import IsolationForest

# -------------------------
# Load Config (Thresholds + Rules)
# -------------------------
with open("../config.json", "r") as f:
    config = json.load(f)

THRESHOLDS = config["THRESHOLDS"]
RULES = config["SCHEDULING_RULES"]

# -------------------------
# Load Sensor Data
# -------------------------
df = pd.read_csv("../sensor_data.csv")
df["Timestamp"] = pd.to_datetime(df["Timestamp"])

print("\n--- Data Overview ---")
print(df.head())

print("\n--- Summary Statistics ---")
print(df.describe())

# Average metrics per device
device_stats = df.groupby("Device ID")[["Current (A)", "Temperature (°C)", "Pressure (hPa)"]].mean()
print("\n--- Average per Device ---")
print(device_stats)

# Alerts per device (already in CSV)
alerts_per_device = df.groupby("Device ID")["Alert"].sum()
print("\n--- Alerts per Device ---")
print(alerts_per_device)

# -------------------------
# Anomaly Detection
# -------------------------
features = ["Current (A)", "Temperature (°C)", "Pressure (hPa)"]
anomaly_detector = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
anomalies = anomaly_detector.fit_predict(df[features])

df["Anomaly"] = anomalies
df_anomalies = df[df["Anomaly"] == -1]

print("\n--- Anomalies Detected ---")
print(df_anomalies)

# -------------------------
# ALERTS (Original Logic)
# -------------------------
print("\n--- Alerts ---")
alerts = []

for device in device_stats.index:
    avg_current = device_stats.loc[device, "Current (A)"]
    avg_temp = device_stats.loc[device, "Temperature (°C)"]
    avg_pressure = device_stats.loc[device, "Pressure (hPa)"]

    # system type from device_id
    if "pipe" in device:
        t = THRESHOLDS["pipe"]
    elif "container" in device:
        t = THRESHOLDS["container"]
    else:
        t = THRESHOLDS["battery_bank"]

    # check against thresholds
    if avg_current > t["current"]:
        alerts.append(f"{device}: Current above safe threshold ({avg_current:.2f}A > {t['current']}A)")
    if avg_temp > t["temperature"]:
        alerts.append(f"{device}: Temperature above safe threshold ({avg_temp:.2f}°C > {t['temperature']}°C)")
    if avg_pressure > t["pressure"]:
        alerts.append(f"{device}: Pressure above safe threshold ({avg_pressure:.2f}hPa > {t['pressure']}hPa)")

if alerts:
    for a in alerts:
        print(a)
else:
    print("No alerts triggered.")

# -------------------------
# SCHEDULING (Added Section)
# -------------------------
print("\n--- Scheduling Suggestions ---")
scheduling = []

for device in device_stats.index:
    avg_current = device_stats.loc[device, "Current (A)"]
    avg_temp = device_stats.loc[device, "Temperature (°C)"]
    avg_pressure = device_stats.loc[device, "Pressure (hPa)"]

    if "pipe" in device:
        t = THRESHOLDS["pipe"]
    elif "container" in device:
        t = THRESHOLDS["container"]
    else:
        t = THRESHOLDS["battery_bank"]

    # Rule 1: Idle shutdown
    if avg_current < RULES["idleMargin"] * t["current"]:
        scheduling.append(f"{device}: Low usage → Schedule OFF during idle hours.")

    # Rule 2: High load → stagger/rotate
    elif avg_current > RULES["highLoadMargin"] * t["current"]:
        scheduling.append(f"{device}: High load → Rotate/stagger usage to balance energy.")

    # Rule 3: Cooling breaks
    if avg_temp > RULES["coolingMargin"] * t["temperature"]:
        scheduling.append(f"{device}: Temp nearing limit → Schedule cooling breaks.")

    # Rule 4: Normal operation
    if (
        avg_current >= RULES["idleMargin"] * t["current"]
        and avg_current <= RULES["highLoadMargin"] * t["current"]
        and avg_temp <= RULES["coolingMargin"] * t["temperature"]
    ):
        scheduling.append(f"{device}: Running optimally → Keep ON.")

for s in scheduling:
    print(s)
