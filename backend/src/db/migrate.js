const db = require('./index');

const migrationSQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  github_username VARCHAR(100),
  leetcode_username VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS github_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_repos INTEGER DEFAULT 0,
  public_repos INTEGER DEFAULT 0,
  total_stars INTEGER DEFAULT 0,
  total_forks INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  total_contributions INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  top_languages JSONB DEFAULT '[]',
  contribution_data JSONB DEFAULT '[]',
  recent_repos JSONB DEFAULT '[]',
  profile_data JSONB DEFAULT '{}',
  fetched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leetcode_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_solved INTEGER DEFAULT 0,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  ranking INTEGER DEFAULT 0,
  contribution_points INTEGER DEFAULT 0,
  reputation INTEGER DEFAULT 0,
  submission_calendar JSONB DEFAULT '{}',
  recent_submissions JSONB DEFAULT '[]',
  skills_data JSONB DEFAULT '{}',
  fetched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'success',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_github_data_user_id ON github_data(user_id);
CREATE INDEX IF NOT EXISTS idx_leetcode_data_user_id ON leetcode_data(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
`;

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    await db.query(migrationSQL);
    console.log('✅ Database migrations completed!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  }
}

// Also keep the standalone script functionality
if (require.main === module) {
  runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runMigrations };
