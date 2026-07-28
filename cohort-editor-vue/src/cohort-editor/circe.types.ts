/**
 * Circe TypeScript Type Definitions with Zod Validation
 *
 * This file contains Zod schemas that mirror the Java model from circe-be.
 * It represents the JSON structure produced by Jackson serialization of the
 * cohort expression domain model.
 *
 * Schemas are the source of truth. TypeScript types are inferred from schemas.
 * This ensures types and runtime validation stay in sync.
 *
 */

import { z } from 'zod'

/**
 * Supporting Type Schemas
 */

export const OffsetSchema = z.object({
  Days: z.number().nullable().optional(),
  Coeff: z.number().optional(),
})
export type Offset = z.infer<typeof OffsetSchema>

export const WindowSchema = z.object({
  Start: OffsetSchema.optional(),
  End: OffsetSchema.optional(),
  UseIndexEnd: z.boolean().optional(),
  UseEventEnd: z.boolean().optional(),
})
export type Window = z.infer<typeof WindowSchema>

export const DateAdjustmentSchema = z.object({
  StartWith: z.enum(['START_DATE', 'END_DATE']).optional(),
  StartOffset: z.number().optional(),
  EndWith: z.enum(['START_DATE', 'END_DATE']).optional(),
  EndOffset: z.number().optional(),
})
export type DateAdjustment = z.infer<typeof DateAdjustmentSchema>

export const OccurrenceSchema = z.object({
  Type: z.number().optional(), // 0=EXACTLY, 1=AT_MOST, 2=AT_LEAST
  Count: z.number().optional(),
  IsDistinct: z.boolean().optional(),
  CountColumn: z.string().optional(),
})
export type Occurrence = z.infer<typeof OccurrenceSchema>

export const NumericRangeSchema = z.object({
  Value: z.number().optional(),
  Op: z.enum(['lt', 'lte', 'eq', '!eq', 'gt', 'gte', 'bt', '!bt']).optional(),
  Extent: z.number().optional(),
})
export type NumericRange = z.infer<typeof NumericRangeSchema>
export type NumericRangeOp = NonNullable<NumericRange['Op']>

export const DateRangeSchema = z.object({
  Value: z.string().optional(),
  Op: z.enum(['lt', 'lte', 'eq', '!eq', 'gt', 'gte', 'bt', '!bt']).optional(),
  Extent: z.string().optional(),
})
export type DateRange = z.infer<typeof DateRangeSchema>
export type DateRangeOp = NonNullable<DateRange['Op']>

export const TextFilterSchema = z.object({
  Value: z.string().optional(),
  Op: z.enum(['endsWith', 'startsWith', 'contains', '!endsWith', '!startsWith', '!contains']).optional(),
})
export type TextFilter = z.infer<typeof TextFilterSchema>
export type TextFilterOp = NonNullable<TextFilter['Op']>

export const ResultLimitSchema = z.object({
  Type: z.enum(['All', 'First', 'Last']).optional(),
})
export type ResultLimit = z.infer<typeof ResultLimitSchema>

export const ConceptSchema = z.object({
  CONCEPT_ID: z.number().optional(),
  CONCEPT_NAME: z.string().optional(),
  STANDARD_CONCEPT: z.string().optional(),
  STANDARD_CONCEPT_CAPTION: z.string().optional(),
  VOCABULARY_ID: z.string().optional(),
  DOMAIN_ID: z.string().optional(),
  CONCEPT_CLASS_ID: z.string().optional(),
  INVALID_REASON: z.string().optional(),
  VALID_START_DATE: z.string().optional(),
  VALID_END_DATE: z.string().optional(),
  INVALID_REASON_CAPTION: z.string().optional(),
})
export type Concept = z.infer<typeof ConceptSchema>

export const ConceptSetSelectionSchema = z.object({
  CodesetId: z.number().optional(),
  IsExclusion: z.boolean().optional(),
})
export type ConceptSetSelection = z.infer<typeof ConceptSetSelectionSchema>

/**
 * Concept or Concept Set reference - NO UNION
 * These are separate fields in Java, never combined
 */
export const ConceptArraySchema = z.array(ConceptSchema)
export type ConceptArray = z.infer<typeof ConceptArraySchema>

export const ConceptSetItemSchema = z.object({
  concept: ConceptSchema.optional(),
  isExcluded: z.boolean().optional(),
  includeDescendants: z.boolean().optional(),
  includeMapped: z.boolean().optional(),
})
export type ConceptSetItem = z.infer<typeof ConceptSetItemSchema>

export const ConceptSetExpressionSchema = z.object({
  items: z.array(ConceptSetItemSchema).optional(),
})
export type ConceptSetExpression = z.infer<typeof ConceptSetExpressionSchema>

export const ConceptSetSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  expression: ConceptSetExpressionSchema.optional(),
})
export type ConceptSet = z.infer<typeof ConceptSetSchema>

export const ObservationFilterSchema = z.object({
  PriorDays: z.number().optional(),
  PostDays: z.number().optional(),
})
export type ObservationFilter = z.infer<typeof ObservationFilterSchema>

export const PeriodSchema = z.object({
  StartDate: z.string().optional(), // ISO 8601
  EndDate: z.string().optional(), // ISO 8601
})
export type Period = z.infer<typeof PeriodSchema>

export const CollapseSettingsSchema = z.object({
  CollapseType: z.enum(['ERA']).optional(),
  EraPad: z.number().optional(),
})
export type CollapseSettings = z.infer<typeof CollapseSettingsSchema>

/**
 * End Strategy Schemas
 * Polymorphic union using Jackson wrapper object serialization
 */

export const DateOffsetStrategySchema = z.object({
  DateField: z.enum(['StartDate', 'EndDate']).optional(),
  Offset: z.number().optional(),
})
export type DateOffsetStrategy = z.infer<typeof DateOffsetStrategySchema>

export const CustomEraStrategySchema = z.object({
  DrugCodesetId: z.number().optional(),
  GapDays: z.number().optional(),
  Offset: z.number().optional(),
  DaysSupplyOverride: z.number().optional(),
})
export type CustomEraStrategy = z.infer<typeof CustomEraStrategySchema>

export const EndStrategySchema = z.union([
  z.object({ DateOffset: DateOffsetStrategySchema }),
  z.object({ CustomEra: CustomEraStrategySchema }),
])
export type EndStrategy = z.infer<typeof EndStrategySchema>

/**
 * Criteria Base Type
 * Contains common properties inherited by all event criteria
 */
const CriteriaBaseSchema = z.object({
  CorrelatedCriteria: z.lazy(() => CriteriaGroupSchema).optional(),
  DateAdjustment: DateAdjustmentSchema.optional(),
})

/**
 * Concrete Criteria Type Schemas
 * Each represents a specific event domain
 */

export const ConditionEraSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  EraStartDate: DateRangeSchema.optional(),
  EraEndDate: DateRangeSchema.optional(),
  OccurrenceCount: NumericRangeSchema.optional(),
  EraLength: NumericRangeSchema.optional(),
  AgeAtStart: NumericRangeSchema.optional(),
  AgeAtEnd: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
})
export type ConditionEra = z.infer<typeof ConditionEraSchema>

export const ConditionOccurrenceSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  OccurrenceEndDate: DateRangeSchema.optional(),
  ConditionType: ConceptArraySchema.optional(),
  ConditionTypeCS: ConceptSetSelectionSchema.optional(),
  ConditionTypeExclude: z.boolean().optional(),
  ConditionSourceConcept: z.number().optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialty: ConceptArraySchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
  VisitType: ConceptArraySchema.optional(),
  VisitTypeCS: ConceptSetSelectionSchema.optional(),
  ConditionStatus: ConceptArraySchema.optional(),
  ConditionStatusCS: ConceptSetSelectionSchema.optional(),
  StopReason: TextFilterSchema.optional(),
})
export type ConditionOccurrence = z.infer<typeof ConditionOccurrenceSchema>

export const DeathSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  OccurrenceEndDate: DateRangeSchema.optional(),
  DeathType: ConceptArraySchema.optional(),
  DeathTypeCS: ConceptSetSelectionSchema.optional(),
  DeathTypeExclude: z.boolean().optional(),
  DeathSourceConcept: ConceptArraySchema.optional(),
  DeathSourceConceptCS: ConceptSetSelectionSchema.optional(),
  DeathSourceConceptExclude: z.boolean().optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialty: ConceptArraySchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
  VisitType: ConceptArraySchema.optional(),
  VisitTypeCS: ConceptSetSelectionSchema.optional(),
})
export type Death = z.infer<typeof DeathSchema>

export const DeviceExposureSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  OccurrenceEndDate: DateRangeSchema.optional(),
  DeviceType: ConceptArraySchema.optional(),
  DeviceTypeCS: ConceptSetSelectionSchema.optional(),
  DeviceTypeExclude: z.boolean().optional(),
  UniqueDeviceId: TextFilterSchema.optional(),
  Quantity: NumericRangeSchema.optional(),
  DeviceSourceConcept: z.number().optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialty: ConceptArraySchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
  VisitType: ConceptArraySchema.optional(),
  VisitTypeCS: ConceptSetSelectionSchema.optional(),
})
export type DeviceExposure = z.infer<typeof DeviceExposureSchema>

export const DoseEraSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  EraStartDate: DateRangeSchema.optional(),
  EraEndDate: DateRangeSchema.optional(),
  DoseValue: NumericRangeSchema.optional(),
  Unit: ConceptArraySchema.optional(),
  UnitCS: ConceptSetSelectionSchema.optional(),
  EraLength: NumericRangeSchema.optional(),
  AgeAtStart: NumericRangeSchema.optional(),
  AgeAtEnd: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
})
export type DoseEra = z.infer<typeof DoseEraSchema>

export const DrugEraSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  EraStartDate: DateRangeSchema.optional(),
  EraEndDate: DateRangeSchema.optional(),
  OccurrenceCount: NumericRangeSchema.optional(),
  GapDays: NumericRangeSchema.optional(),
  EraLength: NumericRangeSchema.optional(),
  AgeAtStart: NumericRangeSchema.optional(),
  AgeAtEnd: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
})
export type DrugEra = z.infer<typeof DrugEraSchema>

export const DrugExposureSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  OccurrenceEndDate: DateRangeSchema.optional(),
  DrugType: ConceptArraySchema.optional(),
  DrugTypeCS: ConceptSetSelectionSchema.optional(),
  DrugTypeExclude: z.boolean().optional(),
  DrugSourceConcept: z.number().optional(),
  StopReason: TextFilterSchema.optional(),
  Refills: NumericRangeSchema.optional(),
  Quantity: NumericRangeSchema.optional(),
  DaysSupply: NumericRangeSchema.optional(),
  RouteConcept: ConceptArraySchema.optional(),
  RouteConceptCS: ConceptSetSelectionSchema.optional(),
  DoseUnit: ConceptArraySchema.optional(),
  DoseUnitCS: ConceptSetSelectionSchema.optional(),
  EffectiveDrugDose: NumericRangeSchema.optional(),
  LotNumber: TextFilterSchema.optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialty: ConceptArraySchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
})
export type DrugExposure = z.infer<typeof DrugExposureSchema>

export const LocationRegionSchema = CriteriaBaseSchema.extend({
  Region: z.string().optional(),
  RegionExclude: z.boolean().optional(),
})
export type LocationRegion = z.infer<typeof LocationRegionSchema>

export const MeasurementSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  MeasurementType: ConceptArraySchema.optional(),
  MeasurementTypeCS: ConceptSetSelectionSchema.optional(),
  MeasurementTypeExclude: z.boolean().optional(),
  Operator: ConceptArraySchema.optional(),
  OperatorCS: ConceptSetSelectionSchema.optional(),
  ValueAsNumber: NumericRangeSchema.optional(),
  ValueAsConcept: ConceptArraySchema.optional(),
  ValueAsConceptCS: ConceptSetSelectionSchema.optional(),
  Unit: ConceptArraySchema.optional(),
  UnitCS: ConceptSetSelectionSchema.optional(),
  RangeHigh: NumericRangeSchema.optional(),
  RangeLow: NumericRangeSchema.optional(),
  RangeHighRatio: NumericRangeSchema.optional(),
  RangeLowRatio: NumericRangeSchema.optional(),
  Abnormal: z.boolean().optional(),
  MeasurementSourceConcept: z.number().optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialty: ConceptArraySchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
  VisitType: ConceptArraySchema.optional(),
  VisitTypeCS: ConceptSetSelectionSchema.optional(),
})
export type Measurement = z.infer<typeof MeasurementSchema>

export const ObservationSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  ObservationType: ConceptArraySchema.optional(),
  ObservationTypeCS: ConceptSetSelectionSchema.optional(),
  ObservationTypeExclude: z.boolean().optional(),
  ValueAsNumber: NumericRangeSchema.optional(),
  ValueAsString: TextFilterSchema.optional(),
  ValueAsConcept: ConceptArraySchema.optional(),
  ValueAsConceptCS: ConceptSetSelectionSchema.optional(),
  Qualifier: ConceptArraySchema.optional(),
  QualifierCS: ConceptSetSelectionSchema.optional(),
  Unit: ConceptArraySchema.optional(),
  UnitCS: ConceptSetSelectionSchema.optional(),
  ObservationSourceConcept: z.number().optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialty: ConceptArraySchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
  VisitType: ConceptArraySchema.optional(),
  VisitTypeCS: ConceptSetSelectionSchema.optional(),
})
export type Observation = z.infer<typeof ObservationSchema>

export const ObservationPeriodSchema = CriteriaBaseSchema.extend({
  First: z.boolean().optional(),
  PeriodStartDate: DateRangeSchema.optional(),
  PeriodEndDate: DateRangeSchema.optional(),
  UserDefinedPeriod: PeriodSchema.optional(),
  PeriodType: ConceptArraySchema.optional(),
  PeriodTypeCS: ConceptSetSelectionSchema.optional(),
  PeriodLength: NumericRangeSchema.optional(),
  AgeAtStart: NumericRangeSchema.optional(),
  AgeAtEnd: NumericRangeSchema.optional(),
})
export type ObservationPeriod = z.infer<typeof ObservationPeriodSchema>

export const PayerPlanPeriodSchema = CriteriaBaseSchema.extend({
  First: z.boolean().optional(),
  PeriodStartDate: DateRangeSchema.optional(),
  PeriodEndDate: DateRangeSchema.optional(),
  UserDefinedPeriod: PeriodSchema.optional(),
  PeriodLength: NumericRangeSchema.optional(),
  AgeAtStart: NumericRangeSchema.optional(),
  AgeAtEnd: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  PayerConcept: z.number().optional(),
  PlanConcept: z.number().optional(),
  SponsorConcept: z.number().optional(),
  StopReasonConcept: z.number().optional(),
  PayerSourceConcept: z.number().optional(),
  PlanSourceConcept: z.number().optional(),
  SponsorSourceConcept: z.number().optional(),
  StopReasonSourceConcept: z.number().optional(),
})
export type PayerPlanPeriod = z.infer<typeof PayerPlanPeriodSchema>

export const ProcedureOccurrenceSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  ProcedureType: ConceptArraySchema.optional(),
  ProcedureTypeCS: ConceptSetSelectionSchema.optional(),
  ProcedureTypeExclude: z.boolean().optional(),
  Modifier: ConceptArraySchema.optional(),
  ModifierCS: ConceptSetSelectionSchema.optional(),
  ProcedureSourceConcept: z.number().optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialty: ConceptArraySchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
  VisitType: ConceptArraySchema.optional(),
  VisitTypeCS: ConceptSetSelectionSchema.optional(),
})
export type ProcedureOccurrence = z.infer<typeof ProcedureOccurrenceSchema>

export const SpecimenSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  SpecimenType: ConceptArraySchema.optional(),
  SpecimenTypeCS: ConceptSetSelectionSchema.optional(),
  SpecimenTypeExclude: z.boolean().optional(),
  SpecimenSourceId: TextFilterSchema.optional(),
  Unit: ConceptArraySchema.optional(),
  UnitCS: ConceptSetSelectionSchema.optional(),
  AnatomicSite: ConceptArraySchema.optional(),
  AnatomicSiteCS: ConceptSetSelectionSchema.optional(),
  DiseaseStatus: ConceptArraySchema.optional(),
  DiseaseStatusCS: ConceptSetSelectionSchema.optional(),
  SpecimenSourceConcept: z.number().optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  Quantity: NumericRangeSchema.optional(),
})
export type Specimen = z.infer<typeof SpecimenSchema>

export const VisitDetailSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  VisitDetailStartDate: DateRangeSchema.optional(),
  VisitDetailEndDate: DateRangeSchema.optional(),
  VisitDetailTypeCS: ConceptSetSelectionSchema.optional(),
  VisitDetailSourceConcept: z.number().optional(),
  VisitDetailLength: NumericRangeSchema.optional(),
  Age: NumericRangeSchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
  PlaceOfServiceCS: ConceptSetSelectionSchema.optional(),
  PlaceOfServiceLocation: z.number().optional(),
})
export type VisitDetail = z.infer<typeof VisitDetailSchema>

export const VisitOccurrenceSchema = CriteriaBaseSchema.extend({
  CodesetId: z.number().optional(),
  First: z.boolean().optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  OccurrenceEndDate: DateRangeSchema.optional(),
  VisitType: ConceptArraySchema.optional(),
  VisitTypeCS: ConceptSetSelectionSchema.optional(),
  VisitTypeExclude: z.boolean().optional(),
  VisitSourceConcept: z.number().optional(),
  VisitLength: NumericRangeSchema.optional(),
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  ProviderSpecialty: ConceptArraySchema.optional(),
  ProviderSpecialtyCS: ConceptSetSelectionSchema.optional(),
  PlaceOfService: ConceptArraySchema.optional(),
  PlaceOfServiceCS: ConceptSetSelectionSchema.optional(),
  PlaceOfServiceLocation: z.number().optional(),
})
export type VisitOccurrence = z.infer<typeof VisitOccurrenceSchema>

/**
 * Polymorphic Criteria Union Type
 * Represents Jackson's wrapper object serialization
 */
export const CriteriaSchema = z.union([
  z.object({ ConditionEra: ConditionEraSchema }),
  z.object({ ConditionOccurrence: ConditionOccurrenceSchema }),
  z.object({ Death: DeathSchema }),
  z.object({ DeviceExposure: DeviceExposureSchema }),
  z.object({ DoseEra: DoseEraSchema }),
  z.object({ DrugEra: DrugEraSchema }),
  z.object({ DrugExposure: DrugExposureSchema }),
  z.object({ LocationRegion: LocationRegionSchema }),
  z.object({ Measurement: MeasurementSchema }),
  z.object({ Observation: ObservationSchema }),
  z.object({ ObservationPeriod: ObservationPeriodSchema }),
  z.object({ PayerPlanPeriod: PayerPlanPeriodSchema }),
  z.object({ ProcedureOccurrence: ProcedureOccurrenceSchema }),
  z.object({ Specimen: SpecimenSchema }),
  z.object({ VisitDetail: VisitDetailSchema }),
  z.object({ VisitOccurrence: VisitOccurrenceSchema }),
])
export type Criteria = z.infer<typeof CriteriaSchema>

export const CriteriaSchemaMap = {
  ConditionEra: ConditionEraSchema,
  ConditionOccurrence: ConditionOccurrenceSchema,
  Death: DeathSchema,
  DeviceExposure: DeviceExposureSchema,
  DoseEra: DoseEraSchema,
  DrugEra: DrugEraSchema,
  DrugExposure: DrugExposureSchema,
  LocationRegion: LocationRegionSchema,
  Measurement: MeasurementSchema,
  Observation: ObservationSchema,
  ObservationPeriod: ObservationPeriodSchema,
  PayerPlanPeriod: PayerPlanPeriodSchema,
  ProcedureOccurrence: ProcedureOccurrenceSchema,
  Specimen: SpecimenSchema,
  VisitDetail: VisitDetailSchema,
  VisitOccurrence: VisitOccurrenceSchema,
} as const
export type CriteriaWrapperKey = keyof typeof CriteriaSchemaMap

export function getCriteriaWrapperKey(criteria: Criteria): CriteriaWrapperKey {
  return Object.keys(criteria)[0] as CriteriaWrapperKey
}

/**
 * Demographic Criteria Schema
 */
export const DemographicCriteriaSchema = z.object({
  Age: NumericRangeSchema.optional(),
  Gender: ConceptArraySchema.optional(),
  GenderCS: ConceptSetSelectionSchema.optional(),
  Race: ConceptArraySchema.optional(),
  RaceCS: ConceptSetSelectionSchema.optional(),
  Ethnicity: ConceptArraySchema.optional(),
  EthnicityCS: ConceptSetSelectionSchema.optional(),
  OccurrenceStartDate: DateRangeSchema.optional(),
  OccurrenceEndDate: DateRangeSchema.optional(),
})
export type DemographicCriteria = z.infer<typeof DemographicCriteriaSchema>

/**
 * Criteria Group Schema - Recursive Types
 * Uses z.lazy() to handle circular references
 * Types are declared first, then schemas are built around them
 */

/**
 * WindowedCriteria Base Class Schema
 * Represents the common properties for criteria positioned within a time window
 */
export interface WindowedCriteria {
  Criteria?: Criteria
  StartWindow?: Window
  EndWindow?: Window
  RestrictVisit?: boolean
  IgnoreObservationPeriod?: boolean
}

/**
 * CorelatedCriteria extends WindowedCriteria
 * Adds occurrence-count logic for boolean qualification
 */
export interface CorelatedCriteria extends WindowedCriteria {
  Occurrence?: Occurrence
}

export interface CriteriaGroup {
  Type?: 'ALL' | 'ANY' | 'AT_LEAST' | 'AT_MOST'
  Count?: number
  CriteriaList?: CorelatedCriteria[]
  DemographicCriteriaList?: DemographicCriteria[]
  Groups?: CriteriaGroup[]
}

/**
 * WindowedCriteria Schema
 * Base schema for criteria positioned within a time window
 * Uses z.lazy() to handle circular reference to Criteria
 */
export const WindowedCriteriaSchema: z.ZodType<WindowedCriteria> = z.lazy(() =>
  z.object({
    Criteria: CriteriaSchema.optional(),
    StartWindow: WindowSchema.optional(),
    EndWindow: WindowSchema.optional(),
    RestrictVisit: z.boolean().optional(),
    IgnoreObservationPeriod: z.boolean().optional(),
  }) as z.ZodType<WindowedCriteria>
)

/**
 * CorelatedCriteria Schema
 * Extends WindowedCriteria by adding occurrence-count logic
 * Uses composition via z.and() to build on the windowed base
 */
export const CorelatedCriteriaSchema: z.ZodType<CorelatedCriteria> = z.lazy(() =>
  WindowedCriteriaSchema.and(
    z.object({
      Occurrence: OccurrenceSchema.optional(),
    })
  ) as z.ZodType<CorelatedCriteria>
)

export const CriteriaGroupSchema: z.ZodType<CriteriaGroup> = z.lazy(() =>
  z.object({
    Type: z.enum(['ALL', 'ANY', 'AT_LEAST', 'AT_MOST']).optional(),
    Count: z.number().optional(),
    CriteriaList: z.array(CorelatedCriteriaSchema).optional(),
    DemographicCriteriaList: z.array(DemographicCriteriaSchema).optional(),
    Groups: z.array(CriteriaGroupSchema).optional(),
  }) as z.ZodType<CriteriaGroup>
)

/**
 * Inclusion Rule Schema
 */
export const InclusionRuleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  expression: CriteriaGroupSchema.optional(),
})
export type InclusionRule = z.infer<typeof InclusionRuleSchema>

/**
 * Primary Criteria Schema
 */
export const PrimaryCriteriaSchema = z.object({
  CriteriaList: z.array(CriteriaSchema).optional(),
  ObservationWindow: ObservationFilterSchema.optional(),
  PrimaryCriteriaLimit: ResultLimitSchema.optional(),
})
export type PrimaryCriteria = z.infer<typeof PrimaryCriteriaSchema>

/**
 * Cohort Expression Schema - Root Object
 */
export const CohortExpressionSchema = z.object({
  Title: z.string().optional(),
  PrimaryCriteria: PrimaryCriteriaSchema.optional(),
  AdditionalCriteria: CriteriaGroupSchema.optional(),
  ConceptSets: z.array(ConceptSetSchema).optional(),
  QualifiedLimit: ResultLimitSchema.optional(),
  ExpressionLimit: ResultLimitSchema.optional(),
  InclusionRules: z.array(InclusionRuleSchema).optional(),
  EndStrategy: EndStrategySchema.optional(),
  CensoringCriteria: z.array(CriteriaSchema).optional(),
  CollapseSettings: CollapseSettingsSchema.optional(),
  CensorWindow: PeriodSchema.optional(),
  cdmVersionRange: z.string().optional(),
})
export type CohortExpression = z.infer<typeof CohortExpressionSchema>
