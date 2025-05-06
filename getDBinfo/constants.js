// constants.js

//  * Recupera los datos de sueño desde PostgreSQL
module.exports = {
    //**************CONSTANTS**************
    SAMSUNG_TYPE: 'Samsung',
    GARMIN_TYPE: 'Garmin',
    SAMSUNG_GALAXY_WATCH_4: 'Galaxy Watch 4',
    SAMSUNG_SERIAL: 'RFAX21EF9JE',
    GARMIN_FORERUNNER_255: 'Forerunner 255',

    //**************PATHS**************
    SQLLITE_PATH_GARMIN: 'c:/Users/1308l/HealthData/DBs/garmin.db',
    SQLLITE_PATH_GARMIN_ACTIVITIES: 'c:/Users/1308l/HealthData/DBs/garmin_activities.db',
    SQLLITE_PATH_GARMIN_MONITORING: 'c:/Users/1308l/HealthData/DBs/garmin_monitoring.db',
    SQLLITE_PATH_GARMIN_SUMMARY: 'c:/Users/1308l/HealthData/DBs/garmin_summary.db',
    SQLLITE_PATH_SUMMARY: 'c:/Users/1308l/HealthData/DBs/summary.db',
    GARMIN_FORERUNNER_255: 'GarminForerunner255',
    GARMIN_VENU_SQ2: 'Venu Sq2',

    //**************CONCEPTS**************

    //UNIT
    MINUTE_UCUM: 1001932, //https://athena.ohdsi.org/search-terms/terms/1001932,
    MINUTE_STRING: 'min',
    HOURS_UCUM: 8505, //https://athena.ohdsi.org/search-terms/terms/1001931,
    HOURS_STRING: 'h',
    BREATHS_PER_MIN: 4117833, //https://athena.ohdsi.org/search-terms/terms/4117833,
    BREATHS_PER_MIN_STRING: 'bpm',

    //TYPE  
    DURING_SLEEP_SNOMED: 4206153, //https://athena.ohdsi.org/search-terms/terms/4206153

    //SOURCE
    WEARABLE_SOURCE: 0,

    //OBSERVATION
    TYPE_CONCEPT_ID: 705183, //https://athena.ohdsi.org/search-terms/terms/705183
    DEEP_SLEEP_DURATION_LOINC: 1001932, //https://athena.ohdsi.org/search-terms/terms/1001932
    //DEEP_SLEEP_DURATION_SOURCE_LOINC: '93831-6',
    LIGHT_SLEEP_DURATION_LOINC: 1001771, //https://athena.ohdsi.org/search-terms/terms/1001771
    //LIGHT_SLEEP_DURATION_SOURCE_LOINC: '93830-8',
    REM_SLEEP_DURATION_LOINC: 1001480, // https://athena.ohdsi.org/search-terms/terms/1001480
    //REM_SLEEP_DURATION_SOURCE_LOINC: '93829-0',
    AWAKE_DURATION_LOINC: 1001952, //https://athena.ohdsi.org/search-terms/terms/1001952
    //AWAKE_DURATION_SOURCE_LOINC: '93828-2',
    DEFAULT_OBSERVATION_CONCEPT_ID: 0, // Valor por defecto si no se encuentra el evento
    SLEEP_DURATION_LOINC: 1002368, //https://athena.ohdsi.org/search-terms/terms/1002368
    //SLEEP_DURATION_SOURCE_LOINC: '93832-4',
    SLEEP_SCORE_LOINC: 1617234, //https://athena.ohdsi.org/search-terms/terms/1617234
    //SLEEP_SCORE_SOURCE_LOINC: '93832-4',
    RESPIRATORY_RATE_LOINC:  3024171, //https://athena.ohdsi.org/search-terms/terms/3024171
    //RESPIRATORY_RATE_SOURCE_LOINC: '9279-1',
    SPO2_LOINC: 40762499, //https://athena.ohdsi.org/search-terms/terms/40762499
    //SPO2_SOURCE_LOINC: '59408-5',
    SLEEP_AVG_STRESS_LOINC: 36031524, //https://athena.ohdsi.org/search-terms/terms/36031524
    //SLEEP_AVG_STRESS_SOURCE_LOINC: '36031524',
    RESPIRATION_RATE_LOINC: 1031770, //https://athena.ohdsi.org/search-terms/terms/1031770
    //RESPIRATION_RATE_SOURCE_LOINC: 'LP74299-6',


};