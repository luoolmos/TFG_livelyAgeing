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

    //**************CONCEPTS*************
    // 
    SPO2_STRING: 'oxygen saturation in arterial blood by pulse oximetry',
    SPO2_STRING_ABREV: 'SPO2',
    RR_STRING: 'respiration rate',
    HR_STRING: 'heart rate',
    DURATION_STRING: 'duration',
    STRESS_STRING: 'stress',
    SLEEP_DURATION_STRING: 'sleep_duration',
    SLEEP_SCORE_STRING: 'sleep_score',
    SLEEP_AVG_STRESS_STRING: 'sleep_avg_stress',
    SLEEP_AVG_SPO2_STRING: 'sleep_avg_spo2',
    SLEEP_AVG_RR_STRING: 'sleep_avg_rr',
    SLEEP_REM_DURATION_STRING: 'rem sleep duration',
    SLEEP_LIGHT_DURATION_STRING: 'light sleep duration',
    SLEEP_DEEP_DURATION_STRING: 'deep sleep duration',
    SLEEP_AWAKE_DURATION_STRING: 'nighttime awakening duration',
    DISTANCE_STRING: 'distance',
    CALORIES_STRING: 'calories burned',
    HEART_RATE_STRING: 'heart rate', //https://athena.ohdsi.org/search-terms/terms/3027018
    AVG_HR_STRING: 'mean heart rate',   //https://athena.ohdsi.org/search-terms/terms/3966397
    MAX_HR_STRING: 'maximum heart rate', //https://athena.ohdsi.org/search-terms/terms/3966129
    RR_STRING: 'respiratory rate', //https://athena.ohdsi.org/search-terms/terms/4313591
    AVG_RR_STRING: 'mean respiratory rate', //https://athena.ohdsi.org/search-terms/terms/3966397
    MAX_RR_STRING: 'maximum respiratory rate', //https://athena.ohdsi.org/search-terms/terms/3966211
    AVG_SPEED_STRING: 'avg_speed',
    MAX_SPEED_STRING: 'max_speed',
    TEMPERATURE_STRING: 'body temperature', //https://athena.ohdsi.org/search-terms/terms/4302666
    AVG_TEMPERATURE_STRING: 'body temperature', //https://athena.ohdsi.org/search-terms/terms/4302666
    MAX_TEMPERATURE_STRING: 'maximum body temperature', //https://athena.ohdsi.org/search-terms/terms/44809208
    MIN_TEMPERATURE_STRING: 'minimum body temperature', //https://athena.ohdsi.org/search-terms/terms/44813868



    //UNIT
    MINUTE_UCUM: 8550, //https://athena.ohdsi.org/search-terms/terms/8550,
    MINUTE_STRING: 'min',
    HOURS_UCUM: 8505, //https://athena.ohdsi.org/search-terms/terms/1001931,
    HOURS_STRING: 'h',
    BREATHS_PER_MIN: 4117833, //https://athena.ohdsi.org/search-terms/terms/4117833,
    BREATHS_PER_MIN_STRING: 'breaths/min',
    BEATS_PER_MIN: 4118124, //https://athena.ohdsi.org/search-terms/terms/4118124,
    BEATS_PER_MIN_STRING: 'beats/min',
    PERCENT_UCUM: 4190629, //https://athena.ohdsi.org/search-terms/terms/4190629,
    PERCENT_STRING: 'percentage unit',
    METER_STRING: 'm', //9546
    KCAL_STRING: 'kcal', //https://athena.ohdsi.org/search-terms/terms/710194



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
    HEART_RATE_LOINC: 3027018, //https://athena.ohdsi.org/search-terms/terms/3027018    
    //HEART_RATE_SOURCE_LOINC: '9843-3',
    OTHER_CONCEPT_ID: 0, //https://athena.ohdsi.org/search-terms/terms/1585734

};

//*   
//1001786	Calories burned in unspecified time --during activity	Measurement	LOINC	Clinical Observation	S	93819-1	20191213	20991231	
//1002138	Calories burned in unspecified time --during weight training	Measurement	LOINC	Clinical Observation	S	93820-9	20191213	20991231	
//1001889	Calories burned in unspecified time --during aerobic activity	Measurement	LOINC	Clinical Observation	S	93821-7	20191213	20991231	
//1001869	Calories burned in unspecified time --while playing a sport	Measurement	LOINC	Clinical Observation	S	93822-5	20191213	20991231	
//3022228	Coproporphyrin [Mass/time] in unspecified time Stool	Measurement	LOINC	Lab Test	S	9382-3	19700101	20991231	
//1002084	Calories burned in unspecified time --during swimming	Measurement	LOINC	Clinical Observation	S	93823-3	20191213	20991231	
//1002435	Calories burned in unspecified time --during cycling	Measurement	LOINC	Clinical Observation	S	93824-1	20191213	20991231	
//1002444	Calories burned in unspecified time --during running	Measurement	LOINC	Clinical Observation	S	93825-8	20191213	20991231	*/
//1001731	Calories burned in unspecified time --during walking */