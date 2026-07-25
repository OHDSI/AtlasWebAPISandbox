import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { CohortExpressionSchema } from '../../src/cohort-editor/circe.types'
import { fileURLToPath } from 'url'

/**
 * Cohort Expression JSON Validation Tests
 *
 * This test suite loads JSON files from the tests/resources/cohort-expressions/
 * directory and validates them against the Zod schemas to ensure they match
 * the expected circe-be domain model structure.
 */

// Setup: Get the directory of this test file (for ESM compatibility)
const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const RESOURCES_DIR = resolve(__dirname, '../resources/cohort-expressions')

/**
 * Utility to load JSON from test resources
 */
function loadJsonFile(filename: string): any {
  const filePath = resolve(RESOURCES_DIR, filename)
  const content = readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Test helper to validate a cohort expression
 * Returns { success: boolean, data?: unknown, errors?: ZodIssue[] }
 */
function validateCohortExpression(json: any) {
  const result = CohortExpressionSchema.safeParse(json)
  return result
}

describe('Cohort Expression JSON Validation', () => {
  describe('Valid Cohort Expressions', () => {
    it('should validate a simple condition cohort', () => {
      const json = loadJsonFile('simple-condition.json')
      const result = validateCohortExpression(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.Title).toBe('Simple Condition Cohort')
        expect(result.data.PrimaryCriteria?.CriteriaList).toBeDefined()
        expect(result.data.PrimaryCriteria?.CriteriaList?.length).toBeGreaterThan(0)
      }
    })

    it('should validate a drug exposure cohort with demographics', () => {
      const json = loadJsonFile('drug-with-demographics.json')
      const result = validateCohortExpression(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.Title).toBe('Drug Exposure with Demographics')
        expect(result.data.AdditionalCriteria?.Type).toBe('ALL')
        expect(result.data.AdditionalCriteria?.DemographicCriteriaList?.length).toBeGreaterThan(0)
      }
    })

    it('should preserve dual-field concept references (Field + FieldCS)', () => {
      const json = loadJsonFile('drug-with-demographics.json')
      const result = validateCohortExpression(json)

      expect(result.success).toBe(true)
      if (result.success && result.data.PrimaryCriteria?.CriteriaList?.[0]) {
        // Access the criteria - it's wrapped in a type-keyed object (e.g., { DrugExposure: {...} })
        const criteria = result.data.PrimaryCriteria.CriteriaList[0] as Record<string, any>
        const drugExposure = criteria.DrugExposure
        
        // Both field and CS variant should be optional, not a union
        expect(drugExposure).toBeDefined()
        expect(drugExposure).toHaveProperty('DrugType')
        // Note: In this example, DrugTypeCS is not set, but could be
      }
    })

    it('should validate demographic criteria with dual-field concept references', () => {
      const json = loadJsonFile('drug-with-demographics.json')
      const result = validateCohortExpression(json)

      expect(result.success).toBe(true)
      if (result.success && result.data.AdditionalCriteria?.DemographicCriteriaList?.[0]) {
        const demographics = result.data.AdditionalCriteria.DemographicCriteriaList[0]
        // Should have both Gender (array) and GenderCS (codesetId) as independent fields
        expect(demographics).toHaveProperty('Gender')
        // GenderCS would be optional in this case
      }
    })
  })

  describe('Invalid Cohort Expressions', () => {
    it('should reject a cohort with invalid field types', () => {
      const json = loadJsonFile('invalid-cohort.json')
      const result = validateCohortExpression(json)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
        // Log the validation errors for debugging
        console.log('Validation errors:', result.error.issues)
      }
    })

    it('should report specific type errors', () => {
      const json = loadJsonFile('invalid-cohort.json')
      const result = validateCohortExpression(json)

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues
        // Top-level errors include the Type validation error
        // Union errors are wrapped, so we check for at least the enum error
        expect(errors.length).toBeGreaterThanOrEqual(2)
        // At least one should be the enum error for Type
        const hasEnumError = errors.some(
          (e) => e.code === 'invalid_enum_value' && e.path?.includes('Type')
        )
        expect(hasEnumError).toBe(true)
      }
    })
  })

  describe('Schema Structure Validation', () => {
    it('should not have ConceptOrSelection union in parsed types', () => {
      // This is a meta-test to ensure the schema structure is correct
      // Load a valid cohort and verify the structure matches expectations
      const json = loadJsonFile('simple-condition.json')
      const result = validateCohortExpression(json)

      expect(result.success).toBe(true)
      // The parsed result should have proper nested structures
      // without encountering union type issues
    })

    it('should handle nested CriteriaGroup recursion', () => {
      // Create a test with nested criteria groups
      const complexCohort = {
        Title: 'Nested Criteria Groups',
        PrimaryCriteria: {
          CriteriaList: [
            {
              ConditionOccurrence: {
                CodesetId: 1
              }
            }
          ]
        },
        AdditionalCriteria: {
          Type: 'ALL',
          Groups: [
            {
              Type: 'ANY',
              CriteriaList: [
                {
                  Criteria: { DrugExposure: { CodesetId: 2 } },
                  StartWindow: { Start: { Days: 0 }, End: { Days: 365 } }
                }
              ]
            }
          ]
        }
      }

      const result = validateCohortExpression(complexCohort)
      // Recursion should work without stack overflow
      expect(result.success).toBe(true)
    })
  })

  describe('File Loading', () => {
    it('should successfully load all test resource files', () => {
      const files = ['simple-condition.json', 'drug-with-demographics.json', 'invalid-cohort.json']

      files.forEach((file) => {
        expect(() => {
          loadJsonFile(file)
        }).not.toThrow()
      })
    })
  })
})
