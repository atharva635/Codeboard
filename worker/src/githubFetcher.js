/**
 * GitHub Data Fetcher
 * Uses GitHub REST API v3 (no auth needed for public data, optional token for higher rate limits)
 * 
 * API Docs: https://docs.github.com/en/rest
 * Rate Limits: 60 req/hr (unauthenticated) | 5,000 req/hr (authenticated)
 */
const https = require('https');
const config = require('./config');

function githubRequest(path) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'CodeBoard-Worker/1.0',
      'Accept': 'application/vnd.github.v3+json',
    };

    if (config.github.token) {
      headers['Authorization'] = `Bearer ${config.github.token}`;
    }

    const options = {
      hostname: 'api.github.com',
      path,
      method: 'GET',
      headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Fetch contribution data from GitHub's contribution page (using GraphQL-like scraping)
function fetchContributions(username) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'github-contributions-api.jogruber.de',
      path: `/v4/${username}?y=last`,
      method: 'GET',
      headers: { 'User-Agent': 'CodeBoard-Worker/1.0' },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            resolve({ total: {}, contributions: [] });
          }
        } catch (e) {
          resolve({ total: {}, contributions: [] });
        }
      });
    });

    req.on('error', () => resolve({ total: {}, contributions: [] }));
    req.end();
  });
}

function calculateStreak(contributions) {
  if (!contributions || !Array.isArray(contributions)) return { current: 0, longest: 0 };

  // Sort contributions by date descending
  const sorted = contributions
    .filter(c => c && c.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check if today or yesterday has contributions (current streak)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let streakActive = false;
  for (const day of sorted) {
    if (day.count > 0) {
      if (!streakActive && (day.date === today || day.date === yesterday)) {
        streakActive = true;
      }
      if (streakActive || currentStreak === 0) {
        tempStreak++;
      }
    } else {
      if (streakActive) {
        currentStreak = tempStreak;
        streakActive = false;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  if (streakActive) currentStreak = tempStreak;

  return { current: currentStreak, longest: longestStreak };
}

async function fetchGitHubData(username) {
  console.log(`📡 Fetching GitHub data for: ${username}`);

  try {
    // Fetch user profile
    const profile = await githubRequest(`/users/${username}`);

    // Fetch repos (sorted by updated, max 30)
    const repos = await githubRequest(`/users/${username}/repos?sort=updated&per_page=30`);

    // Calculate stats from repos
    let totalStars = 0;
    let totalForks = 0;
    const languageMap = {};

    const recentRepos = repos.slice(0, 10).map(repo => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      updated_at: repo.updated_at,
    }));

    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) {
        languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
      }
    });

    // Top languages
    const topLanguages = Object.entries(languageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // Fetch contributions
    const contribData = await fetchContributions(username);
    const totalContributions = contribData.total?.lastYear || contribData.total?.['lastYear'] || 0;
    
    // Build contribution chart data (last 30 days)
    const contributionData = (contribData.contributions || [])
      .slice(-30)
      .map(c => ({ date: c.date, count: c.count || 0 }));

    // Calculate streaks
    const streaks = calculateStreak(contribData.contributions || []);

    const result = {
      total_repos: profile.public_repos || 0,
      public_repos: profile.public_repos || 0,
      total_stars: totalStars,
      total_forks: totalForks,
      followers: profile.followers || 0,
      following: profile.following || 0,
      total_contributions: typeof totalContributions === 'number' ? totalContributions : 0,
      current_streak: streaks.current,
      longest_streak: streaks.longest,
      top_languages: topLanguages,
      contribution_data: contributionData,
      recent_repos: recentRepos,
      profile_data: {
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        html_url: profile.html_url,
        location: profile.location,
        company: profile.company,
        blog: profile.blog,
        created_at: profile.created_at,
      },
    };

    console.log(`✅ GitHub data fetched for ${username}: ${result.total_repos} repos, ${result.total_stars} stars`);
    return result;
  } catch (err) {
    console.error(`❌ GitHub fetch error for ${username}:`, err.message);
    throw err;
  }
}

module.exports = { fetchGitHubData };
