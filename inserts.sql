WITH new_user AS (
    INSERT INTO users (name, email, date_of_birth) 
    VALUES ('Samsung Galaxy 4', 'Wearable3LivelyAgeign2@gmail.com ', '2000-01-01') 
    RETURNING user_id
)
INSERT INTO devices (user_id, device_type, token, model) 
SELECT user_id, 'Samsung', 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1E1SjMiLCJzdWIiOiJDSjNZVEgiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyYWN0IHJwcm8gcnNsZSIsImV4cCI6MTc0MjQwODkwMCwiaWF0IjoxNzQyMzgwMTAwfQ.qPO3JI6pY9lPIOrD_B50_p46Z2B1nyuSNR9vr_hOs3g', 'Galaxy Watch 4' FROM new_user;


WITH new_user AS (
    INSERT INTO users (name, email, date_of_birth) 
    VALUES ('Garmin Venus sq2', 'Wearable5LivelyAgeign@gmail.com', '2000-01-01') 
    RETURNING user_id
)
INSERT INTO devices (user_id, device_type, token, model) 
SELECT user_id, 'Garmin', 'token', 'Venus Sq2' FROM new_user;
