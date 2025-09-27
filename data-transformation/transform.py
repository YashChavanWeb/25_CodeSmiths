import pandas as pd
import os
import json
import time
from kafka import KafkaConsumer
import json as js

# ---------------- Paths ----------------
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

    for col in NUMERIC_COLS:
        if col in df_chunk.columns:
            col_median = df_chunk[col].median()
            df_chunk.loc[:, col] = df_chunk[col].fillna(col_median)

    for col, (low, high) in OUTLIER_RANGES.items():
        if col in df_chunk.columns:
            df_chunk = df_chunk[(df_chunk[col] >= low) & (df_chunk[col] <= high)]

    df_chunk["Power (W)"] = df_chunk.get("Current (A)", 0) * 220
    df_chunk["Timestamp"] = pd.to_datetime(
        df_chunk["Timestamp"], utc=True, errors="coerce"
    )
    df_chunk = df_chunk.dropna(subset=["Timestamp"]).sort_values(
        by=["Device ID", "Timestamp"]
    )

    df_chunk["Temp_Rate"] = (
        df_chunk.groupby("Device ID")["Temperature (°C)"].diff()
        / df_chunk.groupby("Device ID")["Timestamp"].diff().dt.total_seconds()
    )
    df_chunk["Temp_Rate"] = df_chunk["Temp_Rate"].fillna(0)
    df_chunk["Timestamp_IST"] = df_chunk["Timestamp"].dt.tz_convert("Asia/Kolkata")
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

    for col in ["avg_temp", "avg_current", "total_power"]:
        agg_df[col + "_smooth"] = (
            agg_df.groupby("Device ID")[col]
            .rolling(ROLLING_WINDOW, min_periods=1)
            .mean()
            .reset_index(0, drop=True)
        )

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

    for col, (low, high) in AGG_METRICS.items():
        if col in agg_df.columns:
            risk_col = col + "_risk"
            agg_df[risk_col] = ((agg_df[col] - low) / (high - low)).clip(0, 1)
            agg_df[col + "_anomaly"] = ~agg_df[col].between(low, high)

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

    # For clumping, split the aggregated data into 10 equal-sized chunks
    chunk_size = len(agg_df) // 10
    clumped_agg_df = pd.concat(
        [agg_df.iloc[i : i + chunk_size] for i in range(0, len(agg_df), chunk_size)]
    ).reset_index(drop=True)

    return clumped_agg_df


# ---------------- Main Real-Time Loop ----------------
def main_loop(poll_interval=5):
    last_row_count = 0
    print("Starting real-time transform loop (Kafka mode)...")

    # Track which minutes already exist in aggregated CSV
    existing_minutes = set()
    if os.path.exists(AGG_CSV):
        try:
            existing_agg = pd.read_csv(AGG_CSV, usecols=["Device ID", "Minute"])
            existing_minutes = set(
                zip(existing_agg["Device ID"], existing_agg["Minute"])
            )
        except Exception:
            existing_minutes = set()

    # ---------------- Kafka Consumer ----------------
    consumer = KafkaConsumer(
        'sensor-data',
        bootstrap_servers='localhost:9092',
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='analytics-group',
        value_deserializer=lambda x: js.loads(x.decode('utf-8'))
    )

    buffer = []

    while True:
        try:
            for message in consumer:
                buffer.append(message.value)

                if len(buffer) >= 50:  # batch size for processing
                    df_chunk = pd.DataFrame(buffer)
                    buffer = []

                    # Rename columns to match existing schema
                    df_chunk.rename(
                        columns={
                            "deviceId": "Device ID",
                            "systemType": "System Type",
                            "temperature": "Temperature (°C)",
                            "current": "Current (A)",
                            "pressure": "Pressure (hPa)",
                            "alert": "Alert",
                            "timestamp": "Timestamp",
                        },
                        inplace=True,
                    )

                    # --- Clean ---
                    df_chunk = clean_data(df_chunk)
                    if df_chunk.empty:
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

        except KeyboardInterrupt:
            print("\nStopped by user")
            break
        except Exception as e:
            print(f"Error during processing: {e}")
            time.sleep(poll_interval)


if __name__ == "__main__":
    main_loop()
