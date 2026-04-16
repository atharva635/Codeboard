const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/dashboard - Full dashboard data
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user info
    const userResult = await db.query(
      'SELECT id, username, email, github_username, leetcode_username, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Fetch latest GitHub data
    const githubResult = await db.query(
      'SELECT * FROM github_data WHERE user_id = $1 ORDER BY fetched_at DESC LIMIT 1',
      [userId]
    );

    // Fetch latest LeetCode data
    const leetcodeResult = await db.query(
      'SELECT * FROM leetcode_data WHERE user_id = $1 ORDER BY fetched_at DESC LIMIT 1',
      [userId]
    );

    // Fetch recent activity
    const activityResult = await db.query(
      'SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      github: githubResult.rows[0] || null,
      leetcode: leetcodeResult.rows[0] || null,
      activity: activityResult.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/github - GitHub data only
router.get('/github', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM github_data WHERE user_id = $1 ORDER BY fetched_at DESC LIMIT 1',
      [req.user.id]
    );

    res.json({ github: result.rows[0] || null });
  } catch (err) {
    console.error('GitHub analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/leetcode - LeetCode data only
router.get('/leetcode', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM leetcode_data WHERE user_id = $1 ORDER BY fetched_at DESC LIMIT 1',
      [req.user.id]
    );

    res.json({ leetcode: result.rows[0] || null });
  } catch (err) {
    console.error('LeetCode analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/github/history - GitHub historical data
router.get('/github/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const result = await db.query(
      'SELECT total_contributions, total_stars, total_repos, current_streak, fetched_at FROM github_data WHERE user_id = $1 ORDER BY fetched_at DESC LIMIT $2',
      [req.user.id, limit]
    );

    res.json({ history: result.rows });
  } catch (err) {
    console.error('GitHub history error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/leetcode/history - LeetCode historical data
router.get('/leetcode/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const result = await db.query(
      'SELECT total_solved, easy_solved, medium_solved, hard_solved, ranking, fetched_at FROM leetcode_data WHERE user_id = $1 ORDER BY fetched_at DESC LIMIT $2',
      [req.user.id, limit]
    );

    res.json({ history: result.rows });
  } catch (err) {
    console.error('LeetCode history error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/activity - Activity log
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const result = await db.query(
      'SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [req.user.id, limit]
    );

    res.json({ activity: result.rows });
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
