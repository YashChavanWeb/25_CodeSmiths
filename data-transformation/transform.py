import pandas as pd
import os
import json

# Paths
RAW_CSV = "../iot-devices-simulation/backend/sensor_data.csv"
CLEAN_CSV = "./sensor_data_cleaned.csv"
AGG_CSV = "./sensor_data_aggregated.csv"

# Make sure output folder exists
os.makedirs("./transformed_data", exist_ok=True)

# Load config JSON so thresholds & weights can change easily
try:
    with open("metrics_config.json") as f:
        config = json.load(f)
except FileNotFoundError:
    print("metrics_config.json not found!")
    raise

NUMERIC_COLS = config["NUMERIC_COLS"]  # Columns we care about
OUTLIER_RANGES = {
    k: tuple(v) for k, v in config["OUTLIER_RANGES"].items()
}  # Cut crazy values
AGG_METRICS = {
    k: tuple(v) for k, v in config["AGG_METRICS"].items()
}  # For safety score
WEIGHTS = config["WEIGHTS"]  # How much each metric counts
ROLLING_WINDOW = config["ROLLING_WINDOW"]  # Smoothing window

# Load CSV with proper encoding (UTF-8 or ISO-8859-1 based on your CSV encoding)
print("Loading raw CSV...")
try:
    df = pd.read_csv(RAW_CSV, encoding="utf-8")
except UnicodeDecodeError:
    print("UTF-8 encoding failed. Trying ISO-8859-1...")
    df = pd.read_csv(RAW_CSV, encoding="ISO-8859-1")

print(f"Loaded {len(df)} rows")

# Clean column names by stripping spaces and removing special characters
df.columns = df.columns.str.strip().str.replace("Â", "", regex=False)
print("Cleaned column names")

# Remove duplicates to avoid double counting
df = df.drop_duplicates(subset=["Device ID", "Timestamp"])
print(f"After duplicates removal: {len(df)} rows")

# Fill missing values to avoid NaNs messing up calculations
for col in NUMERIC_COLS:
    if col in df.columns:
        median = df[col].median()
        df[col] = df[col].fillna(median)
        print(f"Filled missing values in {col} with median {median}")
    else:
        print(f"Warning: Column {col} not found in the data!")

# Remove extreme spikes, but keep anomalies that are within physical limits
for col, (low, high) in OUTLIER_RANGES.items():
    if col in df.columns:
        before = len(df)
        df = df[(df[col] >= low) & (df[col] <= high)]
        after = len(df)
        print(f"Removed insane sensor spikes from {col}: {before - after} rows dropped")
    else:
        print(f"Warning: Column {col} not found for outlier filtering!")

# Derived features
df["Power (W)"] = df["Current (A)"] * 220  # Simple power calculation
df["Timestamp"] = pd.to_datetime(df["Timestamp"], utc=True)
df = df.sort_values(by=["Device ID", "Timestamp"])
df["Temp_Rate"] = (
    df.groupby("Device ID")["Temperature (°C)"].diff()
    / df.groupby("Device ID")["Timestamp"].diff().dt.total_seconds()
)
df["Temp_Rate"] = df["Temp_Rate"].fillna(0)
print("Derived features: Power (W), Temp_Rate added")

# Convert to IST so dashboard matches local time
df["Timestamp_IST"] = df["Timestamp"].dt.tz_convert("Asia/Kolkata")

# Save cleaned CSV for debugging / reuse
df.to_csv(CLEAN_CSV, index=False)
print(f"Cleaned CSV saved at {CLEAN_CSV}")

# Aggregate per minute because per-second is too noisy (1 min resolution is enough for detecting unsafe patterns)
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

# Smooth metrics to reduce random spikes
agg_df[["avg_temp_smooth", "avg_current_smooth", "total_power_smooth"]] = (
    agg_df.groupby("Device ID")[["avg_temp", "avg_current", "total_power"]]
    .rolling(ROLLING_WINDOW, min_periods=1)
    .mean()
    .reset_index(0, drop=True)
)
print(f"Applied {ROLLING_WINDOW}-min rolling average smoothing")

# Flag anomalies for monitoring
for col, (low, high) in AGG_METRICS.items():
    if col in agg_df.columns:
        alert_col = col + "_anomaly"
        agg_df[alert_col] = ~agg_df[col].between(low, high)
    else:
        print(f"Warning: Column {col} not found for anomaly detection!")

print("Flagged anomalies for temperature, current, and pressure")

# Rolling stats for trends/charts
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

# Calculate safety score based on weighted risk
for col, (low, high) in AGG_METRICS.items():
    if col in agg_df.columns:
        risk_col = col + "_risk"
        agg_df[risk_col] = ((agg_df[col] - low) / (high - low)).clip(
            0, 1
        )  # Normalize 0-1
    else:
        print(f"Warning: Column {col} not found for risk calculation!")

agg_df["safety_score"] = sum(agg_df[col + "_risk"] * w for col, w in WEIGHTS.items())
agg_df["safety_score"] = (
    agg_df["safety_score"] / sum(WEIGHTS.values())
) * 100  # Scale 0-100

agg_df["safety_score_smooth"] = (
    agg_df.groupby("Device ID")["safety_score"]
    .rolling(ROLLING_WINDOW, min_periods=1)
    .mean()
    .reset_index(0, drop=True)
)

print("Calculated single smoothed safety score per device")

# Save aggregated CSV for dashboard / alerts
agg_df.to_csv(AGG_CSV, index=False)
print(f"Aggregated CSV saved at {AGG_CSV}")

# Debug / Sample output
print("\nSample aggregated data with safety score:")
print(agg_df[["Device ID", "Minute", "safety_score", "safety_score_smooth"]].head())
