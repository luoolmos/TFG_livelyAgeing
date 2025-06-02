--DO
--$$
--DECLARE
--    r RECORD;
--BEGIN
--    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'omop_cdm') LOOP
--        EXECUTE 'DROP TABLE omop_cdm.' || quote_ident(r.tablename) || ' CASCADE';
--    END LOOP;
--END
--$$;
--
DO
$$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'custom') LOOP
        EXECUTE 'DROP TABLE custom.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END
$$;


CREATE SCHEMA omop_cdm;  
-- https://github.com/OHDSI/CommonDataModel/blob/v5.4.0/inst/ddl/5.4/postgresql/OMOPCDM_postgresql_5.4_ddl.sql
CREATE SCHEMA custom;    
CREATE EXTENSION IF NOT EXISTS timescaledb;

--  OMOP: concept 
CREATE TABLE omop_cdm.concept (
    concept_id          INTEGER PRIMARY KEY,
    concept_name        VARCHAR(255),
    domain_id           VARCHAR(50),
    vocabulary_id       VARCHAR(20),
    concept_class_id    VARCHAR(50),
    standard_concept    VARCHAR(1),
    concept_code        VARCHAR(50),
    valid_start_date    DATE,
    valid_end_date      DATE,
    invalid_reason      VARCHAR(1)
);

CREATE TABLE omop_cdm.vocabulary (
	vocabulary_id           varchar(20) NOT NULL,
    vocabulary_name         varchar(255) NOT NULL,
    vocabulary_reference    varchar(255) NULL,
    vocabulary_version      varchar(255) NULL,
    vocabulary_concept_id   integer NOT NULL 
);

CREATE TABLE omop_cdm.domain (
    domain_id           varchar(20) NOT NULL,
	domain_name         varchar(255) NOT NULL,
	domain_concept_id   integer NOT NULL
);

CREATE TABLE omop_cdm.concept_class (
    concept_class_id           varchar(20) NOT NULL,
	concept_class_name         varchar(255) NOT NULL,
	concept_class_concept_id   integer NOT NULL
);

CREATE TABLE omop_cdm.concept_relationship (
    concept_id_1        integer NOT NULL,
	concept_id_2        integer NOT NULL,
	relationship_id     varchar(20) NOT NULL,
	valid_start_date    date NOT NULL,
	valid_end_date      date NOT NULL,
	invalid_reason      varchar(1) NULL 
);

CREATE TABLE omop_cdm.relationship (
    relationship_id             varchar(20) NOT NULL,
	relationship_name           varchar(255) NOT NULL,
    is_hierarchical             varchar(1) NOT NULL,
    defines_ancestry            varchar(1) NOT NULL,
    reverse_relationship_id     varchar(20) NOT NULL,
    relationship_concept_id     integer NOT NULL
);

CREATE TABLE omop_cdm.concept_synonym (
    concept_id              integer NOT NULL,
    concept_synonym_name    varchar(1000) NOT NULL,
    language_concept_id     integer NOT NULL 
);

CREATE TABLE omop_cdm.concept_ancestor (
    ancestor_concept_id         integer NOT NULL,
    descendant_concept_id       integer NOT NULL,
    min_levels_of_separation    integer NOT NULL,
    max_levels_of_separation    integer NOT NULL 
);

CREATE TABLE omop_cdm.SOURCE_TO_CONCEPT_MAP (
    source_code                 varchar(50) NOT NULL,
    source_concept_id           integer NOT NULL,
    source_vocabulary_id        varchar(20) NOT NULL,
    source_code_description     varchar(255) NULL,
    target_concept_id           integer NOT NULL,
    target_vocabulary_id        varchar(20) NOT NULL,
    valid_start_date            date NOT NULL,
    valid_end_date              date NOT NULL,
    invalid_reason              varchar(1) NULL
);

CREATE TABLE omop_cdm.DRUG_STRENGTH (
    drug_concept_id integer NOT NULL,
    ingredient_concept_id integer NOT NULL,
    amount_value NUMERIC NULL,
    amount_unit_concept_id integer NULL,
    numerator_value NUMERIC NULL,
    numerator_unit_concept_id integer NULL,
    denominator_value NUMERIC NULL,
    denominator_unit_concept_id integer NULL,
    box_size integer NULL,
    valid_start_date date NOT NULL,
    valid_end_date date NOT NULL,
    invalid_reason varchar(1) NULL 
);

CREATE TABLE omop_cdm.COHORT (
    cohort_definition_id    integer NOT NULL,
    subject_id              integer NOT NULL,
    cohort_start_date       date NOT NULL,
    cohort_end_date         date NOT NULL 
);

CREATE TABLE omop_cdm.COHORT_DEFINITION (
    cohort_definition_id            integer NOT NULL,
    cohort_definition_name          varchar(255) NOT NULL,
    cohort_definition_description   TEXT NULL,
    definition_type_concept_id      integer NOT NULL,
    cohort_definition_syntax        TEXT NULL,
    subject_concept_id              integer NOT NULL,
    cohort_initiation_date          date NULL
);

CREATE TABLE omop_cdm.OBSERVATION_PERIOD (
			observation_period_id integer NOT NULL,
			person_id integer NOT NULL,
			observation_period_start_date date NOT NULL,
			observation_period_end_date date NOT NULL,
			period_type_concept_id integer NOT NULL );

CREATE TABLE omop_cdm.VISIT_OCCURRENCE (
			visit_occurrence_id integer NOT NULL,
			person_id integer NOT NULL,
			visit_concept_id integer NOT NULL,
			visit_start_date date NOT NULL,
			visit_start_datetime TIMESTAMP NULL,
			visit_end_date date NOT NULL,
			visit_end_datetime TIMESTAMP NULL,
			visit_type_concept_id Integer NOT NULL,
			provider_id integer NULL,
			care_site_id integer NULL,
			visit_source_value varchar(50) NULL,
			visit_source_concept_id integer NULL,
			admitted_from_concept_id integer NULL,
			admitted_from_source_value varchar(50) NULL,
			discharged_to_concept_id integer NULL,
			discharged_to_source_value varchar(50) NULL,
			preceding_visit_occurrence_id integer NULL );

CREATE TABLE omop_cdm.VISIT_DETAIL (
			visit_detail_id integer NOT NULL,
			person_id integer NOT NULL,
			visit_detail_concept_id integer NOT NULL,
			visit_detail_start_date date NOT NULL,
			visit_detail_start_datetime TIMESTAMP NULL,
			visit_detail_end_date date NOT NULL,
			visit_detail_end_datetime TIMESTAMP NULL,
			visit_detail_type_concept_id integer NOT NULL,
			provider_id integer NULL,
			care_site_id integer NULL,
			visit_detail_source_value varchar(50) NULL,
			visit_detail_source_concept_id Integer NULL,
			admitted_from_concept_id Integer NULL,
			admitted_from_source_value varchar(50) NULL,
			discharged_to_source_value varchar(50) NULL,
			discharged_to_concept_id integer NULL,
			preceding_visit_detail_id integer NULL,
			parent_visit_detail_id integer NULL,
			visit_occurrence_id integer NOT NULL );

CREATE TABLE omop_cdm.CONDITION_OCCURRENCE (
			condition_occurrence_id integer NOT NULL,
			person_id integer NOT NULL,
			condition_concept_id integer NOT NULL,
			condition_start_date date NOT NULL,
			condition_start_datetime TIMESTAMP NULL,
			condition_end_date date NULL,
			condition_end_datetime TIMESTAMP NULL,
			condition_type_concept_id integer NOT NULL,
			condition_status_concept_id integer NULL,
			stop_reason varchar(20) NULL,
			provider_id integer NULL,
			visit_occurrence_id integer NULL,
			visit_detail_id integer NULL,
			condition_source_value varchar(50) NULL,
			condition_source_concept_id integer NULL,
			condition_status_source_value varchar(50) NULL );

CREATE TABLE omop_cdm.DRUG_EXPOSURE (
			drug_exposure_id integer NOT NULL,
			person_id integer NOT NULL,
			drug_concept_id integer NOT NULL,
			drug_exposure_start_date date NOT NULL,
			drug_exposure_start_datetime TIMESTAMP NULL,
			drug_exposure_end_date date NOT NULL,
			drug_exposure_end_datetime TIMESTAMP NULL,
			verbatim_end_date date NULL,
			drug_type_concept_id integer NOT NULL,
			stop_reason varchar(20) NULL,
			refills integer NULL,
			quantity NUMERIC NULL,
			days_supply integer NULL,
			sig TEXT NULL,
			route_concept_id integer NULL,
			lot_number varchar(50) NULL,
			provider_id integer NULL,
			visit_occurrence_id integer NULL,
			visit_detail_id integer NULL,
			drug_source_value varchar(50) NULL,
			drug_source_concept_id integer NULL,
			route_source_value varchar(50) NULL,
			dose_unit_source_value varchar(50) NULL );

CREATE TABLE omop_cdm.PROCEDURE_OCCURRENCE (
			procedure_occurrence_id integer NOT NULL,
			person_id integer NOT NULL,
			procedure_concept_id integer NOT NULL,
			procedure_date date NOT NULL,
			procedure_datetime TIMESTAMP NULL,
			procedure_end_date date NULL,
			procedure_end_datetime TIMESTAMP NULL,
			procedure_type_concept_id integer NOT NULL,
			modifier_concept_id integer NULL,
			quantity integer NULL,
			provider_id integer NULL,
			visit_occurrence_id integer NULL,
			visit_detail_id integer NULL,
			procedure_source_value varchar(50) NULL,
			procedure_source_concept_id integer NULL,
			modifier_source_value varchar(50) NULL );

--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.DEVICE_EXPOSURE (
			device_exposure_id integer NOT NULL,
			person_id integer NOT NULL,
			device_concept_id integer NOT NULL,
			device_exposure_start_date date NOT NULL,
			device_exposure_start_datetime TIMESTAMP NULL,
			device_exposure_end_date date NULL,
			device_exposure_end_datetime TIMESTAMP NULL,
			device_type_concept_id integer NOT NULL,
			unique_device_id varchar(255) NULL,
			production_id varchar(255) NULL,
			quantity integer NULL,
			provider_id integer NULL,
			visit_occurrence_id integer NULL,
			visit_detail_id integer NULL,
			device_source_value varchar(50) NULL,
			device_source_concept_id integer NULL,
			unit_concept_id integer NULL,
			unit_source_value varchar(50) NULL,
			unit_source_concept_id integer NULL );


--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.DEATH (
			person_id integer NOT NULL,
			death_date date NOT NULL,
			death_datetime TIMESTAMP NULL,
			death_type_concept_id integer NULL,
			cause_concept_id integer NULL,
			cause_source_value varchar(50) NULL,
			cause_source_concept_id integer NULL );

--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.NOTE (
			note_id integer NOT NULL,
			person_id integer NOT NULL,
			note_date date NOT NULL,
			note_datetime TIMESTAMP NULL,
			note_type_concept_id integer NOT NULL,
			note_class_concept_id integer NOT NULL,
			note_title varchar(250) NULL,
			note_text TEXT NOT NULL,
			encoding_concept_id integer NOT NULL,
			language_concept_id integer NOT NULL,
			provider_id integer NULL,
			visit_occurrence_id integer NULL,
			visit_detail_id integer NULL,
			note_source_value varchar(50) NULL,
			note_event_id bigint NULL,
			note_event_field_concept_id integer NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.NOTE_NLP (
			note_nlp_id integer NOT NULL,
			note_id integer NOT NULL,
			section_concept_id integer NULL,
			snippet varchar(250) NULL,
			"offset" varchar(50) NULL,
			lexical_variant varchar(250) NOT NULL,
			note_nlp_concept_id integer NULL,
			note_nlp_source_concept_id integer NULL,
			nlp_system varchar(250) NULL,
			nlp_date date NOT NULL,
			nlp_datetime TIMESTAMP NULL,
			term_exists varchar(1) NULL,
			term_temporal varchar(50) NULL,
			term_modifiers varchar(2000) NULL );

--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.SPECIMEN (
			specimen_id integer NOT NULL,
			person_id integer NOT NULL,
			specimen_concept_id integer NOT NULL,
			specimen_type_concept_id integer NOT NULL,
			specimen_date date NOT NULL,
			specimen_datetime TIMESTAMP NULL,
			quantity NUMERIC NULL,
			unit_concept_id integer NULL,
			anatomic_site_concept_id integer NULL,
			disease_status_concept_id integer NULL,
			specimen_source_id varchar(50) NULL,
			specimen_source_value varchar(50) NULL,
			unit_source_value varchar(50) NULL,
			anatomic_site_source_value varchar(50) NULL,
			disease_status_source_value varchar(50) NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.FACT_RELATIONSHIP (
			domain_concept_id_1 integer NOT NULL,
			fact_id_1 integer NOT NULL,
			domain_concept_id_2 integer NOT NULL,
			fact_id_2 integer NOT NULL,
			relationship_concept_id integer NOT NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.LOCATION (
			location_id integer NOT NULL,
			address_1 varchar(50) NULL,
			address_2 varchar(50) NULL,
			city varchar(50) NULL,
			state varchar(2) NULL,
			zip varchar(9) NULL,
			county varchar(20) NULL,
			location_source_value varchar(50) NULL,
			country_concept_id integer NULL,
			country_source_value varchar(80) NULL,
			latitude NUMERIC NULL,
			longitude NUMERIC NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.CARE_SITE (
			care_site_id integer NOT NULL,
			care_site_name varchar(255) NULL,
			place_of_service_concept_id integer NULL,
			location_id integer NULL,
			care_site_source_value varchar(50) NULL,
			place_of_service_source_value varchar(50) NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.PROVIDER (
			provider_id integer NOT NULL,
			provider_name varchar(255) NULL,
			npi varchar(20) NULL,
			dea varchar(20) NULL,
			specialty_concept_id integer NULL,
			care_site_id integer NULL,
			year_of_birth integer NULL,
			gender_concept_id integer NULL,
			provider_source_value varchar(50) NULL,
			specialty_source_value varchar(50) NULL,
			specialty_source_concept_id integer NULL,
			gender_source_value varchar(50) NULL,
			gender_source_concept_id integer NULL );

--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.PAYER_PLAN_PERIOD (
			payer_plan_period_id integer NOT NULL,
			person_id integer NOT NULL,
			payer_plan_period_start_date date NOT NULL,
			payer_plan_period_end_date date NOT NULL,
			payer_concept_id integer NULL,
			payer_source_value varchar(50) NULL,
			payer_source_concept_id integer NULL,
			plan_concept_id integer NULL,
			plan_source_value varchar(50) NULL,
			plan_source_concept_id integer NULL,
			sponsor_concept_id integer NULL,
			sponsor_source_value varchar(50) NULL,
			sponsor_source_concept_id integer NULL,
			family_source_value varchar(50) NULL,
			stop_reason_concept_id integer NULL,
			stop_reason_source_value varchar(50) NULL,
			stop_reason_source_concept_id integer NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.COST (
			cost_id integer NOT NULL,
			cost_event_id integer NOT NULL,
			cost_domain_id varchar(20) NOT NULL,
			cost_type_concept_id integer NOT NULL,
			currency_concept_id integer NULL,
			total_charge NUMERIC NULL,
			total_cost NUMERIC NULL,
			total_paid NUMERIC NULL,
			paid_by_payer NUMERIC NULL,
			paid_by_patient NUMERIC NULL,
			paid_patient_copay NUMERIC NULL,
			paid_patient_coinsurance NUMERIC NULL,
			paid_patient_deductible NUMERIC NULL,
			paid_by_primary NUMERIC NULL,
			paid_ingredient_cost NUMERIC NULL,
			paid_dispensing_fee NUMERIC NULL,
			payer_plan_period_id integer NULL,
			amount_allowed NUMERIC NULL,
			revenue_code_concept_id integer NULL,
			revenue_code_source_value varchar(50) NULL,
			drg_concept_id integer NULL,
			drg_source_value varchar(3) NULL );

--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.DRUG_ERA (
			drug_era_id integer NOT NULL,
			person_id integer NOT NULL,
			drug_concept_id integer NOT NULL,
			drug_era_start_date TIMESTAMP NOT NULL,
			drug_era_end_date TIMESTAMP NOT NULL,
			drug_exposure_count integer NULL,
			gap_days integer NULL );

--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.DOSE_ERA (
			dose_era_id integer NOT NULL,
			person_id integer NOT NULL,
			drug_concept_id integer NOT NULL,
			unit_concept_id integer NOT NULL,
			dose_value NUMERIC NOT NULL,
			dose_era_start_date TIMESTAMP NOT NULL,
			dose_era_end_date TIMESTAMP NOT NULL );

--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.CONDITION_ERA (
			condition_era_id integer NOT NULL,
			person_id integer NOT NULL,
			condition_concept_id integer NOT NULL,
			condition_era_start_date TIMESTAMP NOT NULL,
			condition_era_end_date TIMESTAMP NOT NULL,
			condition_occurrence_count integer NULL );

--HINT DISTRIBUTE ON KEY (person_id)
CREATE TABLE omop_cdm.EPISODE (
			episode_id bigint NOT NULL,
			person_id bigint NOT NULL,
			episode_concept_id integer NOT NULL,
			episode_start_date date NOT NULL,
			episode_start_datetime TIMESTAMP NULL,
			episode_end_date date NULL,
			episode_end_datetime TIMESTAMP NULL,
			episode_parent_id bigint NULL,
			episode_number integer NULL,
			episode_object_concept_id integer NOT NULL,
			episode_type_concept_id integer NOT NULL,
			episode_source_value varchar(50) NULL,
			episode_source_concept_id integer NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.EPISODE_EVENT (
			episode_id bigint NOT NULL,
			event_id bigint NOT NULL,
			episode_event_field_concept_id integer NOT NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.METADATA (
			metadata_id integer NOT NULL,
			metadata_concept_id integer NOT NULL,
			metadata_type_concept_id integer NOT NULL,
			name varchar(250) NOT NULL,
			value_as_string varchar(250) NULL,
			value_as_concept_id integer NULL,
			value_as_number NUMERIC NULL,
			metadata_date date NULL,
			metadata_datetime TIMESTAMP NULL );

--HINT DISTRIBUTE ON RANDOM
CREATE TABLE omop_cdm.CDM_SOURCE (
			cdm_source_name varchar(255) NOT NULL,
			cdm_source_abbreviation varchar(25) NOT NULL,
			cdm_holder varchar(255) NOT NULL,
			source_description TEXT NULL,
			source_documentation_reference varchar(255) NULL,
			cdm_etl_reference varchar(255) NULL,
			source_release_date date NOT NULL,
			cdm_release_date date NOT NULL,
			cdm_version varchar(10) NULL,
			cdm_version_concept_id integer NOT NULL,
			vocabulary_version varchar(20) NOT NULL );


/** * **Campos:**
        * `person_id`: Clave primaria, identificador único de cada persona. (OMOP)
        * `gender_concept_id`: Identificador del concepto de género, referenciando la tabla `concept`. (OMOP)
        * `year_of_birth`, `month_of_birth`, `day_of_birth`: Información de la fecha de nacimiento. (OMOP)
        * `birth_datetime`: Fecha y hora de nacimiento. (OMOP)
*/ -- Tabla OMOP: person
CREATE TABLE omop_cdm.person (
    person_id                       SERIAL PRIMARY KEY,
    gender_concept_id               integer NOT NULL,
    year_of_birth                   integer NOT NULL,
    month_of_birth                  integer NULL,
    day_of_birth                    integer NULL,
    birth_datetime                  TIMESTAMP NULL,
    race_concept_id                 integer NOT NULL,
    ethnicity_concept_id            integer NOT NULL,
    location_id                     integer NULL,
    provider_id                     integer NULL,
    care_site_id                    integer NULL,
    person_source_value             varchar(50) NULL,
    gender_source_value             varchar(50) NULL,
    gender_source_concept_id        integer NULL,
    race_source_value               varchar(50) NULL,
    race_source_concept_id          integer NULL,
    ethnicity_source_value          varchar(50) NULL,
    ethnicity_source_concept_id     integer NULL
);

ALTER TABLE omop_cdm.person ALTER COLUMN person_id SET DEFAULT nextval('omop_cdm.person_id_seq');
CREATE SEQUENCE IF NOT EXISTS omop_cdm.person_id_seq;

-- TABLA: person
CREATE TABLE custom.person_info (
    person_id   INTEGER REFERENCES omop_cdm.person(person_id) ON DELETE CASCADE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    profile     JSONB, 
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
); 


-- Tabla de dispositivos unificada
CREATE TABLE custom.device (
    device_id UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number       VARCHAR,
    manufacturer        VARCHAR(50) NOT NULL,
    model               VARCHAR(100) NOT NULL,
    token               TEXT UNIQUE,
    first_use_date      TIMESTAMPTZ DEFAULT NOW()
);

-- Relación usuario-dispositivo
CREATE TABLE custom.user_device (
    user_device_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             INTEGER NOT NULL REFERENCES omop_cdm.person(person_id) ON DELETE CASCADE,
    device_id           UUID NOT NULL REFERENCES custom.device(device_id) ON DELETE CASCADE,
    start_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date            TIMESTAMPTZ,
    last_sync_date      TIMESTAMPTZ,
    UNIQUE (user_id, device_id, start_date),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date)
);

--  OMOP: measurement
CREATE TABLE omop_cdm.measurement (
    measurement_id                  SERIAL PRIMARY KEY,
    person_id                       INTEGER, 
    measurement_concept_id          INTEGER,    -- 3027018 (Frecuencia cardiaca), 3038553  (Presión arterial sistólica)
    measurement_date                DATE,
    measurement_datetime            TIMESTAMP,
    measurement_type_concept_id     INTEGER,    -- 44818701 (Prueba de laboratorio), 45754907 (Medición clínica), 32856 (Dispositivo wearable)
    operator_concept_id             integer NULL,
    value_as_number                 FLOAT,
    value_as_concept_id             INTEGER,    -- 4127785 (Normal), 4124457 (Positivo)
    unit_concept_id                 INTEGER,    -- 32064 (latidos por minuto), 8817 (mmHg)
    range_low                       FLOAT,
    range_high                      FLOAT,
    provider_id                     integer NULL,
	visit_occurrence_id             integer NULL,
	visit_detail_id                 integer NULL,
    measurement_source_value        VARCHAR(50), -- "8867-4" en LOINC
    measurement_source_concept_id   INTEGER,     -- Concepto no estandarizado si no existe mapeo.
    unit_source_value               VARCHAR(50), -- "bpm", "mg/dL"
    unit_source_concept_id          integer NULL,
    value_source_value              VARCHAR(50),  -- Valor original no procesado "72 bpm"
    measurement_event_id            bigint NULL,
	meas_event_field_concept_id     integer NULL

);
CREATE UNIQUE INDEX idx_measurement_unique
ON omop_cdm.measurement (measurement_id, measurement_datetime);

-- Crear la tabla como hypertable
SELECT create_hypertable(
   'omop_cdm.measurement',
   'measurement_datetime',
   partitioning_column => 'person_id',
   number_partitions => 100
)


--  OMOP: observation 
    CREATE TABLE omop_cdm.observation (
        observation_id                      SERIAL NOT NULL,
		person_id                           integer NOT NULL,
		observation_concept_id              integer NOT NULL,
		observation_date                    date NOT NULL,
		observation_datetime                TIMESTAMP NULL,
		observation_type_concept_id         integer NOT NULL,
		value_as_number                     NUMERIC NULL,
		value_as_string                     varchar(60) NULL,
		value_as_concept_id                 Integer NULL,
		qualifier_concept_id                integer NULL,
		unit_concept_id                     integer NULL,
		provider_id                         integer NULL,
		visit_occurrence_id                 integer NULL,
		visit_detail_id                     integer NULL,
		observation_source_value            varchar(50) NULL,
		observation_source_concept_id       integer NULL,
		unit_source_value                   varchar(50) NULL,
		qualifier_source_value              varchar(50) NULL,
		value_source_value                  varchar(50) NULL,
		observation_event_id                bigint NULL,
		obs_event_field_concept_id          integer NULL
    );
CREATE UNIQUE INDEX idx_observation_unique
ON omop_cdm.observation (observation_id, observation_datetime);

-- Crear la tabla como hypertable
SELECT create_hypertable(
   'omop_cdm.observation',
   'observation_datetime',
   partitioning_column => 'person_id',
   number_partitions => 100
)

/*hr_min, hr_max, rhr_avg, steps, rr_max, rr_min, spo2_avg, sleep_avg*/
-- TABLA: daily_summary
CREATE TABLE custom.daily_summary (
    date                    DATE NOT NULL,
    person_id               INTEGER NOT NULL REFERENCES omop_cdm.person(person_id) ON DELETE CASCADE,
    steps                   INTEGER CHECK (steps >= 0),
    min_hr_bpm              INTEGER CHECK (min_hr_bpm BETWEEN 30 AND 250),
    max_hr_bpm              INTEGER CHECK (max_hr_bpm BETWEEN 30 AND 250),
    avg_hr_bpm              INTEGER CHECK (avg_hr_bpm BETWEEN 30 AND 250),
    --sleep_score             INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
    sleep_duration_minutes  INTEGER CHECK (sleep_duration_minutes >= 0),
	min_rr_bpm              INTEGER CHECK (min_rr_bpm BETWEEN 0 AND 100),
	max_rr_bpm              INTEGER CHECK (max_rr_bpm BETWEEN 0 AND 100),
	spo2_avg              	FLOAT CHECK (spo2_avg BETWEEN 0 AND 100),
    summary                 JSONB NOT NULL, 
    PRIMARY KEY (date, person_id)
);

-- 
--postgresql CDM Primary Key Constraints for OMOP Common Data Model 5.4

ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT xpk_PERSON PRIMARY KEY (person_id);
ALTER TABLE omop_cdm.OBSERVATION_PERIOD ADD CONSTRAINT xpk_OBSERVATION_PERIOD PRIMARY KEY (observation_period_id);
ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT xpk_VISIT_OCCURRENCE PRIMARY KEY (visit_occurrence_id);
ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT xpk_VISIT_DETAIL PRIMARY KEY (visit_detail_id);
ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT xpk_CONDITION_OCCURRENCE PRIMARY KEY (condition_occurrence_id);
ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT xpk_DRUG_EXPOSURE PRIMARY KEY (drug_exposure_id);
ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT xpk_PROCEDURE_OCCURRENCE PRIMARY KEY (procedure_occurrence_id);
ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT xpk_DEVICE_EXPOSURE PRIMARY KEY (device_exposure_id);
ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT xpk_MEASUREMENT PRIMARY KEY (measurement_id);
ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT xpk_OBSERVATION PRIMARY KEY (observation_id);
ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT xpk_NOTE PRIMARY KEY (note_id);
ALTER TABLE omop_cdm.NOTE_NLP ADD CONSTRAINT xpk_NOTE_NLP PRIMARY KEY (note_nlp_id);
ALTER TABLE omop_cdm.SPECIMEN ADD CONSTRAINT xpk_SPECIMEN PRIMARY KEY (specimen_id);
ALTER TABLE omop_cdm.LOCATION ADD CONSTRAINT xpk_LOCATION PRIMARY KEY (location_id);
ALTER TABLE omop_cdm.CARE_SITE ADD CONSTRAINT xpk_CARE_SITE PRIMARY KEY (care_site_id);
ALTER TABLE omop_cdm.PROVIDER ADD CONSTRAINT xpk_PROVIDER PRIMARY KEY (provider_id);
ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT xpk_PAYER_PLAN_PERIOD PRIMARY KEY (payer_plan_period_id);
ALTER TABLE omop_cdm.COST ADD CONSTRAINT xpk_COST PRIMARY KEY (cost_id);
ALTER TABLE omop_cdm.DRUG_ERA ADD CONSTRAINT xpk_DRUG_ERA PRIMARY KEY (drug_era_id);
ALTER TABLE omop_cdm.DOSE_ERA ADD CONSTRAINT xpk_DOSE_ERA PRIMARY KEY (dose_era_id);
ALTER TABLE omop_cdm.CONDITION_ERA ADD CONSTRAINT xpk_CONDITION_ERA PRIMARY KEY (condition_era_id);
ALTER TABLE omop_cdm.EPISODE ADD CONSTRAINT xpk_EPISODE PRIMARY KEY (episode_id);
ALTER TABLE omop_cdm.METADATA ADD CONSTRAINT xpk_METADATA PRIMARY KEY (metadata_id);
ALTER TABLE omop_cdm.CONCEPT ADD CONSTRAINT xpk_CONCEPT PRIMARY KEY (concept_id);
ALTER TABLE omop_cdm.VOCABULARY ADD CONSTRAINT xpk_VOCABULARY PRIMARY KEY (vocabulary_id);
ALTER TABLE omop_cdm.DOMAIN ADD CONSTRAINT xpk_DOMAIN PRIMARY KEY (domain_id);
ALTER TABLE omop_cdm.CONCEPT_CLASS ADD CONSTRAINT xpk_CONCEPT_CLASS PRIMARY KEY (concept_class_id);
ALTER TABLE omop_cdm.RELATIONSHIP ADD CONSTRAINT xpk_RELATIONSHIP PRIMARY KEY (relationship_id);



---CONSTRAINTS
--postgresql CDM Foreign Key Constraints for OMOP Common Data Model 5.4
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_gender_concept_id FOREIGN KEY (gender_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_race_concept_id FOREIGN KEY (race_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_ethnicity_concept_id FOREIGN KEY (ethnicity_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_location_id FOREIGN KEY (location_id) REFERENCES omop_cdm.LOCATION (LOCATION_ID);
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_care_site_id FOREIGN KEY (care_site_id) REFERENCES omop_cdm.CARE_SITE (CARE_SITE_ID);
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_gender_source_concept_id FOREIGN KEY (gender_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_race_source_concept_id FOREIGN KEY (race_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PERSON ADD CONSTRAINT fpk_PERSON_ethnicity_source_concept_id FOREIGN KEY (ethnicity_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION_PERIOD ADD CONSTRAINT fpk_OBSERVATION_PERIOD_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION_PERIOD ADD CONSTRAINT fpk_OBSERVATION_PERIOD_period_type_concept_id FOREIGN KEY (period_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_visit_concept_id FOREIGN KEY (visit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_visit_type_concept_id FOREIGN KEY (visit_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_care_site_id FOREIGN KEY (care_site_id) REFERENCES omop_cdm.CARE_SITE (CARE_SITE_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_visit_source_concept_id FOREIGN KEY (visit_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_admitted_from_concept_id FOREIGN KEY (admitted_from_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_discharged_to_concept_id FOREIGN KEY (discharged_to_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_OCCURRENCE ADD CONSTRAINT fpk_VISIT_OCCURRENCE_preceding_visit_occurrence_id FOREIGN KEY (preceding_visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_visit_detail_concept_id FOREIGN KEY (visit_detail_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_visit_detail_type_concept_id FOREIGN KEY (visit_detail_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_care_site_id FOREIGN KEY (care_site_id) REFERENCES omop_cdm.CARE_SITE (CARE_SITE_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_visit_detail_source_concept_id FOREIGN KEY (visit_detail_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_admitted_from_concept_id FOREIGN KEY (admitted_from_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_discharged_to_concept_id FOREIGN KEY (discharged_to_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_preceding_visit_detail_id FOREIGN KEY (preceding_visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_parent_visit_detail_id FOREIGN KEY (parent_visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.VISIT_DETAIL ADD CONSTRAINT fpk_VISIT_DETAIL_visit_occurrence_id FOREIGN KEY (visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT fpk_CONDITION_OCCURRENCE_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT fpk_CONDITION_OCCURRENCE_condition_concept_id FOREIGN KEY (condition_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT fpk_CONDITION_OCCURRENCE_condition_type_concept_id FOREIGN KEY (condition_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT fpk_CONDITION_OCCURRENCE_condition_status_concept_id FOREIGN KEY (condition_status_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT fpk_CONDITION_OCCURRENCE_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT fpk_CONDITION_OCCURRENCE_visit_occurrence_id FOREIGN KEY (visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT fpk_CONDITION_OCCURRENCE_visit_detail_id FOREIGN KEY (visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.CONDITION_OCCURRENCE ADD CONSTRAINT fpk_CONDITION_OCCURRENCE_condition_source_concept_id FOREIGN KEY (condition_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT fpk_DRUG_EXPOSURE_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT fpk_DRUG_EXPOSURE_drug_concept_id FOREIGN KEY (drug_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT fpk_DRUG_EXPOSURE_drug_type_concept_id FOREIGN KEY (drug_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT fpk_DRUG_EXPOSURE_route_concept_id FOREIGN KEY (route_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT fpk_DRUG_EXPOSURE_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT fpk_DRUG_EXPOSURE_visit_occurrence_id FOREIGN KEY (visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT fpk_DRUG_EXPOSURE_visit_detail_id FOREIGN KEY (visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.DRUG_EXPOSURE ADD CONSTRAINT fpk_DRUG_EXPOSURE_drug_source_concept_id FOREIGN KEY (drug_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT fpk_PROCEDURE_OCCURRENCE_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT fpk_PROCEDURE_OCCURRENCE_procedure_concept_id FOREIGN KEY (procedure_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT fpk_PROCEDURE_OCCURRENCE_procedure_type_concept_id FOREIGN KEY (procedure_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT fpk_PROCEDURE_OCCURRENCE_modifier_concept_id FOREIGN KEY (modifier_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT fpk_PROCEDURE_OCCURRENCE_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT fpk_PROCEDURE_OCCURRENCE_visit_occurrence_id FOREIGN KEY (visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT fpk_PROCEDURE_OCCURRENCE_visit_detail_id FOREIGN KEY (visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.PROCEDURE_OCCURRENCE ADD CONSTRAINT fpk_PROCEDURE_OCCURRENCE_procedure_source_concept_id FOREIGN KEY (procedure_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_device_concept_id FOREIGN KEY (device_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_device_type_concept_id FOREIGN KEY (device_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_visit_occurrence_id FOREIGN KEY (visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_visit_detail_id FOREIGN KEY (visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_device_source_concept_id FOREIGN KEY (device_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_unit_concept_id FOREIGN KEY (unit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DEVICE_EXPOSURE ADD CONSTRAINT fpk_DEVICE_EXPOSURE_unit_source_concept_id FOREIGN KEY (unit_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_measurement_concept_id FOREIGN KEY (measurement_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_measurement_type_concept_id FOREIGN KEY (measurement_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_operator_concept_id FOREIGN KEY (operator_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_value_as_concept_id FOREIGN KEY (value_as_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_unit_concept_id FOREIGN KEY (unit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_visit_occurrence_id FOREIGN KEY (visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_visit_detail_id FOREIGN KEY (visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_measurement_source_concept_id FOREIGN KEY (measurement_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_unit_source_concept_id FOREIGN KEY (unit_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.MEASUREMENT ADD CONSTRAINT fpk_MEASUREMENT_meas_event_field_concept_id FOREIGN KEY (meas_event_field_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_observation_concept_id FOREIGN KEY (observation_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_observation_type_concept_id FOREIGN KEY (observation_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_value_as_concept_id FOREIGN KEY (value_as_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_qualifier_concept_id FOREIGN KEY (qualifier_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_unit_concept_id FOREIGN KEY (unit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_visit_occurrence_id FOREIGN KEY (visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_visit_detail_id FOREIGN KEY (visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_observation_source_concept_id FOREIGN KEY (observation_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.OBSERVATION ADD CONSTRAINT fpk_OBSERVATION_obs_event_field_concept_id FOREIGN KEY (obs_event_field_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DEATH ADD CONSTRAINT fpk_DEATH_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.DEATH ADD CONSTRAINT fpk_DEATH_death_type_concept_id FOREIGN KEY (death_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DEATH ADD CONSTRAINT fpk_DEATH_cause_concept_id FOREIGN KEY (cause_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DEATH ADD CONSTRAINT fpk_DEATH_cause_source_concept_id FOREIGN KEY (cause_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_note_type_concept_id FOREIGN KEY (note_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_note_class_concept_id FOREIGN KEY (note_class_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_encoding_concept_id FOREIGN KEY (encoding_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_language_concept_id FOREIGN KEY (language_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_provider_id FOREIGN KEY (provider_id) REFERENCES omop_cdm.PROVIDER (PROVIDER_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_visit_occurrence_id FOREIGN KEY (visit_occurrence_id) REFERENCES omop_cdm.VISIT_OCCURRENCE (VISIT_OCCURRENCE_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_visit_detail_id FOREIGN KEY (visit_detail_id) REFERENCES omop_cdm.VISIT_DETAIL (VISIT_DETAIL_ID);
--
--ALTER TABLE omop_cdm.NOTE ADD CONSTRAINT fpk_NOTE_note_event_field_concept_id FOREIGN KEY (note_event_field_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.NOTE_NLP ADD CONSTRAINT fpk_NOTE_NLP_section_concept_id FOREIGN KEY (section_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.NOTE_NLP ADD CONSTRAINT fpk_NOTE_NLP_note_nlp_concept_id FOREIGN KEY (note_nlp_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.NOTE_NLP ADD CONSTRAINT fpk_NOTE_NLP_note_nlp_source_concept_id FOREIGN KEY (note_nlp_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.SPECIMEN ADD CONSTRAINT fpk_SPECIMEN_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.SPECIMEN ADD CONSTRAINT fpk_SPECIMEN_specimen_concept_id FOREIGN KEY (specimen_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.SPECIMEN ADD CONSTRAINT fpk_SPECIMEN_specimen_type_concept_id FOREIGN KEY (specimen_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.SPECIMEN ADD CONSTRAINT fpk_SPECIMEN_unit_concept_id FOREIGN KEY (unit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.SPECIMEN ADD CONSTRAINT fpk_SPECIMEN_anatomic_site_concept_id FOREIGN KEY (anatomic_site_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.SPECIMEN ADD CONSTRAINT fpk_SPECIMEN_disease_status_concept_id FOREIGN KEY (disease_status_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.FACT_RELATIONSHIP ADD CONSTRAINT fpk_FACT_RELATIONSHIP_domain_concept_id_1 FOREIGN KEY (domain_concept_id_1) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.FACT_RELATIONSHIP ADD CONSTRAINT fpk_FACT_RELATIONSHIP_domain_concept_id_2 FOREIGN KEY (domain_concept_id_2) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.FACT_RELATIONSHIP ADD CONSTRAINT fpk_FACT_RELATIONSHIP_relationship_concept_id FOREIGN KEY (relationship_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.LOCATION ADD CONSTRAINT fpk_LOCATION_country_concept_id FOREIGN KEY (country_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CARE_SITE ADD CONSTRAINT fpk_CARE_SITE_place_of_service_concept_id FOREIGN KEY (place_of_service_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CARE_SITE ADD CONSTRAINT fpk_CARE_SITE_location_id FOREIGN KEY (location_id) REFERENCES omop_cdm.LOCATION (LOCATION_ID);
--
--ALTER TABLE omop_cdm.PROVIDER ADD CONSTRAINT fpk_PROVIDER_specialty_concept_id FOREIGN KEY (specialty_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PROVIDER ADD CONSTRAINT fpk_PROVIDER_care_site_id FOREIGN KEY (care_site_id) REFERENCES omop_cdm.CARE_SITE (CARE_SITE_ID);
--
--ALTER TABLE omop_cdm.PROVIDER ADD CONSTRAINT fpk_PROVIDER_gender_concept_id FOREIGN KEY (gender_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PROVIDER ADD CONSTRAINT fpk_PROVIDER_specialty_source_concept_id FOREIGN KEY (specialty_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PROVIDER ADD CONSTRAINT fpk_PROVIDER_gender_source_concept_id FOREIGN KEY (gender_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_payer_plan_period_id FOREIGN KEY (payer_plan_period_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_payer_concept_id FOREIGN KEY (payer_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_payer_source_concept_id FOREIGN KEY (payer_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_plan_concept_id FOREIGN KEY (plan_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_plan_source_concept_id FOREIGN KEY (plan_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_sponsor_concept_id FOREIGN KEY (sponsor_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_sponsor_source_concept_id FOREIGN KEY (sponsor_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_stop_reason_concept_id FOREIGN KEY (stop_reason_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.PAYER_PLAN_PERIOD ADD CONSTRAINT fpk_PAYER_PLAN_PERIOD_stop_reason_source_concept_id FOREIGN KEY (stop_reason_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.COST ADD CONSTRAINT fpk_COST_cost_domain_id FOREIGN KEY (cost_domain_id) REFERENCES omop_cdm.DOMAIN (DOMAIN_ID);
--
--ALTER TABLE omop_cdm.COST ADD CONSTRAINT fpk_COST_cost_type_concept_id FOREIGN KEY (cost_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.COST ADD CONSTRAINT fpk_COST_currency_concept_id FOREIGN KEY (currency_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.COST ADD CONSTRAINT fpk_COST_revenue_code_concept_id FOREIGN KEY (revenue_code_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.COST ADD CONSTRAINT fpk_COST_drg_concept_id FOREIGN KEY (drg_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_ERA ADD CONSTRAINT fpk_DRUG_ERA_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.DRUG_ERA ADD CONSTRAINT fpk_DRUG_ERA_drug_concept_id FOREIGN KEY (drug_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DOSE_ERA ADD CONSTRAINT fpk_DOSE_ERA_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.DOSE_ERA ADD CONSTRAINT fpk_DOSE_ERA_drug_concept_id FOREIGN KEY (drug_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DOSE_ERA ADD CONSTRAINT fpk_DOSE_ERA_unit_concept_id FOREIGN KEY (unit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONDITION_ERA ADD CONSTRAINT fpk_CONDITION_ERA_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.CONDITION_ERA ADD CONSTRAINT fpk_CONDITION_ERA_condition_concept_id FOREIGN KEY (condition_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.EPISODE ADD CONSTRAINT fpk_EPISODE_person_id FOREIGN KEY (person_id) REFERENCES omop_cdm.PERSON (PERSON_ID);
--
--ALTER TABLE omop_cdm.EPISODE ADD CONSTRAINT fpk_EPISODE_episode_concept_id FOREIGN KEY (episode_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.EPISODE ADD CONSTRAINT fpk_EPISODE_episode_object_concept_id FOREIGN KEY (episode_object_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.EPISODE ADD CONSTRAINT fpk_EPISODE_episode_type_concept_id FOREIGN KEY (episode_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.EPISODE ADD CONSTRAINT fpk_EPISODE_episode_source_concept_id FOREIGN KEY (episode_source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.EPISODE_EVENT ADD CONSTRAINT fpk_EPISODE_EVENT_episode_id FOREIGN KEY (episode_id) REFERENCES omop_cdm.EPISODE (EPISODE_ID);
--
--ALTER TABLE omop_cdm.EPISODE_EVENT ADD CONSTRAINT fpk_EPISODE_EVENT_episode_event_field_concept_id FOREIGN KEY (episode_event_field_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.METADATA ADD CONSTRAINT fpk_METADATA_metadata_concept_id FOREIGN KEY (metadata_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.METADATA ADD CONSTRAINT fpk_METADATA_metadata_type_concept_id FOREIGN KEY (metadata_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.METADATA ADD CONSTRAINT fpk_METADATA_value_as_concept_id FOREIGN KEY (value_as_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CDM_SOURCE ADD CONSTRAINT fpk_CDM_SOURCE_cdm_version_concept_id FOREIGN KEY (cdm_version_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT ADD CONSTRAINT fpk_CONCEPT_domain_id FOREIGN KEY (domain_id) REFERENCES omop_cdm.DOMAIN (DOMAIN_ID);
--
--ALTER TABLE omop_cdm.CONCEPT ADD CONSTRAINT fpk_CONCEPT_vocabulary_id FOREIGN KEY (vocabulary_id) REFERENCES omop_cdm.VOCABULARY (VOCABULARY_ID);
--
--ALTER TABLE omop_cdm.CONCEPT ADD CONSTRAINT fpk_CONCEPT_concept_class_id FOREIGN KEY (concept_class_id) REFERENCES omop_cdm.CONCEPT_CLASS (CONCEPT_CLASS_ID);
--
--ALTER TABLE omop_cdm.VOCABULARY ADD CONSTRAINT fpk_VOCABULARY_vocabulary_concept_id FOREIGN KEY (vocabulary_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DOMAIN ADD CONSTRAINT fpk_DOMAIN_domain_concept_id FOREIGN KEY (domain_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT_CLASS ADD CONSTRAINT fpk_CONCEPT_CLASS_concept_class_concept_id FOREIGN KEY (concept_class_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT_RELATIONSHIP ADD CONSTRAINT fpk_CONCEPT_RELATIONSHIP_concept_id_1 FOREIGN KEY (concept_id_1) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT_RELATIONSHIP ADD CONSTRAINT fpk_CONCEPT_RELATIONSHIP_concept_id_2 FOREIGN KEY (concept_id_2) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT_RELATIONSHIP ADD CONSTRAINT fpk_CONCEPT_RELATIONSHIP_relationship_id FOREIGN KEY (relationship_id) REFERENCES omop_cdm.RELATIONSHIP (RELATIONSHIP_ID);
--
--ALTER TABLE omop_cdm.RELATIONSHIP ADD CONSTRAINT fpk_RELATIONSHIP_relationship_concept_id FOREIGN KEY (relationship_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT_SYNONYM ADD CONSTRAINT fpk_CONCEPT_SYNONYM_concept_id FOREIGN KEY (concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT_SYNONYM ADD CONSTRAINT fpk_CONCEPT_SYNONYM_language_concept_id FOREIGN KEY (language_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT_ANCESTOR ADD CONSTRAINT fpk_CONCEPT_ANCESTOR_ancestor_concept_id FOREIGN KEY (ancestor_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.CONCEPT_ANCESTOR ADD CONSTRAINT fpk_CONCEPT_ANCESTOR_descendant_concept_id FOREIGN KEY (descendant_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.SOURCE_TO_CONCEPT_MAP ADD CONSTRAINT fpk_SOURCE_TO_CONCEPT_MAP_source_concept_id FOREIGN KEY (source_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.SOURCE_TO_CONCEPT_MAP ADD CONSTRAINT fpk_SOURCE_TO_CONCEPT_MAP_target_concept_id FOREIGN KEY (target_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.SOURCE_TO_CONCEPT_MAP ADD CONSTRAINT fpk_SOURCE_TO_CONCEPT_MAP_target_vocabulary_id FOREIGN KEY (target_vocabulary_id) REFERENCES omop_cdm.VOCABULARY (VOCABULARY_ID);
--
--ALTER TABLE omop_cdm.DRUG_STRENGTH ADD CONSTRAINT fpk_DRUG_STRENGTH_drug_concept_id FOREIGN KEY (drug_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_STRENGTH ADD CONSTRAINT fpk_DRUG_STRENGTH_ingredient_concept_id FOREIGN KEY (ingredient_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_STRENGTH ADD CONSTRAINT fpk_DRUG_STRENGTH_amount_unit_concept_id FOREIGN KEY (amount_unit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_STRENGTH ADD CONSTRAINT fpk_DRUG_STRENGTH_numerator_unit_concept_id FOREIGN KEY (numerator_unit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.DRUG_STRENGTH ADD CONSTRAINT fpk_DRUG_STRENGTH_denominator_unit_concept_id FOREIGN KEY (denominator_unit_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.COHORT_DEFINITION ADD CONSTRAINT fpk_COHORT_DEFINITION_cohort_definition_id FOREIGN KEY (cohort_definition_id) REFERENCES omop_cdm.COHORT (COHORT_DEFINITION_ID);
--
--ALTER TABLE omop_cdm.COHORT_DEFINITION ADD CONSTRAINT fpk_COHORT_DEFINITION_definition_type_concept_id FOREIGN KEY (definition_type_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--ALTER TABLE omop_cdm.COHORT_DEFINITION ADD CONSTRAINT fpk_COHORT_DEFINITION_subject_concept_id FOREIGN KEY (subject_concept_id) REFERENCES omop_cdm.CONCEPT (CONCEPT_ID);
--
--
--- INDEX
/*postgresql OMOP CDM Indices
  There are no unique indices created because it is assumed that the primary key constraints have been run prior to
  implementing indices.
*/


/************************

Standardized clinical data

************************/

--CLUSTER omop_cdm.person  USING idx_person_id ;
--CREATE INDEX idx_gender ON omop_cdm.person (gender_concept_id ASC);
--CREATE INDEX idx_person_id  ON omop_cdm.person  (person_id ASC);
--
--CREATE INDEX idx_observation_period_id_1  ON omop_cdm.observation_period  (person_id ASC);
--CLUSTER omop_cdm.observation_period  USING idx_observation_period_id_1 ;
--
--CREATE INDEX idx_visit_person_id_1  ON omop_cdm.visit_occurrence  (person_id ASC);
--CLUSTER omop_cdm.visit_occurrence  USING idx_visit_person_id_1 ;
--CREATE INDEX idx_visit_concept_id_1 ON omop_cdm.visit_occurrence (visit_concept_id ASC);
--
--CREATE INDEX idx_visit_det_person_id_1  ON omop_cdm.visit_detail  (person_id ASC);
--CLUSTER omop_cdm.visit_detail  USING idx_visit_det_person_id_1 ;
--CREATE INDEX idx_visit_det_concept_id_1 ON omop_cdm.visit_detail (visit_detail_concept_id ASC);
--CREATE INDEX idx_visit_det_occ_id ON omop_cdm.visit_detail (visit_occurrence_id ASC);
--
--CREATE INDEX idx_condition_person_id_1  ON omop_cdm.condition_occurrence  (person_id ASC);
--CLUSTER omop_cdm.condition_occurrence  USING idx_condition_person_id_1 ;
--CREATE INDEX idx_condition_concept_id_1 ON omop_cdm.condition_occurrence (condition_concept_id ASC);
--CREATE INDEX idx_condition_visit_id_1 ON omop_cdm.condition_occurrence (visit_occurrence_id ASC);
--
--CREATE INDEX idx_drug_person_id_1  ON omop_cdm.drug_exposure  (person_id ASC);
--CLUSTER omop_cdm.drug_exposure  USING idx_drug_person_id_1 ;
--CREATE INDEX idx_drug_concept_id_1 ON omop_cdm.drug_exposure (drug_concept_id ASC);
--CREATE INDEX idx_drug_visit_id_1 ON omop_cdm.drug_exposure (visit_occurrence_id ASC);
--
--CREATE INDEX idx_procedure_person_id_1  ON omop_cdm.procedure_occurrence  (person_id ASC);
--CLUSTER omop_cdm.procedure_occurrence  USING idx_procedure_person_id_1 ;
--CREATE INDEX idx_procedure_concept_id_1 ON omop_cdm.procedure_occurrence (procedure_concept_id ASC);
--CREATE INDEX idx_procedure_visit_id_1 ON omop_cdm.procedure_occurrence (visit_occurrence_id ASC);
--
--CREATE INDEX idx_device_person_id_1  ON omop_cdm.device_exposure  (person_id ASC);
--CLUSTER omop_cdm.device_exposure  USING idx_device_person_id_1 ;
--CREATE INDEX idx_device_concept_id_1 ON omop_cdm.device_exposure (device_concept_id ASC);
--CREATE INDEX idx_device_visit_id_1 ON omop_cdm.device_exposure (visit_occurrence_id ASC);
--
--CREATE INDEX idx_measurement_person_id_1  ON omop_cdm.measurement  (person_id ASC);
--CLUSTER omop_cdm.measurement  USING idx_measurement_person_id_1 ;
--CREATE INDEX idx_measurement_concept_id_1 ON omop_cdm.measurement (measurement_concept_id ASC);
--CREATE INDEX idx_measurement_visit_id_1 ON omop_cdm.measurement (visit_occurrence_id ASC);
--
--CREATE INDEX idx_observation_person_id_1  ON omop_cdm.observation  (person_id ASC);
--CLUSTER omop_cdm.observation  USING idx_observation_person_id_1 ;
--CREATE INDEX idx_observation_concept_id_1 ON omop_cdm.observation (observation_concept_id ASC);
--CREATE INDEX idx_observation_visit_id_1 ON omop_cdm.observation (visit_occurrence_id ASC);
--
--CREATE INDEX idx_death_person_id_1  ON omop_cdm.death  (person_id ASC);
--CLUSTER omop_cdm.death  USING idx_death_person_id_1 ;
--
--CREATE INDEX idx_note_person_id_1  ON omop_cdm.note  (person_id ASC);
--CLUSTER omop_cdm.note  USING idx_note_person_id_1 ;
--CREATE INDEX idx_note_concept_id_1 ON omop_cdm.note (note_type_concept_id ASC);
--CREATE INDEX idx_note_visit_id_1 ON omop_cdm.note (visit_occurrence_id ASC);
--
--CREATE INDEX idx_note_nlp_note_id_1  ON omop_cdm.note_nlp  (note_id ASC);
--CLUSTER omop_cdm.note_nlp  USING idx_note_nlp_note_id_1 ;
--CREATE INDEX idx_note_nlp_concept_id_1 ON omop_cdm.note_nlp (note_nlp_concept_id ASC);
--
--CREATE INDEX idx_specimen_person_id_1  ON omop_cdm.specimen  (person_id ASC);
--CLUSTER omop_cdm.specimen  USING idx_specimen_person_id_1 ;
--CREATE INDEX idx_specimen_concept_id_1 ON omop_cdm.specimen (specimen_concept_id ASC);
--
--CREATE INDEX idx_fact_relationship_id1 ON omop_cdm.fact_relationship (domain_concept_id_1 ASC);
--CREATE INDEX idx_fact_relationship_id2 ON omop_cdm.fact_relationship (domain_concept_id_2 ASC);
--CREATE INDEX idx_fact_relationship_id3 ON omop_cdm.fact_relationship (relationship_concept_id ASC);
--
--/************************
--
--Standardized health system data
--
--************************/
--
--CREATE INDEX idx_location_id_1  ON omop_cdm.location  (location_id ASC);
--CLUSTER omop_cdm.location  USING idx_location_id_1 ;
--
--CREATE INDEX idx_care_site_id_1  ON omop_cdm.care_site  (care_site_id ASC);
--CLUSTER omop_cdm.care_site  USING idx_care_site_id_1 ;
--
--CREATE INDEX idx_provider_id_1  ON omop_cdm.provider  (provider_id ASC);
--CLUSTER omop_cdm.provider  USING idx_provider_id_1 ;
--
--/************************
--
--Standardized health economics
--
--************************/
--
--CREATE INDEX idx_period_person_id_1  ON omop_cdm.payer_plan_period  (person_id ASC);
--CLUSTER omop_cdm.payer_plan_period  USING idx_period_person_id_1 ;
--
--CREATE INDEX idx_cost_event_id  ON omop_cdm.cost (cost_event_id ASC);
--
--/************************
--
--Standardized derived elements
--
--************************/
--
--CREATE INDEX idx_drug_era_person_id_1  ON omop_cdm.drug_era  (person_id ASC);
--CLUSTER omop_cdm.drug_era  USING idx_drug_era_person_id_1 ;
--CREATE INDEX idx_drug_era_concept_id_1 ON omop_cdm.drug_era (drug_concept_id ASC);
--
--CREATE INDEX idx_dose_era_person_id_1  ON omop_cdm.dose_era  (person_id ASC);
--CLUSTER omop_cdm.dose_era  USING idx_dose_era_person_id_1 ;
--CREATE INDEX idx_dose_era_concept_id_1 ON omop_cdm.dose_era (drug_concept_id ASC);
--
--CREATE INDEX idx_condition_era_person_id_1  ON omop_cdm.condition_era  (person_id ASC);
--CLUSTER omop_cdm.condition_era  USING idx_condition_era_person_id_1 ;
--CREATE INDEX idx_condition_era_concept_id_1 ON omop_cdm.condition_era (condition_concept_id ASC);
--
--/**************************
--
--Standardized meta-data
--
--***************************/
--
--CREATE INDEX idx_metadata_concept_id_1  ON omop_cdm.metadata  (metadata_concept_id ASC);
--CLUSTER omop_cdm.metadata  USING idx_metadata_concept_id_1 ;
--
--/**************************
--
--Standardized vocabularies
--
--***************************/
--
--CREATE INDEX idx_concept_concept_id  ON omop_cdm.concept  (concept_id ASC);
--CLUSTER omop_cdm.concept  USING idx_concept_concept_id ;
--CREATE INDEX idx_concept_code ON omop_cdm.concept (concept_code ASC);
--CREATE INDEX idx_concept_vocabluary_id ON omop_cdm.concept (vocabulary_id ASC);
--CREATE INDEX idx_concept_domain_id ON omop_cdm.concept (domain_id ASC);
--CREATE INDEX idx_concept_class_id ON omop_cdm.concept (concept_class_id ASC);
--
--CREATE INDEX idx_vocabulary_vocabulary_id  ON omop_cdm.vocabulary  (vocabulary_id ASC);
--CLUSTER omop_cdm.vocabulary  USING idx_vocabulary_vocabulary_id ;
--
--CREATE INDEX idx_domain_domain_id  ON omop_cdm.domain  (domain_id ASC);
--CLUSTER omop_cdm.domain  USING idx_domain_domain_id ;
--
--CREATE INDEX idx_concept_class_class_id  ON omop_cdm.concept_class  (concept_class_id ASC);
--CLUSTER omop_cdm.concept_class  USING idx_concept_class_class_id ;
--
--CREATE INDEX idx_concept_relationship_id_1  ON omop_cdm.concept_relationship  (concept_id_1 ASC);
--CLUSTER omop_cdm.concept_relationship  USING idx_concept_relationship_id_1 ;
--CREATE INDEX idx_concept_relationship_id_2 ON omop_cdm.concept_relationship (concept_id_2 ASC);
--CREATE INDEX idx_concept_relationship_id_3 ON omop_cdm.concept_relationship (relationship_id ASC);
--
--CREATE INDEX idx_relationship_rel_id  ON omop_cdm.relationship  (relationship_id ASC);
--CLUSTER omop_cdm.relationship  USING idx_relationship_rel_id ;
--
--CREATE INDEX idx_concept_synonym_id  ON omop_cdm.concept_synonym  (concept_id ASC);
--CLUSTER omop_cdm.concept_synonym  USING idx_concept_synonym_id ;
--
--CREATE INDEX idx_concept_ancestor_id_1  ON omop_cdm.concept_ancestor  (ancestor_concept_id ASC);
--CLUSTER omop_cdm.concept_ancestor  USING idx_concept_ancestor_id_1 ;
--CREATE INDEX idx_concept_ancestor_id_2 ON omop_cdm.concept_ancestor (descendant_concept_id ASC);
--
--CREATE INDEX idx_source_to_concept_map_3  ON omop_cdm.source_to_concept_map  (target_concept_id ASC);
--CLUSTER omop_cdm.source_to_concept_map  USING idx_source_to_concept_map_3 ;
--CREATE INDEX idx_source_to_concept_map_1 ON omop_cdm.source_to_concept_map (source_vocabulary_id ASC);
--CREATE INDEX idx_source_to_concept_map_2 ON omop_cdm.source_to_concept_map (target_vocabulary_id ASC);
--CREATE INDEX idx_source_to_concept_map_c ON omop_cdm.source_to_concept_map (source_code ASC);
--
--CREATE INDEX idx_drug_strength_id_1  ON omop_cdm.drug_strength  (drug_concept_id ASC);
--CLUSTER omop_cdm.drug_strength  USING idx_drug_strength_id_1 ;
--CREATE INDEX idx_drug_strength_id_2 ON omop_cdm.drug_strength (ingredient_concept_id ASC);
--
--\copy omop_cdm.concept (concept_id, concept_name, domain_id, vocabulary_id, concept_class_id, standard_concept, concept_code, valid_start_date, valid_end_date, invalid_reason) FROM 'C:\Users\1308l\OneDrive\Documentos\INGINF\S8\TFG\DB\vocabulary_download_v5_{0e1335ba-7eb9-4be6-9638-4a966ab22f87}_1745604953094\CONCEPT.csv' DELIMITER ';' CSV HEADER ENCODING 'UTF8' QUOTE '"' ESCAPE '\'
--