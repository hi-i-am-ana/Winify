module.exports = {
  host: process.env.HOST,
  port: process.env.PORT,

  // pgport: process.env.POSTGRES_PORT,
  // pguser: process.env.POSTGRES_USERNAME,
  // pgdatabase: process.env.POSTGRES_DATABASE,
  // pgpassword: process.env.POSTGRES_PASSWORD,
  // pghost: process.env.POSTGRES_HOST,

  gmailhost: process.env.GMAIL_HOST,
  gmailport: process.env.GMAIL_PORT,
  gmailuser: process.env.GMAIL_USERNAME,
  gmailpassword: process.env.GMAIL_PASSWORD,

  stravaClient: process.env.STRAVA_CLIENT_ID,
  stravaSecret: process.env.STRAVA_CLIENT_SECRET,

  accessSecret: process.env.ACCESS_SECRET
};