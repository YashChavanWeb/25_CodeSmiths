import pandas as pd
import os
import json

#  Paths
RAW_CSV = "../iot-devices-simulation/backend/sensor_data.csv"
CLEAN_CSV = "./sensor_data_cleaned.csv"
AGG_CSV = "./sensor_data_aggregated.csv"

#  make sure output folder exists
os.makedirs("./transformed_data", exist_ok=True)

#  load config json so thresholds & weights can change easily
with open("metrics_config.json") as f:
    config = json.load(f)

NUMERIC_COLS = config["NUMERIC_COLS"]  # numbers we care about
OUTLIER_RANGES = {
    k: tuple(v) for k, v in config["OUTLIER_RANGES"].items()
}  # cut crazy values
AGG_METRICS = {
    k: tuple(v) for k, v in config["AGG_METRICS"].items()
}  # for safety score
WEIGHTS = config["WEIGHTS"]  # how much each metric counts
ROLLING_WINDOW = config["ROLLING_WINDOW"]  # smoothing window

#  load csv with proper encoding (UTF-8 or ISO-8859-1 based on your CSV encoding)
print("Loading raw CSV...")
df = pd.read_csv(
    RAW_CSV, encoding="utf-8"
)  # Try utf-8 first; fallback to "ISO-8859-1" if needed
print(f"Loaded {len(df)} rows")

# Clean column names by stripping spaces and removing special characters
df.columns = df.columns.str.strip().str.replace("Â", "", regex=False)
print("Cleaned column names")

#  remove duplicates so we don’t double count
df = df.drop_duplicates(subset=["Device ID", "Timestamp"])
print(f"After duplicates removal: {len(df)} rows")

#  fill missing numbers to avoid NaNs messing up calculations
for col in NUMERIC_COLS:
    median = df[col].median()
    df[col] = df[col].fillna(median)
    print(f"Filled missing values in {col} with median {median}")

#  remove extreme spikes, but keep anomalies that are within physical limits
for col, (low, high) in OUTLIER_RANGES.items():
    before = len(df)
    df = df[(df[col] >= low) & (df[col] <= high)]
    after = len(df)
    print(f"Removed insane sensor spikes from {col}: {before - after} rows dropped")

#  derived features
df["Power (W)"] = df["Current (A)"] * 220  # simple power calc
df["Timestamp"] = pd.to_datetime(df["Timestamp"], utc=True)
df = df.sort_values(by=["Device ID", "Timestamp"])
df["Temp_Rate"] = (
    df.groupby("Device ID")["Temperature (°C)"].diff()
    / df.groupby("Device ID")["Timestamp"].diff().dt.total_seconds()
)
df["Temp_Rate"] = df["Temp_Rate"].fillna(0)
print("Derived features: Power (W), Temp_Rate added")

#  convert to IST so dashboard matches local time
df["Timestamp_IST"] = df["Timestamp"].dt.tz_convert("Asia/Kolkata")

#  save cleaned csv for debugging / reuse
df.to_csv(CLEAN_CSV, index=False)
print(f"Cleaned CSV saved at {CLEAN_CSV}")

#  aggregate per minute because per-second is too noisy
# 1 min resolution is enough for detecting unsafe patterns in industrial IoT
df["Minute"] = df["Timestamp_IST"].dt.floor("min")
agg_df = (
    df.groupby(["Device ID", "Minute"])
    .agg(
        avg_temp=("Temperature (°C)", "mean"),
        avg_current=("Current (A)", "mean"),
        max_pressure=("Pressure (hPa)", "max"),
        total_power=("Power (W)", "sum"),
        avg_temp_rate=("Temp_Rate", "mean"),
    )
    .reset_index()
)

#  smooth metrics to reduce random spikes
agg_df[["avg_temp_smooth", "avg_current_smooth", "total_power_smooth"]] = (
    agg_df.groupby("Device ID")[["avg_temp", "avg_current", "total_power"]]
    .rolling(ROLLING_WINDOW, min_periods=1)
    .mean()
    .reset_index(0, drop=True)
)
print(f"Applied {ROLLING_WINDOW}-min rolling average smoothing")

#  flag anomalies for monitoring
for col, (low, high) in AGG_METRICS.items():
    alert_col = col + "_anomaly"
    agg_df[alert_col] = ~agg_df[col].between(low, high)
print("Flagged anomalies for temperature, current, and pressure")

#  rolling stats for trends/charts
agg_df[["temp_roll_max", "temp_roll_min"]] = (
    agg_df.groupby("Device ID")["avg_temp_smooth"]
    .rolling(ROLLING_WINDOW, min_periods=1)
    .agg(["max", "min"])
    .reset_index(0, drop=True)
)

agg_df[["power_roll_max", "power_roll_min"]] = (
    agg_df.groupby("Device ID")["total_power_smooth"]
    .rolling(ROLLING_WINDOW, min_periods=1)
    .agg(["max", "min"])
    .reset_index(0, drop=True)
)
print("Added rolling max/min statistics for temp & power")

#  calculate safety score based on weighted risk
for col, (low, high) in AGG_METRICS.items():
    risk_col = col + "_risk"
    agg_df[risk_col] = ((agg_df[col] - low) / (high - low)).clip(0, 1)  # normalize 0-1

agg_df["safety_score"] = sum(agg_df[col + "_risk"] * w for col, w in WEIGHTS.items())
agg_df["safety_score"] = (
    agg_df["safety_score"] / sum(WEIGHTS.values())
) * 100  # scale 0-100

agg_df["safety_score_smooth"] = (
    agg_df.groupby("Device ID")["safety_score"]
    .rolling(ROLLING_WINDOW, min_periods=1)
    .mean()
    .reset_index(0, drop=True)
)

print("Calculated single smoothed safety score per device")

#  save aggregated csv for dashboard / alerts
agg_df.to_csv(AGG_CSV, index=False)
print(f"Aggregated CSV saved at {AGG_CSV}")

# debug / sample output
print("\nSample aggregated data with safety score:")
print(agg_df[["Device ID", "Minute", "safety_score", "safety_score_smooth"]].head())
