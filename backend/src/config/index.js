require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'codeboard',
    user: process.env.DB_USER || 'codeboard_user',
    password: process.env.DB_PASSWORD || 'codeboard_pass',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
