/**
 * LeetCode Data Fetcher
 * Uses LeetCode's public GraphQL API endpoint
 * 
 * API: https://leetcode.com/graphql  (no auth needed for public profiles)
 * This is the official GraphQL endpoint that LeetCode's own frontend uses.
 */
const https = require('https');

function leetcodeGraphQL(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });

    const options = {
      hostname: 'leetcode.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'CodeBoard-Worker/1.0',
        'Referer': 'https://leetcode.com',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors) {
            reject(new Error(`LeetCode GraphQL Error: ${JSON.stringify(parsed.errors)}`));
          } else {
            resolve(parsed.data);
          }
        } catch (e) {
          reject(new Error(`LeetCode parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function fetchLeetCodeData(username) {
  console.log(`📡 Fetching LeetCode data for: ${username}`);

  try {
    // Query 1: User profile and problem stats
    const profileQuery = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            aboutMe
            ranking
            reputation
            starRating
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          userCalendar {
            submissionCalendar
            totalActiveDays
            streak
          }
          languageProblemCount {
            languageName
            problemsSolved
          }
        }
        allQuestionsCount {
          difficulty
          count
        }
      }
    `;

    const data = await leetcodeGraphQL(profileQuery, { username });

    if (!data.matchedUser) {
      throw new Error(`LeetCode user "${username}" not found`);
    }

    const user = data.matchedUser;
    const allQuestions = data.allQuestionsCount || [];

    // Parse submission stats
    const acStats = user.submitStatsGlobal?.acSubmissionNum || [];
    const totalSolved = acStats.find(s => s.difficulty === 'All')?.count || 0;
    const easySolved = acStats.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = acStats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = acStats.find(s => s.difficulty === 'Hard')?.count || 0;

    const totalQuestions = allQuestions.find(q => q.difficulty === 'All')?.count || 0;

    // Parse submission calendar
    let submissionCalendar = {};
    try {
      submissionCalendar = JSON.parse(user.userCalendar?.submissionCalendar || '{}');
    } catch (e) {
      submissionCalendar = {};
    }

    // Get recent submissions (last 30 days from calendar)
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const recentSubmissions = Object.entries(submissionCalendar)
      .filter(([ts]) => parseInt(ts) >= thirtyDaysAgo)
      .map(([timestamp, count]) => ({
        date: new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0],
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate acceptance rate
    const acceptanceRate = totalQuestions > 0
      ? parseFloat(((totalSolved / totalQuestions) * 100).toFixed(2))
      : 0;

    // Language skills
    const skillsData = {
      languages: (user.languageProblemCount || []).slice(0, 10),
      totalActiveDays: user.userCalendar?.totalActiveDays || 0,
      streak: user.userCalendar?.streak || 0,
    };

    const result = {
      total_solved: totalSolved,
      easy_solved: easySolved,
      medium_solved: mediumSolved,
      hard_solved: hardSolved,
      total_questions: totalQuestions,
      acceptance_rate: acceptanceRate,
      ranking: user.profile?.ranking || 0,
      contribution_points: user.profile?.reputation || 0,
      reputation: user.profile?.reputation || 0,
      submission_calendar: submissionCalendar,
      recent_submissions: recentSubmissions,
      skills_data: skillsData,
    };

    console.log(`✅ LeetCode data fetched for ${username}: ${totalSolved} solved (E:${easySolved} M:${mediumSolved} H:${hardSolved})`);
    return result;
  } catch (err) {
    console.error(`❌ LeetCode fetch error for ${username}:`, err.message);
    throw err;
  }
}

module.exports = { fetchLeetCodeData };
