const express = require('express');
const https = require('https');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// ---- GitHub Fetch Logic ----
function githubRequest(path) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'CodeBoard/1.0',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (config.github.token) {
      headers['Authorization'] = `Bearer ${config.github.token}`;
    }
    const req = https.request({ hostname: 'api.github.com', path, method: 'GET', headers }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          res.statusCode === 200 ? resolve(JSON.parse(data)) : reject(new Error(`GitHub ${res.statusCode}`));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function fetchContributions(username) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'github-contributions-api.jogruber.de',
      path: `/v4/${username}?y=last`,
      method: 'GET',
      headers: { 'User-Agent': 'CodeBoard/1.0' },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(res.statusCode === 200 ? JSON.parse(data) : { total: {}, contributions: [] }); }
        catch { resolve({ total: {}, contributions: [] }); }
      });
    });
    req.on('error', () => resolve({ total: {}, contributions: [] }));
    req.end();
  });
}

async function fetchGitHubData(username) {
  const profile = await githubRequest(`/users/${username}`);
  const repos = await githubRequest(`/users/${username}/repos?sort=updated&per_page=30`);

  let totalStars = 0, totalForks = 0;
  const langMap = {};
  repos.forEach(r => {
    totalStars += r.stargazers_count || 0;
    totalForks += r.forks_count || 0;
    if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
  });

  const topLanguages = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  const recentRepos = repos.slice(0, 10).map(r => ({
    name: r.name, description: r.description, language: r.language,
    stars: r.stargazers_count, forks: r.forks_count, url: r.html_url, updated_at: r.updated_at,
  }));

  const contribData = await fetchContributions(username);
  const totalContributions = contribData.total?.lastYear || contribData.total?.['lastYear'] || 0;
  const contributionData = (contribData.contributions || []).slice(-30).map(c => ({ date: c.date, count: c.count || 0 }));

  // Streak calculation
  const sorted = (contribData.contributions || []).filter(c => c?.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  let currentStreak = 0, longestStreak = 0, tempStreak = 0, streakActive = false;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  for (const day of sorted) {
    if (day.count > 0) {
      if (!streakActive && (day.date === today || day.date === yesterday)) streakActive = true;
      tempStreak++;
    } else {
      if (streakActive) currentStreak = tempStreak;
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
      if (streakActive) { streakActive = false; }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  if (streakActive) currentStreak = tempStreak;

  return {
    total_repos: profile.public_repos || 0, public_repos: profile.public_repos || 0,
    total_stars: totalStars, total_forks: totalForks,
    followers: profile.followers || 0, following: profile.following || 0,
    total_contributions: typeof totalContributions === 'number' ? totalContributions : 0,
    current_streak: currentStreak, longest_streak: longestStreak,
    top_languages: topLanguages, contribution_data: contributionData,
    recent_repos: recentRepos,
    profile_data: {
      name: profile.name, bio: profile.bio, avatar_url: profile.avatar_url,
      html_url: profile.html_url, location: profile.location,
      company: profile.company, blog: profile.blog, created_at: profile.created_at,
    },
  };
}

// ---- LeetCode Fetch Logic ----
function leetcodeGQL(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: 'leetcode.com', path: '/graphql', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData), 'User-Agent': 'CodeBoard/1.0', 'Referer': 'https://leetcode.com' },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const p = JSON.parse(data);
          p.errors ? reject(new Error(JSON.stringify(p.errors))) : resolve(p.data);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function fetchLeetCodeData(username) {
  const data = await leetcodeGQL(`
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking reputation starRating }
        submitStatsGlobal { acSubmissionNum { difficulty count } }
        userCalendar { submissionCalendar totalActiveDays streak }
        languageProblemCount { languageName problemsSolved }
      }
      allQuestionsCount { difficulty count }
    }
  `, { username });

  if (!data.matchedUser) throw new Error(`LeetCode user "${username}" not found`);
  const user = data.matchedUser;
  const allQ = data.allQuestionsCount || [];
  const ac = user.submitStatsGlobal?.acSubmissionNum || [];

  const totalSolved = ac.find(s => s.difficulty === 'All')?.count || 0;
  const easySolved = ac.find(s => s.difficulty === 'Easy')?.count || 0;
  const mediumSolved = ac.find(s => s.difficulty === 'Medium')?.count || 0;
  const hardSolved = ac.find(s => s.difficulty === 'Hard')?.count || 0;
  const totalQuestions = allQ.find(q => q.difficulty === 'All')?.count || 0;

  let subCal = {};
  try { subCal = JSON.parse(user.userCalendar?.submissionCalendar || '{}'); } catch { subCal = {}; }

  const now = Math.floor(Date.now() / 1000);
  const recentSubmissions = Object.entries(subCal)
    .filter(([ts]) => parseInt(ts) >= now - 30 * 86400)
    .map(([ts, count]) => ({ date: new Date(parseInt(ts) * 1000).toISOString().split('T')[0], count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_solved: totalSolved, easy_solved: easySolved, medium_solved: mediumSolved, hard_solved: hardSolved,
    total_questions: totalQuestions, acceptance_rate: totalQuestions > 0 ? parseFloat(((totalSolved / totalQuestions) * 100).toFixed(2)) : 0,
    ranking: user.profile?.ranking || 0, contribution_points: user.profile?.reputation || 0,
    reputation: user.profile?.reputation || 0, submission_calendar: subCal, recent_submissions: recentSubmissions,
    skills_data: { languages: (user.languageProblemCount || []).slice(0, 10), totalActiveDays: user.userCalendar?.totalActiveDays || 0, streak: user.userCalendar?.streak || 0 },
  };
}

// ---- SYNC ENDPOINT ----
router.post('/now', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await db.query(
      'SELECT github_username, leetcode_username FROM users WHERE id = $1', [userId]
    );

    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = userResult.rows[0];
    const results = { github: null, leetcode: null, errors: [] };

    // Fetch GitHub
    if (user.github_username) {
      try {
        const ghData = await fetchGitHubData(user.github_username);
        await db.query(
          `INSERT INTO github_data (user_id, total_repos, public_repos, total_stars, total_forks, followers, following,
            total_contributions, current_streak, longest_streak, top_languages, contribution_data, recent_repos, profile_data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [userId, ghData.total_repos, ghData.public_repos, ghData.total_stars, ghData.total_forks,
            ghData.followers, ghData.following, ghData.total_contributions, ghData.current_streak,
            ghData.longest_streak, JSON.stringify(ghData.top_languages), JSON.stringify(ghData.contribution_data),
            JSON.stringify(ghData.recent_repos), JSON.stringify(ghData.profile_data)]
        );
        if (ghData.profile_data?.avatar_url) {
          await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [ghData.profile_data.avatar_url, userId]);
        }
        await db.query(`INSERT INTO activity_log (user_id, platform, action, status, details) VALUES ($1, 'github', 'manual_sync', 'success', $2)`,
          [userId, JSON.stringify({ repos: ghData.total_repos, stars: ghData.total_stars })]);
        results.github = 'success';
      } catch (err) {
        results.errors.push(`GitHub: ${err.message}`);
        await db.query(`INSERT INTO activity_log (user_id, platform, action, status, details) VALUES ($1, 'github', 'manual_sync', 'error', $2)`,
          [userId, JSON.stringify({ error: err.message })]);
      }
    }

    // Fetch LeetCode
    if (user.leetcode_username) {
      try {
        const lcData = await fetchLeetCodeData(user.leetcode_username);
        await db.query(
          `INSERT INTO leetcode_data (user_id, total_solved, easy_solved, medium_solved, hard_solved, total_questions,
            acceptance_rate, ranking, contribution_points, reputation, submission_calendar, recent_submissions, skills_data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [userId, lcData.total_solved, lcData.easy_solved, lcData.medium_solved, lcData.hard_solved,
            lcData.total_questions, lcData.acceptance_rate, lcData.ranking, lcData.contribution_points,
            lcData.reputation, JSON.stringify(lcData.submission_calendar), JSON.stringify(lcData.recent_submissions),
            JSON.stringify(lcData.skills_data)]
        );
        await db.query(`INSERT INTO activity_log (user_id, platform, action, status, details) VALUES ($1, 'leetcode', 'manual_sync', 'success', $2)`,
          [userId, JSON.stringify({ total_solved: lcData.total_solved, ranking: lcData.ranking })]);
        results.leetcode = 'success';
      } catch (err) {
        results.errors.push(`LeetCode: ${err.message}`);
        await db.query(`INSERT INTO activity_log (user_id, platform, action, status, details) VALUES ($1, 'leetcode', 'manual_sync', 'error', $2)`,
          [userId, JSON.stringify({ error: err.message })]);
      }
    }

    res.json({ message: 'Sync completed!', results });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

module.exports = router;
