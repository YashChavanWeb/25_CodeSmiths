from kafka import KafkaConsumer
import pandas as pd
import json
import numpy as np
from sklearn.ensemble import IsolationForest

# Kafka consumer
consumer = KafkaConsumer(
    'sensor-data',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',  # Read from beginning
    enable_auto_commit=True,
    group_id='analytics-group',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

# Collect messages into a list
data_list = []

print("Fetching messages from Kafka...")
for message in consumer:
    data_list.append(message.value)
    
    # Optional: break after N messages if needed
    if len(data_list) >= 1000:
        break

# Convert to DataFrame
df = pd.DataFrame(data_list)

# Convert timestamp
df["timestamp"] = pd.to_datetime(df["timestamp"])

# Rename columns to match your previous CSV-based script
df.rename(columns={
    "deviceId": "Device ID",
    "temperature": "Temperature (°C)",
    "current": "Current (A)",
    "pressure": "Pressure (hPa)",
    "alert": "Alert"
}, inplace=True)

# ----------------------------
# Your existing analysis below
# ----------------------------

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

# Anomaly Detection
anomaly_detector = IsolationForest(n_estimators=100, contamination=0.05)
features = ["Current (A)", "Temperature (°C)", "Pressure (hPa)"]
device_data = df[features]
anomalies = anomaly_detector.fit_predict(device_data)
df["Anomaly"] = anomalies
df_anomalies = df[df["Anomaly"] == -1]
print("\n--- Anomalies Detected ---")
print(df_anomalies)

# Optimization & Alerts
print("\n--- Optimization Suggestions & Alerts ---")
suggestions = []

for device in device_stats.index:
    avg_current = device_stats.loc[device, "Current (A)"]
    avg_temp = device_stats.loc[device, "Temperature (°C)"]
    alerts = alerts_per_device.get(device, 0)
    is_anomalous = df[df["Device ID"] == device]["Anomaly"].any()

    if alerts > 20:
        suggestions.append(f"{device}: High alert count ({alerts}) → Recommend maintenance.")
    elif avg_current < 4.5:
        suggestions.append(f"{device}: Low current usage ({avg_current:.2f}A) → Consider turning off when not needed.")
    elif avg_temp > 30:
        suggestions.append(f"{device}: High average temperature ({avg_temp:.2f}°C) → Check cooling system.")
    elif is_anomalous:
        suggestions.append(f"{device}: Anomalous behavior detected → Investigate further.")
    else:
        suggestions.append(f"{device}: Operating normally.")

for s in suggestions:
    print(s)
