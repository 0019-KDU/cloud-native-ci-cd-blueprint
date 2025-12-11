import http from 'k6/http';
import { check, sleep } from 'k6';

// Smoke test configuration - minimal load to verify functionality
export const options = {
  vus: 1,                    // 1 virtual user
  duration: '30s',           // Run for 30 seconds
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
    http_req_failed: ['rate<0.01'],    // Error rate should be below 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://129.212.208.28';

export default function () {
  // Test critical paths only
  const endpoints = [
    { url: '/', name: 'Homepage' },
    { url: '/api', name: 'Health Check' },
    { url: '/api/incidents', name: 'Incidents API' },
    { url: '/api/analytics/overview', name: 'Analytics API' },
  ];

  endpoints.forEach(endpoint => {
    const res = http.get(`${BASE_URL}${endpoint.url}`);
    check(res, {
      [`${endpoint.name} status is 200`]: (r) => r.status === 200,
    });
    sleep(0.5);
  });
}
