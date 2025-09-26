import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql.types import DoubleType
from pyspark.sql.functions import avg, coalesce, col, lit
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='{"ts": "%(asctime)s", "level": "%(levelname)s", "msg": "%(message)s"}')

# Paths
RAW_CSV = "../iot-devices-simulation/backend/sensor_data.csv"
CLEAN_CSV = "./sensor_data_cleaned.csv"
AGG_CSV = "./sensor_data_aggregated.csv"

# Start Spark
spark = SparkSession.builder.appName("IoTDataTransform").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

def read_csv(path):
    df = spark.read.option("header", True).csv(path)
    # Standardize column names
    df = df.withColumnRenamed("Device ID", "Device_ID") \
           .withColumnRenamed("Temperature (°C)", "Temperature_C") \
           .withColumnRenamed("Current (A)", "Current_A") \
           .withColumnRenamed("Pressure (hPa)", "Pressure_hPa")
    return df

def clean_sdf(df):
    # Cast numeric columns to double
    numeric_cols = ["Temperature_C", "Current_A", "Pressure_hPa"]
    for col_name in numeric_cols:
        df = df.withColumn(col_name, df[col_name].cast(DoubleType()))
    return df

def aggregate_sdf(df):
    # Fill missing values first
    df = df.withColumn("Pressure_hPa", coalesce(col("Pressure_hPa"), lit(1.99))) \
           .withColumn("Current_A", coalesce(col("Current_A"), lit(5.0))) \
           .withColumn("Temperature_C", coalesce(col("Temperature_C"), lit(30.0)))
    
    sdf_agg = df.groupBy("Device_ID").agg(
        avg("Temperature_C").alias("Avg_Temperature_C"),
        avg("Current_A").alias("Avg_Current_A"),
        avg("Pressure_hPa").alias("Avg_Pressure_hPa")
    )
    return sdf_agg

def main_loop():
    logging.info("Starting PySpark real-time loop...")
    while True:
        raw_df = read_csv(RAW_CSV)
        sdf_clean = clean_sdf(raw_df)
        sdf_clean.toPandas().to_csv(CLEAN_CSV, index=False)
        
        sdf_agg = aggregate_sdf(sdf_clean)
        sdf_agg.toPandas().to_csv(AGG_CSV, index=False)
        
        logging.info("Transformed and aggregated data saved.")
        time.sleep(5)  # loop every 5 seconds

if __name__ == "__main__":
    main_loop()
