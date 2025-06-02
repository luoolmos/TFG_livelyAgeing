module.exports = {
  // Endpoints de Fitbit
  FITBIT_STEPS: (date) => `https://api.fitbit.com/1/user/-/activities/steps/date/${date}.json`,
  FITBIT_STEPS_INTRADAY: (date) => `https://api.fitbit.com/1/user/-/activities/steps/date/${date}/1d/1min.json`,
  FITBIT_DAILY_ACTIVITY: (date) => `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
  FITBIT_HEART_RATE: (date, end_date) => `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/${end_date}.json`,
  FITBIT_HEART_RATE_INTRADAY: (date) => `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d/5.json`,
  FITBIT_SLEEP: (date) => `https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`,
  FITBIT_SLEEP_RANGE: (start, end) => `https://api.fitbit.com/1.2/user/-/sleep/date/${start}/${end}.json`,
  FITBIT_BREATHING_RATE: (date) => `https://api.fitbit.com/1/user/-/br/date/${date}/${date}.json`,
  FITBIT_BREATHING_RATE_INTRADAY: (date) => `https://api.fitbit.com/1/user/-/br/date/${date}/1d/5min.json`,
  FITBIT_SPO2: (date) => `https://api.fitbit.com/1/user/-/spo2/date/${date}.json`,
  FITBIT_TEMPERATURE: (date) => `https://api.fitbit.com/1/user/-/temp/core/date/${date}.json`,
  FITBIT_HRV: (date) => `https://api.fitbit.com/1/user/-/hrv/date/${date}.json`,
  FITBIT_HRV_INTRADAY: (date) => `https://api.fitbit.com/1/user/-/hrv/date/${date}/1d/5min.json`,
  FITBIT_ACTIVITIES_INTRDAY : (date) => `https://api.fitbit.com/1/user/-/activities/date/${date}/1d/5min.json`,
  FITBIT_PROFILE: `https://api.fitbit.com/1/user/-/profile.json`,
  FITBIT_DEVICES: `https://api.fitbit.com/1/user/-/devices.json`,
  FITBIT_ACTIVITIES_CATEGORIES: `https://api.fitbit.com/1/activities.json`
};

