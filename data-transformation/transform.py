import pandas as pd
import os
import json
from kafka import KafkaConsumer
import json as js
import time
from pymongo import MongoClient
from flask import Flask, jsonify
import threading

# ---------------- MongoDB Setup ----------------
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection settings
MONGODB_USER = os.getenv("MONGODB_USER")
MONGODB_PASSWORD = os.getenv("MONGODB_PASSWORD")
MONGODB_HOST = os.getenv("MONGODB_HOST")

# Create MongoDB client
try:
    # Use the connection string but append the database name at the end
    client = MongoClient(MONGODB_HOST + "clean-data?retryWrites=true&w=majority")
    db = client.get_database()  # Get the database from the connection string
    sensor_collection = db["sensor_data"]  # Collection for sensor data
    agg_collection = db["aggregated_data"]  # Collection for aggregated data
    print("Successfully connected to MongoDB")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    client = None

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
    "Status",  # Add Status column
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
        "Status",  # Add Status column
    ]
    + [f"{col}_risk" for col in AGG_METRICS.keys()]
    + [f"{col}_anomaly" for col in AGG_METRICS.keys()]
)


# ---------------- Helper Function ----------------
def write_csv_with_header(df, filepath):
    """Append to CSV, ensure header exists if file is missing or empty."""
    write_header = not os.path.exists(filepath) or os.path.getsize(filepath) == 0
    df.to_csv(filepath, index=False, mode="a", header=write_header)
    # Publish to MongoDB after writing the CSV
    publish_to_mongo(df, filepath)


# ---------------- MongoDB Function ----------------
def publish_to_mongo(df, filepath):
    """Publish the data to MongoDB."""
    try:
        # Construct the MongoDB URI with credentials
        mongo_uri = f"mongodb+srv://{os.environ.get('MONGODB_USER')}:{os.environ.get('MONGODB_PASSWORD')}@{os.environ.get('MONGODB_HOST')}/?retryWrites=true&w=majority"

        # Connect to MongoDB
        client = MongoClient(mongo_uri)

        # Specify the actual database name
        db = client["clean-data"]  # The database name should be specified here
        collection_name = "cleaned_data" if "cleaned" in filepath else "aggregated_data"
        collection = db[collection_name]

        # Convert DataFrame to dicts and insert into MongoDB
        records = df.to_dict(orient="records")
        if records:
            collection.insert_many(records)
            print(f"Published {len(records)} records to MongoDB ({collection_name})")
        else:
            print("No records to publish to MongoDB.")

    except Exception as e:
        print(f"Error while publishing to MongoDB: {e}")


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

    # Handle Status field
    if "Status" not in df_chunk.columns:
        # If all sensor values are NaN, status is Off, otherwise On
        df_chunk["Status"] = df_chunk.apply(
            lambda row: (
                "Off"
                if all(
                    pd.isna(row[col])
                    for col in ["Temperature (°C)", "Current (A)", "Pressure (hPa)"]
                )
                else "On"
            ),
            axis=1,
        )

    # Ensure all required columns are present
    for col in CLEAN_COL_ORDER:
        if col not in df_chunk.columns:
            df_chunk[col] = None

    # Return dataframe with correct column order
    return df_chunk[CLEAN_COL_ORDER]


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
            Status=(
                "Status",
                "last",
            ),  # Preserve the last status in the minute interval
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
def main_loop(poll_interval=5, duration=10):
    start_time = time.time()
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
        "sensor-data",
        bootstrap_servers="localhost:9092",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        group_id="analytics-group",
        value_deserializer=lambda x: js.loads(x.decode("utf-8")),
    )

    buffer = []

    while True:
        if time.time() - start_time >= duration:
            # Stop after the specified duration
            print(f"Stopping after {duration} seconds.")
            break

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
                            "status": "Status",  # Add status field mapping
                        },
                        inplace=True,
                    )

                    # --- Clean ---
                    df_chunk = clean_data(df_chunk)
                    if df_chunk.empty:
                        continue

                    write_csv_with_header(df_chunk, CLEAN_CSV)

                    # Store cleaned data in MongoDB
                    if client:
                        try:
                            records = df_chunk.to_dict("records")
                            sensor_collection.insert_many(records)
                        except Exception as e:
                            print(f"Error while publishing to MongoDB: {e}")

                    # --- Aggregate ---
                    agg_df = aggregate_data(df_chunk)
                    if not agg_df.empty:
                        agg_df["Device_Minute"] = list(
                            zip(agg_df["Device ID"], agg_df["Minute"])
                        )
                        agg_df = agg_df[
                            ~agg_df["Device_Minute"].isin(existing_minutes)
                        ].drop(columns=["Device_Minute"])

                        if not agg_df.empty:
                            chunk_size = max(1, len(agg_df) // 10)
                            clumped_agg_df = pd.concat(
                                [
                                    agg_df.iloc[i : i + chunk_size]
                                    for i in range(0, len(agg_df), chunk_size)
                                ]
                            ).reset_index(drop=True)

                            write_csv_with_header(clumped_agg_df, AGG_CSV)

                            # Store aggregated data in MongoDB
                            if client:
                                try:
                                    agg_records = clumped_agg_df.to_dict("records")
                                    agg_collection.insert_many(agg_records)
                                except Exception as e:
                                    print(f"Error while publishing to MongoDB: {e}")

                            existing_minutes.update(
                                zip(agg_df["Device ID"], agg_df["Minute"])
                            )
                            print(
                                f"Updated aggregated CSV with {len(clumped_agg_df)} new rows"
                            )

        except KeyboardInterrupt:
            print("\nStopped by user")
            break
        except Exception as e:
            print(f"Error during processing: {e}")
            time.sleep(poll_interval)


app = Flask(__name__)
transform_thread = None
is_transform_running = False


@app.route("/start-transform", methods=["POST"])
def start_transform():
    global transform_thread, is_transform_running

    if is_transform_running:
        return (
            jsonify(
                {"status": "error", "message": "Transform process is already running"}
            ),
            400,
        )

    try:
        is_transform_running = True
        transform_thread = threading.Thread(target=main_loop, kwargs={"duration": 10})
        transform_thread.start()
        return (
            jsonify({"status": "success", "message": "Transform process started"}),
            200,
        )
    except Exception as e:
        is_transform_running = False
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/status", methods=["GET"])
def get_status():
    global is_transform_running
    return jsonify(
        {
            "status": "running" if is_transform_running else "stopped",
            "is_alive": transform_thread.is_alive() if transform_thread else False,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
