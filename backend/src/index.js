const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const syncRoutes = require('./routes/sync');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'codeboard-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Auto-run migrations, then start server
const { runMigrations } = require('./db/migrate');

async function start() {
  try {
    await runMigrations();
  } catch (err) {
    console.error('⚠️  Migration failed, starting anyway:', err.message);
  }

  app.listen(config.port, () => {
    console.log(`🚀 CodeBoard Backend running on port ${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health check: http://localhost:${config.port}/api/health`);
  });
}

start();

module.exports = app;
