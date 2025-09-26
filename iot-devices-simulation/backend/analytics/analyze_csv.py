import pandas as pd

# Load CSV
df = pd.read_csv("../sensor_data.csv")

# Convert timestamp
df["Timestamp"] = pd.to_datetime(df["Timestamp"])

print("\n--- Data Overview ---")
print(df.head())

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

# -------------------
# OPTIMIZATION LOGIC
# -------------------

print("\n--- Optimization Suggestions ---")

suggestions = []

for device in device_stats.index:
    avg_current = device_stats.loc[device, "Current (A)"]
    avg_temp = device_stats.loc[device, "Temperature (°C)"]
    alerts = alerts_per_device.get(device, 0)

    # Rule 1: Too many alerts → maintenance
    if alerts > 20:
        suggestions.append(f"{device}: 🚨 High alert count ({alerts}) → Recommend maintenance.")

    # Rule 2: Low usage → turn off
    elif avg_current < 4.5:
        suggestions.append(f"{device}: ⚡ Low current usage ({avg_current:.2f}A) → Consider turning off when not needed.")

    # Rule 3: High temperature → check cooling
    elif avg_temp > 30:
        suggestions.append(f"{device}: 🔥 High average temperature ({avg_temp:.2f}°C) → Check cooling system.")

    # Otherwise normal
    else:
        suggestions.append(f"{device}: ✅ Operating normally.")

# Output optimization suggestions
for s in suggestions:
    print(s)
