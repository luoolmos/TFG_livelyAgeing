/* GARMIN MONITORING DB TABLE*/

CREATE TABLE _attributes (
    timestamp DATETIME,
    "key" VARCHAR NOT NULL,
    value VARCHAR,
    PRIMARY KEY ("key")
);

CREATE TABLE monitoring (
    timestamp DATETIME NOT NULL,
    activity_type VARCHAR(17) NOT NULL,
    intensity INTEGER,
    duration TIME NOT NULL,
    distance FLOAT,
    cum_active_time TIME NOT NULL,
    active_calories INTEGER,
    steps INTEGER,
    strokes INTEGER,
    cycles FLOAT,
    PRIMARY KEY (timestamp, activity_type)
);

CREATE TABLE monitoring_climb (
    timestamp DATETIME NOT NULL,
    ascent FLOAT,
    descent FLOAT,
    cum_ascent FLOAT,
    cum_descent FLOAT,
    PRIMARY KEY (timestamp),
    UNIQUE (timestamp, ascent, descent, cum_ascent, cum_descent)
);

CREATE TABLE monitoring_hr (
    timestamp DATETIME NOT NULL,
    heart_rate INTEGER NOT NULL,
    PRIMARY KEY (timestamp)
);

CREATE TABLE monitoring_info (
    timestamp DATETIME NOT NULL,
    file_id INTEGER NOT NULL,
    activity_type VARCHAR(17) NOT NULL,
    resting_metabolic_rate INTEGER,
    cycles_to_distance FLOAT,
    cycles_to_calories FLOAT,
    PRIMARY KEY (timestamp, activity_type)
);

CREATE TABLE monitoring_intensity (
    timestamp DATETIME NOT NULL,
    moderate_activity_time TIME NOT NULL,
    vigorous_activity_time TIME NOT NULL,
    PRIMARY KEY (timestamp),
    UNIQUE (timestamp, moderate_activity_time, vigorous_activity_time)
);

CREATE TABLE monitoring_pulse_ox (
    timestamp DATETIME NOT NULL,
    pulse_ox FLOAT NOT NULL,
    PRIMARY KEY (timestamp)
);

CREATE TABLE monitoring_rr (
    timestamp DATETIME NOT NULL,
    rr FLOAT NOT NULL,
    PRIMARY KEY (timestamp)
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

Table monitoring {
  timestamp DATETIME [not null]
  activity_type VARCHAR(17) [not null]
  intensity INTEGER
  duration TIME [not null]
  distance FLOAT
  cum_active_time TIME [not null]
  active_calories INTEGER
  steps INTEGER
  strokes INTEGER
  cycles FLOAT

  Primary Key (timestamp, activity_type)
}

Table monitoring_climb {
  timestamp DATETIME [not null, pk]
  ascent FLOAT
  descent FLOAT
  cum_ascent FLOAT
  cum_descent FLOAT

  Note: "UNIQUE(timestamp, ascent, descent, cum_ascent, cum_descent)"
}

Table monitoring_hr {
  timestamp DATETIME [not null, pk]
  heart_rate INTEGER [not null]
}

Table monitoring_info {
  timestamp DATETIME [not null]
  file_id INTEGER [not null]
  activity_type VARCHAR(17) [not null]
  resting_metabolic_rate INTEGER
  cycles_to_distance FLOAT
  cycles_to_calories FLOAT

  Primary Key (timestamp, activity_type)
}

Table monitoring_intensity {
  timestamp DATETIME [not null, pk]
  moderate_activity_time TIME [not null]
  vigorous_activity_time TIME [not null]

  Note: "UNIQUE(timestamp, moderate_activity_time, vigorous_activity_time)"
}

Table monitoring_pulse_ox {
  timestamp DATETIME [not null, pk]
  pulse_ox FLOAT [not null]
}

Table monitoring_rr {
  timestamp DATETIME [not null, pk]
  rr FLOAT [not null]
}

*/