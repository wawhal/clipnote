# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized in `/tests` directory mirroring the `/src` structure:

```
tests/
├── setup.ts           # Jest configuration and Chrome API mocks
└── utils/
    └── helpers.test.ts  # Tests for utility functions
```

## Writing Tests

### Unit Tests

Create test files with `.test.ts` or `.spec.ts` suffix:

```typescript
import { myFunction } from '../../src/utils/myModule';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Mocking Chrome APIs

Chrome APIs are mocked globally in `tests/setup.ts`. You can customize mocks per test:

```typescript
beforeEach(() => {
  (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
});
```

## Code Coverage

Coverage reports are generated in `/coverage` directory. Aim for:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

Tests run automatically on:
- Pre-commit (if git hooks configured)
- Pull requests
- Before production builds

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should describe behavior
3. **Coverage**: Test happy paths and edge cases
4. **Mocking**: Mock external dependencies (Chrome APIs, DB)
5. **Speed**: Keep tests fast (<5s total suite time)

## Debugging Tests

```bash
# Run specific test file
npm test -- helpers.test.ts

# Run with verbose output
npm test -- --verbose

# Debug in VS Code
# Use "Jest: Debug" launch configuration
```
