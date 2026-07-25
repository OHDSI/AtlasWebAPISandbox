# Test Structure Guide

This directory contains unit tests for the cohort-editor application.

## Directory Structure

```
tests/
├── unit/                              # Unit tests using Vitest
│   ├── cohortExpression.validation.spec.ts  # JSON validation tests
│   ├── testHelpers.ts                 # Shared utility functions
│   └── [other test files]
└── resources/                         # Test data and fixtures
    └── cohort-expressions/            # Sample JSON files for validation
        ├── simple-condition.json      # Valid cohort expression (basic)
        ├── drug-with-demographics.json # Valid cohort expression (complex)
        └── invalid-cohort.json        # Invalid cohort for error testing
```

## Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests once (CI mode)
npm run test:unit:run

# Run a specific test file
npm run test:unit:run tests/unit/cohortExpression.validation.spec.ts

# Run tests in watch mode with UI
npm run test:unit -- --ui
```

## Test Patterns

### 1. Loading Test Resources

Use the helper function to load JSON files from `tests/resources/`:

```typescript
import { loadJsonResource } from './testHelpers'

const cohort = loadJsonResource('cohort-expressions/simple-condition.json')
```

### 2. Validating JSON Against Zod Schemas

Use `safeParse()` for graceful error handling:

```typescript
import { loadJsonResource, validateJson } from './testHelpers'
import { CohortExpressionSchema } from '../../src/cohort-editor/circe.types'

const json = loadJsonResource('cohort-expressions/simple-condition.json')
const result = validateJson(json, CohortExpressionSchema)

if (result.success) {
  console.log('Valid cohort:', result.data)
} else {
  console.log('Validation errors:', result.error.issues)
}
```

### 3. Testing Validation Errors

Check that invalid JSON is properly rejected:

```typescript
it('should reject invalid cohort', () => {
  const json = loadJsonResource('cohort-expressions/invalid-cohort.json')
  const result = validateJson(json, CohortExpressionSchema)

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues.length).toBeGreaterThan(0)
  }
})
```

### 4. Using Nested Structures

Vitest's test discovery and Zod's recursive schemas work together:

```typescript
describe('Complex Structures', () => {
  it('should handle nested criteria groups', () => {
    const complexCohort = {
      Title: 'Test',
      AdditionalCriteria: {
        Type: 'ALL',
        Groups: [
          {
            Type: 'ANY',
            CriteriaList: [/* ... */]
          }
        ]
      }
    }

    const result = validateJson(complexCohort, CohortExpressionSchema)
    expect(result.success).toBe(true)
  })
})
```

## Adding Test Data

To add new test JSON files:

1. Create a JSON file in `tests/resources/cohort-expressions/`
2. Ensure it matches the expected structure (or is intentionally invalid for error testing)
3. Reference it in your test using `loadJsonResource()`

Example:
```json
{
  "Title": "My Test Cohort",
  "PrimaryCriteria": {
    "CriteriaList": [
      {
        "ConditionOccurrence": {
          "CodesetId": 1
        }
      }
    ]
  }
}
```

## Schema Validation Features

The tests validate:

✅ **Dual-field concept references**: `DrugType` (array) and `DrugTypeCS` (codesetId) as independent fields  
✅ **Polymorphic criteria unions**: `Criteria` wrapper types like `{ ConditionOccurrence: {...} }`  
✅ **Recursive structures**: Nested `CriteriaGroup` with nested criteria  
✅ **Enum constraints**: `Type` field restricted to `'ALL' | 'ANY' | 'AT_LEAST' | 'AT_MOST'`  
✅ **Type coercion rejection**: String/boolean mismatches caught at validation time  

## Troubleshooting

**Tests not finding resources?**
- Ensure the `tests/resources/` directory exists
- Check file paths are relative to `tests/resources/`

**Zod validation passing when it shouldn't?**
- Zod allows extra properties by default - this is intentional for forward compatibility
- Use `.strict()` on schemas if you need to reject unknown fields

**Union errors showing as single "invalid_union" error?**
- This is Zod's default behavior - use `result.error.issues` to inspect detailed errors
- See `testHelpers.ts` for utilities to drill into nested errors

## Best Practices

1. **Keep test JSON files small and focused** - One file per scenario
2. **Name files descriptively** - `drug-with-demographics.json` vs `test.json`
3. **Use `safeParse()` in tests** - Never let validation errors crash your test
4. **Check `result.success` before accessing data** - TypeScript will guide you
5. **Test both valid and invalid cases** - Validation is bidirectional

## Helper Functions

See `testHelpers.ts` for utility functions:

- `loadJsonResource(filename)` - Load JSON from test resources
- `validateJson(json, schema)` - Validate with error handling
- `validateJsonOrThrow(json, schema)` - Validate and throw on error
- `loadAndValidateResource(filename, schema)` - One-step load + validate
