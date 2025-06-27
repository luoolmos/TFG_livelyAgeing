CREATE OR REPLACE FUNCTION custom.insert_person_with_device(
    p_name            VARCHAR,
    p_birth_date      DATE,
    p_email           VARCHAR,
    p_manufacturer    VARCHAR    ,
    p_model           VARCHAR    ,
    p_profile         JSONB      DEFAULT NULL,
    p_serial_number   VARCHAR    DEFAULT NULL,
    p_start_date      TIMESTAMPTZ DEFAULT now(),
    p_end_date        TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    ret_person_id      INTEGER,
    ret_device_id      UUID,
    ret_user_device_id UUID
) AS $$
DECLARE
    v_person_id       INTEGER;
    v_device_id       UUID;
    v_user_device_id  UUID;
BEGIN
    -- 1) Insert minimal en OMOP
    INSERT INTO omop_modified.person(
        birth_datetime,
        year_of_birth,
        month_of_birth,
        day_of_birth,
        person_source_value
    )
    VALUES (
        p_birth_date,
        EXTRACT(YEAR  FROM p_birth_date)::int,
        EXTRACT(MONTH FROM p_birth_date)::int,
        EXTRACT(DAY   FROM p_birth_date)::int,
        p_name
    )
    RETURNING person_id INTO v_person_id;

    -- 2) Insert en custom.person_info
    INSERT INTO custom.person_info(person_id, email, name, profile)
    VALUES (v_person_id, p_email, p_name, p_profile);

    -- 3) Device…
    INSERT INTO custom.device(serial_number, manufacturer, model)
    VALUES (p_serial_number, p_manufacturer, p_model)
    RETURNING device_id INTO v_device_id;

    -- 4) Relación user–device
    INSERT INTO custom.user_device(user_id, device_id, start_date, end_date)
    VALUES (v_person_id, v_device_id, p_start_date, p_end_date)
    RETURNING user_device_id INTO v_user_device_id;

    RETURN QUERY SELECT v_person_id, v_device_id, v_user_device_id;
END;
$$ LANGUAGE plpgsql;


SELECT *
FROM custom.insert_person_with_device(
  p_email         => 'Wearable5LivelyAgeign@gmail.com',
  p_name          => 'Garmin Venu sq2',
   p_birth_date => '2000-01-01',
  p_manufacturer  => 'Garmin',
  p_model         => 'Venu Sq2'
);

SELECT *
FROM custom.insert_person_with_device(
  p_email         => 'Wearable3LivelyAgeign2@gmail.com',
  p_name          => 'Samsung Galaxy 4',
   p_birth_date => '2000-01-01',
  p_manufacturer  => 'Samsung',
  p_model         => 'Galaxy Watch 4'
);

SELECT *
FROM custom.insert_person_with_device(
  p_email         => 'tfg.unimore.master@gmail.com',
  p_name          => 'Forerunner 55',
   p_birth_date => '2000-01-01',
  p_manufacturer  => 'Garmin',
  p_model         => 'Forerunner 55'
);