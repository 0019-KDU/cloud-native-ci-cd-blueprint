import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Load test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Spike to 100 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate should be below 5%
    errors: ['rate<0.1'],              // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://129.212.208.28';

export default function () {
  // Test 1: Homepage
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  sleep(1);

  // Test 2: API Health Check
  res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'health endpoint is 200': (r) => r.status === 200,
    'health response is valid': (r) => r.body.includes('status'),
  }) || errorRate.add(1);
  sleep(1);

  // Test 3: Get Incidents List
  res = http.get(`${BASE_URL}/api/incidents`);
  check(res, {
    'incidents endpoint is 200': (r) => r.status === 200,
    'incidents returns array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
  sleep(1);

  // Test 4: Get Analytics Data
  res = http.get(`${BASE_URL}/api/analytics/overview`);
  check(res, {
    'analytics endpoint is 200': (r) => r.status === 200,
    'analytics has totalIncidents': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.hasOwnProperty('totalIncidents');
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
  sleep(2);
}

// Setup function (runs once per VU at the start)
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  
  // Verify backend is reachable
  const res = http.get(`${BASE_URL}/api/health`);
  if (res.status !== 200) {
    throw new Error(`Backend not healthy: ${res.status}`);
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Load test completed');
}
