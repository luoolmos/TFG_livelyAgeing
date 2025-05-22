/* GARMIN DB TABLE*/

CREATE TABLE _attributes (
    timestamp DATETIME,
    "key" VARCHAR NOT NULL,
    value VARCHAR,
    PRIMARY KEY ("key")
);

CREATE TABLE attributes (
    timestamp DATETIME,
    "key" VARCHAR NOT NULL,
    value VARCHAR,
    PRIMARY KEY ("key")
);

CREATE TABLE daily_summary (
    day DATE NOT NULL,
    hr_min INTEGER,
    hr_max INTEGER,
    rhr INTEGER,
    stress_avg INTEGER,
    step_goal INTEGER,
    steps INTEGER,
    moderate_activity_time TIME NOT NULL,
    vigorous_activity_time TIME NOT NULL,
    intensity_time_goal TIME NOT NULL,
    floors_up FLOAT,
    floors_down FLOAT,
    floors_goal FLOAT,
    distance FLOAT,
    calories_goal INTEGER,
    calories_total INTEGER,
    calories_bmr INTEGER,
    calories_active INTEGER,
    calories_consumed INTEGER,
    hydration_goal INTEGER,
    hydration_intake INTEGER,
    sweat_loss INTEGER,
    spo2_avg FLOAT,
    spo2_min FLOAT,
    rr_waking_avg FLOAT,
    rr_max FLOAT,
    rr_min FLOAT,
    bb_charged INTEGER,
    bb_max INTEGER,
    bb_min INTEGER,
    description VARCHAR,
    PRIMARY KEY (day)
);

CREATE TABLE device_info (
    timestamp DATETIME NOT NULL,
    file_id VARCHAR,
    serial_number INTEGER NOT NULL,
    software_version VARCHAR,
    cum_operating_time TIME NOT NULL,
    battery_status VARCHAR(8),
    battery_voltage FLOAT,
    PRIMARY KEY (timestamp, serial_number),
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (serial_number) REFERENCES devices(serial_number)
);

CREATE TABLE devices (
    serial_number INTEGER NOT NULL,
    timestamp DATETIME,
    device_type VARCHAR,
    manufacturer VARCHAR(24),
    product VARCHAR,
    hardware_version VARCHAR,
    PRIMARY KEY (serial_number)
);

CREATE TABLE files (
    id VARCHAR NOT NULL,
    name VARCHAR,
    type VARCHAR(28) NOT NULL,
    serial_number INTEGER,
    PRIMARY KEY (id),
    UNIQUE (name),
    FOREIGN KEY (serial_number) REFERENCES devices(serial_number)
);

CREATE TABLE resting_hr (
    day DATE NOT NULL,
    resting_heart_rate FLOAT,
    PRIMARY KEY (day)
);

CREATE TABLE "sleep" (
    "day" DATE NOT NULL,
    "start" DATETIME,
    "end" DATETIME,
    "total_sleep" TIME NOT NULL,
    "deep_sleep" TIME NOT NULL,
    "light_sleep" TIME NOT NULL,
    "rem_sleep" TIME NOT NULL,
    "awake" TIME NOT NULL,
    "avg_spo2" FLOAT,
    "avg_rr" FLOAT,
    "avg_stress" FLOAT,
    "score" INTEGER,
    "qualifier" VARCHAR,
    PRIMARY KEY ("day")
);

CREATE TABLE sleep_events (
    timestamp DATETIME NOT NULL,
    event VARCHAR,
    duration TIME NOT NULL,
    PRIMARY KEY (timestamp)
);

CREATE TABLE stress (
    timestamp DATETIME NOT NULL,
    stress INTEGER NOT NULL,
    PRIMARY KEY (timestamp),
    UNIQUE (timestamp)
);

CREATE TABLE weight (
    day DATE NOT NULL,
    weight FLOAT NOT NULL,
    PRIMARY KEY (day)
);



/********************
*     DBDIAGRAM.IO  *
*********************/

/*
Table devices {
  serial_number INTEGER [pk]
  timestamp DATETIME
  device_type VARCHAR
  manufacturer VARCHAR(24)
  product VARCHAR
  hardware_version VARCHAR
}

Table files {
  id VARCHAR [pk]
  name VARCHAR
  type VARCHAR(28)
  serial_number INTEGER
  Note: "UNIQUE(name)"
}

Table device_info {
  timestamp DATETIME [not null]
  file_id VARCHAR
  serial_number INTEGER [not null]
  software_version VARCHAR
  cum_operating_time TIME [not null]
  battery_status VARCHAR(8)
  battery_voltage FLOAT

  Primary Key (timestamp, serial_number)
}

Table daily_summary {
  day DATE [pk]
  hr_min INTEGER
  hr_max INTEGER
  rhr INTEGER
  stress_avg INTEGER
  step_goal INTEGER
  steps INTEGER
  moderate_activity_time TIME [not null]
  vigorous_activity_time TIME [not null]
  intensity_time_goal TIME [not null]
  floors_up FLOAT
  floors_down FLOAT
  floors_goal FLOAT
  distance FLOAT
  calories_goal INTEGER
  calories_total INTEGER
  calories_bmr INTEGER
  calories_active INTEGER
  calories_consumed INTEGER
  hydration_goal INTEGER
  hydration_intake INTEGER
  sweat_loss INTEGER
  spo2_avg FLOAT
  spo2_min FLOAT
  rr_waking_avg FLOAT
  rr_max FLOAT
  rr_min FLOAT
  bb_charged INTEGER
  bb_max INTEGER
  bb_min INTEGER
  description VARCHAR
}

Table resting_hr {
  day DATE [pk]
  resting_heart_rate FLOAT
}

Table weight {
  day DATE [pk]
  weight FLOAT [not null]
}

Table "sleep" {
  day DATE [pk]
  start DATETIME
  end DATETIME
  total_sleep TIME [not null]
  deep_sleep TIME [not null]
  light_sleep TIME [not null]
  rem_sleep TIME [not null]
  awake TIME [not null]
  avg_spo2 FLOAT
  avg_rr FLOAT
  avg_stress FLOAT
  score INTEGER
  qualifier VARCHAR
}

Table sleep_events {
  timestamp DATETIME [pk]
  event VARCHAR
  duration TIME [not null]
}

Table stress {
  timestamp DATETIME [pk, unique]
  stress INTEGER [not null]
}

Table _attributes {
  timestamp DATETIME
  key VARCHAR [not null, pk]
  value VARCHAR
}

Table attributes {
  timestamp DATETIME
  key VARCHAR [not null, pk]
  value VARCHAR
}

Ref: files.serial_number > devices.serial_number
Ref: device_info.serial_number > devices.serial_number
Ref: device_info.file_id > files.id

*/