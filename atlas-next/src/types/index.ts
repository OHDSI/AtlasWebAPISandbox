// Shared type definitions for OHDSI Atlas React/TypeScript migration

export interface Source {
  sourceId: number;
  sourceName: string;
  sourceDialect: string;
  sourceKey: string;
  daimons: Daimon[];
}

export interface Daimon {
  daimonType: string;
  tableQualifier: string;
  priority: number;
}

export interface CohortDefinition {
  id: number;
  name: string;
  description: string;
  expressionType: string;
  expression: CohortExpression;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  tags: Tag[];
}

export interface CohortExpression {
  items: ConceptSetItem[];
}

export interface ConceptSet {
  id: number;
  name: string;
  expression: ConceptSetExpression;
}

export interface ConceptSetExpression {
  items: ConceptSetItem[];
}

export interface ConceptSetItem {
  concept: Concept;
  isExcluded: boolean;
  includeDescendants: boolean;
  includeMapped: boolean;
}

export interface Concept {
  conceptId: number;
  conceptName: string;
  domainId: string;
  vocabularyId: string;
  conceptClassId: string;
  standardConcept: string;
  conceptCode: string;
  invalidReason: string | null;
}

export interface IRAnalysis {
  id: number;
  name: string;
  description: string;
  expression: unknown;
}

export interface Estimation {
  id: number;
  name: string;
  description: string;
  specification: unknown;
}

export interface Prediction {
  id: number;
  name: string;
  description: string;
  specification: unknown;
}

export interface CohortCharacterization {
  id: number;
  name: string;
  description: string;
  featureAnalyses: FeatureAnalysis[];
}

export interface FeatureAnalysis {
  id: number;
  name: string;
  type: string;
  domain: string;
  design: unknown;
}

export interface Pathway {
  id: number;
  name: string;
  description: string;
  targetCohorts: CohortDefinition[];
  eventCohorts: CohortDefinition[];
}

export interface Job {
  executionId: number;
  jobName: string;
  status: string;
  startDate: string;
  endDate: string | null;
}

export interface UserInfo {
  login: string;
  name: string | null;
  permissionIdx: Record<string, string[]>;
}

export interface Tag {
  id: number;
  name: string;
  type: string;
  groups: TagGroup[];
}

export interface TagGroup {
  id: number;
  name: string;
}

export interface AppConfig {
  api: {
    url: string;
    sources?: Source[];
    isExecutionEngineAvailable?: boolean;
  };
  userAuthenticationEnabled: boolean;
  authProviders: AuthProviderConfig[];
  refreshTokenThreshold: number;
  enableSkipLogin: boolean;
  disableBrowserCheck: boolean;
  webAPIRoot: string;
  companyInfoCustomHtmlTemplate?: string;
  showCompanyInfo: boolean;
}

export interface AuthProviderConfig {
  name: string;
  url: string;
  ajax: boolean;
  icon: string;
  isUse498: boolean;
}

export type AppInitializationStatus = 'initializing' | 'running' | 'failed' | 'noSourcesAvailable';

export type PermissionIndex = Record<string, string[]>;
