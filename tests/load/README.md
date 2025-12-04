# Load Testing with K6

## Installation

```bash
# Windows (using Chocolatey)
choco install k6

# Or download from: https://k6.io/docs/get-started/installation/
```

## Running Tests Locally

### Smoke Test (Quick validation)
```bash
k6 run tests/load/smoke-test.js
```

### Full Load Test
```bash
k6 run tests/load/load-test.js
```

### Against Custom Environment
```bash
k6 run -e BASE_URL=http://129.212.208.28 tests/load/load-test.js
```

## Test Scenarios

### 1. Smoke Test (`smoke-test.js`)
- **Purpose**: Quick validation that system works
- **Load**: 1 user for 30 seconds
- **Use**: After deployments to verify basic functionality

### 2. Load Test (`load-test.js`)
- **Purpose**: Performance testing under realistic load
- **Stages**:
  - Ramp up: 0 → 10 users (1 min)
  - Ramp up: 10 → 50 users (3 min)
  - Steady state: 50 users (2 min)
  - Spike: 50 → 100 users (1 min)
  - Ramp down: 100 → 0 users (2 min)
- **Total Duration**: ~9 minutes
- **Use**: Before production deployments

## Thresholds

### Load Test
- **Response Time**: 95% of requests < 500ms
- **Error Rate**: < 5% failures
- **Custom Errors**: < 10% application errors

### Smoke Test
- **Response Time**: 95% of requests < 1000ms
- **Error Rate**: < 1% failures

## CI/CD Integration

Tests run automatically in staging pipeline:
1. Deploy to staging
2. Run smoke test (30s validation)
3. Run load test (9min performance test)
4. Generate HTML report
5. Fail pipeline if thresholds not met

## Metrics Collected

- **http_req_duration**: Request response time
- **http_req_failed**: Failed request rate
- **http_reqs**: Total HTTP requests
- **vus**: Virtual users
- **iterations**: Completed test iterations

## Example Output

```
scenarios: (100.00%) 1 scenario, 100 max VUs, 10m30s max duration
default: Up to 100 looping VUs for 9m0s over 5 stages

✓ homepage status is 200
✓ health endpoint is 200
✓ incidents endpoint is 200

checks.........................: 95.00% ✓ 4560  ✗ 240
data_received..................: 1.2 MB 2.2 kB/s
http_req_duration..............: avg=145ms min=50ms med=120ms max=850ms p(95)=450ms
http_req_failed................: 3.00%  ✓ 48    ✗ 1552
http_reqs......................: 1600   2.96/s
```

## Customization

Edit `load-test.js` to adjust:
- **Virtual users**: Change `target` in stages
- **Duration**: Change `duration` in stages
- **Endpoints**: Add/remove test scenarios
- **Thresholds**: Adjust performance requirements
