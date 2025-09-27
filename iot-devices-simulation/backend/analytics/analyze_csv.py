import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

# Load CSV
df = pd.read_csv("../sensor_data.csv")

# Convert timestamp
df["Timestamp"] = pd.to_datetime(df["Timestamp"])

# Overview
print("\n--- Data Overview ---")
print(df.head())

# Summary statistics
print("\n--- Summary Statistics ---")
print(df.describe())

# Average metrics per device
device_stats = df.groupby("Device ID")[["Current (A)", "Temperature (°C)", "Pressure (hPa)"]].mean()
print("\n--- Average per Device ---")
print(device_stats)

# Alerts per device
alerts_per_device = df.groupby("Device ID")["Alert"].sum()
print("\n--- Alerts per Device ---")
print(alerts_per_device)

# --------------------------------------
# ANOMALY DETECTION
# --------------------------------------

# Initialize Isolation Forest model for anomaly detection
anomaly_detector = IsolationForest(n_estimators=100, contamination=0.05)  # 5% of the data is expected to be anomalous
features = ["Current (A)", "Temperature (°C)", "Pressure (hPa)"]

# Train anomaly detector on the data
device_data = df[features]
anomalies = anomaly_detector.fit_predict(device_data)

# Add anomaly column to the dataframe (-1 is anomalous, 1 is normal)
df["Anomaly"] = anomalies
df_anomalies = df[df["Anomaly"] == -1]

print("\n--- Anomalies Detected ---")
print(df_anomalies)

# -------------------
# ALERTS & OPTIMIZATION LOGIC
# -------------------

print("\n--- Optimization Suggestions & Alerts ---")

suggestions = []

for device in device_stats.index:
    avg_current = device_stats.loc[device, "Current (A)"]
    avg_temp = device_stats.loc[device, "Temperature (°C)"]
    alerts = alerts_per_device.get(device, 0)
    is_anomalous = df[df["Device ID"] == device]["Anomaly"].any()

    # Rule 1: Too many alerts → maintenance
    if alerts > 20:
        suggestions.append(f"{device}: High alert count ({alerts}) → Recommend maintenance.")

    # Rule 2: Low usage → turn off
    elif avg_current < 4.5:
        suggestions.append(f"{device}: Low current usage ({avg_current:.2f}A) → Consider turning off when not needed.")

    # Rule 3: High temperature → check cooling
    elif avg_temp > 30:
        suggestions.append(f"{device}:  High average temperature ({avg_temp:.2f}°C) → Check cooling system.")

    # Rule 4: Anomalous behavior detected
    elif is_anomalous:
        suggestions.append(f"{device}: Anomalous behavior detected → Investigate further.")

    # Otherwise normal
    else:
        suggestions.append(f"{device}:  Operating normally.")

# Output optimization suggestions
for s in suggestions:
    print(s)
