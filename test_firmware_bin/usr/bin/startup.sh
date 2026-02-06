#!/bin/sh
# IoT Device Startup Script
API_KEY="sk_live_51HzVABCDEFGHIJKLMNOPQRSTUVWXYZ"
DB_PASSWORD="MySecretPass123!"
MQTT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
SERVER_URL="http://192.168.1.100:8080"

echo "Starting IoT service..."
/usr/bin/iot-daemon --api-key=$API_KEY
