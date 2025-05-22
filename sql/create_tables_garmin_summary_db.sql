/* GARMIN SUMMARY DB TABLE*/

CREATE TABLE _attributes (
    timestamp DATETIME,
    "key" VARCHAR NOT NULL,
    value VARCHAR,
    PRIMARY KEY ("key")
);

CREATE TABLE days_summary (
    day DATE NOT NULL,
    hr_avg FLOAT,
    hr_min FLOAT,
    hr_max FLOAT,
    rhr_avg FLOAT,
    rhr_min FLOAT,
    rhr_max FLOAT,
    inactive_hr_avg FLOAT,
    inactive_hr_min FLOAT,
    inactive_hr_max FLOAT,
    weight_avg FLOAT,
    weight_min FLOAT,
    weight_max FLOAT,
    intensity_time TIME NOT NULL,
    moderate_activity_time TIME NOT NULL,
    vigorous_activity_time TIME NOT NULL,
    intensity_time_goal TIME NOT NULL,
    steps INTEGER,
    steps_goal INTEGER,
    floors FLOAT,
    floors_goal FLOAT,
    sleep_avg TIME NOT NULL,
    sleep_min TIME NOT NULL,
    sleep_max TIME NOT NULL,
    rem_sleep_avg TIME NOT NULL,
    rem_sleep_min TIME NOT NULL,
    rem_sleep_max TIME NOT NULL,
    stress_avg INTEGER,
    calories_avg INTEGER,
    calories_bmr_avg INTEGER,
    calories_active_avg INTEGER,
    calories_goal INTEGER,
    calories_consumed_avg INTEGER,
    activities INTEGER,
    activities_calories INTEGER,
    activities_distance INTEGER,
    hydration_goal INTEGER,
    hydration_avg INTEGER,
    hydration_intake INTEGER,
    sweat_loss_avg INTEGER,
    sweat_loss INTEGER,
    spo2_avg FLOAT,
    spo2_min FLOAT,
    rr_waking_avg FLOAT,
    rr_max FLOAT,
    rr_min FLOAT,
    bb_max INTEGER,
    bb_min INTEGER,
    PRIMARY KEY (day)
);

CREATE TABLE intensity_hr (
    timestamp DATETIME NOT NULL,
    intensity INTEGER NOT NULL,
    heart_rate INTEGER NOT NULL,
    PRIMARY KEY (timestamp)
);

CREATE TABLE months_summary (
    first_day DATE NOT NULL,
    hr_avg FLOAT,
    hr_min FLOAT,
    hr_max FLOAT,
    rhr_avg FLOAT,
    rhr_min FLOAT,
    rhr_max FLOAT,
    inactive_hr_avg FLOAT,
    inactive_hr_min FLOAT,
    inactive_hr_max FLOAT,
    weight_avg FLOAT,
    weight_min FLOAT,
    weight_max FLOAT,
    intensity_time TIME NOT NULL,
    moderate_activity_time TIME NOT NULL,
    vigorous_activity_time TIME NOT NULL,
    intensity_time_goal TIME NOT NULL,
    steps INTEGER,
    steps_goal INTEGER,
    floors FLOAT,
    floors_goal FLOAT,
    sleep_avg TIME NOT NULL,
    sleep_min TIME NOT NULL,
    sleep_max TIME NOT NULL,
    rem_sleep_avg TIME NOT NULL,
    rem_sleep_min TIME NOT NULL,
    rem_sleep_max TIME NOT NULL,
    stress_avg INTEGER,
    calories_avg INTEGER,
    calories_bmr_avg INTEGER,
    calories_active_avg INTEGER,
    calories_goal INTEGER,
    calories_consumed_avg INTEGER,
    activities INTEGER,
    activities_calories INTEGER,
    activities_distance INTEGER,
    hydration_goal INTEGER,
    hydration_avg INTEGER,
    hydration_intake INTEGER,
    sweat_loss_avg INTEGER,
    sweat_loss INTEGER,
    spo2_avg FLOAT,
    spo2_min FLOAT,
    rr_waking_avg FLOAT,
    rr_max FLOAT,
    rr_min FLOAT,
    bb_max INTEGER,
    bb_min INTEGER,
    PRIMARY KEY (first_day)
);

CREATE TABLE summary (
    timestamp DATETIME,
    "key" VARCHAR NOT NULL,
    value VARCHAR,
    PRIMARY KEY ("key")
);

CREATE TABLE weeks_summary (
    first_day DATE NOT NULL,
    hr_avg FLOAT,
    hr_min FLOAT,
    hr_max FLOAT,
    rhr_avg FLOAT,
    rhr_min FLOAT,
    rhr_max FLOAT,
    inactive_hr_avg FLOAT,
    inactive_hr_min FLOAT,
    inactive_hr_max FLOAT,
    weight_avg FLOAT,
    weight_min FLOAT,
    weight_max FLOAT,
    intensity_time TIME NOT NULL,
    moderate_activity_time TIME NOT NULL,
    vigorous_activity_time TIME NOT NULL,
    intensity_time_goal TIME NOT NULL,
    steps INTEGER,
    steps_goal INTEGER,
    floors FLOAT,
    floors_goal FLOAT,
    sleep_avg TIME NOT NULL,
    sleep_min TIME NOT NULL,
    sleep_max TIME NOT NULL,
    rem_sleep_avg TIME NOT NULL,
    rem_sleep_min TIME NOT NULL,
    rem_sleep_max TIME NOT NULL,
    stress_avg INTEGER,
    calories_avg INTEGER,
    calories_bmr_avg INTEGER,
    calories_active_avg INTEGER,
    calories_goal INTEGER,
    calories_consumed_avg INTEGER,
    activities INTEGER,
    activities_calories INTEGER,
    activities_distance INTEGER,
    hydration_goal INTEGER,
    hydration_avg INTEGER,
    hydration_intake INTEGER,
    sweat_loss_avg INTEGER,
    sweat_loss INTEGER,
    spo2_avg FLOAT,
    spo2_min FLOAT,
    rr_waking_avg FLOAT,
    rr_max FLOAT,
    rr_min FLOAT,
    bb_max INTEGER,
    bb_min INTEGER,
    PRIMARY KEY (first_day)
);

CREATE TABLE years_summary (
    first_day DATE NOT NULL,
    hr_avg FLOAT,
    hr_min FLOAT,
    hr_max FLOAT,
    rhr_avg FLOAT,
    rhr_min FLOAT,
    rhr_max FLOAT,
    inactive_hr_avg FLOAT,
    inactive_hr_min FLOAT,
    inactive_hr_max FLOAT,
    weight_avg FLOAT,
    weight_min FLOAT,
    weight_max FLOAT,
    intensity_time TIME NOT NULL,
    moderate_activity_time TIME NOT NULL,
    vigorous_activity_time TIME NOT NULL,
    intensity_time_goal TIME NOT NULL,
    steps INTEGER,
    steps_goal INTEGER,
    floors FLOAT,
    floors_goal FLOAT,
    sleep_avg TIME NOT NULL,
    sleep_min TIME NOT NULL,
    sleep_max TIME NOT NULL,
    rem_sleep_avg TIME NOT NULL,
    rem_sleep_min TIME NOT NULL,
    rem_sleep_max TIME NOT NULL,
    stress_avg INTEGER,
    calories_avg INTEGER,
    calories_bmr_avg INTEGER,
    calories_active_avg INTEGER,
    calories_goal INTEGER,
    calories_consumed_avg INTEGER,
    activities INTEGER,
    activities_calories INTEGER,
    activities_distance INTEGER,
    hydration_goal INTEGER,
    hydration_avg INTEGER,
    hydration_intake INTEGER,
    sweat_loss_avg INTEGER,
    sweat_loss INTEGER,
    spo2_avg FLOAT,
    spo2_min FLOAT,
    rr_waking_avg FLOAT,
    rr_max FLOAT,
    rr_min FLOAT,
    bb_max INTEGER,
    bb_min INTEGER,
    PRIMARY KEY (first_day)
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

Table days_summary {
  day DATE [not null, pk]
  hr_avg FLOAT
  hr_min FLOAT
  hr_max FLOAT
  rhr_avg FLOAT
  rhr_min FLOAT
  rhr_max FLOAT
  inactive_hr_avg FLOAT
  inactive_hr_min FLOAT
  inactive_hr_max FLOAT
  weight_avg FLOAT
  weight_min FLOAT
  weight_max FLOAT
  intensity_time TIME [not null]
  moderate_activity_time TIME [not null]
  vigorous_activity_time TIME [not null]
  intensity_time_goal TIME [not null]
  steps INTEGER
  steps_goal INTEGER
  floors FLOAT
  floors_goal FLOAT
  sleep_avg TIME [not null]
  sleep_min TIME [not null]
  sleep_max TIME [not null]
  rem_sleep_avg TIME [not null]
  rem_sleep_min TIME [not null]
  rem_sleep_max TIME [not null]
  stress_avg INTEGER
  calories_avg INTEGER
  calories_bmr_avg INTEGER
  calories_active_avg INTEGER
  calories_goal INTEGER
  calories_consumed_avg INTEGER
  activities INTEGER
  activities_calories INTEGER
  activities_distance INTEGER
  hydration_goal INTEGER
  hydration_avg INTEGER
  hydration_intake INTEGER
  sweat_loss_avg INTEGER
  sweat_loss INTEGER
  spo2_avg FLOAT
  spo2_min FLOAT
  rr_waking_avg FLOAT
  rr_max FLOAT
  rr_min FLOAT
  bb_max INTEGER
  bb_min INTEGER
}

Table intensity_hr {
  timestamp DATETIME [not null, pk]
  intensity INTEGER [not null]
  heart_rate INTEGER [not null]
}

Table months_summary {
  first_day DATE [not null, pk]
  hr_avg FLOAT
  hr_min FLOAT
  hr_max FLOAT
  rhr_avg FLOAT
  rhr_min FLOAT
  rhr_max FLOAT
  inactive_hr_avg FLOAT
  inactive_hr_min FLOAT
  inactive_hr_max FLOAT
  weight_avg FLOAT
  weight_min FLOAT
  weight_max FLOAT
  intensity_time TIME [not null]
  moderate_activity_time TIME [not null]
  vigorous_activity_time TIME [not null]
  intensity_time_goal TIME [not null]
  steps INTEGER
  steps_goal INTEGER
  floors FLOAT
  floors_goal FLOAT
  sleep_avg TIME [not null]
  sleep_min TIME [not null]
  sleep_max TIME [not null]
  rem_sleep_avg TIME [not null]
  rem_sleep_min TIME [not null]
  rem_sleep_max TIME [not null]
  stress_avg INTEGER
  calories_avg INTEGER
  calories_bmr_avg INTEGER
  calories_active_avg INTEGER
  calories_goal INTEGER
  calories_consumed_avg INTEGER
  activities INTEGER
  activities_calories INTEGER
  activities_distance INTEGER
  hydration_goal INTEGER
  hydration_avg INTEGER
  hydration_intake INTEGER
  sweat_loss_avg INTEGER
  sweat_loss INTEGER
  spo2_avg FLOAT
  spo2_min FLOAT
  rr_waking_avg FLOAT
  rr_max FLOAT
  rr_min FLOAT
  bb_max INTEGER
  bb_min INTEGER
}

Table summary {
  timestamp DATETIME
  key VARCHAR [not null, pk]
  value VARCHAR
}

Table weeks_summary {
  first_day DATE [not null, pk]
  hr_avg FLOAT
  hr_min FLOAT
  hr_max FLOAT
  rhr_avg FLOAT
  rhr_min FLOAT
  rhr_max FLOAT
  inactive_hr_avg FLOAT
  inactive_hr_min FLOAT
  inactive_hr_max FLOAT
  weight_avg FLOAT
  weight_min FLOAT
  weight_max FLOAT
  intensity_time TIME [not null]
  moderate_activity_time TIME [not null]
  vigorous_activity_time TIME [not null]
  intensity_time_goal TIME [not null]
  steps INTEGER
  steps_goal INTEGER
  floors FLOAT
  floors_goal FLOAT
  sleep_avg TIME [not null]
  sleep_min TIME [not null]
  sleep_max TIME [not null]
  rem_sleep_avg TIME [not null]
  rem_sleep_min TIME [not null]
  rem_sleep_max TIME [not null]
  stress_avg INTEGER
  calories_avg INTEGER
  calories_bmr_avg INTEGER
  calories_active_avg INTEGER
  calories_goal INTEGER
  calories_consumed_avg INTEGER
  activities INTEGER
  activities_calories INTEGER
  activities_distance INTEGER
  hydration_goal INTEGER
  hydration_avg INTEGER
  hydration_intake INTEGER
  sweat_loss_avg INTEGER
  sweat_loss INTEGER
  spo2_avg FLOAT
  spo2_min FLOAT
  rr_waking_avg FLOAT
  rr_max FLOAT
  rr_min FLOAT
  bb_max INTEGER
  bb_min INTEGER
}

Table years_summary {
  first_day DATE [not null, pk]
  hr_avg FLOAT
  hr_min FLOAT
  hr_max FLOAT
  rhr_avg FLOAT
  rhr_min FLOAT
  rhr_max FLOAT
  inactive_hr_avg FLOAT
  inactive_hr_min FLOAT
  inactive_hr_max FLOAT
  weight_avg FLOAT
  weight_min FLOAT
  weight_max FLOAT
  intensity_time TIME [not null]
  moderate_activity_time TIME [not null]
  vigorous_activity_time TIME [not null]
  intensity_time_goal TIME [not null]
  steps INTEGER
  steps_goal INTEGER
  floors FLOAT
  floors_goal FLOAT
  sleep_avg TIME [not null]
  sleep_min TIME [not null]
  sleep_max TIME [not null]
  rem_sleep_avg TIME [not null]
  rem_sleep_min TIME [not null]
  rem_sleep_max TIME [not null]
  stress_avg INTEGER
  calories_avg INTEGER
  calories_bmr_avg INTEGER
  calories_active_avg INTEGER
  calories_goal INTEGER
  calories_consumed_avg INTEGER
  activities INTEGER
  activities_calories INTEGER
  activities_distance INTEGER
  hydration_goal INTEGER
  hydration_avg INTEGER
  hydration_intake INTEGER
  sweat_loss_avg INTEGER
  sweat_loss INTEGER
  spo2_avg FLOAT
  spo2_min FLOAT
  rr_waking_avg FLOAT
  rr_max FLOAT
  rr_min FLOAT
  bb_max INTEGER
  bb_min INTEGER
}


*/