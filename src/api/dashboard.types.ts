export type ManagerType = string;
export type ProgressStageType = "TEST" | "QUOTE" | "APPROVAL" | "CLOSING";
export type TimePeriodApiType = "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR";
export type CategoryType = "채용" | "공공" | "병원" | "성과";
export type ProductType = "ATS" | "역검SR" | "INHR+통합" | "역검" | "이탈사";
export type CompanySizeType = "T0" | "T1" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | null;
export type TrustLevelType = "P1" | "P2" | "P3" | null;
export type PossibilityType = "90%" | "40%" | "0%";

export interface DashboardTableRequest {
  timePeriod: TimePeriodApiType;
  search?: { companyName?: string };
  filters?: {
    companySizes?: CompanySizeType[];
    managers?: ManagerType[];
    categories?: CategoryType[];
    productUsages?: string[];
    possibilities?: PossibilityType[];
    stages?: ProgressStageType[];
    contractAmountRange?: { minMan?: number | null; maxMan?: number | null };
    expectedRevenueRange?: { minMan?: number | null; maxMan?: number | null };
    targetMonths?: number[];
  };
  sort?: {
    field:
    | "companyName"
    | "companySize"
    | "manager"
    | "category"
    | "productUsage"
    | "trustIndex"
    | "contractAmount"
    | "possibility"
    | "expectedRevenue"
    | "targetDate";
    order: "asc" | "desc";
  };
  pagination?: { page: number; pageSize: number };
}

export interface PeriodChange {
  previousTrustIndex: number | null;
  previousPossibility: PossibilityType;
  previousExpectedRevenue: number;
  currentExpectedRevenue: number;
  previousTargetMonth: number | null;
  previousTest: boolean;
  previousQuote: boolean;
  previousApproval: boolean;
  previousContract: boolean;
}

export interface AdoptionDecision {
  possibility: PossibilityType;
  targetRevenue?: number | null;
  targetMonth?: number | null;
  test?: boolean;
  quote?: boolean;
  approval?: boolean;
  contract?: boolean;
}

export interface DashboardTableRow {
  no: number;
  companyName: string;
  companySize: CompanySizeType;
  category: CategoryType;
  productUsage: ProductType[];
  manager: ManagerType;
  contractAmount: number | null;
  trustIndex?: number | null;
  trustLevel: TrustLevelType;
  adoptionDecision: AdoptionDecision;
  expectedRevenue?: number;
  periodChange?: PeriodChange;
  // 원본 Customer 타입의 모든 필드 포함
  [key: string]: unknown;
}

export interface DashboardTableResponse {
  rows: DashboardTableRow[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export type TimePeriodApi = TimePeriodApiType;
export type ProgressStage = ProgressStageType;

