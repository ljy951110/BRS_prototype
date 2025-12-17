import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Phone,
  Users,
  Building2,
  Calendar,
  Star,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Text, Card, Badge, Modal } from "@/components/common/atoms";
import { SalesActionHistory } from "@/components/dashboard/SalesActionHistory";
import {
  Customer,
  SalesAction,
  ContentEngagement,
  Possibility,
  MBMPipelineStatus,
} from "@/types/customer";
import {
  formatCurrency,
  getDataWithPeriodChange,
  calculateExpectedRevenue,
} from "@/data/mockData";
import type { TimePeriod } from "@/App";
import styles from "./index.module.scss";

// 금액 축약 포맷
const formatCompactCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || amount === 0) return "-";
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000000) return `${(amount / 10000).toFixed(0)}만`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
};

interface CustomerTableProps {
  data: Customer[];
  timePeriod: TimePeriod;
}

type ModalTab = "summary" | "sales" | "marketing";

type ColumnFilters = {
  company: string;
  manager: string;
  companySize: string;
  category: string;
  trustMin: string;
  trustMax: string;
  contractMin: string;
  contractMax: string;
  possibility: string;
  expectedMin: string;
  expectedMax: string;
  targetStart: string;
  targetEnd: string;
  mbmPipeline: string;
  lastContactStart: string;
  lastContactEnd: string;
  progress: {
    test: boolean;
    quote: boolean;
    approval: boolean;
    contract: boolean;
  };
};

type FilterModalTarget =
  | "company"
  | "manager"
  | "companySize"
  | "category"
  | "trust"
  | "contract"
  | "possibility"
  | "expected"
  | "targetDate"
  | "mbmPipeline"
  | "lastContact"
  | "progress";

const FILTER_SORT_FIELD: Record<FilterModalTarget, SortField | null> = {
  company: "companyName",
  companySize: "companySize",
  manager: "manager",
  category: "category",
  trust: "trustIndex",
  contract: "contractAmount",
  possibility: "possibility",
  expected: "expectedRevenue",
  targetDate: "targetDate",
  mbmPipeline: null,
  lastContact: null,
  progress: null,
};

// 컨텐츠 카테고리 레이블
const CONTENT_CATEGORY_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  TOFU: { label: "인지 단계", color: "blue" },
  MOFU: { label: "고려 단계", color: "purple" },
  BOFU: { label: "결정 단계", color: "green" },
};

// 콘텐츠 카테고리별 색상/라벨 (콘텐츠 상세 모달용)
const CONTENT_CATEGORY_META: Record<
  ContentEngagement["category"],
  { variant: "cyan" | "purple" | "success"; label: string }
> = {
  TOFU: { variant: "cyan", label: "인지단계" },
  MOFU: { variant: "purple", label: "고려단계" },
  BOFU: { variant: "success", label: "결정단계" },
};

// 기간에 따른 일수 (콘텐츠 상세 집계용)
const PERIOD_DAYS: Record<TimePeriod, number> = {
  "1w": 7,
  "1m": 30,
  "6m": 180,
  "1y": 365,
};

type SortField =
  | "companyName"
  | "companySize"
  | "manager"
  | "category"
  | "trustIndex"
  | "contractAmount"
  | "expectedRevenue"
  | "possibility"
  | "customerResponse"
  | "targetDate";
type SortDirection = "asc" | "desc";

// 가능성 순서 (정렬용)
const POSSIBILITY_ORDER: Record<string, number> = {
  "90%": 3,
  "40%": 2,
  "0%": 1,
};
// 고객반응 순서 (정렬용)
const RESPONSE_ORDER: Record<string, number> = { 상: 3, 중: 2, 하: 1 };

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  "1w": "1주일",
  "1m": "1개월",
  "6m": "6개월",
  "1y": "1년",
};

// 기간에 따라 표시할 주차 수
const PERIOD_WEEKS_COUNT: Record<TimePeriod, number> = {
  "1w": 2, // 현재 주 + 1주 전
  "1m": 4, // 최근 4주
  "6m": 6, // 모든 주차
  "1y": 6, // 모든 주차
};

const TrendIcon = ({
  direction,
}: {
  direction: Customer["changeDirection"];
}) => {
  if (direction === "up")
    return <TrendingUp size={14} className={styles.trendUp} />;
  if (direction === "down")
    return <TrendingDown size={14} className={styles.trendDown} />;
  return <Minus size={14} className={styles.trendNone} />;
};

const ContentCategoryBadge = ({
  category,
}: {
  category: ContentEngagement["category"];
}) => {
  const variants: Record<
    ContentEngagement["category"],
    "info" | "warning" | "success"
  > = {
    TOFU: "info",
    MOFU: "warning",
    BOFU: "success",
  };
  return (
    <Badge variant={variants[category]} size="sm">
      {category}
    </Badge>
  );
};

const getCategoryVariant = (category: string) => {
  switch (category) {
    case "채용":
      return "info";
    case "공공":
      return "purple";
    case "성과":
      return "cyan";
    default:
      return "default";
  }
};

// MBM 파이프라인 상태 표시용
const MBM_PIPELINE_LABELS: Record<MBMPipelineStatus, { label: string; variant: "default" | "info" | "warning" | "success" | "error" | "purple" | "cyan" }> = {
  invited: { label: "참여전", variant: "default" },
  participated: { label: "참여", variant: "info" },
  followup: { label: "팔로업 진행", variant: "purple" },
  stagnant: { label: "정체", variant: "warning" },
  closed: { label: "종료", variant: "success" },
};

// 고객 반응 표시용
const CUSTOMER_RESPONSE_VARIANTS: Record<string, "success" | "warning" | "error"> = {
  상: "success",
  중: "warning", 
  하: "error",
};

// 제품사용 파싱 (ATS/역검 -> 태그 배열)
const parseProductUsage = (usage: string): string[] => {
  if (!usage) return [];
  // "ATS/역검" -> ["ATS", "역검"]
  return usage.split(/[/,]/).map(s => s.trim()).filter(Boolean);
};

// 최근 MBM 날짜 계산
const getLastMBMDate = (attendance: Customer["attendance"]): string | null => {
  if (!attendance) return null;
  
  const MBM_DATES: Record<string, string> = {
    "1218": "12/18",
    "1209": "12/09", 
    "1107": "11/07",
  };
  
  // 가장 최근 MBM 참석 찾기 (키 역순으로 정렬)
  const attendedKeys = Object.keys(attendance)
    .filter(key => attendance[key as keyof typeof attendance])
    .sort((a, b) => parseInt(b) - parseInt(a));
  
  if (attendedKeys.length === 0) return null;
  return MBM_DATES[attendedKeys[0]] || attendedKeys[0];
};

// 마지막 컨택일 계산 (날짜 반환)
const getLastContactDate = (salesActions: SalesAction[] | undefined): string | null => {
  if (!salesActions || salesActions.length === 0) return null;
  
  const sortedActions = [...salesActions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedActions[0].date;
};

// 날짜를 YY-MM-DD 형식으로 포맷
const formatDateShort = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 도입결정 단계 계산
const getAdoptionStage = (adoption: Customer["adoptionDecision"]): string => {
  if (adoption.contract) return "계약";
  if (adoption.approval) return "품의";
  if (adoption.quote) return "견적서";
  if (adoption.test) return "테스트";
  return "-";
};

// 도입결정 단계 variant
const getAdoptionStageVariant = (stage: string): "default" | "info" | "warning" | "success" | "purple" => {
  switch (stage) {
    case "계약": return "success";
    case "품의": return "purple";
    case "견적서": return "info";
    case "테스트": return "warning";
    default: return "default";
  }
};

// 도입결정 단계 레벨 (비교용)
const getAdoptionStageLevel = (stage: string): number => {
  switch (stage) {
    case "계약": return 4;
    case "품의": return 3;
    case "견적서": return 2;
    case "테스트": return 1;
    default: return 0;
  }
};

// 주간 타임라인 정보
const WEEKS = [
  {
    key: "1104",
    label: "11월 1주",
    range: "11/4~10",
    startDate: "2024-11-04",
    endDate: "2024-11-10",
  },
  {
    key: "1111",
    label: "11월 2주",
    range: "11/11~17",
    startDate: "2024-11-11",
    endDate: "2024-11-17",
  },
  {
    key: "1118",
    label: "11월 3주",
    range: "11/18~24",
    startDate: "2024-11-18",
    endDate: "2024-11-24",
  },
  {
    key: "1125",
    label: "11월 4주",
    range: "11/25~12/1",
    startDate: "2024-11-25",
    endDate: "2024-12-01",
  },
  {
    key: "1202",
    label: "12월 1주",
    range: "12/2~8",
    startDate: "2024-12-02",
    endDate: "2024-12-08",
  },
  {
    key: "1209",
    label: "12월 2주",
    range: "12/9~15",
    startDate: "2024-12-09",
    endDate: "2024-12-15",
    isCurrent: true,
  },
] as const;

// MBM 이벤트 목록
const MBM_EVENTS: Record<string, { date: string; label: string }> = {
  "1107": { date: "2024-11-07", label: "11/7 MBM" },
  "1218": { date: "2024-12-18", label: "12/18 MBM" },
};

// 특정 주에 MBM 이벤트가 있는지 확인
const getMBMForWeek = (
  weekStartDate: string,
  weekEndDate: string
): { key: string; label: string } | null => {
  const start = new Date(weekStartDate);
  const end = new Date(weekEndDate);
  end.setHours(23, 59, 59);

  for (const [key, event] of Object.entries(MBM_EVENTS)) {
    const eventDate = new Date(event.date);
    if (eventDate >= start && eventDate <= end) {
      return { key, label: event.label };
    }
  }
  return null;
};

// 액션 날짜가 어느 주에 속하는지 찾기
const findWeekForAction = (dateStr: string): string | null => {
  const actionDate = new Date(dateStr);

  for (const week of WEEKS) {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    end.setHours(23, 59, 59);

    if (actionDate >= start && actionDate <= end) {
      return week.key;
    }
  }
  return null;
};

// 액션 모달 데이터 타입
interface ActionModalData {
  action: SalesAction;
  weekLabel: string;
  prevPossibility?: Possibility | null;
  currentPossibility?: Possibility | null;
  prevCustomerResponse?: string | null;
  prevTargetRevenue?: number | null;
  prevTest?: boolean;
  prevQuote?: boolean;
  prevApproval?: boolean;
  prevContract?: boolean;
}

// 컨텐츠 모달 데이터 타입
interface ContentModalData {
  weekLabel: string;
  weekRange: string;
  startDate: string;
  endDate: string;
  trustChange: number;
}

export const CustomerTable = ({ data, timePeriod }: CustomerTableProps) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("summary");
  const [actionModalData, setActionModalData] =
    useState<ActionModalData | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [contentModalData, setContentModalData] =
    useState<ContentModalData | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedContentDetail, setSelectedContentDetail] = useState<{
    title: string;
    category: ContentEngagement["category"];
    currentViews: number;
    pastViews: number;
    periodViews: number;
    viewers: {
      companyName: string;
      date?: string;
      category: string;
      companySize?: string | null;
      manager: string;
      contractAmount: number;
      targetRevenue: number;
      possibility: string;
      test: boolean;
      quote: boolean;
      approval: boolean;
      contract: boolean;
    }[];
  } | null>(null);
  const COLUMN_FILTER_DEFAULTS: ColumnFilters = {
    company: "",
    manager: "all",
    companySize: "all",
    category: "all",
    trustMin: "",
    trustMax: "",
    contractMin: "",
    contractMax: "",
    possibility: "all",
    expectedMin: "",
    expectedMax: "",
    targetStart: "",
    targetEnd: "",
    mbmPipeline: "all",
    lastContactStart: "",
    lastContactEnd: "",
    progress: {
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  };
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(
    COLUMN_FILTER_DEFAULTS
  );
  const [filterModalTarget, setFilterModalTarget] =
    useState<FilterModalTarget | null>(null);

  const managers = useMemo(
    () => Array.from(new Set(data.map((c) => c.manager))).sort(),
    [data]
  );

  const companySizes = useMemo(
    () => Array.from(new Set(data.map((c) => c.companySize || "미정"))).sort(),
    [data]
  );

  const categories = useMemo(
    () => Array.from(new Set(data.map((c) => c.category))).sort(),
    [data]
  );

  const possibilities = useMemo(
    () =>
      Array.from(
        new Set(data.map((c) => c.adoptionDecision.possibility))
      ).sort(),
    [data]
  );

  const mbmPipelineStatuses = useMemo(
    () => Array.from(new Set(data.map((c) => c.mbmPipelineStatus))).sort(),
    [data]
  );

  // 기간에 맞게 변화량 재계산
  const periodData = useMemo(
    () => getDataWithPeriodChange(data, timePeriod),
    [data, timePeriod]
  );

  const matchesNumberRange = (
    value: number | null | undefined,
    minStr: string,
    maxStr: string
  ) => {
    if (value === null || value === undefined) return false;
    const min = minStr === "" ? null : Number(minStr);
    const max = maxStr === "" ? null : Number(maxStr);
    if (min !== null && value < min) return false;
    if (max !== null && value > max) return false;
    return true;
  };

  const filteredByColumn = useMemo(() => {
    return periodData.filter((customer) => {
      const trustIndex = customer.trustIndex ?? 0;
      const contractAmount = customer.contractAmount ?? 0;
      const expectedRevenue =
        customer._periodData?.currentExpectedRevenue ?? 0;
      const targetDate = customer.adoptionDecision.targetDate;

      if (
        columnFilters.company &&
        !customer.companyName
          .toLowerCase()
          .includes(columnFilters.company.toLowerCase())
      ) {
        return false;
      }

      if (
        columnFilters.manager !== "all" &&
        customer.manager !== columnFilters.manager
      ) {
        return false;
      }

      if (
        columnFilters.companySize !== "all" &&
        (customer.companySize || "미정") !== columnFilters.companySize
      ) {
        return false;
      }

      if (
        columnFilters.category !== "all" &&
        customer.category !== columnFilters.category
      ) {
        return false;
      }

      if (
        columnFilters.possibility !== "all" &&
        customer.adoptionDecision.possibility !== columnFilters.possibility
      ) {
        return false;
      }

      // MBM 파이프라인 상태 컬럼 필터
      if (
        columnFilters.mbmPipeline !== "all" &&
        customer.mbmPipelineStatus !== columnFilters.mbmPipeline
      ) {
        return false;
      }

      if (
        (columnFilters.trustMin || columnFilters.trustMax) &&
        !matchesNumberRange(trustIndex, columnFilters.trustMin, columnFilters.trustMax)
      ) {
        return false;
      }

      if (
        (columnFilters.contractMin || columnFilters.contractMax) &&
        !matchesNumberRange(
          contractAmount,
          columnFilters.contractMin,
          columnFilters.contractMax
        )
      ) {
        return false;
      }

      if (
        (columnFilters.expectedMin || columnFilters.expectedMax) &&
        !matchesNumberRange(
          expectedRevenue,
          columnFilters.expectedMin,
          columnFilters.expectedMax
        )
      ) {
        return false;
      }

      if (columnFilters.targetStart || columnFilters.targetEnd) {
        if (!targetDate) return false;
        const target = new Date(targetDate).getTime();
        if (
          columnFilters.targetStart &&
          target < new Date(columnFilters.targetStart).getTime()
        ) {
          return false;
        }
        if (
          columnFilters.targetEnd &&
          target > new Date(columnFilters.targetEnd).getTime()
        ) {
          return false;
        }
      }

      // 마지막 컨택일 필터
      if (columnFilters.lastContactStart || columnFilters.lastContactEnd) {
        const lastContactDate = getLastContactDate(customer.salesActions);
        if (!lastContactDate) return false;
        const lastContact = new Date(lastContactDate).getTime();
        if (
          columnFilters.lastContactStart &&
          lastContact < new Date(columnFilters.lastContactStart).getTime()
        ) {
          return false;
        }
        if (
          columnFilters.lastContactEnd &&
          lastContact > new Date(columnFilters.lastContactEnd).getTime()
        ) {
          return false;
        }
      }

      const hasProgressFilter =
        columnFilters.progress.test ||
        columnFilters.progress.quote ||
        columnFilters.progress.approval ||
        columnFilters.progress.contract;

      if (hasProgressFilter) {
        if (
          (columnFilters.progress.test && !customer.adoptionDecision.test) ||
          (columnFilters.progress.quote && !customer.adoptionDecision.quote) ||
          (columnFilters.progress.approval &&
            !customer.adoptionDecision.approval) ||
          (columnFilters.progress.contract &&
            !customer.adoptionDecision.contract)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [columnFilters, periodData]);

  // 필드별 값 가져오기
  const getFieldValue = (customer: Customer, field: SortField): any => {
    switch (field) {
      case "companyName":
        return customer.companyName;
      case "companySize":
        return customer.companySize || "미정";
      case "manager":
        return customer.manager;
      case "category":
        return customer.category;
      case "trustIndex":
        return customer.trustIndex ?? 0;
      case "contractAmount":
        return customer.contractAmount ?? 0;
      case "expectedRevenue":
        return customer._periodData?.currentExpectedRevenue ?? 0;
      case "possibility":
        return POSSIBILITY_ORDER[customer.adoptionDecision.possibility] ?? 0;
      case "customerResponse":
        return RESPONSE_ORDER[customer.adoptionDecision.customerResponse] ?? 0;
      case "targetDate":
        return customer.adoptionDecision.targetDate
          ? new Date(customer.adoptionDecision.targetDate).getTime()
          : 0;
      default:
        return 0;
    }
  };

  // 기간 필터에 따라 표시할 주차 필터링
  const filteredWeeks = useMemo(() => {
    const weeksCount = PERIOD_WEEKS_COUNT[timePeriod];
    // WEEKS 배열의 마지막(현재)부터 weeksCount만큼 가져오기
    return WEEKS.slice(-weeksCount);
  }, [timePeriod]);

  const sortedData = useMemo(() => {
    if (!sortField) return filteredByColumn;
    return [...filteredByColumn].sort((a, b) => {
      const aVal = getFieldValue(a, sortField);
      const bVal = getFieldValue(b, sortField);

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredByColumn, sortField, sortDirection]);

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab("summary");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
  };

  // 액션 모달 열기
  const openActionModal = (
    action: SalesAction,
    weekLabel: string,
    customer?: Customer
  ) => {
    // 해당 액션 전의 값들 찾기
    let prevPossibility: Possibility | null = null;
    let prevCustomerResponse: string | null = null;
    let prevTargetRevenue: number | null = null;
    let prevTest = false;
    let prevQuote = false;
    let prevApproval = false;
    let prevContract = false;
    
    const currentPossibility = action.possibility || null;

    if (customer?.salesActions) {
      const sortedActions = [...customer.salesActions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const actionIndex = sortedActions.findIndex(
        (a) => a.date === action.date && a.content === action.content
      );

      // 이전 액션 찾기
      if (actionIndex > 0) {
        const prevAction = sortedActions[actionIndex - 1];
        prevPossibility = prevAction.possibility || null;
        prevCustomerResponse = prevAction.customerResponse || null;
        prevTargetRevenue = prevAction.targetRevenue || null;
        prevTest = prevAction.test || false;
        prevQuote = prevAction.quote || false;
        prevApproval = prevAction.approval || false;
        prevContract = prevAction.contract || false;
      }
    }

    setActionModalData({
      action,
      weekLabel,
      prevPossibility,
      currentPossibility,
      prevCustomerResponse,
      prevTargetRevenue,
      prevTest,
      prevQuote,
      prevApproval,
      prevContract,
    });
    setIsActionModalOpen(true);
  };

  // 액션 모달 닫기
  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setActionModalData(null);
  };

  // 컨텐츠 모달 열기
  const openContentModal = (
    week: (typeof WEEKS)[number],
    trustChange: number
  ) => {
    setContentModalData({
      weekLabel: week.label,
      weekRange: week.range,
      startDate: week.startDate,
      endDate: week.endDate,
      trustChange,
    });
    setIsContentModalOpen(true);
  };

  // 컨텐츠 모달 닫기
  const closeContentModal = () => {
    setIsContentModalOpen(false);
    setContentModalData(null);
    setSelectedContentDetail(null);
  };

  // 콘텐츠 상세 모달 열기 (SummaryCards와 동일한 뷰어 리스트)
  const openContentDetail = (content: ContentEngagement) => {
    const now = new Date("2024-12-10");
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - PERIOD_DAYS[timePeriod]);

    const viewers: {
      companyName: string;
      date?: string;
      category: string;
      companySize?: string | null;
      manager: string;
      contractAmount: number;
      targetRevenue: number;
      possibility: string;
      test: boolean;
      quote: boolean;
      approval: boolean;
      contract: boolean;
    }[] = [];
    let totalViews = 0;
    let pastViews = 0;

    data.forEach((customer) => {
      if (!customer.contentEngagements) return;
      customer.contentEngagements.forEach((engagement) => {
        if (
          engagement.title === content.title &&
          engagement.category === content.category
        ) {
          totalViews++;
          const engagementDate = new Date(engagement.date);
          if (engagementDate < periodStart) {
            pastViews++;
          }
          if (engagementDate >= periodStart && engagementDate <= now) {
            viewers.push({
              companyName: customer.companyName,
              date: engagement.date,
              category: customer.category,
              companySize: customer.companySize,
              manager: customer.manager,
              contractAmount: customer.contractAmount ?? 0,
              targetRevenue: customer.adoptionDecision?.targetRevenue ?? 0,
              possibility: customer.adoptionDecision?.possibility ?? "0%",
              test: customer.adoptionDecision?.test ?? false,
              quote: customer.adoptionDecision?.quote ?? false,
              approval: customer.adoptionDecision?.approval ?? false,
              contract: customer.adoptionDecision?.contract ?? false,
            });
          }
        }
      });
    });

    setSelectedContentDetail({
      title: content.title,
      category: content.category,
      currentViews: totalViews,
      pastViews,
      periodViews: viewers.length,
      viewers: viewers.sort(
        (a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
      ),
    });
    setIsContentModalOpen(true);
  };

  // 해당 기간의 컨텐츠 필터링
  const getContentsForPeriod = (
    customer: Customer,
    startDate: string,
    endDate: string
  ): ContentEngagement[] => {
    if (!customer.contentEngagements) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);

    return customer.contentEngagements.filter((content) => {
      const contentDate = new Date(content.date);
      return contentDate >= start && contentDate <= end;
    });
  };

  // 해당 주의 영업 액션 가져오기
  const getActionsForWeek = (customer: Customer, weekKey: string) => {
    if (!customer.salesActions) return [];
    return customer.salesActions.filter(
      (action) => findWeekForAction(action.date) === weekKey
    );
  };

  // 신뢰지수 변화 계산
  const getTrustChange = (
    customer: Customer,
    weekKey: string,
    index: number
  ) => {
    if (!customer.trustHistory || index === 0) return null;
    const currentData = customer.trustHistory[weekKey];
    const prevKey = WEEKS[index - 1].key;
    const prevData = customer.trustHistory[prevKey];
    if (!currentData || !prevData) return null;
    return currentData.trustIndex - prevData.trustIndex;
  };

  const SortHeader = ({
    children,
    filterTarget,
  }: {
    children: React.ReactNode;
    filterTarget?: FilterModalTarget;
  }) => (
    <th className={styles.th}>
      <div className={styles.sortHeader}>
        <span>{children}</span>
        {filterTarget && (
          <button
            className={styles.filterBtn}
            onClick={() => setFilterModalTarget(filterTarget)}
            title="필터 설정"
          >
            <Filter size={12} />
          </button>
        )}
      </div>
    </th>
  );

  const getTrustLevelVariant = (level: Customer["trustLevel"]) => {
    switch (level) {
      case "P1":
        return "success";
      case "P2":
        return "warning";
      case "P3":
        return "error";
      default:
        return "default";
    }
  };

  const getPossibilityVariant = (possibility: string) => {
    switch (possibility) {
      case "90%":
        return "success";
      case "40%":
        return "warning";
      case "0%":
        return "error";
      default:
        return "default";
    }
  };

  const renderSortControls = (target: FilterModalTarget) => {
    const field = FILTER_SORT_FIELD[target];
    if (!field) return null;
    const isActive = sortField === field;
    return (
      <div className={styles.sortControl}>
        <span className={styles.sortLabel}>정렬</span>
        <div className={styles.sortButtons}>
          <button
            className={`${styles.sortBtn} ${
              isActive && sortDirection === "asc" ? styles.active : ""
            }`}
            onClick={() => {
              setSortField(field);
              setSortDirection("asc");
            }}
          >
            오름차순
          </button>
          <button
            className={`${styles.sortBtn} ${
              isActive && sortDirection === "desc" ? styles.active : ""
            }`}
            onClick={() => {
              setSortField(field);
              setSortDirection("desc");
            }}
          >
            내림차순
          </button>
          <button
            className={styles.sortReset}
            onClick={() => {
              if (isActive) {
                setSortField(null);
                setSortDirection("desc");
              }
            }}
          >
            해제
          </button>
        </div>
      </div>
    );
  };

  const resetFilter = (target: FilterModalTarget) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      switch (target) {
        case "company":
          next.company = COLUMN_FILTER_DEFAULTS.company;
          break;
        case "manager":
          next.manager = COLUMN_FILTER_DEFAULTS.manager;
          break;
        case "companySize":
          next.companySize = COLUMN_FILTER_DEFAULTS.companySize;
          break;
        case "category":
          next.category = COLUMN_FILTER_DEFAULTS.category;
          break;
        case "possibility":
          next.possibility = COLUMN_FILTER_DEFAULTS.possibility;
          break;
        case "trust":
          next.trustMin = COLUMN_FILTER_DEFAULTS.trustMin;
          next.trustMax = COLUMN_FILTER_DEFAULTS.trustMax;
          break;
        case "contract":
          next.contractMin = COLUMN_FILTER_DEFAULTS.contractMin;
          next.contractMax = COLUMN_FILTER_DEFAULTS.contractMax;
          break;
        case "expected":
          next.expectedMin = COLUMN_FILTER_DEFAULTS.expectedMin;
          next.expectedMax = COLUMN_FILTER_DEFAULTS.expectedMax;
          break;
        case "targetDate":
          next.targetStart = COLUMN_FILTER_DEFAULTS.targetStart;
          next.targetEnd = COLUMN_FILTER_DEFAULTS.targetEnd;
          break;
        case "mbmPipeline":
          next.mbmPipeline = COLUMN_FILTER_DEFAULTS.mbmPipeline;
          break;
        case "lastContact":
          next.lastContactStart = COLUMN_FILTER_DEFAULTS.lastContactStart;
          next.lastContactEnd = COLUMN_FILTER_DEFAULTS.lastContactEnd;
          break;
        case "progress":
          next.progress = { ...COLUMN_FILTER_DEFAULTS.progress };
          break;
      }
      return next;
    });
  };

  const renderFilterModalContent = () => {
    switch (filterModalTarget) {
      case "company":
        return (
          <div className={styles.modalField}>
            <label>기업명</label>
            <input
              className={styles.filterInput}
              placeholder="기업명 검색"
              value={columnFilters.company}
              onChange={(e) =>
                setColumnFilters((prev) => ({
                  ...prev,
                  company: e.target.value,
                }))
              }
            />
            {renderSortControls("company")}
          </div>
        );
      case "manager":
        return (
          <div className={styles.modalField}>
            <label>담당자</label>
            <select
              className={styles.filterSelect}
              value={columnFilters.manager}
              onChange={(e) =>
                setColumnFilters((prev) => ({
                  ...prev,
                  manager: e.target.value,
                }))
              }
            >
              <option value="all">전체</option>
              {managers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {renderSortControls("manager")}
          </div>
        );
      case "companySize":
        return (
          <div className={styles.modalField}>
            <label>기업 규모</label>
            <select
              className={styles.filterSelect}
              value={columnFilters.companySize}
              onChange={(e) =>
                setColumnFilters((prev) => ({
                  ...prev,
                  companySize: e.target.value,
                }))
              }
            >
              <option value="all">전체</option>
              {companySizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            {renderSortControls("companySize")}
          </div>
        );
      case "category":
        return (
          <div className={styles.modalField}>
            <label>카테고리</label>
            <select
              className={styles.filterSelect}
              value={columnFilters.category}
              onChange={(e) =>
                setColumnFilters((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
            >
              <option value="all">전체</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {renderSortControls("category")}
          </div>
        );
      case "possibility":
        return (
          <div className={styles.modalField}>
            <label>가능성</label>
            <select
              className={styles.filterSelect}
              value={columnFilters.possibility}
              onChange={(e) =>
                setColumnFilters((prev) => ({
                  ...prev,
                  possibility: e.target.value,
                }))
              }
            >
              <option value="all">전체</option>
              {possibilities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {renderSortControls("possibility")}
          </div>
        );
      case "trust":
        return (
          <div className={styles.modalField}>
            <label>신뢰지수 범위</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                className={styles.filterInput}
                placeholder="min"
                value={columnFilters.trustMin}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    trustMin: e.target.value,
                  }))
                }
              />
              <span className={styles.rangeDash}>~</span>
              <input
                type="number"
                className={styles.filterInput}
                placeholder="max"
                value={columnFilters.trustMax}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    trustMax: e.target.value,
                  }))
                }
              />
            </div>
            {renderSortControls("trust")}
          </div>
        );
      case "contract":
        return (
          <div className={styles.modalField}>
            <label>계약금액 범위</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                className={styles.filterInput}
                placeholder="min"
                value={columnFilters.contractMin}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    contractMin: e.target.value,
                  }))
                }
              />
              <span className={styles.rangeDash}>~</span>
              <input
                type="number"
                className={styles.filterInput}
                placeholder="max"
                value={columnFilters.contractMax}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    contractMax: e.target.value,
                  }))
                }
              />
            </div>
            {renderSortControls("contract")}
          </div>
        );
      case "expected":
        return (
          <div className={styles.modalField}>
            <label>예상매출 범위</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                className={styles.filterInput}
                placeholder="min"
                value={columnFilters.expectedMin}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    expectedMin: e.target.value,
                  }))
                }
              />
              <span className={styles.rangeDash}>~</span>
              <input
                type="number"
                className={styles.filterInput}
                placeholder="max"
                value={columnFilters.expectedMax}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    expectedMax: e.target.value,
                  }))
                }
              />
            </div>
            {renderSortControls("expected")}
          </div>
        );
      case "targetDate":
        return (
          <div className={styles.modalField}>
            <label>목표일자 구간</label>
            <div className={styles.dateInputs}>
              <input
                type="date"
                className={styles.filterInput}
                value={columnFilters.targetStart}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    targetStart: e.target.value,
                  }))
                }
              />
              <input
                type="date"
                className={styles.filterInput}
                value={columnFilters.targetEnd}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    targetEnd: e.target.value,
                  }))
                }
              />
            </div>
            {renderSortControls("targetDate")}
          </div>
        );
      case "mbmPipeline":
        return (
          <div className={styles.modalField}>
            <label>MBM 파이프라인 상태</label>
            <select
              className={styles.filterSelect}
              value={columnFilters.mbmPipeline}
              onChange={(e) =>
                setColumnFilters((prev) => ({
                  ...prev,
                  mbmPipeline: e.target.value,
                }))
              }
            >
              <option value="all">전체</option>
              {mbmPipelineStatuses.map((status) => (
                <option key={status} value={status}>
                  {MBM_PIPELINE_LABELS[status]?.label || status}
                </option>
              ))}
            </select>
            {renderSortControls("mbmPipeline")}
          </div>
        );
      case "lastContact":
        return (
          <div className={styles.modalField}>
            <label>마지막 컨택일 구간</label>
            <div className={styles.dateInputs}>
              <input
                type="date"
                className={styles.filterInput}
                value={columnFilters.lastContactStart}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    lastContactStart: e.target.value,
                  }))
                }
              />
              <input
                type="date"
                className={styles.filterInput}
                value={columnFilters.lastContactEnd}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    lastContactEnd: e.target.value,
                  }))
                }
              />
            </div>
            {renderSortControls("lastContact")}
          </div>
        );
      case "progress":
        return (
          <div className={styles.modalField}>
            <label>진행상태</label>
            <div className={styles.progressChecks}>
              {[
                { key: "test", label: "테스트" },
                { key: "quote", label: "견적" },
                { key: "approval", label: "승인" },
                { key: "contract", label: "계약" },
              ].map((item) => (
                <label key={item.key} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={
                      columnFilters.progress[
                        item.key as keyof typeof columnFilters.progress
                      ]
                    }
                    onChange={(e) =>
                      setColumnFilters((prev) => ({
                        ...prev,
                        progress: {
                          ...prev.progress,
                          [item.key]: e.target.checked,
                        },
                      }))
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            {renderSortControls("progress")}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className={styles.tableCard} padding="none">
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {/* 1. 기업명 */}
                <SortHeader filterTarget="company">
                  기업명
                </SortHeader>
                {/* 2. 기업 규모 */}
                <SortHeader filterTarget="companySize">
                  기업 규모
                </SortHeader>
                {/* 3. 카테고리 */}
                <SortHeader filterTarget="category">
                  카테고리
                </SortHeader>
                {/* 4. 제품사용 */}
                <th className={styles.th}>제품사용</th>
                {/* 5. 담당자 */}
                <SortHeader filterTarget="manager">
                  담당자
                </SortHeader>
                {/* 6. 계약 금액 */}
                <SortHeader filterTarget="contract">
                  계약금액
                </SortHeader>
                {/* 7. 최근 MBM */}
                <th className={styles.th}>최근 MBM</th>
                {/* 8. 도입결정 단계 */}
                <th className={styles.th}>
                  <div className={styles.filterHeader}>
                    <span>도입결정</span>
                    <button
                      className={styles.filterBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterModalTarget("progress");
                      }}
                      title="필터 설정"
                    >
                      <Filter size={12} />
                    </button>
                  </div>
                </th>
                {/* 9. 마지막 컨택일 */}
                <SortHeader filterTarget="lastContact">
                  마지막 컨택
                </SortHeader>
                {/* 10. 신뢰지수 */}
                <SortHeader filterTarget="trust">
                  신뢰지수
                </SortHeader>
                {/* 11. 가능성 */}
                <SortHeader filterTarget="possibility">
                  가능성
                </SortHeader>
                {/* 12. 예상매출 */}
                <SortHeader filterTarget="expected">
                  예상매출
                </SortHeader>
                {/* 13. 목표일자 */}
                <SortHeader filterTarget="targetDate">
                  목표일자
                </SortHeader>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((customer) => {
                const productTags = parseProductUsage(customer.productUsage);
                const lastMBM = getLastMBMDate(customer.attendance);
                const lastContactDate = getLastContactDate(customer.salesActions);
                const adoptionStage = getAdoptionStage(customer.adoptionDecision);
                
                return (
                  <tr
                    key={customer.no}
                    className={`${styles.tr} ${styles.clickableRow}`}
                    onClick={() => openCustomerDetail(customer)}
                  >
                    {/* 1. 기업명 */}
                    <td className={styles.td}>
                      <Text variant="body-sm" weight="medium">
                        {customer.companyName}
                      </Text>
                    </td>
                    {/* 2. 기업 규모 */}
                    <td className={styles.td}>
                      <Text variant="body-sm">
                        {customer.companySize || "미정"}
                      </Text>
                    </td>
                    {/* 3. 카테고리 */}
                    <td className={styles.td}>
                      <Badge
                        variant={getCategoryVariant(customer.category)}
                        size="sm"
                      >
                        {customer.category}
                      </Badge>
                    </td>
                    {/* 4. 제품사용 (멀티태그) */}
                    <td className={styles.td}>
                      <div className={styles.tagGroup}>
                        {productTags.map((tag, idx) => (
                          <Badge key={idx} variant="default" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    {/* 5. 담당자 */}
                    <td className={styles.td}>
                      <Text variant="body-sm">{customer.manager}</Text>
                    </td>
                    {/* 6. 계약 금액 */}
                    <td className={styles.td}>
                      <Text variant="body-sm" mono>
                        {formatCurrency(customer.contractAmount)}
                      </Text>
                    </td>
                    {/* 7. 최근 MBM */}
                    <td className={styles.td}>
                      <Text variant="body-sm" color={lastMBM ? "primary" : "tertiary"}>
                        {lastMBM || "-"}
                      </Text>
                    </td>
                    {/* 8. 도입결정 단계 (변화 표시) */}
                    <td className={styles.td}>
                      {(() => {
                        const pastStage = customer._periodData?.pastAdoptionStage || adoptionStage;
                        const isImproved = getAdoptionStageLevel(adoptionStage) > getAdoptionStageLevel(pastStage);
                        const isDeclined = getAdoptionStageLevel(adoptionStage) < getAdoptionStageLevel(pastStage);
                        const changeType = isImproved ? "positive" : isDeclined ? "negative" : "neutral";
                        
                        return (
                          <div className={`${styles.changeTag} ${styles[changeType]}`}>
                            <span>{pastStage}</span>
                            <ArrowRight size={10} />
                            <span>{adoptionStage}</span>
                          </div>
                        );
                      })()}
                    </td>
                    {/* 9. 마지막 컨택일 */}
                    <td className={styles.td}>
                      <Text variant="body-sm" color={lastContactDate ? "primary" : "tertiary"}>
                        {formatDateShort(lastContactDate)}
                      </Text>
                    </td>
                    {/* 10. 신뢰지수 (변화 표시) */}
                    <td className={styles.td}>
                      {(() => {
                        const past = customer._periodData?.pastTrustIndex ?? customer.trustIndex ?? 0;
                        const current = customer.trustIndex ?? 0;
                        const isPositive = current > past;
                        const isNegative = current < past;
                        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";
                        
                        return (
                          <div className={`${styles.changeTag} ${styles[changeType]}`}>
                            <span>{past}</span>
                            <ArrowRight size={10} />
                            <span>{current}</span>
                          </div>
                        );
                      })()}
                    </td>
                    {/* 11. 가능성 (변화 표시) */}
                    <td className={styles.td}>
                      {(() => {
                        const past = customer._periodData?.pastPossibility || customer.adoptionDecision.possibility;
                        const current = customer.adoptionDecision.possibility;
                        const isPositive = (POSSIBILITY_ORDER[current] ?? 0) > (POSSIBILITY_ORDER[past] ?? 0);
                        const isNegative = (POSSIBILITY_ORDER[current] ?? 0) < (POSSIBILITY_ORDER[past] ?? 0);
                        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";
                        
                        return (
                          <div className={`${styles.changeTag} ${styles[changeType]}`}>
                            <span>{past}</span>
                            <ArrowRight size={10} />
                            <span>{current}</span>
                          </div>
                        );
                      })()}
                    </td>
                    {/* 12. 예상매출 (변화 표시) */}
                    <td className={styles.td}>
                      {(() => {
                        const current = customer._periodData?.currentExpectedRevenue ?? 0;
                        const past = customer._periodData?.pastExpectedRevenue ?? current;
                        const isPositive = current > past;
                        const isNegative = current < past;
                        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";
                        
                        return (
                          <div className={`${styles.changeTag} ${styles[changeType]}`}>
                            <span>{formatCompactCurrency(past)}</span>
                            <ArrowRight size={10} />
                            <span>{formatCompactCurrency(current)}</span>
                          </div>
                        );
                      })()}
                    </td>
                    {/* 13. 목표일자 (변화 표시) */}
                    <td className={styles.td}>
                      {(() => {
                        const current = customer.adoptionDecision.targetDate || "-";
                        const past = customer._periodData?.pastTargetDate || current;
                        // 목표일자가 당겨지면 긍정적 (더 빨리 매출 발생), 늦춰지면 부정적
                        const isPositive = past !== "-" && current !== "-" && new Date(current) < new Date(past);
                        const isNegative = past !== "-" && current !== "-" && new Date(current) > new Date(past);
                        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";
                        
                        return (
                          <div className={`${styles.changeTag} ${styles[changeType]}`}>
                            <span>{past}</span>
                            <ArrowRight size={10} />
                            <span>{current}</span>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={!!filterModalTarget}
        onClose={() => setFilterModalTarget(null)}
        title="컬럼 필터"
        size="sm"
      >
        <div className={styles.filterModalContent}>
          {renderFilterModalContent()}
          {filterModalTarget && (
            <div className={styles.modalActions}>
              <button
                className={styles.resetBtn}
                onClick={() => resetFilter(filterModalTarget)}
              >
                초기화
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setFilterModalTarget(null)}
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedCustomer?.companyName || ""}
        size="xl"
      >
        {selectedCustomer && (
          <div className={styles.modalContent}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "summary" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("summary")}
              >
                <Building2 size={16} />
                <span>요약</span>
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "sales" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("sales")}
              >
                <Calendar size={16} />
                <span>영업 히스토리</span>
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "marketing" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("marketing")}
              >
                <BookOpen size={16} />
                <span>마케팅 히스토리</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === "summary" && (
                <div className={styles.infoTab}>
                  {/* Basic Info */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">
                      기본 정보
                    </Text>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          담당자
                        </Text>
                        <Text variant="body-sm">
                          {selectedCustomer.manager}
                        </Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          카테고리
                        </Text>
                        <Text variant="body-sm">
                          {selectedCustomer.category}
                        </Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          기업 규모
                        </Text>
                        <Text variant="body-sm">
                          {selectedCustomer.companySize || "-"}
                        </Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          계약 금액
                        </Text>
                        <Text variant="body-sm" mono>
                          {formatCurrency(selectedCustomer.contractAmount)}
                        </Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          제품 사용
                        </Text>
                        <Text variant="body-sm">
                          {selectedCustomer.productUsage}
                        </Text>
                      </div>
                    </div>
                  </section>

                  {/* Status Changes */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">
                      상태 변화
                    </Text>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          신뢰 점수
                        </Text>
                        <div className={`${styles.changeTag} ${styles[
                          selectedCustomer.changeDirection === "up" ? "positive" :
                          selectedCustomer.changeDirection === "down" ? "negative" : "neutral"
                        ]}`}>
                          <span>{(selectedCustomer.trustIndex ?? 0) - (selectedCustomer.changeAmount ?? 0)}</span>
                          <ArrowRight size={10} />
                          <span>{selectedCustomer.trustIndex}</span>
                        </div>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          목표 매출
                        </Text>
                        <div className={styles.changeTag}>
                          <span>{formatCompactCurrency(selectedCustomer._periodData?.pastTargetRevenue ?? 0)}</span>
                          <ArrowRight size={10} />
                          <span>{formatCompactCurrency(selectedCustomer.adoptionDecision?.targetRevenue ?? 0)}</span>
                        </div>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          가능성
                        </Text>
                        <div className={styles.changeTag}>
                          <span>{selectedCustomer._periodData?.pastPossibility}</span>
                          <ArrowRight size={10} />
                          <span>{selectedCustomer.adoptionDecision.possibility}</span>
                        </div>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          예상 매출
                        </Text>
                        <div className={styles.changeTag}>
                          <span>{formatCompactCurrency(selectedCustomer._periodData?.pastExpectedRevenue ?? 0)}</span>
                          <ArrowRight size={10} />
                          <span>{formatCompactCurrency(selectedCustomer._periodData?.currentExpectedRevenue ?? 0)}</span>
                        </div>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          도입결정 단계
                        </Text>
                        <div className={styles.changeTag}>
                          <span>{selectedCustomer._periodData?.pastAdoptionStage || "-"}</span>
                          <ArrowRight size={10} />
                          <span>{getAdoptionStage(selectedCustomer.adoptionDecision) || "-"}</span>
                        </div>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">
                          목표 일자
                        </Text>
                        <div className={styles.changeTag}>
                          <span>{selectedCustomer._periodData?.pastTargetDate || "-"}</span>
                          <ArrowRight size={10} />
                          <span>{selectedCustomer.adoptionDecision.targetDate || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* HubSpot Link */}
                  <section className={styles.modalSection}>
                    <a 
                      href={`https://app.hubspot.com/contacts/${selectedCustomer.no}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.hubspotButton}
                    >
                      <Text variant="body-sm" weight="medium">
                        HubSpot Company 보기
                      </Text>
                      <ArrowRight size={16} />
                    </a>
                  </section>
                </div>
              )}

              {activeTab === "sales" && (
                <div className={styles.salesTab}>
                  {/* 주차별 추이 그래프 */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">
                      주차별 추이
                    </Text>
                    {selectedCustomer.salesActions && selectedCustomer.salesActions.length > 0 ? (
                      <div className={styles.weeklyChart}>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart
                            data={selectedCustomer.salesActions
                              .slice()
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((action) => ({
                                date: action.date,
                                customerResponseIndex: 
                                  action.customerResponse === "상" ? 3 :
                                  action.customerResponse === "중" ? 2 :
                                  action.customerResponse === "하" ? 1 : 0,
                                targetRevenue: action.targetRevenue ? action.targetRevenue / 100000000 : null,
                                expectedRevenue: action.targetRevenue && action.possibility
                                  ? (action.targetRevenue * parseInt(action.possibility)) / 100 / 100000000
                                  : null,
                              }))}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#a1a1aa"
                              tick={{ fill: "#a1a1aa", fontSize: 12 }}
                            />
                            <YAxis 
                              yAxisId="left"
                              stroke="#a1a1aa"
                              tick={{ fill: "#a1a1aa", fontSize: 12 }}
                              label={{ value: "고객 반응 지수", angle: -90, position: "insideLeft", fill: "#a1a1aa" }}
                              domain={[0, 3]}
                              ticks={[1, 2, 3]}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              stroke="#a1a1aa"
                              tick={{ fill: "#a1a1aa", fontSize: 12 }}
                              label={{ value: "매출 (억원)", angle: 90, position: "insideRight", fill: "#a1a1aa" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#18181b",
                                border: "1px solid #27272a",
                                borderRadius: "8px",
                              }}
                              labelStyle={{ color: "#fafafa" }}
                              itemStyle={{ color: "#a1a1aa" }}
                            />
                            <Legend 
                              wrapperStyle={{ color: "#a1a1aa" }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="customerResponseIndex"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              name="고객 반응 지수"
                              dot={{ fill: "#3b82f6", r: 4 }}
                            />
                            <Bar
                              yAxisId="right"
                              dataKey="targetRevenue"
                              fill="#a855f7"
                              name="목표 매출"
                              opacity={0.6}
                            />
                            <Bar
                              yAxisId="right"
                              dataKey="expectedRevenue"
                              fill="#22c55e"
                              name="예상 매출"
                              opacity={0.8}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className={styles.chartPlaceholder}>
                        <Text variant="body-sm" color="tertiary">
                          영업 액션 데이터가 없습니다.
                        </Text>
                      </div>
                    )}
                  </section>

                  {/* 영업 액션 타임라인 */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">
                      영업 액션 타임라인
                    </Text>
                    {selectedCustomer.salesActions && selectedCustomer.salesActions.length > 0 ? (
                      <div className={styles.actionTimeline}>
                        {selectedCustomer.salesActions
                          .slice()
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((action, idx) => (
                            <div key={idx} className={styles.actionCard}>
                              <div className={styles.actionHeader}>
                                <Text variant="body-sm" weight="semibold">
                                  {action.date}
                                </Text>
                                <Badge variant="info" size="sm">
                                  {action.type === "call" ? "콜" : action.type === "meeting" ? "미팅" : "메일"}
                                </Badge>
                              </div>
                              <Text variant="body-sm" color="secondary">
                                담당자: {selectedCustomer.manager}
                              </Text>
                              <Text variant="body-sm" className={styles.actionDescription}>
                                {action.content || "-"}
                              </Text>
                              <div className={styles.actionTags}>
                                {action.customerResponse && (
                                  <Badge 
                                    variant={
                                      action.customerResponse === "상" ? "success" :
                                      action.customerResponse === "중" ? "warning" : "error"
                                    }
                                    size="sm"
                                  >
                                    고객 반응: {action.customerResponse}
                                  </Badge>
                                )}
                                {action.test || action.quote || action.approval || action.contract ? (
                                  <Badge variant="info" size="sm">
                                    도입결정: {getAdoptionStage({
                                      test: action.test || false,
                                      quote: action.quote || false,
                                      approval: action.approval || false,
                                      contract: action.contract || false,
                                    } as any)}
                                  </Badge>
                                ) : null}
                                {action.targetRevenue && (
                                  <Badge variant="default" size="sm">
                                    목표 매출: {formatCompactCurrency(action.targetRevenue)}
                                  </Badge>
                                )}
                                {action.targetDate && (
                                  <Badge variant="default" size="sm">
                                    목표 일자: {action.targetDate}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <Text variant="body-sm" color="tertiary">
                        영업 액션 이력이 없습니다.
                      </Text>
                    )}
                  </section>
                </div>
              )}

              {activeTab === "marketing" && (
                <div className={styles.marketingTab}>
                  {/* 콘텐츠 소비 요약 */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">
                      콘텐츠 소비 요약 (최근 30일)
                    </Text>
                    <div className={styles.summaryGrid}>
                      <div className={styles.summaryItem}>
                        <Text variant="caption" color="tertiary">최다 소비 퍼널</Text>
                        <Text variant="body-md" weight="semibold">MOFU</Text>
                      </div>
                      <div className={styles.summaryItem}>
                        <Text variant="caption" color="tertiary">콘텐츠 조회 수</Text>
                        <Text variant="body-md" weight="semibold">
                          {selectedCustomer.contentEngagements?.length || 0}
                        </Text>
                      </div>
                    </div>
                  </section>

                  {/* 콘텐츠 소비 이력 */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">
                      콘텐츠 소비 이력
                    </Text>
                    {selectedCustomer.contentEngagements && selectedCustomer.contentEngagements.length > 0 ? (
                      <div className={styles.contentList}>
                        {selectedCustomer.contentEngagements
                          .slice()
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 10)
                          .map((content, idx) => (
                            <a
                              key={idx}
                              href={`https://app.hubspot.com/content/${idx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.contentItem}
                            >
                              <div className={styles.contentHeader}>
                                <Text variant="body-sm" weight="medium">
                                  {content.title || "콘텐츠 제목"}
                                </Text>
                                <Badge variant="info" size="sm">
                                  {content.category || "MOFU"}
                                </Badge>
                              </div>
                              <Text variant="caption" color="tertiary">
                                최근 조회: {content.date || "-"}
                              </Text>
                            </a>
                          ))}
                      </div>
                    ) : (
                      <Text variant="body-sm" color="tertiary">
                        콘텐츠 소비 이력이 없습니다.
                      </Text>
                    )}
                  </section>

                  {/* MBM 참여 이력 */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">
                      MBM 참여 이력
                    </Text>
                    {selectedCustomer.attendance && Object.values(selectedCustomer.attendance).some(Boolean) ? (
                      <div className={styles.mbmList}>
                        {Object.entries(selectedCustomer.attendance)
                          .filter(([key, value]) => value && MBM_EVENTS[key])
                          .sort((a, b) => {
                            const eventA = MBM_EVENTS[a[0]];
                            const eventB = MBM_EVENTS[b[0]];
                            if (!eventA || !eventB) return 0;
                            return new Date(eventB.date).getTime() - new Date(eventA.date).getTime();
                          })
                          .map(([key]) => {
                            const event = MBM_EVENTS[key];
                            if (!event) return null;
                            return (
                              <a
                                key={key}
                                href={`https://app.hubspot.com/marketing-events/${key}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.mbmItem}
                              >
                                <div className={styles.mbmIcon}>
                                  <Calendar size={16} />
                                </div>
                                <div className={styles.mbmContent}>
                                  <Text variant="body-sm" weight="medium">
                                    {event.label}
                                  </Text>
                                  <Text variant="caption" color="tertiary">
                                    진행일: {event.date}
                                  </Text>
                                </div>
                              </a>
                            );
                          })}
                      </div>
                    ) : (
                      <Text variant="body-sm" color="tertiary">
                        MBM 참여 이력이 없습니다.
                      </Text>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 영업 액션 상세 모달 */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={closeActionModal}
        title="영업 액션 상세"
        size="sm"
      >
        {actionModalData && selectedCustomer && (
          <div className={styles.actionModal}>
            <div className={styles.actionModalHeader}>
              <Badge
                variant={
                  actionModalData.action.type === "meeting" ? "purple" : "cyan"
                }
                size="md"
              >
                {actionModalData.action.type === "meeting" ? (
                  <>
                    <Users size={12} /> 미팅
                  </>
                ) : (
                  <>
                    <Phone size={12} /> 콜
                  </>
                )}
              </Badge>
              <div className={styles.actionDate}>
                <Calendar size={14} />
                <Text variant="body-sm" color="secondary">
                  {actionModalData.action.date}
                </Text>
              </div>
            </div>

            <div className={styles.actionModalContent}>
              <Text variant="label" color="tertiary">
                활동 내용
              </Text>
              <Text variant="body-sm" weight="medium">
                {actionModalData.action.content}
              </Text>
            </div>

            <div className={styles.actionModalMeta}>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">
                  기간
                </Text>
                <Text variant="body-sm">{actionModalData.weekLabel}</Text>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">
                  담당자
                </Text>
                <Text variant="body-sm">{selectedCustomer.manager}</Text>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">
                  가능성 변화
                </Text>
                <div className={styles.possibilityChange}>
                  {actionModalData.prevPossibility ? (
                    <>
                      <Badge variant="default" size="sm">
                        {actionModalData.prevPossibility}
                      </Badge>
                      <ArrowRight size={12} className={styles.arrowIcon} />
                    </>
                  ) : null}
                  <Badge
                    variant={
                      actionModalData.currentPossibility === "90%"
                        ? "success"
                        : actionModalData.currentPossibility === "40%"
                        ? "warning"
                        : "error"
                    }
                    size="sm"
                  >
                    {actionModalData.currentPossibility || "-"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 고객반응 및 목표매출 */}
            <div className={styles.actionModalMeta}>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">
                  고객반응 변화
                </Text>
                <div className={styles.possibilityChange}>
                  {actionModalData.prevCustomerResponse && 
                   actionModalData.prevCustomerResponse !== actionModalData.action.customerResponse ? (
                    <>
                      <Badge variant="default" size="sm" className={styles.pastValue}>
                        {actionModalData.prevCustomerResponse}
                      </Badge>
                      <ArrowRight size={12} className={styles.arrowIcon} />
                    </>
                  ) : null}
                  <Badge
                    variant={
                      actionModalData.action.customerResponse === "상"
                        ? "success"
                        : actionModalData.action.customerResponse === "중"
                        ? "warning"
                        : "error"
                    }
                    size="sm"
                  >
                    {actionModalData.action.customerResponse || "-"}
                  </Badge>
                </div>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">
                  목표매출 변화
                </Text>
                <div className={styles.possibilityChange}>
                  {actionModalData.prevTargetRevenue !== null && 
                   actionModalData.prevTargetRevenue !== undefined &&
                   actionModalData.prevTargetRevenue !== actionModalData.action.targetRevenue ? (
                    <>
                      <Text variant="body-sm" color="tertiary" className={styles.pastValue}>
                        {formatCurrency(actionModalData.prevTargetRevenue)}
                      </Text>
                      <ArrowRight size={12} className={styles.arrowIcon} />
                    </>
                  ) : null}
                  <Text variant="body-sm" weight="semibold">
                    {actionModalData.action.targetRevenue
                      ? formatCurrency(actionModalData.action.targetRevenue)
                      : "-"}
                  </Text>
                </div>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">
                  목표 일자
                </Text>
                <Text variant="body-sm" weight="semibold">
                  {actionModalData.action.targetDate || "-"}
                </Text>
              </div>
            </div>

            {/* 진행 상태 체크리스트 */}
            <div className={styles.progressChecklist}>
              <Text variant="caption" color="tertiary">진행 상태 변화</Text>
              <div className={styles.checklistItems}>
                <div className={`${styles.checkItem} ${actionModalData.action.test ? styles.checked : ''} ${!actionModalData.prevTest && actionModalData.action.test ? styles.newlyChecked : ''}`}>
                  {actionModalData.action.test ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <Text variant="body-sm">테스트</Text>
                </div>
                <div className={`${styles.checkItem} ${actionModalData.action.quote ? styles.checked : ''} ${!actionModalData.prevQuote && actionModalData.action.quote ? styles.newlyChecked : ''}`}>
                  {actionModalData.action.quote ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <Text variant="body-sm">견적</Text>
                </div>
                <div className={`${styles.checkItem} ${actionModalData.action.approval ? styles.checked : ''} ${!actionModalData.prevApproval && actionModalData.action.approval ? styles.newlyChecked : ''}`}>
                  {actionModalData.action.approval ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <Text variant="body-sm">품의</Text>
                </div>
                <div className={`${styles.checkItem} ${actionModalData.action.contract ? styles.checked : ''} ${!actionModalData.prevContract && actionModalData.action.contract ? styles.newlyChecked : ''}`}>
                  {actionModalData.action.contract ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <Text variant="body-sm">계약</Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 컨텐츠 조회 모달 */}
      <Modal
        isOpen={isContentModalOpen}
        onClose={closeContentModal}
        title={
          selectedCustomer
            ? `${selectedCustomer.companyName} - 조회 컨텐츠`
            : "조회 컨텐츠"
        }
        size="md"
      >
        {(() => {
          // 1) 콘텐츠 상세 모달 (SummaryCards와 동일한 뷰어 리스트)
          if (selectedContentDetail) {
            const categoryMeta = CONTENT_CATEGORY_META[selectedContentDetail.category];
            return (
              <div className={styles.contentDetailModal}>
                <div className={styles.contentDetailHeader}>
                  <Badge variant={categoryMeta.variant}>
                    {selectedContentDetail.category}
                  </Badge>
                  <Text variant="caption" color="tertiary">
                    {categoryMeta.label}
                  </Text>
                </div>

                <div className={styles.contentDetailStats}>
                  <div className={styles.contentStatItem}>
                    <Eye size={18} />
                    <Text variant="h3" weight="bold" mono>
                      {selectedContentDetail.currentViews}
                    </Text>
                    <Text variant="caption" color="secondary">
                      총 조회수
                    </Text>
                  </div>
                  <div className={styles.contentStatItem}>
                    <BookOpen size={18} />
                    <Text variant="h3" weight="bold" mono color="success">
                      {selectedContentDetail.periodViews}
                    </Text>
                    <Text variant="caption" color="secondary">
                      기간 내 조회
                    </Text>
                  </div>
                  <div className={styles.contentStatItem}>
                    <Text variant="body-md" weight="bold" mono>
                      {selectedContentDetail.pastViews}
                    </Text>
                    <Text variant="caption" color="secondary">
                      과거 조회
                    </Text>
                  </div>
                </div>

                <Text variant="body-sm" weight="semibold">
                  조회한 기업 ({selectedContentDetail.viewers.length}개사)
                </Text>
                <div className={styles.viewerList}>
                  {selectedContentDetail.viewers.map((viewer, idx) => (
                    <div key={idx} className={styles.viewerItem}>
                      <div className={styles.viewerMain}>
                        <Text variant="body-sm" weight="semibold">
                          {viewer.companyName}
                        </Text>
                        <Text variant="caption" color="tertiary">
                          {viewer.date}
                        </Text>
                      </div>
                      <div className={styles.viewerMeta}>
                        <Badge variant="default" size="sm">
                          {viewer.category}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {viewer.companySize || "-"}
                        </Badge>
                        <Badge variant="info" size="sm">
                          {viewer.possibility}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {selectedContentDetail.viewers.length === 0 && (
                    <div className={styles.emptyContent}>
                      <Text variant="body-sm" color="tertiary">
                        기간 내 조회 기업이 없습니다.
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // 2) 기존 주간 컨텐츠 모달 (신뢰지수 변화용)
          if (contentModalData && selectedCustomer) {
            const filteredContents = getContentsForPeriod(
              selectedCustomer,
              contentModalData.startDate,
              contentModalData.endDate
            );
            return (
              <div className={styles.contentModal}>
                <div className={styles.contentModalHeader}>
                  <div className={styles.periodBadge}>
                    <Text variant="body-sm" weight="semibold">
                      {contentModalData.weekLabel}
                    </Text>
                    <Text variant="caption" color="tertiary">
                      ({contentModalData.weekRange})
                    </Text>
                  </div>
                  <div className={styles.contentStats}>
                    <div className={styles.statItem}>
                      <Text variant="caption" color="tertiary">
                        조회 컨텐츠
                      </Text>
                      <Text variant="h4" weight="bold" mono>
                        {filteredContents.length}건
                      </Text>
                    </div>
                    <div className={styles.statItem}>
                      <Text variant="caption" color="tertiary">
                        신뢰지수 변화
                      </Text>
                      <Text variant="h4" weight="bold" mono color="success">
                        +{contentModalData.trustChange}
                      </Text>
                    </div>
                  </div>
                  <Text variant="body-sm" color="secondary">
                    해당 기간 동안 조회한 컨텐츠로 신뢰지수가 상승했습니다.
                  </Text>
                </div>

                <div className={styles.contentModalList}>
                  {filteredContents.map((content, idx) => {
                    const categoryInfo =
                      CONTENT_CATEGORY_LABELS[content.category] || {
                        label: content.category,
                        color: "default",
                      };
                    return (
                      <div key={idx} className={styles.contentModalItem}>
                        <div className={styles.contentIcon}>
                          <BookOpen size={16} />
                        </div>
                        <div className={styles.contentInfo}>
                          <Text variant="body-sm" weight="medium">
                            {content.title}
                          </Text>
                          <div className={styles.contentMeta}>
                            <Text variant="caption" color="tertiary">
                              {content.date}
                            </Text>
                            <Badge
                              variant={
                                content.category === "BOFU"
                                  ? "success"
                                  : content.category === "MOFU"
                                  ? "warning"
                                  : "info"
                              }
                              size="sm"
                            >
                              {content.category} · {categoryInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredContents.length === 0 && (
                    <div className={styles.emptyContent}>
                      <Text variant="body-sm" color="tertiary">
                        해당 기간에 조회한 컨텐츠가 없습니다.
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </Modal>
    </>
  );
};
