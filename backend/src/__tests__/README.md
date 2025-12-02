# Test Coverage Report

Test coverage for AI Incident Assistant Backend

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for CI/CD
npm run test:ci
```

## Coverage Requirements

The project enforces 80% code coverage across:
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

## Test Structure

```
backend/src/__tests__/
├── config/
│   └── env.test.js           # Configuration tests
├── controllers/
│   └── incidents.controller.test.js  # HTTP controller tests
├── db/
│   └── index.test.js         # Database connection tests
├── middlewares/
│   └── errorHandler.test.js  # Error middleware tests
└── services/
    ├── ai.service.test.js     # AI integration tests
    └── incidents.service.test.js  # Business logic tests
```

## Test Categories

### Unit Tests
- **Services**: Business logic and AI integration
- **Controllers**: HTTP request/response handling
- **Middleware**: Error handling and logging
- **Database**: Connection and query execution
- **Configuration**: Environment variable loading

### Integration Tests
- API endpoint testing with supertest
- Database interaction mocking
- External service mocking (OpenAI)

## Mocking Strategy

### External Dependencies
- **OpenAI API**: Mocked to avoid API costs
- **PostgreSQL**: Mocked for isolated testing
- **File System**: Mocked for logger tests

### Test Data
- Realistic incident scenarios
- Various error conditions
- Edge cases and boundary conditions

## Coverage Report

After running tests, view the coverage report:

```bash
# HTML report
open coverage/lcov-report/index.html

# Terminal summary
npm test
```

## CI/CD Integration

Tests run automatically on:
- Every pull request
- Merge to main branch
- Pre-deployment checks

Coverage thresholds must be met for builds to pass.
