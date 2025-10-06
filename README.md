# IoT-Based Smart Energy Consumption and Safety Monitor

## Overview

This project is a simulated IoT-based system designed to monitor energy consumption and safety parameters in a manufacturing or factory environment. The system uses various sensors to collect real-time data on metrics like current, temperature, and pressure. The project aims to optimize energy usage, improve safety, and integrate voice assistant control. It also features a web/mobile dashboard for monitoring and controlling devices.

## Features

* **Simulated IoT Device System**: Simulates 100s of IoT devices (e.g., current, temperature, and pressure sensors).
* **Real-Time Data Collection**: Streams sensor data to the backend using Kafka or AWS.
* **Data Analytics & Optimization**: Identifies high consumption or critical safety patterns and suggests optimizations.
* **Predictive Analysis**: Predicts potential system failures based on the collected data.
* **Remote Device Control**: Allows remote control of devices via simulated relays.
* **UI Dashboard**: A web/mobile interface displaying real-time data, trends, and insights.
* **Smart Assistant Integration**: Supports integration with Alexa/Google Home for voice-based device control.

## Directory Structure

```
└── yashchavanweb-25_codesmiths/
    ├── dashboard-ui/                
    ├── data-transformation/          
    └── iot-devices-simulation/       
        ├── backend/                 
        ├── bots/                    
        ├── controllers/             
        ├── kafka/                   
        ├── routes/                  
        ├── sensors/                 
        └── utils/                   
```

## Components

### Backend

* **Server**: Backend API integrating with Kafka to stream data.
* **Sensors**: Simulated sensors (current, temperature, pressure).
* **Kafka Integration**: Real-time data streaming from sensors to backend.
* **Analytics**: Processes data to detect patterns and generate optimization suggestions.

### Frontend

* **Dashboard UI**: React-based user interface to monitor metrics, trends, and insights.
* **Voice Assistant Integration**: Allows control of devices via Alexa or Google Home.

### Data Transformation

* **Data Processing**: Python scripts for transforming incoming sensor data for analysis.

### Bots

* **DeviceBot**: Simulates IoT device behavior, generating sensor data.
---
