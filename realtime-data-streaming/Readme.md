Turn on docker desktop

1. zookeeper installation
   docker run -d --name zookeeper -p 2181:2181 zookeeper

Set IP
docker run -d --name kafka -p 9092:9092 ^
-e KAFKA_ZOOKEEPER_CONNECT= 172.23.96.1:2181 ^
-e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT:// 172.23.96.1:9092 ^
-e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 ^
confluentinc/cp-kafka:6.2.10





Metal / Chemical industry
hazardous
kafka
ingest the data
multiple machines
10 secs
range
out of range - anamonly detection

clean kafka data
analyze data
hazardous scenes
realtime

Here’s a clear table with the chemical mentioned (using **Ammonia (NH₃)** as an example):

| **Chemical**      | **Device**        | **Sensor**      | **Normal Range**  | **Dangerous Range**                                               |
| ----------------- | ----------------- | --------------- | ----------------- | ----------------------------------------------------------------- |
| **Ammonia (NH₃)** | **Storage Tank**  | Temperature     | -30°C to 40°C     | ↑ Above 50°C: Risk of explosion or venting                        |
|                   |                   | Pressure        | 1 to 2 bar        | ↑ Above 2.5 bar: Too much pressure, could burst                   |
|                   |                   | Current (Motor) | 50% to 80% of max | ↑ Above max: Motor overload, could fail                           |
|                   | **Transfer Pipe** | Temperature     | -20°C to 40°C     | ↑ Above 50°C: Risk of vaporization or rupture                     |
|                   |                   | Pressure        | 5 to 20 bar       | ↑ Surge >1.2x Normal: Blockage, rupture; ↓ Near 0 bar: Pump issue |
|                   | **Reactor**       | Temperature     | 200°C to 500°C    | ↑ Above 550°C: Damage to catalyst, explosion risk                 |
|                   |                   | Pressure        | 1 to 5 bar        | ↑ Above 1.2x Normal: Overpressure, risk of failure                |
|                   | **All Devices**   | Sensor Signal   | 4 to 20 mA        | <3.6 mA or >21 mA: Sensor or wiring problem                       |

This table lists the **Ammonia (NH₃)** chemical along with its equipment, sensor ranges, and the danger zones. Let me know if you need it adjusted further!

# Why

Here are the **top 3 uses** of **Ammonia (NH₃)**:

### 1. **Fertilizer Production**

- **Primary use**: Ammonia is the main ingredient in many fertilizers (like urea and ammonium nitrate).
- **Why**: It provides essential nitrogen for plant growth, making it crucial for **global food production**.

### 2. **Chemical Manufacturing**

- **Feedstock for other chemicals**: Used to produce chemicals like **nitric acid**, **hydrazine**, and **ammonium sulfate**.
- **Why**: It's a building block for a wide range of industrial chemicals.

### 3. **Refrigeration**

- **Industrial cooling**: Ammonia is used as a coolant in large refrigeration systems.
- **Why**: It’s efficient and widely used in **food processing** and **cold storage** due to its excellent heat absorption properties.

These are the main ways ammonia is used in industry.
