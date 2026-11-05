import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 250 },
    { duration: '30s', target: 500 },
    { duration: '20s', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
    http_req_failed: ['rate<0.02']     // Error rate should be less than 2%
  }
};

const BASE_URL = 'http://localhost:5000';

export default function () {
  // 1. Student Login
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      identifier: '01711223344',
      password: 'password123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, { 'login status is 200': (r) => r.status === 200 });

  const token = loginRes.json('token');
  const headers = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  sleep(1);

  // 2. Load Feed
  const feedRes = http.get(`${BASE_URL}/questions`, { headers });
  check(feedRes, { 'feed status is 200': (r) => r.status === 200 });

  const questions = feedRes.json('questions') || [];

  // 3. Open 2-3 questions
  for (let i = 0; i < Math.min(3, questions.length); i++) {
    const qId = questions[i]._id;
    const detailRes = http.get(`${BASE_URL}/questions/${qId}`, { headers });
    check(detailRes, { 'question detail 200': (r) => r.status === 200 });
    sleep(0.5);
  }

  // 4. Occasional Like (50% probability)
  if (questions.length > 0 && Math.random() > 0.5) {
    const qId = questions[0]._id;
    http.post(`${BASE_URL}/like/question/${qId}`, null, { headers });
  }

  // 5. Occasional Comment (25% probability)
  if (questions.length > 0 && Math.random() > 0.75) {
    const qId = questions[0]._id;
    http.post(
      `${BASE_URL}/questions/${qId}/answers`,
      JSON.stringify({ text: 'ধন্যবাদ শিক্ষক, সমাধানটি বুঝতে পেরেছি।' }),
      { headers }
    );
  }

  sleep(2);
}
