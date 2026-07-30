import { describe, it, expect } from 'vitest'
import type { CohortExpression } from '../../src/cohort-editor/circe.types'
import { findUsedConceptSetIds, unassignConceptSetId } from '../../src/cohort-editor/concept-set-usage'

/**
 * Builds a CohortExpression that exercises every kind of schema shape the walker
 * has to traverse: polymorphic Criteria union (PrimaryCriteria, nested groups,
 * CensoringCriteria), recursive CriteriaGroup/Groups nesting, the WindowedCriteria +
 * Occurrence intersection (CorrelatedCriteria), DemographicCriteriaList, InclusionRules,
 * and the EndStrategy union (CustomEra).
 */
function buildExpression(): CohortExpression {
  return {
    Title: 'Walker Test Cohort',
    PrimaryCriteria: {
      CriteriaList: [
        {
          DrugExposure: {
            CodesetId: 1,
            GenderCS: { CodesetId: 2, IsExclusion: false },
          },
        },
      ],
    },
    AdditionalCriteria: {
      Type: 'ALL',
      CriteriaList: [
        {
          Criteria: { Death: { CodesetId: 3, DeathSourceConcept: 4 } },
          StartWindow: { Start: { Days: 0, Coeff: -1 }, End: { Days: 0, Coeff: 1 } },
          Occurrence: { Type: 2, Count: 1 },
        },
      ],
      DemographicCriteriaList: [{ GenderCS: { CodesetId: 5 } }],
      Groups: [
        {
          Type: 'ANY',
          CriteriaList: [
            {
              Criteria: { ConditionOccurrence: { CodesetId: 6, ConditionSourceConcept: 7 } },
            },
          ],
        },
      ],
    },
    InclusionRules: [
      {
        name: 'Rule 1',
        expression: {
          Type: 'ALL',
          CriteriaList: [{ Criteria: { Measurement: { CodesetId: 8 } } }],
        },
      },
    ],
    EndStrategy: { CustomEra: { DrugCodesetId: 9 } },
    CensoringCriteria: [{ Observation: { CodesetId: 10 } }],
  }
}

describe('concept-set-usage walker', () => {
  it('findUsedConceptSetIds collects every reference across the whole graph', () => {
    const used = findUsedConceptSetIds(buildExpression())
    expect(used).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
  })

  it('unassignConceptSetId clears only the matching raw field, leaving others intact', () => {
    const expression = buildExpression()
    unassignConceptSetId(expression, 1)

    const drugExposure = expression.PrimaryCriteria?.CriteriaList?.[0] as { DrugExposure: Record<string, unknown> }
    expect(drugExposure.DrugExposure.CodesetId).toBeUndefined()
    expect(drugExposure.DrugExposure.GenderCS).toEqual({ CodesetId: 2, IsExclusion: false })

    // Everything else in the graph should be untouched.
    const remaining = findUsedConceptSetIds(expression)
    expect(remaining).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9, 10]))
  })

  it('unassignConceptSetId clears only CodesetId within a wrapped ConceptSetSelection, not the whole field', () => {
    const expression = buildExpression()
    unassignConceptSetId(expression, 2)

    const drugExposure = expression.PrimaryCriteria?.CriteriaList?.[0] as { DrugExposure: Record<string, unknown> }
    expect(drugExposure.DrugExposure.GenderCS).toEqual({ CodesetId: undefined, IsExclusion: false })
  })

  it('unassignConceptSetId reaches into nested Groups, InclusionRules, EndStrategy and CensoringCriteria', () => {
    const expression = buildExpression()
    unassignConceptSetId(expression, 6)
    unassignConceptSetId(expression, 8)
    unassignConceptSetId(expression, 9)
    unassignConceptSetId(expression, 10)

    const remaining = findUsedConceptSetIds(expression)
    expect(remaining).toEqual(new Set([1, 2, 3, 4, 5, 7]))
  })
})
