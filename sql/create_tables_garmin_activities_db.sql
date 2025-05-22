/* GARMIN ACTIVITIES DB TABLE*/

--CREATE TABLE _attributes (
--    timestamp DATETIME,
--    "key" VARCHAR NOT NULL,
--    value VARCHAR,
--    PRIMARY KEY ("key")
--);

CREATE TABLE activities (
    activity_id VARCHAR NOT NULL,
    name VARCHAR,
    description VARCHAR,
    type VARCHAR,
    course_id INTEGER,
    laps INTEGER,
    sport VARCHAR,
    sub_sport VARCHAR,
    device_serial_number INTEGER,
    self_eval_feel VARCHAR,
    self_eval_effort VARCHAR,
    training_load FLOAT,
    training_effect FLOAT,
    anaerobic_training_effect FLOAT,
    start_time DATETIME,
    stop_time DATETIME,
    elapsed_time TIME NOT NULL,
    moving_time TIME NOT NULL,
    distance FLOAT,
    cycles FLOAT,
    avg_hr INTEGER,
    max_hr INTEGER,
    avg_rr FLOAT,
    max_rr FLOAT,
    calories INTEGER,
    avg_cadence INTEGER,
    max_cadence INTEGER,
    avg_speed FLOAT,
    max_speed FLOAT,
    ascent FLOAT,
    descent FLOAT,
    max_temperature FLOAT,
    min_temperature FLOAT,
    avg_temperature FLOAT,
    start_lat FLOAT,
    start_long FLOAT,
    stop_lat FLOAT,
    stop_long FLOAT,
    hr_zones_method VARCHAR(18),
    hrz_1_hr INTEGER,
    hrz_2_hr INTEGER,
    hrz_3_hr INTEGER,
    hrz_4_hr INTEGER,
    hrz_5_hr INTEGER,
    hrz_1_time TIME NOT NULL,
    hrz_2_time TIME NOT NULL,
    hrz_3_time TIME NOT NULL,
    hrz_4_time TIME NOT NULL,
    hrz_5_time TIME NOT NULL,
    PRIMARY KEY (activity_id)
);

CREATE TABLE activities_devices (
    activity_id VARCHAR NOT NULL,
    device_serial_number INTEGER NOT NULL,
    PRIMARY KEY (activity_id, device_serial_number)
);

CREATE TABLE activity_laps (
    activity_id VARCHAR NOT NULL,
    lap INTEGER NOT NULL,
    start_time DATETIME,
    stop_time DATETIME,
    elapsed_time TIME NOT NULL,
    moving_time TIME NOT NULL,
    distance FLOAT,
    cycles FLOAT,
    avg_hr INTEGER,
    max_hr INTEGER,
    avg_rr FLOAT,
    max_rr FLOAT,
    calories INTEGER,
    avg_cadence INTEGER,
    max_cadence INTEGER,
    avg_speed FLOAT,
    max_speed FLOAT,
    ascent FLOAT,
    descent FLOAT,
    max_temperature FLOAT,
    min_temperature FLOAT,
    avg_temperature FLOAT,
    start_lat FLOAT,
    start_long FLOAT,
    stop_lat FLOAT,
    stop_long FLOAT,
    hr_zones_method VARCHAR(18),
    hrz_1_hr INTEGER,
    hrz_2_hr INTEGER,
    hrz_3_hr INTEGER,
    hrz_4_hr INTEGER,
    hrz_5_hr INTEGER,
    hrz_1_time TIME NOT NULL,
    hrz_2_time TIME NOT NULL,
    hrz_3_time TIME NOT NULL,
    hrz_4_time TIME NOT NULL,
    hrz_5_time TIME NOT NULL,
    PRIMARY KEY (activity_id, lap),
    FOREIGN KEY (activity_id) REFERENCES activities (activity_id)
);

CREATE TABLE activity_records (
    activity_id VARCHAR NOT NULL,
    record INTEGER NOT NULL,
    timestamp DATETIME,
    position_lat FLOAT,
    position_long FLOAT,
    distance FLOAT,
    cadence INTEGER,
    altitude FLOAT,
    hr INTEGER,
    rr FLOAT,
    speed FLOAT,
    temperature FLOAT,
    PRIMARY KEY (activity_id, record),
    FOREIGN KEY (activity_id) REFERENCES activities (activity_id)
);

CREATE TABLE cycle_activities (
    strokes INTEGER,
    vo2_max FLOAT,
    activity_id VARCHAR NOT NULL,
    PRIMARY KEY (activity_id),
    FOREIGN KEY (activity_id) REFERENCES activities (activity_id)
);

CREATE TABLE paddle_activities (
    strokes INTEGER,
    avg_stroke_distance FLOAT,
    activity_id VARCHAR NOT NULL,
    PRIMARY KEY (activity_id),
    FOREIGN KEY (activity_id) REFERENCES activities (activity_id)
);

CREATE TABLE steps_activities (
    steps INTEGER,
    avg_pace TIME NOT NULL,
    avg_moving_pace TIME NOT NULL,
    max_pace TIME NOT NULL,
    avg_steps_per_min INTEGER,
    max_steps_per_min INTEGER,
    avg_step_length FLOAT,
    avg_vertical_ratio FLOAT,
    avg_vertical_oscillation FLOAT,
    avg_gct_balance FLOAT,
    avg_ground_contact_time TIME NOT NULL,
    avg_stance_time_percent FLOAT,
    vo2_max FLOAT,
    activity_id VARCHAR NOT NULL,
    PRIMARY KEY (activity_id),
    FOREIGN KEY (activity_id) REFERENCES activities (activity_id)
);



/********************
*     DBDIAGRAM.IO  *
*********************/

/*
Table _attributes {
  timestamp DATETIME
  key VARCHAR [not null, pk]
  value VARCHAR
}

Table activities {
  activity_id VARCHAR [pk]
  name VARCHAR
  description VARCHAR
  type VARCHAR
  course_id INTEGER
  laps INTEGER
  sport VARCHAR
  sub_sport VARCHAR
  device_serial_number INTEGER
  self_eval_feel VARCHAR
  self_eval_effort VARCHAR
  training_load FLOAT
  training_effect FLOAT
  anaerobic_training_effect FLOAT
  start_time DATETIME
  stop_time DATETIME
  elapsed_time TIME [not null]
  moving_time TIME [not null]
  distance FLOAT
  cycles FLOAT
  avg_hr INTEGER
  max_hr INTEGER
  avg_rr FLOAT
  max_rr FLOAT
  calories INTEGER
  avg_cadence INTEGER
  max_cadence INTEGER
  avg_speed FLOAT
  max_speed FLOAT
  ascent FLOAT
  descent FLOAT
  max_temperature FLOAT
  min_temperature FLOAT
  avg_temperature FLOAT
  start_lat FLOAT
  start_long FLOAT
  stop_lat FLOAT
  stop_long FLOAT
  hr_zones_method VARCHAR(18)
  hrz_1_hr INTEGER
  hrz_2_hr INTEGER
  hrz_3_hr INTEGER
  hrz_4_hr INTEGER
  hrz_5_hr INTEGER
  hrz_1_time TIME [not null]
  hrz_2_time TIME [not null]
  hrz_3_time TIME [not null]
  hrz_4_time TIME [not null]
  hrz_5_time TIME [not null]
}

Table activities_devices {
  activity_id VARCHAR [not null]
  device_serial_number INTEGER [not null]

  Primary Key (activity_id, device_serial_number)
}

Table activity_laps {
  activity_id VARCHAR [not null]
  lap INTEGER [not null]
  start_time DATETIME
  stop_time DATETIME
  elapsed_time TIME [not null]
  moving_time TIME [not null]
  distance FLOAT
  cycles FLOAT
  avg_hr INTEGER
  max_hr INTEGER
  avg_rr FLOAT
  max_rr FLOAT
  calories INTEGER
  avg_cadence INTEGER
  max_cadence INTEGER
  avg_speed FLOAT
  max_speed FLOAT
  ascent FLOAT
  descent FLOAT
  max_temperature FLOAT
  min_temperature FLOAT
  avg_temperature FLOAT
  start_lat FLOAT
  start_long FLOAT
  stop_lat FLOAT
  stop_long FLOAT
  hr_zones_method VARCHAR(18)
  hrz_1_hr INTEGER
  hrz_2_hr INTEGER
  hrz_3_hr INTEGER
  hrz_4_hr INTEGER
  hrz_5_hr INTEGER
  hrz_1_time TIME [not null]
  hrz_2_time TIME [not null]
  hrz_3_time TIME [not null]
  hrz_4_time TIME [not null]
  hrz_5_time TIME [not null]

  Primary Key (activity_id, lap)
}

Table activity_records {
  activity_id VARCHAR [not null]
  record INTEGER [not null]
  timestamp DATETIME
  position_lat FLOAT
  position_long FLOAT
  distance FLOAT
  cadence INTEGER
  altitude FLOAT
  hr INTEGER
  rr FLOAT
  speed FLOAT
  temperature FLOAT

  Primary Key (activity_id, record)
}

Table cycle_activities {
  strokes INTEGER
  vo2_max FLOAT
  activity_id VARCHAR [not null, pk]
}

Table paddle_activities {
  strokes INTEGER
  avg_stroke_distance FLOAT
  activity_id VARCHAR [not null, pk]
}

Table steps_activities {
  steps INTEGER
  avg_pace TIME [not null]
  avg_moving_pace TIME [not null]
  max_pace TIME [not null]
  avg_steps_per_min INTEGER
  max_steps_per_min INTEGER
  avg_step_length FLOAT
  avg_vertical_ratio FLOAT
  avg_vertical_oscillation FLOAT
  avg_gct_balance FLOAT
  avg_ground_contact_time TIME [not null]
  avg_stance_time_percent FLOAT
  vo2_max FLOAT
  activity_id VARCHAR [not null, pk]
}

Ref: activity_laps.activity_id > activities.activity_id
Ref: activity_records.activity_id > activities.activity_id
Ref: cycle_activities.activity_id > activities.activity_id
Ref: paddle_activities.activity_id > activities.activity_id
Ref: steps_activities.activity_id > activities.activity_id

*/