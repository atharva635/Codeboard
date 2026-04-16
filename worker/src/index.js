const cron = require('node-cron');
const config = require('./config');
const db = require('./db');
const { fetchGitHubData } = require('./githubFetcher');
const { fetchLeetCodeData } = require('./leetcodeFetcher');

async function processUser(user) {
  console.log(`\n👤 Processing user: ${user.username} (ID: ${user.id})`);

  // Fetch GitHub data if username is set
  if (user.github_username) {
    try {
      const githubData = await fetchGitHubData(user.github_username);

      await db.query(
        `INSERT INTO github_data 
         (user_id, total_repos, public_repos, total_stars, total_forks, followers, following,
          total_contributions, current_streak, longest_streak, top_languages, contribution_data,
          recent_repos, profile_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          user.id,
          githubData.total_repos,
          githubData.public_repos,
          githubData.total_stars,
          githubData.total_forks,
          githubData.followers,
          githubData.following,
          githubData.total_contributions,
          githubData.current_streak,
          githubData.longest_streak,
          JSON.stringify(githubData.top_languages),
          JSON.stringify(githubData.contribution_data),
          JSON.stringify(githubData.recent_repos),
          JSON.stringify(githubData.profile_data),
        ]
      );

      // Update user avatar
      if (githubData.profile_data?.avatar_url) {
        await db.query(
          'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
          [githubData.profile_data.avatar_url, user.id]
        );
      }

      // Log activity
      await db.query(
        `INSERT INTO activity_log (user_id, platform, action, status, details)
         VALUES ($1, 'github', 'data_fetch', 'success', $2)`,
        [user.id, JSON.stringify({ repos: githubData.total_repos, stars: githubData.total_stars })]
      );

      console.log(`  ✅ GitHub data saved for ${user.github_username}`);
    } catch (err) {
      console.error(`  ❌ GitHub fetch failed for ${user.github_username}:`, err.message);
      await db.query(
        `INSERT INTO activity_log (user_id, platform, action, status, details)
         VALUES ($1, 'github', 'data_fetch', 'error', $2)`,
        [user.id, JSON.stringify({ error: err.message })]
      );
    }
  }

  // Fetch LeetCode data if username is set
  if (user.leetcode_username) {
    try {
      const lcData = await fetchLeetCodeData(user.leetcode_username);

      await db.query(
        `INSERT INTO leetcode_data
         (user_id, total_solved, easy_solved, medium_solved, hard_solved, total_questions,
          acceptance_rate, ranking, contribution_points, reputation, submission_calendar,
          recent_submissions, skills_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          user.id,
          lcData.total_solved,
          lcData.easy_solved,
          lcData.medium_solved,
          lcData.hard_solved,
          lcData.total_questions,
          lcData.acceptance_rate,
          lcData.ranking,
          lcData.contribution_points,
          lcData.reputation,
          JSON.stringify(lcData.submission_calendar),
          JSON.stringify(lcData.recent_submissions),
          JSON.stringify(lcData.skills_data),
        ]
      );

      await db.query(
        `INSERT INTO activity_log (user_id, platform, action, status, details)
         VALUES ($1, 'leetcode', 'data_fetch', 'success', $2)`,
        [user.id, JSON.stringify({ total_solved: lcData.total_solved, ranking: lcData.ranking })]
      );

      console.log(`  ✅ LeetCode data saved for ${user.leetcode_username}`);
    } catch (err) {
      console.error(`  ❌ LeetCode fetch failed for ${user.leetcode_username}:`, err.message);
      await db.query(
        `INSERT INTO activity_log (user_id, platform, action, status, details)
         VALUES ($1, 'leetcode', 'data_fetch', 'error', $2)`,
        [user.id, JSON.stringify({ error: err.message })]
      );
    }
  }
}

async function runFetchJob() {
  console.log('\n' + '='.repeat(60));
  console.log(`🔄 Starting data fetch job at ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // Get all users with GitHub or LeetCode usernames
    const result = await db.query(
      'SELECT id, username, github_username, leetcode_username FROM users WHERE github_username IS NOT NULL OR leetcode_username IS NOT NULL'
    );

    const users = result.rows;
    console.log(`📋 Found ${users.length} users to process`);

    for (const user of users) {
      await processUser(user);
      // Small delay between users to be nice to APIs
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n✅ Fetch job completed at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('❌ Fetch job error:', err.message);
  }
}

// Start the worker
async function main() {
  console.log('🚀 CodeBoard Worker Service starting...');
  console.log(`📅 Cron schedule: ${config.fetchCron}`);
  console.log(`🗄️  Database: ${config.db.host}:${config.db.port}/${config.db.database}`);

  // Run immediately on startup
  console.log('\n🔄 Running initial fetch...');
  await runFetchJob();

  // Schedule recurring fetches
  cron.schedule(config.fetchCron, () => {
    runFetchJob();
  });

  console.log(`\n⏰ Worker is now running. Next fetch scheduled per cron: ${config.fetchCron}`);
}

main().catch(err => {
  console.error('💀 Worker failed to start:', err.message);
  process.exit(1);
});
