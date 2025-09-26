Turn on docker desktop

1. zookeeper installation
   docker run -d --name zookeeper -p 2181:2181 zookeeper

Set IP
docker run -d --name kafka -p 9092:9092 ^
-e KAFKA_ZOOKEEPER_CONNECT=192.168.137.35:2181 ^
-e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.137.35:9092 ^
-e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 ^
confluentinc/cp-kafka:6.2.10
