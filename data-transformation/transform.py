import pandas as pd
import os
import json
import time

# ---------------- Paths ----------------
RAW_CSV = "../iot-devices-simulation/backend/sensor_data.csv"
CLEAN_CSV = "./sensor_data_cleaned.csv"
AGG_CSV = "./sensor_data_aggregated.csv"
os.makedirs("./transformed_data", exist_ok=True)

# ---------------- Config ----------------
with open("metrics_config.json") as f:
    config = json.load(f)

NUMERIC_COLS = config["NUMERIC_COLS"]
OUTLIER_RANGES = {k: tuple(v) for k, v in config["OUTLIER_RANGES"].items()}
AGG_METRICS = {k: tuple(v) for k, v in config["AGG_METRICS"].items()}
WEIGHTS = config["WEIGHTS"]
ROLLING_WINDOW = config["ROLLING_WINDOW"]

# ---------------- Fixed column schemas ----------------
CLEAN_COL_ORDER = [
    "Device ID",
    "System Type",
    "Timestamp",
    "Temperature (°C)",
    "Current (A)",
    "Pressure (hPa)",
    "Alert",
    "Power (W)",
    "Temp_Rate",
    "Timestamp_IST",
]

AGG_COL_ORDER = (
    [
        "Device ID",
        "Minute",
        "avg_temp",
        "avg_current",
        "max_pressure",
        "total_power",
        "avg_temp_rate",
        "avg_temp_smooth",
        "avg_current_smooth",
        "total_power_smooth",
        "temp_roll_max",
        "temp_roll_min",
        "power_roll_max",
        "power_roll_min",
        "safety_score",
        "safety_score_smooth",
    ]
    + [f"{col}_risk" for col in AGG_METRICS.keys()]
    + [f"{col}_anomaly" for col in AGG_METRICS.keys()]
)


# ---------------- Helper Function ----------------
def write_csv_with_header(df, filepath):
    """Append to CSV, ensure header exists if file is missing or empty."""
    write_header = not os.path.exists(filepath) or os.path.getsize(filepath) == 0
    df.to_csv(filepath, index=False, mode="a", header=write_header)


# ---------------- Functions ----------------
def clean_data(df_chunk):
    if df_chunk.empty:
        return df_chunk

    df_chunk = df_chunk.copy()

    # Fill missing numeric cols with median safely
    for col in NUMERIC_COLS:
        if col in df_chunk.columns:
            df_chunk.loc[:, col] = df_chunk[col].fillna(df_chunk[col].median())

    # Remove outliers
    for col, (low, high) in OUTLIER_RANGES.items():
        if col in df_chunk.columns:
            df_chunk = df_chunk[(df_chunk[col] >= low) & (df_chunk[col] <= high)]

    # Add computed columns
    df_chunk["Power (W)"] = df_chunk.get("Current (A)", 0) * 220
    df_chunk["Timestamp"] = pd.to_datetime(
        df_chunk["Timestamp"], utc=True, errors="coerce"
    )
    df_chunk = df_chunk.dropna(subset=["Timestamp"]).sort_values(
        ["Device ID", "Timestamp"]
    )

    # Temperature rate of change
    df_chunk["Temp_Rate"] = (
        df_chunk.groupby("Device ID")["Temperature (°C)"].diff()
        / df_chunk.groupby("Device ID")["Timestamp"].diff().dt.total_seconds()
    ).fillna(0)

    # Convert to IST
    df_chunk["Timestamp_IST"] = df_chunk["Timestamp"].dt.tz_convert("Asia/Kolkata")

    # Reorder + ensure all columns exist
    for col in CLEAN_COL_ORDER:
        if col not in df_chunk.columns:
            df_chunk[col] = pd.NA
    df_chunk = df_chunk[CLEAN_COL_ORDER]

    return df_chunk


def aggregate_data(df_chunk):
    if df_chunk.empty:
        return pd.DataFrame()

    df_chunk["Minute"] = df_chunk["Timestamp_IST"].dt.floor("min")

    agg_df = (
        df_chunk.groupby(["Device ID", "Minute"])
        .agg(
            avg_temp=("Temperature (°C)", "mean"),
            avg_current=("Current (A)", "mean"),
            max_pressure=("Pressure (hPa)", "max"),
            total_power=("Power (W)", "sum"),
            avg_temp_rate=("Temp_Rate", "mean"),
        )
        .reset_index()
    )

    # Rolling smoothing
    for col in ["avg_temp", "avg_current", "total_power"]:
        agg_df[col + "_smooth"] = (
            agg_df.groupby("Device ID")[col]
            .rolling(ROLLING_WINDOW, min_periods=1)
            .mean()
            .reset_index(0, drop=True)
        )

    # Rolling max/min
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

    # Risk scoring
    for col, (low, high) in AGG_METRICS.items():
        if col in agg_df.columns:
            agg_df[col + "_risk"] = ((agg_df[col] - low) / (high - low)).clip(0, 1)
            agg_df[col + "_anomaly"] = ~agg_df[col].between(low, high)

    # Weighted safety score
    agg_df["safety_score"] = sum(
        agg_df[col + "_risk"] * w for col, w in WEIGHTS.items()
    )
    agg_df["safety_score"] = (agg_df["safety_score"] / sum(WEIGHTS.values())) * 100
    agg_df["safety_score_smooth"] = (
        agg_df.groupby("Device ID")["safety_score"]
        .rolling(ROLLING_WINDOW, min_periods=1)
        .mean()
        .reset_index(0, drop=True)
    )

    # Reorder + ensure all columns exist
    for col in AGG_COL_ORDER:
        if col not in agg_df.columns:
            agg_df[col] = pd.NA
    agg_df = agg_df[AGG_COL_ORDER]

    return agg_df


# ---------------- Main Real-Time Loop ----------------
def main_loop(poll_interval=5):
    last_row_count = 0
    print("Starting real-time transform loop...")

    # Track which minutes already exist in aggregated CSV
    existing_minutes = set()
    if os.path.exists(AGG_CSV):
        try:
            existing_agg = pd.read_csv(AGG_CSV, usecols=["Device ID", "Minute"])
            existing_minutes = set(
                zip(existing_agg["Device ID"], existing_agg["Minute"])
            )
        except Exception as e:
            print(f"Warning: cannot read AGG_CSV ({e}), starting fresh.")
            existing_minutes = set()

    while True:
        try:
            df = pd.read_csv(RAW_CSV)
        except Exception as e:
            print(f"Failed to read RAW_CSV: {e}")
            time.sleep(poll_interval)
            continue

        new_rows = df.iloc[last_row_count:]
        if new_rows.empty:
            time.sleep(poll_interval)
            continue

        print(f"Processing {len(new_rows)} new rows...")

        try:
            # --- Clean ---
            df_chunk = clean_data(new_rows)
            if df_chunk.empty:
                last_row_count = len(df)
                time.sleep(poll_interval)
                continue

            write_csv_with_header(df_chunk, CLEAN_CSV)

            # --- Aggregate ---
            agg_df = aggregate_data(df_chunk)
            if not agg_df.empty:
                agg_df["Device_Minute"] = list(
                    zip(agg_df["Device ID"], agg_df["Minute"])
                )
                agg_df = agg_df[~agg_df["Device_Minute"].isin(existing_minutes)].drop(
                    columns=["Device_Minute"]
                )

                if not agg_df.empty:
                    chunk_size = max(1, len(agg_df) // 10)
                    clumped_agg_df = pd.concat(
                        [
                            agg_df.iloc[i : i + chunk_size]
                            for i in range(0, len(agg_df), chunk_size)
                        ]
                    ).reset_index(drop=True)

                    write_csv_with_header(clumped_agg_df, AGG_CSV)
                    existing_minutes.update(zip(agg_df["Device ID"], agg_df["Minute"]))
                    print(f"Updated aggregated CSV with {len(clumped_agg_df)} new rows")

        except Exception as e:
            print(f"Error during processing: {e}")

        last_row_count = len(df)
        time.sleep(poll_interval)


if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        print("\nStopped by user")
    except Exception as e:
        print(f"Error in main loop: {e}")
