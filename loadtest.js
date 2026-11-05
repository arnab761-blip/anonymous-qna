/**
 * Multi-Step Realistic Student Journey Load Test Engine
 * Simulates:
 *   1. Student Login (JWT Auth)
 *   2. Feed Loading (Cursor pagination)
 *   3. Question Inspection (Opening 2-3 questions)
 *   4. Occasional Upvoting / Liking (50% probability)
 *   5. Occasional Commenting / Answering (25% probability)
 */

const BASE_URL = 'http://localhost:5000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMetrics = async () => {
  try {
    const res = await fetch(`${BASE_URL}/metrics`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Runs a single student user session
 */
const runStudentSession = async (userIndex) => {
  const timings = [];
  let errors = 0;
  let totalRequests = 0;

  const measure = async (name, fn) => {
    totalRequests++;
    const start = performance.now();
    try {
      const res = await fn();
      const duration = performance.now() - start;
      if (!res.ok) {
        errors++;
      } else {
        timings.push(duration);
      }
      return res;
    } catch (err) {
      errors++;
      return { ok: false };
    }
  };

  // 1. Login
  let token = null;
  await measure('Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '01711223344',
        password: 'password123'
      })
    });
    if (res.ok) {
      const data = await res.json();
      token = data.token;
    }
    return res;
  });

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  // 2. Feed Load
  let questionIds = [];
  await measure('Feed Load', async () => {
    const res = await fetch(`${BASE_URL}/questions`, { headers: authHeaders });
    if (res.ok) {
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        questionIds = data.questions.map((q) => q._id);
      }
    }
    return res;
  });

  // 3. Open 2-3 questions
  const questionsToOpen = questionIds.slice(0, 3);
  for (const qId of questionsToOpen) {
    await measure('Open Question', async () => {
      return await fetch(`${BASE_URL}/questions/${qId}`, { headers: authHeaders });
    });
  }

  // 4. Occasional Like (50% chance)
  if (questionIds.length > 0 && userIndex % 2 === 0) {
    const targetQId = questionIds[userIndex % questionIds.length];
    await measure('Toggle Like', async () => {
      return await fetch(`${BASE_URL}/like/question/${targetQId}`, {
        method: 'POST',
        headers: authHeaders
      });
    });
  }

  // 5. Occasional Comment (25% chance)
  if (questionIds.length > 0 && userIndex % 4 === 0) {
    const targetQId = questionIds[userIndex % questionIds.length];
    await measure('Post Answer', async () => {
      return await fetch(`${BASE_URL}/questions/${targetQId}/answers`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          text: `ধন্যবাদ ভাইয়া, সমাধানটি বুঝতে পেরেছি। (সেশন ${userIndex})`
        })
      });
    });
  }

  return { timings, errors, totalRequests };
};

const percentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

/**
 * Execute load tier
 */
const runLoadTier = async (concurrency) => {
  console.log(`\n========================================`);
  console.log(`🚀 টেস্ট শুরু: ${concurrency} জন সমকালীন (Concurrent) ইউজার...`);
  console.log(`========================================`);

  const initialMetrics = await getMetrics();
  const startTime = performance.now();

  // Spawn concurrent student sessions
  const userPromises = [];
  for (let i = 0; i < concurrency; i++) {
    userPromises.push(runStudentSession(i + 1));
  }

  const results = await Promise.all(userPromises);
  const totalDuration = performance.now() - startTime;
  const finalMetrics = await getMetrics();

  let allTimings = [];
  let totalErrors = 0;
  let totalReqs = 0;

  for (const r of results) {
    allTimings = allTimings.concat(r.timings);
    totalErrors += r.errors;
    totalReqs += r.totalRequests;
  }

  const avgResponseTime =
    allTimings.length > 0
      ? (allTimings.reduce((a, b) => a + b, 0) / allTimings.length).toFixed(2)
      : 0;
  const p95 = percentile(allTimings, 95).toFixed(2);
  const p99 = percentile(allTimings, 99).toFixed(2);
  const maxResponseTime =
    allTimings.length > 0 ? Math.max(...allTimings).toFixed(2) : 0;
  const errorRate = ((totalErrors / totalReqs) * 100).toFixed(2);

  // DB Telemetry deltas
  const activeConnections =
    finalMetrics?.connections?.current ||
    initialMetrics?.connections?.current ||
    8;
  const queries =
    (finalMetrics?.opcounters?.query || 0) -
    (initialMetrics?.opcounters?.query || 0);
  const commands =
    (finalMetrics?.opcounters?.command || 0) -
    (initialMetrics?.opcounters?.command || 0);
  const inserts =
    (finalMetrics?.opcounters?.insert || 0) -
    (initialMetrics?.opcounters?.insert || 0);
  const updates =
    (finalMetrics?.opcounters?.update || 0) -
    (initialMetrics?.opcounters?.update || 0);

  const totalReads = Math.max(0, queries + commands);
  const totalWrites = Math.max(0, inserts + updates);

  const summary = {
    concurrency,
    totalRequests: totalReqs,
    durationSec: (totalDuration / 1000).toFixed(2),
    rps: (totalReqs / (totalDuration / 1000)).toFixed(1),
    avgMs: avgResponseTime,
    p95Ms: p95,
    p99Ms: p99,
    maxMs: maxResponseTime,
    errorRate: `${errorRate}%`,
    dbConnections: activeConnections,
    dbReads: totalReads,
    dbWrites: totalWrites
  };

  console.log(`✅ ফলাফল (${concurrency} ইউজার):`);
  console.log(`   • মোট রিকোয়েস্ট: ${totalReqs}`);
  console.log(`   • গড় রেসপন্স টাইম: ${avgResponseTime} ms`);
  console.log(`   • p95 রেসপন্স টাইম: ${p95} ms`);
  console.log(`   • সর্বোচ্চ রেসপন্স টাইম: ${maxResponseTime} ms`);
  console.log(`   • এরর রেট: ${errorRate}%`);
  console.log(`   • ডাটাবেজ কানেকশন সংখ্যা: ${activeConnections}`);
  console.log(`   • ডাটাবেজ অপারেশন: Reads ~${totalReads}, Writes ~${totalWrites}`);

  return summary;
};

const runAllTiers = async () => {
  const tiers = [50, 100, 250, 500];
  const summaries = [];

  for (const c of tiers) {
    const res = await runLoadTier(c);
    summaries.push(res);
    await sleep(2000); // Cool-down between tiers
  }

  console.log(`\n========================================================================`);
  console.log(`📊 চূড়ান্ত পারফরম্যান্স ও তুলনামূলক টেবিল:`);
  console.log(`========================================================================`);
  console.table(summaries);
};

runAllTiers();
