-- IoT Security Testing Platform - Database Initialization
-- This script runs only once when the database is first initialized

-- Enable UUID extension
\c iot_security_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
