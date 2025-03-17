CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices Table
CREATE TABLE devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_type TEXT NOT NULL,
    token TEXT UNIQUE,
    model TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries on user_id in devices
CREATE INDEX idx_devices_user_id ON devices(user_id);


-- Datos de Actividad (Pasos, Calorías, Minutos Activos)
CREATE TABLE activity_series (
    user_id UUID REFERENCES users(user_id),
    time TIMESTAMPTZ NOT NULL,
    activity_type TEXT,
    steps INTEGER,
    calories_burned DECIMAL,
    active_zone_minutes INTEGER,
    PRIMARY KEY (user_id, time)
);
SELECT create_hypertable('activity_series', 'time');

-- Ritmo Cardíaco
CREATE TABLE heart_rate_series (
    user_id UUID REFERENCES users(user_id),
    time TIMESTAMPTZ NOT NULL,
    heart_rate INTEGER,
    PRIMARY KEY (user_id, time)
);
SELECT create_hypertable('heart_rate_series', 'time');

-- Variabilidad del Ritmo Cardíaco
CREATE TABLE heart_rate_variability (
    user_id UUID REFERENCES users(user_id),
    time TIMESTAMPTZ NOT NULL,
    hrv_value DECIMAL,
    PRIMARY KEY (user_id, time)
);
SELECT create_hypertable('heart_rate_variability', 'time');

-- Datos de Respiración y SpO2
CREATE TABLE breathing_series (
    user_id UUID REFERENCES users(user_id),
    time TIMESTAMPTZ NOT NULL,
    breathing_rate DECIMAL,
    spo2_level DECIMAL,
    PRIMARY KEY (user_id, time)
);
SELECT create_hypertable('breathing_series', 'time');

-- Temperatura Corporal
CREATE TABLE temperature_series (
    user_id UUID REFERENCES users(user_id),
    time TIMESTAMPTZ NOT NULL,
    temperature DECIMAL,
    PRIMARY KEY (user_id, time)
);
SELECT create_hypertable('temperature_series', 'time');

-- Datos del Sueño
CREATE TABLE sleep_series (
    user_id UUID REFERENCES users(user_id),
    time TIMESTAMPTZ NOT NULL,
    sleep_stage TEXT,
    duration_minutes INTEGER,
    PRIMARY KEY (user_id, time)
);
SELECT create_hypertable('sleep_series', 'time');

-- Datos de Nutrición
CREATE TABLE nutrition_series (
    user_id UUID REFERENCES users(user_id),
    time TIMESTAMPTZ NOT NULL,
    calories INTEGER,
    protein DECIMAL,
    fat DECIMAL,
    carbohydrates DECIMAL,
    PRIMARY KEY (user_id, time)
);
SELECT create_hypertable('nutrition_series', 'time');


-- Electrocardiogramas
CREATE TABLE electrocardiograms (
    ecg_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    recorded_at TIMESTAMPTZ NOT NULL,
    result TEXT,
    notes TEXT
);

-- Notificaciones de Ritmo Irregular
CREATE TABLE irregular_rhythm_notifications (
    notification_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    detected_at TIMESTAMPTZ NOT NULL,
    severity_level TEXT,
    notes TEXT
);

