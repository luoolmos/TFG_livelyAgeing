// src/constants.ts

export const SAMSUNG_TYPE = 'Samsung';
export const GARMIN_TYPE = 'Garmin';
export const SAMSUNG_GALAXY_WATCH_4 = 'Galaxy Watch 4';
export const SAMSUNG_SERIAL = 'RFAX21EF9JE';
export const GARMIN_FORERUNNER_255 = 'Forerunner 255';

// Concepts
export const SPO2_STRING = 'oxygen saturation in arterial blood by pulse oximetry';
export const SPO2_STRING_ABREV = 'SPO2';
export const HR_STRING = 'heart rate';
export const DURATION_STRING = 'duration';
export const STRESS_STRING = 'stress';
export const SLEEP_DURATION_STRING = 'sleep duration';
export const SLEEP_SCORE_STRING = 'sleep score';
export const SLEEP_AVG_STRESS_STRING = 'stress level';
export const SLEEP_REM_DURATION_STRING = 'rem sleep duration';
export const SLEEP_LIGHT_DURATION_STRING = 'light sleep duration';
export const SLEEP_DEEP_DURATION_STRING = 'deep sleep duration';
export const SLEEP_AWAKE_DURATION_STRING = 'nighttime awakening duration';
export const DISTANCE_STRING = 'distance';
export const CALORIES_STRING = 'calories burned';
export const HEART_RATE_STRING = 'heart rate';
export const AVG_HR_STRING = 'mean heart rate';
export const MAX_HR_STRING = 'maximum heart rate';
export const RR_STRING = 'respiratory rate';
export const AVG_RR_STRING = 'mean respiratory rate';
export const MAX_RR_STRING = 'maximum respiratory rate';
export const AVG_SPEED_STRING = 'avg_speed';
export const MAX_SPEED_STRING = 'max_speed';
export const TEMPERATURE_STRING = 'body temperature';
export const AVG_TEMPERATURE_STRING = 'body temperature';
export const MAX_TEMPERATURE_STRING = 'maximum body temperature';
export const MIN_TEMPERATURE_STRING = 'minimum body temperature';
export const STEPS_STRING = 'number of steps in unspecified time pedometer';
export const STEPS_STRING_ABREV = 'steps';

// Units
export const MINUTE_UCUM = 8550;
export const MINUTE_STRING = 'min';
export const HOURS_UCUM = 8505;
export const HOURS_STRING = 'h';
export const BREATHS_PER_MIN = 4117833;
export const BREATHS_PER_MIN_STRING = 'breaths/min';
export const BEATS_PER_MIN = 4118124;
export const BEATS_PER_MIN_STRING = 'beats/min';
export const PERCENT_UCUM = 4190629;
export const PERCENT_STRING = 'percentage unit';
export const METER_STRING = 'meter';
export const KCAL_STRING = 'kcal';
export const CELSIUS_STRING = 'degree celsius';

// Types
export const DURING_SLEEP_SNOMED = 4206153;

// Source
export const WEARABLE_SOURCE = 0;

// Observations & Concept IDs
export const TYPE_CONCEPT_ID = 705183;
export const DEEP_SLEEP_DURATION_LOINC = 1001932;
export const LIGHT_SLEEP_DURATION_LOINC = 1001771;
export const REM_SLEEP_DURATION_LOINC = 1001480;
export const AWAKE_DURATION_LOINC = 1001952;
export const DEFAULT_OBSERVATION_CONCEPT_ID = 0;
export const SLEEP_DURATION_LOINC = 1002368;
export const SLEEP_SCORE_LOINC = 1617234;
export const RESPIRATORY_RATE_LOINC = 3024171;
export const SPO2_LOINC = 40762499;
export const SLEEP_AVG_STRESS_LOINC = 36031524;
export const RESPIRATION_RATE_LOINC = 1031770;
export const HEART_RATE_LOINC = 3027018;

export const CONCEPT_IDS = {
  HEART_RATE: 3027018,
  RESPIRATORY_RATE: 3024171,
  SPO2: 40762499,
  SLEEP_DURATION: 1002368,
  // ...agrega aquí los que más uses
};
