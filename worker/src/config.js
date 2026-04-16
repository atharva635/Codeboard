require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'codeboard',
    user: process.env.DB_USER || 'codeboard_user',
    password: process.env.DB_PASSWORD || 'codeboard_pass',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  fetchCron: process.env.FETCH_CRON || '0 */6 * * *',
};
