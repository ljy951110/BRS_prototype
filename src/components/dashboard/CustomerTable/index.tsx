import { PresetDateRangePicker } from "@/components/common/atoms/PresetDateRangePicker";
import { CategoryLabel, ProductTypeLabel } from "@/constants/commonMap";
import {
  calculateExpectedRevenue,
} from "@/data/mockData";
import { Category, ProductType, type SalesAction } from "@/repository/openapi/model";
import { useGetCustomerSummary, useGetSalesHistory } from "@/repository/query/customerDetailApiController/queryHook";
import { useGetTrustChangeDetail } from "@/repository/query/trustChangeDetailApiController/queryHook";
import { Customer } from "@/types/customer";
import { FilterFilled } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  theme,
  Typography
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { FilterDropdownProps } from "antd/es/table/interface";
import dayjs from 'dayjs';
import { ArrowRight, BookOpen, Building2, Calendar, ExternalLink, Eye, Phone, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./index.module.scss";

const { Title, Text: AntText } = Typography;

// 다크모드 툴팁 스타일 (yjcopy 참고)
const DARK_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '8px',
  },
  labelStyle: {
    color: '#fafafa',
  },
  itemStyle: {
    color: '#fafafa',
  },
};

interface TableFilters {
  companySizes?: string[];
  categories?: string[];
  productUsages?: string[];
  managers?: string[];
  possibilityRange?: { min?: number; max?: number };
  progressStages?: string[];
  contractAmountRange?: { minMan?: number; maxMan?: number };
  expectedRevenueRange?: { minMan?: number; maxMan?: number };
  targetRevenueRange?: { minMan?: number; maxMan?: number };
  targetMonthRange?: { start?: string; end?: string };
  companyName?: string;
  lastContactDateRange?: { start?: string; end?: string };
  lastMBMDateRange?: { start?: string; end?: string };
  sort?: { field: string; order: "asc" | "desc" };
}

interface Manager {
  owner_id: string;
  name: string;
}

interface CustomerTableProps {
  data: Customer[];
  loading?: boolean;
  pagination?: TablePaginationConfig;
  filters?: TableFilters;
  onFiltersChange?: (filters: TableFilters) => void;
  managers?: Manager[];
}

type TableRow = Customer & {
  key: number;
  expectedRevenue: number;
};

const formatMan = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "-";
  const man = Math.round(val / 10000);
  return `${man}만`;
};

// 이전 방식: attendance와 salesActions로부터 계산
// 현재는 API에서 lastMBMDate, lastContactDate를 직접 제공하므로 사용하지 않음
// const getLastMBMDate = (attendance: Customer["attendance"]): string | null => { ... }
// const getLastContactDate = (salesActions: Customer["salesActions"]): string | null => { ... }

// 날짜를 YY-MM-DD 형식으로 포맷
const formatDateShort = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 목표일자 문자열을 날짜로 변환
const parseTargetDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr || dateStr === "-") return null;

  // ISO 형식 날짜인 경우 (예: "2024-12-10")
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // "월" 형식인 경우 (예: "12월", "1월")
  const monthMatch = dateStr.match(/(\d+)/);
  if (monthMatch) {
    const month = parseInt(monthMatch[1], 10);
    if (month >= 1 && month <= 12) {
      // 현재 날짜 기준 (2024-12-10)
      const now = new Date("2024-12-10");
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 12월

      // 목표 월이 현재 월보다 작으면 다음 해로 해석
      // 예: 현재 12월, 목표 "1월" → 2025년 1월
      // 예: 현재 12월, 목표 "12월" → 2024년 12월 (같은 해)
      const targetYear = month < currentMonth ? currentYear + 1 : currentYear;
      return new Date(targetYear, month - 1, 1);
    }
  }

  return null;
};

const renderProgressTags = (
  record: TableRow | Customer,
  showNew: boolean | undefined,
  colors: {
    activeText: string;
    activeBorder: string;
    inactiveText: string;
    inactiveBorder: string;
    newText: string;
    newBorder: string;
    newBg?: string;
  }
): React.ReactNode => {
  const ad = record.adoptionDecision;
  const past = (record as TableRow)._periodData;
  const hasPastData = !!past;

  // adoptionDecision이 없는 경우 빈 태그 반환
  if (!ad) {
    return <Space size={6}></Space>;
  }

  const activeStyle = {
    borderColor: colors.activeBorder,
    color: colors.activeText,
    background: "transparent",
  };
  const inactiveStyle = {
    borderColor: colors.inactiveBorder,
    color: colors.inactiveText,
    background: "transparent",
  };
  const newStyle = {
    borderColor: colors.newBorder,
    color: colors.newText,
    background: colors.newBg || "rgba(34,197,94,0.08)",
  };
  // 자동으로 채워진 이전 단계 스타일 (흰색 테두리)
  const impliedStyle = {
    borderColor: "white",
    color: colors.activeText,
    background: "transparent",
  };

  // 상위 단계가 진행되면 하위 단계도 충족된 것으로 표시
  // C(계약) → T, Q, A 충족
  // A(승인) → T, Q 충족
  // Q(견적) → T 충족
  const isTestActive = !!ad.test || !!ad.quote || !!ad.approval || !!ad.contract;
  const isQuoteActive = !!ad.quote || !!ad.approval || !!ad.contract;
  const isApprovalActive = !!ad.approval || !!ad.contract;
  const isContractActive = !!ad.contract;

  // 이전 기간의 활성화 상태 (상위 단계 포함)
  const pastTestActive = !!(past?.pastTest || past?.pastQuote || past?.pastApproval || past?.pastContract);
  const pastQuoteActive = !!(past?.pastQuote || past?.pastApproval || past?.pastContract);
  const pastApprovalActive = !!(past?.pastApproval || past?.pastContract);
  const pastContractActive = !!past?.pastContract;

  const stages: {
    key: "test" | "quote" | "approval" | "contract";
    label: string;
    pastActive: boolean; // 이전 기간에 활성화되었는지 (상위 단계 포함)
    currentActive: boolean; // 현재 활성화되었는지
    actualValue: boolean; // 실제로 이 단계가 진행되었는지
  }[] = [
      { key: "test", label: "T", pastActive: pastTestActive, currentActive: isTestActive, actualValue: !!ad.test },
      { key: "quote", label: "Q", pastActive: pastQuoteActive, currentActive: isQuoteActive, actualValue: !!ad.quote },
      {
        key: "approval",
        label: "A",
        pastActive: pastApprovalActive,
        currentActive: isApprovalActive,
        actualValue: !!ad.approval,
      },
      {
        key: "contract",
        label: "C",
        pastActive: pastContractActive,
        currentActive: isContractActive,
        actualValue: !!ad.contract,
      },
    ];

  return (
    <Space size={6}>
      {stages.map((stage) => {
        const isNew = showNew && hasPastData && stage.currentActive && !stage.pastActive;

        let style;
        if (!stage.currentActive) {
          // 활성화되지 않음
          style = inactiveStyle;
        } else if (stage.actualValue) {
          // 실제로 이 단계가 진행됨
          if (isNew) {
            // 이전에는 활성화되지 않았는데 새로 추가됨 → 초록색
            style = newStyle;
          } else {
            // 이전에도 활성화되어 있었음
            style = activeStyle;
          }
        } else {
          // 상위 단계로 인해 자동 채워짐
          if (stage.pastActive) {
            // 이전에도 활성화되어 있었음 (상위 단계 때문이든 실제든)
            style = activeStyle;
          } else {
            // 이전에는 없었는데 현재 상위 단계로 인해 채워짐 → 흰색 테두리
            style = impliedStyle;
          }
        }

        return (
          <Tag key={stage.key} style={style} bordered>
            {stage.label}
          </Tag>
        );
      })}
    </Space>
  );
};

export const CustomerTable = ({ data, loading, pagination: paginationProp, filters: _filters, onFiltersChange, managers = [] }: CustomerTableProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedContent, setSelectedContent] = useState<{
    title: string;
    category: string;
    date: string;
  } | null>(null);

  // 각 탭별 조회 기간 (모달 열릴 때는 항상 6개월 전부터 현재까지)
  const getInitialDateRange = (): [dayjs.Dayjs, dayjs.Dayjs] => {
    return [dayjs().subtract(6, 'month'), dayjs()];
  };

  const [summaryDateRange, setSummaryDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(getInitialDateRange);
  const [actionDateRange, setActionDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(getInitialDateRange);
  const [contentDateRange, setContentDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(getInitialDateRange);

  // 영업 액션 상세 모달
  const [selectedAction, setSelectedAction] = useState<SalesAction | null>(null);
  const [isActionDetailModalOpen, setIsActionDetailModalOpen] = useState(false);

  const { token } = theme.useToken();

  // 모달이 닫힐 때 조회 기간 초기화
  useEffect(() => {
    if (!selectedCustomer) {
      const initialRange = getInitialDateRange();
      setSummaryDateRange(initialRange);
      setActionDateRange(initialRange);
      setContentDateRange(initialRange);
    }
  }, [selectedCustomer]);

  // 고객 요약 정보 조회
  const { data: _customerSummary, isLoading: _isSummaryLoading } = useGetCustomerSummary(
    selectedCustomer?.no ?? 0,
    {
      dateRange: {
        startDate: summaryDateRange[0].format('YYYY-MM-DD'),
        endDate: summaryDateRange[1].format('YYYY-MM-DD'),
      },
    },
    {
      enabled: !!selectedCustomer,
    }
  );

  // 영업 히스토리 조회
  const { data: salesHistoryData, isLoading: isSalesHistoryLoading } = useGetSalesHistory(
    selectedCustomer?.no ?? 0,
    {
      dateRange: {
        startDate: actionDateRange[0].format('YYYY-MM-DD'),
        endDate: actionDateRange[1].format('YYYY-MM-DD'),
      },
    },
    {
      enabled: !!selectedCustomer,
    }
  );

  // 콘텐츠/MBM 상세 조회
  const { data: trustChangeDetailData, isLoading: isTrustChangeDetailLoading } = useGetTrustChangeDetail(
    selectedCustomer?.no ?? 0,
    {
      dateRange: {
        startDate: contentDateRange[0].format('YYYY-MM-DD'),
        endDate: contentDateRange[1].format('YYYY-MM-DD'),
      },
    },
    {
      enabled: !!selectedCustomer,
    }
  );

  // 범위 필터 state
  const [contractAmountMin, setContractAmountMin] = useState<number | null>(null);
  const [contractAmountMax, setContractAmountMax] = useState<number | null>(null);
  const [targetRevenueMin, setTargetRevenueMin] = useState<number | null>(null);
  const [targetRevenueMax, setTargetRevenueMax] = useState<number | null>(null);
  const [expectedRevenueMin, setExpectedRevenueMin] = useState<number | null>(null);
  const [expectedRevenueMax, setExpectedRevenueMax] = useState<number | null>(null);
  const [targetMonthRangeStart, setTargetMonthRangeStart] = useState<string>("");
  const [targetMonthRangeEnd, setTargetMonthRangeEnd] = useState<string>("");
  const [contractAmountMinDraft, setContractAmountMinDraft] = useState<number | null>(null); // 만원 단위
  const [contractAmountMaxDraft, setContractAmountMaxDraft] = useState<number | null>(null); // 만원 단위
  const [targetRevenueMinDraft, setTargetRevenueMinDraft] = useState<number | null>(null); // 만원 단위
  const [targetRevenueMaxDraft, setTargetRevenueMaxDraft] = useState<number | null>(null); // 만원 단위
  const [expectedRevenueMinDraft, setExpectedRevenueMinDraft] = useState<number | null>(null); // 만원 단위
  const [expectedRevenueMaxDraft, setExpectedRevenueMaxDraft] = useState<number | null>(null); // 만원 단위
  const [targetMonthRangeStartDraft, setTargetMonthRangeStartDraft] = useState<dayjs.Dayjs | null>(null);
  const [targetMonthRangeEndDraft, setTargetMonthRangeEndDraft] = useState<dayjs.Dayjs | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [companySearchDraft, setCompanySearchDraft] = useState("");
  const [lastContactStart, setLastContactStart] = useState<string>("");
  const [lastContactEnd, setLastContactEnd] = useState<string>("");
  const [lastContactStartDraft, setLastContactStartDraft] = useState<dayjs.Dayjs | null>(null);
  const [lastContactEndDraft, setLastContactEndDraft] = useState<dayjs.Dayjs | null>(null);
  const [lastMBMStart, setLastMBMStart] = useState<string>("");
  const [lastMBMEnd, setLastMBMEnd] = useState<string>("");
  const [lastMBMStartDraft, setLastMBMStartDraft] = useState<dayjs.Dayjs | null>(null);
  const [lastMBMEndDraft, setLastMBMEndDraft] = useState<dayjs.Dayjs | null>(null);

  // 컬럼 필터 state (Antd Table 필터용)
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProductUsages, setSelectedProductUsages] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [possibilityMin, setPossibilityMin] = useState<number | null>(null);
  const [possibilityMax, setPossibilityMax] = useState<number | null>(null);
  const [possibilityMinDraft, setPossibilityMinDraft] = useState<number | null>(null);
  const [possibilityMaxDraft, setPossibilityMaxDraft] = useState<number | null>(null);
  const [selectedProgressStages, _setSelectedProgressStages] = useState<string[]>([]);

  // 정렬 state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 정렬 draft state (각 필터 드롭다운별로)
  const [sortFieldDraft, setSortFieldDraft] = useState<Record<string, string | null>>({});
  const [sortOrderDraft, setSortOrderDraft] = useState<Record<string, "asc" | "desc">>({});

  // 초기화/적용 버튼으로 필터를 적용한 경우 자동 적용을 건너뛰기 위한 ref
  const skipAutoApplyRef = useRef(false);

  // 현재 필터 상태를 수집하여 부모에게 전달하는 헬퍼 함수
  const applyFilters = (overrides?: {
    companySizes?: string[];
    categories?: string[];
    productUsages?: string[];
    managers?: string[];
    possibilityMin?: number | null;
    possibilityMax?: number | null;
    progressStages?: string[];
    targetMonthRangeStart?: string;
    targetMonthRangeEnd?: string;
    contractAmountMin?: number | null;
    contractAmountMax?: number | null;
    targetRevenueMin?: number | null;
    targetRevenueMax?: number | null;
    expectedRevenueMin?: number | null;
    expectedRevenueMax?: number | null;
    companyName?: string;
    lastContactStart?: string;
    lastContactEnd?: string;
    lastMBMStart?: string;
    lastMBMEnd?: string;
    sortField?: string | null;
    sortOrder?: "asc" | "desc";
  }) => {
    if (!onFiltersChange) return;

    const currentFilters: TableFilters = {};

    // 모든 필터를 항상 함께 적용 (override 우선)
    const finalCompanySizes = overrides?.companySizes !== undefined ? overrides.companySizes : selectedCompanySizes;
    if (finalCompanySizes.length > 0) {
      currentFilters.companySizes = finalCompanySizes;
    }

    const finalCategories = overrides?.categories !== undefined ? overrides.categories : selectedCategories;
    if (finalCategories.length > 0) {
      currentFilters.categories = finalCategories;
    }

    const finalProductUsages = overrides?.productUsages !== undefined ? overrides.productUsages : selectedProductUsages;
    if (finalProductUsages.length > 0) {
      currentFilters.productUsages = finalProductUsages;
    }

    const finalManagers = overrides?.managers !== undefined ? overrides.managers : selectedManagers;
    if (finalManagers.length > 0) {
      currentFilters.managers = finalManagers;
    }

    const finalPossibilityMin = overrides?.possibilityMin !== undefined ? overrides.possibilityMin : possibilityMin;
    const finalPossibilityMax = overrides?.possibilityMax !== undefined ? overrides.possibilityMax : possibilityMax;
    if (finalPossibilityMin !== null || finalPossibilityMax !== null) {
      currentFilters.possibilityRange = {};
      if (finalPossibilityMin !== null) {
        currentFilters.possibilityRange.min = finalPossibilityMin;
      }
      if (finalPossibilityMax !== null) {
        currentFilters.possibilityRange.max = finalPossibilityMax;
      }
    }

    const finalProgressStages = overrides?.progressStages !== undefined ? overrides.progressStages : selectedProgressStages;
    if (finalProgressStages.length > 0) {
      currentFilters.progressStages = finalProgressStages;
    }

    const finalCompanyName = overrides?.companyName !== undefined ? overrides.companyName : companySearch;
    if (finalCompanyName.trim()) {
      currentFilters.companyName = finalCompanyName.trim();
    }

    const finalLastContactStart = overrides?.lastContactStart !== undefined ? overrides.lastContactStart : lastContactStart;
    const finalLastContactEnd = overrides?.lastContactEnd !== undefined ? overrides.lastContactEnd : lastContactEnd;
    if (finalLastContactStart || finalLastContactEnd) {
      currentFilters.lastContactDateRange = {};
      if (finalLastContactStart) currentFilters.lastContactDateRange.start = finalLastContactStart;
      if (finalLastContactEnd) currentFilters.lastContactDateRange.end = finalLastContactEnd;
    }

    const finalLastMBMStart = overrides?.lastMBMStart !== undefined ? overrides.lastMBMStart : lastMBMStart;
    const finalLastMBMEnd = overrides?.lastMBMEnd !== undefined ? overrides.lastMBMEnd : lastMBMEnd;
    if (finalLastMBMStart || finalLastMBMEnd) {
      currentFilters.lastMBMDateRange = {};
      if (finalLastMBMStart) currentFilters.lastMBMDateRange.start = finalLastMBMStart;
      if (finalLastMBMEnd) currentFilters.lastMBMDateRange.end = finalLastMBMEnd;
    }

    const finalContractMin = overrides?.contractAmountMin !== undefined ? overrides.contractAmountMin : contractAmountMin;
    const finalContractMax = overrides?.contractAmountMax !== undefined ? overrides.contractAmountMax : contractAmountMax;
    if (finalContractMin !== null || finalContractMax !== null) {
      currentFilters.contractAmountRange = {};
      if (finalContractMin !== null) {
        currentFilters.contractAmountRange.minMan = Math.round(finalContractMin * 10000);
      }
      if (finalContractMax !== null) {
        currentFilters.contractAmountRange.maxMan = Math.round(finalContractMax * 10000);
      }
    }

    const finalTargetMin = overrides?.targetRevenueMin !== undefined ? overrides.targetRevenueMin : targetRevenueMin;
    const finalTargetMax = overrides?.targetRevenueMax !== undefined ? overrides.targetRevenueMax : targetRevenueMax;
    if (finalTargetMin !== null || finalTargetMax !== null) {
      currentFilters.targetRevenueRange = {};
      if (finalTargetMin !== null) {
        currentFilters.targetRevenueRange.minMan = Math.round(finalTargetMin * 10000);
      }
      if (finalTargetMax !== null) {
        currentFilters.targetRevenueRange.maxMan = Math.round(finalTargetMax * 10000);
      }
    }

    const finalExpectedMin = overrides?.expectedRevenueMin !== undefined ? overrides.expectedRevenueMin : expectedRevenueMin;
    const finalExpectedMax = overrides?.expectedRevenueMax !== undefined ? overrides.expectedRevenueMax : expectedRevenueMax;
    if (finalExpectedMin !== null || finalExpectedMax !== null) {
      currentFilters.expectedRevenueRange = {};
      if (finalExpectedMin !== null) {
        currentFilters.expectedRevenueRange.minMan = Math.round(finalExpectedMin * 10000);
      }
      if (finalExpectedMax !== null) {
        currentFilters.expectedRevenueRange.maxMan = Math.round(finalExpectedMax * 10000);
      }
    }

    const finalTargetMonthRangeStart = overrides?.targetMonthRangeStart !== undefined ? overrides.targetMonthRangeStart : targetMonthRangeStart;
    const finalTargetMonthRangeEnd = overrides?.targetMonthRangeEnd !== undefined ? overrides.targetMonthRangeEnd : targetMonthRangeEnd;
    if (finalTargetMonthRangeStart || finalTargetMonthRangeEnd) {
      currentFilters.targetMonthRange = {};
      if (finalTargetMonthRangeStart) currentFilters.targetMonthRange.start = finalTargetMonthRangeStart;
      if (finalTargetMonthRangeEnd) currentFilters.targetMonthRange.end = finalTargetMonthRangeEnd;
    }

    // 정렬 (override 우선)
    const finalSortField = overrides?.sortField !== undefined ? overrides.sortField : sortField;
    const finalSortOrder = overrides?.sortOrder !== undefined ? overrides.sortOrder : sortOrder;
    if (finalSortField) {
      currentFilters.sort = {
        field: finalSortField,
        order: finalSortOrder,
      };
    }

    onFiltersChange(currentFilters);
  };

  useEffect(() => {
    setContractAmountMinDraft(
      contractAmountMin !== null ? Math.round(contractAmountMin / 10000) : null
    );
    setContractAmountMaxDraft(
      contractAmountMax !== null ? Math.round(contractAmountMax / 10000) : null
    );
    setTargetRevenueMinDraft(
      targetRevenueMin !== null ? Math.round(targetRevenueMin / 10000) : null
    );
    setTargetRevenueMaxDraft(
      targetRevenueMax !== null ? Math.round(targetRevenueMax / 10000) : null
    );
    setExpectedRevenueMinDraft(
      expectedRevenueMin !== null ? Math.round(expectedRevenueMin / 10000) : null
    );
    setExpectedRevenueMaxDraft(
      expectedRevenueMax !== null ? Math.round(expectedRevenueMax / 10000) : null
    );
    setTargetMonthRangeStartDraft(targetMonthRangeStart ? dayjs(targetMonthRangeStart) : null);
    setTargetMonthRangeEndDraft(targetMonthRangeEnd ? dayjs(targetMonthRangeEnd) : null);
  }, [
    contractAmountMin,
    contractAmountMax,
    targetRevenueMin,
    targetRevenueMax,
    expectedRevenueMin,
    expectedRevenueMax,
    targetMonthRangeStart,
    targetMonthRangeEnd,
  ]);

  const progressColors = {
    activeText: token.colorTextBase,
    activeBorder: token.colorTextBase,
    inactiveText: token.colorTextTertiary,
    inactiveBorder: token.colorBorder,
    newText: token.colorSuccess,
    newBorder: token.colorSuccess,
    newBg: token.colorSuccessBg,
  };

  const tableData: TableRow[] = useMemo(() => {
    return data
      .map((c) => ({
        ...c,
        key: c.no,
        expectedRevenue:
          c._periodData?.currentExpectedRevenue ??
          calculateExpectedRevenue(
            c.adoptionDecision?.targetRevenue,
            c.adoptionDecision?.possibility
          ),
      }))
      .filter((row) => {
        // 계약금액 범위 필터
        if (contractAmountMin !== null && (row.contractAmount ?? 0) < contractAmountMin) {
          return false;
        }
        if (contractAmountMax !== null && (row.contractAmount ?? 0) > contractAmountMax) {
          return false;
        }

        // 목표매출 범위 필터
        if (targetRevenueMin !== null && (row.adoptionDecision?.targetRevenue ?? 0) < targetRevenueMin) {
          return false;
        }
        if (targetRevenueMax !== null && (row.adoptionDecision?.targetRevenue ?? 0) > targetRevenueMax) {
          return false;
        }

        // 예상매출 범위 필터
        if (expectedRevenueMin !== null && row.expectedRevenue < expectedRevenueMin) {
          return false;
        }
        if (expectedRevenueMax !== null && row.expectedRevenue > expectedRevenueMax) {
          return false;
        }

        // 목표일자 범위 필터
        if (targetMonthRangeStart || targetMonthRangeEnd) {
          const targetDate = parseTargetDate(row.adoptionDecision?.targetDate);
          if (!targetDate) return false; // 목표일자가 없으면 제외
          const targetDateStr = targetDate.toISOString().split('T')[0];
          if (targetMonthRangeStart && targetDateStr < targetMonthRangeStart) return false;
          if (targetMonthRangeEnd && targetDateStr > targetMonthRangeEnd) return false;
        }

        // 기업명 검색 필터
        if (companySearch.trim()) {
          if (!row.companyName.toLowerCase().includes(companySearch.trim().toLowerCase())) {
            return false;
          }
        }

        // 마지막 컨택일 필터
        if (lastContactStart || lastContactEnd) {
          const lastContactDate = row.lastContactDate;
          if (!lastContactDate) return false;
          const lastContact = new Date(lastContactDate).getTime();
          if (lastContactStart && lastContact < new Date(lastContactStart).getTime()) {
            return false;
          }
          if (lastContactEnd && lastContact > new Date(lastContactEnd).getTime()) {
            return false;
          }
        }

        // 최근 MBM 필터
        if (lastMBMStart || lastMBMEnd) {
          const lastMBMDate = row.lastMBMDate;
          if (!lastMBMDate) return false;
          const lastMBM = new Date(lastMBMDate).getTime();
          if (lastMBMStart && lastMBM < new Date(lastMBMStart).getTime()) {
            return false;
          }
          if (lastMBMEnd && lastMBM > new Date(lastMBMEnd).getTime()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortField) return 0;

        const modifier = sortOrder === "asc" ? 1 : -1;

        switch (sortField) {
          case "companyName":
            return a.companyName.localeCompare(b.companyName) * modifier;
          case "companySize":
            return String(a.companySize ?? "").localeCompare(String(b.companySize ?? "")) * modifier;
          case "manager":
            return a.manager.localeCompare(b.manager) * modifier;
          case "category":
            return a.category.localeCompare(b.category) * modifier;
          case "productUsage":
            return a.productUsage.join(",").localeCompare(b.productUsage.join(",")) * modifier;
          case "trustIndex":
            return ((a.trustIndex ?? 0) - (b.trustIndex ?? 0)) * modifier;
          case "contractAmount":
            return ((a.contractAmount ?? 0) - (b.contractAmount ?? 0)) * modifier;
          case "targetRevenue":
            return ((a.adoptionDecision?.targetRevenue ?? 0) - (b.adoptionDecision?.targetRevenue ?? 0)) * modifier;
          case "possibility": {
            const aVal = Number((a.adoptionDecision?.possibility || "0").replace("%", ""));
            const bVal = Number((b.adoptionDecision?.possibility || "0").replace("%", ""));
            return (aVal - bVal) * modifier;
          }
          case "expectedRevenue":
            return (a.expectedRevenue - b.expectedRevenue) * modifier;
          case "targetDate": {
            const aDate = new Date(a.adoptionDecision?.targetDate || 0).getTime();
            const bDate = new Date(b.adoptionDecision?.targetDate || 0).getTime();
            return (aDate - bDate) * modifier;
          }
          case "lastContactDate": {
            const aContact = a.lastContactDate;
            const bContact = b.lastContactDate;
            const aTime = aContact ? new Date(aContact).getTime() : 0;
            const bTime = bContact ? new Date(bContact).getTime() : 0;
            return (aTime - bTime) * modifier;
          }
          case "lastMBMDate": {
            const aMBM = a.lastMBMDate;
            const bMBM = b.lastMBMDate;
            const aTime = aMBM ? new Date(aMBM).getTime() : 0;
            const bTime = bMBM ? new Date(bMBM).getTime() : 0;
            return (aTime - bTime) * modifier;
          }
          default:
            return 0;
        }
      });
  }, [data, contractAmountMin, contractAmountMax, targetRevenueMin, targetRevenueMax, expectedRevenueMin, expectedRevenueMax, targetMonthRangeStart, targetMonthRangeEnd, companySearch, lastContactStart, lastContactEnd, lastMBMStart, lastMBMEnd, sortField, sortOrder]);


  const getProgressLevel = (ad: Customer["adoptionDecision"] | undefined) => {
    if (!ad) return -1;
    if (ad.contract) return 3;
    if (ad.approval) return 2;
    if (ad.quote) return 1;
    if (ad.test) return 0;
    return -1;
  };

  const columns: ColumnsType<TableRow> = [
    {
      title: "기업명",
      dataIndex: "companyName",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            setCompanySearchDraft(companySearch);
            skipAutoApplyRef.current = false;
          } else {
            // 버튼으로 이미 적용했으면 자동 적용 건너뛰기
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            // 드롭다운 닫힐 때 자동 적용
            setCompanySearch(companySearchDraft);
            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["companyName"] !== undefined) {
              finalSortField = sortFieldDraft["companyName"];
              finalSortOrder = sortOrderDraft["companyName"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              companyName: companySearchDraft,
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }: FilterDropdownProps) => {
        const currentSortField = sortFieldDraft["companyName"] ?? (sortField === "companyName" ? sortField : null);
        const currentSortOrder = sortOrderDraft["companyName"] ?? (sortField === "companyName" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8, width: 200 }}>
            <Input
              placeholder="기업명 검색"
              value={companySearchDraft}
              onChange={(e) => setCompanySearchDraft(e.target.value)}
              allowClear
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "companyName" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, companyName: "companyName" });
                  setSortOrderDraft({ ...sortOrderDraft, companyName: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "companyName" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, companyName: "companyName" });
                  setSortOrderDraft({ ...sortOrderDraft, companyName: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  setCompanySearch(companySearchDraft);
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["companyName"] !== undefined) {
                    finalSortField = sortFieldDraft["companyName"];
                    finalSortOrder = sortOrderDraft["companyName"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    companyName: companySearchDraft,
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setCompanySearch("");
                  setCompanySearchDraft("");
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.companyName;
                  delete newOrderDraft.companyName;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  let finalSortField = sortField;
                  if (sortField === "companyName") {
                    finalSortField = null;
                    setSortField(null);
                  }
                  applyFilters({
                    companyName: "",
                    sortField: finalSortField,
                    sortOrder: sortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: (filtered) => (
        <FilterFilled style={{ color: filtered || companySearch || sortField === "companyName" ? token.colorPrimary : undefined }} />
      ),
      width: 200,
    },
    {
      title: "규모",
      dataIndex: "companySize",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            // 버튼으로 이미 적용했으면 자동 적용 건너뛰기
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            // 드롭다운 닫힐 때 자동 적용
            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["companySize"] !== undefined) {
              finalSortField = sortFieldDraft["companySize"];
              finalSortOrder = sortOrderDraft["companySize"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["companySize"] ?? (sortField === "companySize" ? sortField : null);
        const currentSortOrder = sortOrderDraft["companySize"] ?? (sortField === "companySize" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8, width: 200 }}>
            <Select
              mode="multiple"
              allowClear
              placeholder="기업 규모 선택"
              style={{ width: "100%" }}
              options={Array.from(new Set(tableData.map((d) => d.companySize || "미정"))).map((size) => ({ label: size || "미정", value: size || "미정" }))}
              value={selectedCompanySizes}
              onChange={(values) => setSelectedCompanySizes(values)}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "companySize" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, companySize: "companySize" });
                  setSortOrderDraft({ ...sortOrderDraft, companySize: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "companySize" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, companySize: "companySize" });
                  setSortOrderDraft({ ...sortOrderDraft, companySize: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["companySize"] !== undefined) {
                    finalSortField = sortFieldDraft["companySize"];
                    finalSortOrder = sortOrderDraft["companySize"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setSelectedCompanySizes([]);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.companySize;
                  delete newOrderDraft.companySize;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  let finalSortField = sortField;
                  if (sortField === "companySize") {
                    finalSortField = null;
                    setSortField(null);
                  }
                  applyFilters({
                    companySizes: [], // 빈 배열로 즉시 초기화
                    sortField: finalSortField,
                    sortOrder: sortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled style={{ color: selectedCompanySizes.length > 0 || sortField === "companySize" ? token.colorPrimary : undefined }} />
      ),
      width: 120,
    },
    {
      title: "구분",
      dataIndex: "category",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["category"] !== undefined) {
              finalSortField = sortFieldDraft["category"];
              finalSortOrder = sortOrderDraft["category"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["category"] ?? (sortField === "category" ? sortField : null);
        const currentSortOrder = sortOrderDraft["category"] ?? (sortField === "category" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8, width: 200 }}>
            <Select
              mode="multiple"
              allowClear
              placeholder="카테고리 선택"
              style={{ width: "100%" }}
              options={Object.values(Category).map((c) => ({ label: CategoryLabel[c], value: c }))}
              value={selectedCategories}
              onChange={(values) => setSelectedCategories(values)}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "category" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, category: "category" });
                  setSortOrderDraft({ ...sortOrderDraft, category: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "category" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, category: "category" });
                  setSortOrderDraft({ ...sortOrderDraft, category: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["category"] !== undefined) {
                    finalSortField = sortFieldDraft["category"];
                    finalSortOrder = sortOrderDraft["category"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setSelectedCategories([]);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.category;
                  delete newOrderDraft.category;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  let finalSortField = sortField;
                  if (sortField === "category") {
                    finalSortField = null;
                    setSortField(null);
                  }
                  applyFilters({
                    categories: [], // 빈 배열로 즉시 초기화
                    sortField: finalSortField,
                    sortOrder: sortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled style={{ color: selectedCategories.length > 0 || sortField === "category" ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => record.category === value,
      render: (category: string) => {
        // 한글 라벨 -> 영문 키 역매핑
        const labelToKey: Record<string, Category> = {
          '채용': Category.RECRUIT,
          '성과': Category.PERFORMANCE,
          '공공': Category.PUBLIC,
        };

        const categoryKey = labelToKey[category] || category;

        const colorMap: Record<string, string> = {
          [Category.RECRUIT]: "blue",
          [Category.PUBLIC]: "green",
          [Category.PERFORMANCE]: "orange",
        };

        return <Tag color={colorMap[categoryKey] || "default"} bordered>{CategoryLabel[category as keyof typeof CategoryLabel] || category}</Tag>;
      },
      width: 100,
    },
    {
      title: "제품사용",
      dataIndex: "productUsage",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["productUsage"] !== undefined) {
              finalSortField = sortFieldDraft["productUsage"];
              finalSortOrder = sortOrderDraft["productUsage"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["productUsage"] ?? (sortField === "productUsage" ? sortField : null);
        const currentSortOrder = sortOrderDraft["productUsage"] ?? (sortField === "productUsage" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8, width: 200 }}>
            <Select
              mode="multiple"
              allowClear
              placeholder="제품사용 선택"
              style={{ width: "100%" }}
              options={[ProductType.ATS, ProductType.ACCSR, ProductType.INHR_PLUS, ProductType.ACC, ProductType.CHURN].map((p) => ({ label: ProductTypeLabel[p], value: p }))}
              value={selectedProductUsages}
              onChange={(values) => setSelectedProductUsages(values)}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "productUsage" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, productUsage: "productUsage" });
                  setSortOrderDraft({ ...sortOrderDraft, productUsage: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "productUsage" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, productUsage: "productUsage" });
                  setSortOrderDraft({ ...sortOrderDraft, productUsage: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["productUsage"] !== undefined) {
                    finalSortField = sortFieldDraft["productUsage"];
                    finalSortOrder = sortOrderDraft["productUsage"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setSelectedProductUsages([]);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.productUsage;
                  delete newOrderDraft.productUsage;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  let finalSortField = sortField;
                  if (sortField === "productUsage") {
                    finalSortField = null;
                    setSortField(null);
                  }
                  applyFilters({
                    productUsages: [], // 빈 배열로 즉시 초기화
                    sortField: finalSortField,
                    sortOrder: sortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled style={{ color: selectedProductUsages.length > 0 || sortField === "productUsage" ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => record.productUsage.includes(value as ProductType),
      render: (products: string[]) => {
        const productColorMap: Record<string, string> = {
          [ProductType.ATS]: "blue",
          [ProductType.ACCSR]: "purple",
          [ProductType.INHR_PLUS]: "orange",
          [ProductType.ACC]: "green",
          [ProductType.CHURN]: "red",
        };
        return (
          <div className={styles.tagGroup}>
            {products.map((product) => (
              <Tag key={product} color={productColorMap[product] || "default"} bordered>
                {ProductTypeLabel[product as ProductType] || product}
              </Tag>
            ))}
          </div>
        );
      },
      width: 150,
    },
    {
      title: "담당자",
      dataIndex: "manager",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["manager"] !== undefined) {
              finalSortField = sortFieldDraft["manager"];
              finalSortOrder = sortOrderDraft["manager"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["manager"] ?? (sortField === "manager" ? sortField : null);
        const currentSortOrder = sortOrderDraft["manager"] ?? (sortField === "manager" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8, width: 200 }}>
            <Select
              mode="multiple"
              allowClear
              placeholder="담당자 선택"
              style={{ width: "100%" }}
              options={managers.length > 0
                ? managers.map((m) => ({ label: m.name, value: m.owner_id }))
                : Array.from(new Set(tableData.map((d) => d.manager))).map((m) => ({ label: m, value: m }))}
              value={selectedManagers}
              onChange={(values) => setSelectedManagers(values)}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "manager" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, manager: "manager" });
                  setSortOrderDraft({ ...sortOrderDraft, manager: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "manager" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, manager: "manager" });
                  setSortOrderDraft({ ...sortOrderDraft, manager: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["manager"] !== undefined) {
                    finalSortField = sortFieldDraft["manager"];
                    finalSortOrder = sortOrderDraft["manager"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setSelectedManagers([]);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.manager;
                  delete newOrderDraft.manager;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  let finalSortField = sortField;
                  if (sortField === "manager") {
                    finalSortField = null;
                    setSortField(null);
                  }
                  applyFilters({
                    managers: [], // 빈 배열로 즉시 초기화
                    sortField: finalSortField,
                    sortOrder: sortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled style={{ color: selectedManagers.length > 0 || sortField === "manager" ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => record.manager === value,
      width: 100,
    },
    {
      title: "직전반기 매출",
      dataIndex: "contractAmount",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            const finalMin = contractAmountMinDraft !== null ? contractAmountMinDraft * 10000 : null;
            const finalMax = contractAmountMaxDraft !== null ? contractAmountMaxDraft * 10000 : null;
            setContractAmountMin(finalMin);
            setContractAmountMax(finalMax);
            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["contractAmount"] !== undefined) {
              finalSortField = sortFieldDraft["contractAmount"];
              finalSortOrder = sortOrderDraft["contractAmount"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              contractAmountMin: contractAmountMinDraft,
              contractAmountMax: contractAmountMaxDraft,
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["contractAmount"] ?? (sortField === "contractAmount" ? sortField : null);
        const currentSortOrder = sortOrderDraft["contractAmount"] ?? (sortField === "contractAmount" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8 }}>
            <InputNumber
              style={{ width: 180 }}
              placeholder="최소"
              value={contractAmountMinDraft ?? undefined}
              onChange={(value) => {
                setContractAmountMinDraft(value === null ? null : Number(value));
              }}
              formatter={(v) => (v ? `${v}만` : "")}
              parser={(v) => Number((v || "").replace(/[^0-9.-]/g, ""))}
            />
            <InputNumber
              style={{ width: 180 }}
              placeholder="최대"
              value={contractAmountMaxDraft ?? undefined}
              onChange={(value) => {
                setContractAmountMaxDraft(value === null ? null : Number(value));
              }}
              formatter={(v) => (v ? `${v}만` : "")}
              parser={(v) => Number((v || "").replace(/[^0-9.-]/g, ""))}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "contractAmount" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, contractAmount: "contractAmount" });
                  setSortOrderDraft({ ...sortOrderDraft, contractAmount: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "contractAmount" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, contractAmount: "contractAmount" });
                  setSortOrderDraft({ ...sortOrderDraft, contractAmount: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  const finalMin = contractAmountMinDraft !== null ? contractAmountMinDraft * 10000 : null;
                  const finalMax = contractAmountMaxDraft !== null ? contractAmountMaxDraft * 10000 : null;
                  setContractAmountMin(finalMin);
                  setContractAmountMax(finalMax);
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["contractAmount"] !== undefined) {
                    finalSortField = sortFieldDraft["contractAmount"];
                    finalSortOrder = sortOrderDraft["contractAmount"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    contractAmountMin: contractAmountMinDraft,
                    contractAmountMax: contractAmountMaxDraft,
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setContractAmountMinDraft(null);
                  setContractAmountMaxDraft(null);
                  setContractAmountMin(null);
                  setContractAmountMax(null);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.contractAmount;
                  delete newOrderDraft.contractAmount;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  if (sortField === "contractAmount") {
                    setSortField(null);
                  }
                  applyFilters({
                    contractAmountMin: null,
                    contractAmountMax: null,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled
          style={{
            color:
              contractAmountMin !== null || contractAmountMax !== null || sortField === "contractAmount"
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (val: number | null) => formatMan(val),
      width: 120,
    },
    {
      title: "최근 MBM",
      dataIndex: "lastMBMDate",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
            setLastMBMStartDraft(lastMBMStart ? dayjs(lastMBMStart) : null);
            setLastMBMEndDraft(lastMBMEnd ? dayjs(lastMBMEnd) : null);
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            const startStr = lastMBMStartDraft ? lastMBMStartDraft.format('YYYY-MM-DD') : "";
            const endStr = lastMBMEndDraft ? lastMBMEndDraft.format('YYYY-MM-DD') : "";
            setLastMBMStart(startStr);
            setLastMBMEnd(endStr);

            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["lastMBMDate"] !== undefined) {
              finalSortField = sortFieldDraft["lastMBMDate"];
              finalSortOrder = sortOrderDraft["lastMBMDate"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              lastMBMStart: startStr,
              lastMBMEnd: endStr,
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["lastMBMDate"] ?? (sortField === "lastMBMDate" ? sortField : null);
        const currentSortOrder = sortOrderDraft["lastMBMDate"] ?? (sortField === "lastMBMDate" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8 }}>
            <PresetDateRangePicker
              value={[lastMBMStartDraft, lastMBMEndDraft]}
              onChange={(dates) => {
                setLastMBMStartDraft(dates ? dates[0] : null);
                setLastMBMEndDraft(dates ? dates[1] : null);
              }}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "lastMBMDate" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, lastMBMDate: "lastMBMDate" });
                  setSortOrderDraft({ ...sortOrderDraft, lastMBMDate: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "lastMBMDate" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, lastMBMDate: "lastMBMDate" });
                  setSortOrderDraft({ ...sortOrderDraft, lastMBMDate: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  const startStr = lastMBMStartDraft ? lastMBMStartDraft.format('YYYY-MM-DD') : "";
                  const endStr = lastMBMEndDraft ? lastMBMEndDraft.format('YYYY-MM-DD') : "";
                  setLastMBMStart(startStr);
                  setLastMBMEnd(endStr);

                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["lastMBMDate"] !== undefined) {
                    finalSortField = sortFieldDraft["lastMBMDate"];
                    finalSortOrder = sortOrderDraft["lastMBMDate"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    lastMBMStart: startStr,
                    lastMBMEnd: endStr,
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setLastMBMStartDraft(null);
                  setLastMBMEndDraft(null);
                  setLastMBMStart("");
                  setLastMBMEnd("");
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.lastMBMDate;
                  delete newOrderDraft.lastMBMDate;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  if (sortField === "lastMBMDate") {
                    setSortField(null);
                  }
                  applyFilters({
                    lastMBMStart: "",
                    lastMBMEnd: "",
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled
          style={{
            color:
              lastMBMStart || lastMBMEnd || sortField === "lastMBMDate"
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (lastMBMDate: string | null | undefined) => {
        const formattedDate = lastMBMDate ? formatDateShort(lastMBMDate) : "-";
        return (
          <span style={{ color: token.colorTextBase }}>
            {formattedDate}
          </span>
        );
      },
      width: 110,
    },
    {
      title: "딜 단계",
      dataIndex: "progress",
      filters: [
        { text: "테스트", value: "test" },
        { text: "견적", value: "quote" },
        { text: "승인", value: "approval" },
        { text: "계약", value: "contract" },
      ],
      onFilter: (value, record) => {
        const levelMap: Record<string, number> = {
          test: 0,
          quote: 1,
          approval: 2,
          contract: 3,
        };
        const requiredLevel = levelMap[String(value)] ?? -1;
        const currentLevel = getProgressLevel(record.adoptionDecision);
        return currentLevel === requiredLevel;
      },
      render: (_, record) => {
        const getProgressLabel = (ad: Customer["adoptionDecision"] | undefined) => {
          if (!ad) return "-";
          if (ad.contract) return "계약";
          if (ad.approval) return "승인";
          if (ad.quote) return "견적";
          if (ad.test) return "테스트";
          return "-";
        };

        const getPastProgress = (periodData: TableRow["_periodData"]) => {
          if (!periodData) return "-";
          if (periodData.pastContract) return "계약";
          if (periodData.pastApproval) return "승인";
          if (periodData.pastQuote) return "견적";
          if (periodData.pastTest) return "테스트";
          return "-";
        };

        const past = getPastProgress(record._periodData);
        const current = getProgressLabel(record.adoptionDecision);

        const pastLevel = past === "계약" ? 3 : past === "승인" ? 2 : past === "견적" ? 1 : past === "테스트" ? 0 : -1;
        const currentLevel = current === "계약" ? 3 : current === "승인" ? 2 : current === "견적" ? 1 : current === "테스트" ? 0 : -1;

        const isPositive = currentLevel > pastLevel;
        const isNegative = currentLevel < pastLevel;
        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

        return (
          <div className={`${styles.changeTag} ${styles[changeType]}`}>
            <span>{past}</span>
            <ArrowRight size={10} />
            <span>{current}</span>
          </div>
        );
      },
      width: 140,
    },
    {
      title: "마지막 컨택",
      dataIndex: "salesActions",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
            // 드롭다운 열 때 현재 값을 draft에 복사
            setLastContactStartDraft(lastContactStart ? dayjs(lastContactStart) : null);
            setLastContactEndDraft(lastContactEnd ? dayjs(lastContactEnd) : null);
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            // 날짜 필터 적용
            const startStr = lastContactStartDraft ? lastContactStartDraft.format('YYYY-MM-DD') : "";
            const endStr = lastContactEndDraft ? lastContactEndDraft.format('YYYY-MM-DD') : "";
            setLastContactStart(startStr);
            setLastContactEnd(endStr);

            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["lastContactDate"] !== undefined) {
              finalSortField = sortFieldDraft["lastContactDate"];
              finalSortOrder = sortOrderDraft["lastContactDate"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              lastContactStart: startStr,
              lastContactEnd: endStr,
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["lastContactDate"] ?? (sortField === "lastContactDate" ? sortField : null);
        const currentSortOrder = sortOrderDraft["lastContactDate"] ?? (sortField === "lastContactDate" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8 }}>
            <PresetDateRangePicker
              value={[lastContactStartDraft, lastContactEndDraft]}
              onChange={(dates) => {
                setLastContactStartDraft(dates ? dates[0] : null);
                setLastContactEndDraft(dates ? dates[1] : null);
              }}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "lastContactDate" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, lastContactDate: "lastContactDate" });
                  setSortOrderDraft({ ...sortOrderDraft, lastContactDate: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "lastContactDate" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, lastContactDate: "lastContactDate" });
                  setSortOrderDraft({ ...sortOrderDraft, lastContactDate: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  const startStr = lastContactStartDraft ? lastContactStartDraft.format('YYYY-MM-DD') : "";
                  const endStr = lastContactEndDraft ? lastContactEndDraft.format('YYYY-MM-DD') : "";
                  setLastContactStart(startStr);
                  setLastContactEnd(endStr);

                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["lastContactDate"] !== undefined) {
                    finalSortField = sortFieldDraft["lastContactDate"];
                    finalSortOrder = sortOrderDraft["lastContactDate"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    lastContactStart: startStr,
                    lastContactEnd: endStr,
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setLastContactStart("");
                  setLastContactEnd("");
                  setLastContactStartDraft(null);
                  setLastContactEndDraft(null);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.lastContactDate;
                  delete newOrderDraft.lastContactDate;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  let finalSortField = sortField;
                  if (sortField === "lastContactDate") {
                    finalSortField = null;
                    setSortField(null);
                  }
                  applyFilters({
                    lastContactStart: "",
                    lastContactEnd: "",
                    sortField: finalSortField,
                    sortOrder: sortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled
          style={{
            color:
              lastContactStart || lastContactEnd || sortField === "lastContactDate"
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (_: unknown, record: TableRow) => {
        const lastContactDate = record.lastContactDate;
        return (
          <span style={{
            color: lastContactDate ? token.colorTextBase : token.colorTextTertiary,
            whiteSpace: 'nowrap'
          }}>
            {formatDateShort(lastContactDate)}
          </span>
        );
      },
      onCell: () => ({
        style: { whiteSpace: 'nowrap' }
      }),
      width: 110,
    },
    {
      title: "신뢰지수",
      dataIndex: "trustIndex",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["trustIndex"] !== undefined) {
              finalSortField = sortFieldDraft["trustIndex"];
              finalSortOrder = sortOrderDraft["trustIndex"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm }) => {
        const currentSortField = sortFieldDraft["trustIndex"] ?? (sortField === "trustIndex" ? sortField : null);
        const currentSortOrder = sortOrderDraft["trustIndex"] ?? (sortField === "trustIndex" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8, width: 200 }}>
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "trustIndex" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, trustIndex: "trustIndex" });
                  setSortOrderDraft({ ...sortOrderDraft, trustIndex: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "trustIndex" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, trustIndex: "trustIndex" });
                  setSortOrderDraft({ ...sortOrderDraft, trustIndex: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["trustIndex"] !== undefined) {
                    finalSortField = sortFieldDraft["trustIndex"];
                    finalSortOrder = sortOrderDraft["trustIndex"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.trustIndex;
                  delete newOrderDraft.trustIndex;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  let finalSortField = sortField;
                  if (sortField === "trustIndex") {
                    finalSortField = null;
                    setSortField(null);
                  }
                  applyFilters({
                    sortField: finalSortField,
                    sortOrder: sortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled style={{ color: sortField === "trustIndex" ? token.colorPrimary : undefined }} />
      ),
      render: (_, record) => {
        const past = record._periodData?.pastTrustIndex ?? null;
        const current = record.trustIndex || 0;
        const isPositive = past !== null && current > past;
        const isNegative = past !== null && current < past;
        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

        return (
          <div className={`${styles.changeTag} ${styles[changeType]}`}>
            <span>{past ?? current}</span>
            <ArrowRight size={10} />
            <span>{current}</span>
          </div>
        );
      },
      width: 120,
    },
    {
      title: "목표매출",
      dataIndex: "_periodData",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            const finalMin = targetRevenueMinDraft !== null ? targetRevenueMinDraft * 10000 : null;
            const finalMax = targetRevenueMaxDraft !== null ? targetRevenueMaxDraft * 10000 : null;
            setTargetRevenueMin(finalMin);
            setTargetRevenueMax(finalMax);
            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["targetRevenue"] !== undefined) {
              finalSortField = sortFieldDraft["targetRevenue"];
              finalSortOrder = sortOrderDraft["targetRevenue"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              targetRevenueMin: targetRevenueMinDraft,
              targetRevenueMax: targetRevenueMaxDraft,
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["targetRevenue"] ?? (sortField === "targetRevenue" ? sortField : null);
        const currentSortOrder = sortOrderDraft["targetRevenue"] ?? (sortField === "targetRevenue" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8 }}>
            <InputNumber
              style={{ width: 180 }}
              placeholder="최소"
              value={targetRevenueMinDraft ?? undefined}
              onChange={(value) => {
                setTargetRevenueMinDraft(value === null ? null : Number(value));
              }}
              formatter={(v) => (v ? `${v}만` : "")}
              parser={(v) => Number((v || "").replace(/[^0-9.-]/g, ""))}
            />
            <InputNumber
              style={{ width: 180 }}
              placeholder="최대"
              value={targetRevenueMaxDraft ?? undefined}
              onChange={(value) => {
                setTargetRevenueMaxDraft(value === null ? null : Number(value));
              }}
              formatter={(v) => (v ? `${v}만` : "")}
              parser={(v) => Number((v || "").replace(/[^0-9.-]/g, ""))}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "targetRevenue" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, targetRevenue: "targetRevenue" });
                  setSortOrderDraft({ ...sortOrderDraft, targetRevenue: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "targetRevenue" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, targetRevenue: "targetRevenue" });
                  setSortOrderDraft({ ...sortOrderDraft, targetRevenue: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  const finalMin = targetRevenueMinDraft !== null ? targetRevenueMinDraft * 10000 : null;
                  const finalMax = targetRevenueMaxDraft !== null ? targetRevenueMaxDraft * 10000 : null;
                  setTargetRevenueMin(finalMin);
                  setTargetRevenueMax(finalMax);
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["targetRevenue"] !== undefined) {
                    finalSortField = sortFieldDraft["targetRevenue"];
                    finalSortOrder = sortOrderDraft["targetRevenue"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    targetRevenueMin: targetRevenueMinDraft,
                    targetRevenueMax: targetRevenueMaxDraft,
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setTargetRevenueMinDraft(null);
                  setTargetRevenueMaxDraft(null);
                  setTargetRevenueMin(null);
                  setTargetRevenueMax(null);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.targetRevenue;
                  delete newOrderDraft.targetRevenue;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  if (sortField === "targetRevenue") {
                    setSortField(null);
                  }
                  applyFilters({
                    targetRevenueMin: null,
                    targetRevenueMax: null,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled
          style={{
            color:
              targetRevenueMin !== null || targetRevenueMax !== null || sortField === "targetRevenue"
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (_, record) => {
        const past = record._periodData?.pastTargetRevenue ?? 0;
        const current = record.adoptionDecision?.targetRevenue ?? 0;
        const isPositive = current > past;
        const isNegative = current < past;
        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

        return (
          <div className={`${styles.changeTag} ${styles[changeType]}`}>
            <span>{formatMan(past)}</span>
            <ArrowRight size={10} />
            <span>{formatMan(current)}</span>
          </div>
        );
      },
      width: 140,
    },
    {
      title: "가능성",
      dataIndex: "_periodData",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            setPossibilityMin(possibilityMinDraft);
            setPossibilityMax(possibilityMaxDraft);
            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["possibility"] !== undefined) {
              finalSortField = sortFieldDraft["possibility"];
              finalSortOrder = sortOrderDraft["possibility"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              possibilityMin: possibilityMinDraft,
              possibilityMax: possibilityMaxDraft,
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["possibility"] ?? (sortField === "possibility" ? sortField : null);
        const currentSortOrder = sortOrderDraft["possibility"] ?? (sortField === "possibility" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8 }}>
            <InputNumber
              style={{ width: 180 }}
              placeholder="최소 (0-100)"
              value={possibilityMinDraft ?? undefined}
              onChange={(value) => {
                setPossibilityMinDraft(value === null ? null : Number(value));
              }}
              min={0}
              max={100}
            />
            <InputNumber
              style={{ width: 180 }}
              placeholder="최대 (0-100)"
              value={possibilityMaxDraft ?? undefined}
              onChange={(value) => {
                setPossibilityMaxDraft(value === null ? null : Number(value));
              }}
              min={0}
              max={100}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "possibility" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, possibility: "possibility" });
                  setSortOrderDraft({ ...sortOrderDraft, possibility: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "possibility" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, possibility: "possibility" });
                  setSortOrderDraft({ ...sortOrderDraft, possibility: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  setPossibilityMin(possibilityMinDraft);
                  setPossibilityMax(possibilityMaxDraft);
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["possibility"] !== undefined) {
                    finalSortField = sortFieldDraft["possibility"];
                    finalSortOrder = sortOrderDraft["possibility"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    possibilityMin: possibilityMinDraft,
                    possibilityMax: possibilityMaxDraft,
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setPossibilityMinDraft(null);
                  setPossibilityMaxDraft(null);
                  setPossibilityMin(null);
                  setPossibilityMax(null);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.possibility;
                  delete newOrderDraft.possibility;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  let finalSortField = sortField;
                  if (sortField === "possibility") {
                    finalSortField = null;
                    setSortField(null);
                  }
                  applyFilters({
                    possibilityMin: null,
                    possibilityMax: null,
                    sortField: finalSortField,
                    sortOrder: sortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled style={{ color: possibilityMin !== null || possibilityMax !== null || sortField === "possibility" ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => record.adoptionDecision?.possibility === value,
      render: (_, record) => {
        const past = record._periodData?.pastPossibility || "0%";
        const current = record.adoptionDecision?.possibility || "0%";
        const pastNum = Number(past.replace("%", ""));
        const currentNum = Number(current.replace("%", ""));
        const isPositive = currentNum > pastNum;
        const isNegative = currentNum < pastNum;
        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

        return (
          <div className={`${styles.changeTag} ${styles[changeType]}`}>
            <span>{past}</span>
            <ArrowRight size={10} />
            <span>{current}</span>
          </div>
        );
      },
      width: 110,
    },
    {
      title: "예상매출",
      dataIndex: "_periodData",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            const finalMin = expectedRevenueMinDraft !== null ? expectedRevenueMinDraft * 10000 : null;
            const finalMax = expectedRevenueMaxDraft !== null ? expectedRevenueMaxDraft * 10000 : null;
            setExpectedRevenueMin(finalMin);
            setExpectedRevenueMax(finalMax);
            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["expectedRevenue"] !== undefined) {
              finalSortField = sortFieldDraft["expectedRevenue"];
              finalSortOrder = sortOrderDraft["expectedRevenue"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              expectedRevenueMin: expectedRevenueMinDraft,
              expectedRevenueMax: expectedRevenueMaxDraft,
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["expectedRevenue"] ?? (sortField === "expectedRevenue" ? sortField : null);
        const currentSortOrder = sortOrderDraft["expectedRevenue"] ?? (sortField === "expectedRevenue" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8 }}>
            <InputNumber
              style={{ width: 180 }}
              placeholder="최소"
              value={expectedRevenueMinDraft ?? undefined}
              onChange={(value) => {
                setExpectedRevenueMinDraft(value === null ? null : Number(value));
              }}
              formatter={(v) => (v ? `${v}만` : "")}
              parser={(v) => Number((v || "").replace(/[^0-9.-]/g, ""))}
            />
            <InputNumber
              style={{ width: 180 }}
              placeholder="최대"
              value={expectedRevenueMaxDraft ?? undefined}
              onChange={(value) => {
                setExpectedRevenueMaxDraft(value === null ? null : Number(value));
              }}
              formatter={(v) => (v ? `${v}만` : "")}
              parser={(v) => Number((v || "").replace(/[^0-9.-]/g, ""))}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "expectedRevenue" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, expectedRevenue: "expectedRevenue" });
                  setSortOrderDraft({ ...sortOrderDraft, expectedRevenue: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "expectedRevenue" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, expectedRevenue: "expectedRevenue" });
                  setSortOrderDraft({ ...sortOrderDraft, expectedRevenue: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  const finalMin = expectedRevenueMinDraft !== null ? expectedRevenueMinDraft * 10000 : null;
                  const finalMax = expectedRevenueMaxDraft !== null ? expectedRevenueMaxDraft * 10000 : null;
                  setExpectedRevenueMin(finalMin);
                  setExpectedRevenueMax(finalMax);
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["expectedRevenue"] !== undefined) {
                    finalSortField = sortFieldDraft["expectedRevenue"];
                    finalSortOrder = sortOrderDraft["expectedRevenue"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    expectedRevenueMin: expectedRevenueMinDraft,
                    expectedRevenueMax: expectedRevenueMaxDraft,
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setExpectedRevenueMinDraft(null);
                  setExpectedRevenueMaxDraft(null);
                  setExpectedRevenueMin(null);
                  setExpectedRevenueMax(null);
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.expectedRevenue;
                  delete newOrderDraft.expectedRevenue;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  if (sortField === "expectedRevenue") {
                    setSortField(null);
                  }
                  applyFilters({
                    expectedRevenueMin: null,
                    expectedRevenueMax: null,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled
          style={{
            color:
              expectedRevenueMin !== null || expectedRevenueMax !== null || sortField === "expectedRevenue"
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (_, record) => {
        const past = record._periodData?.pastExpectedRevenue ?? 0;
        const current =
          record._periodData?.currentExpectedRevenue ?? record.expectedRevenue;
        const isPositive = current > past;
        const isNegative = current < past;
        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

        return (
          <div className={`${styles.changeTag} ${styles[changeType]}`}>
            <span>{formatMan(past)}</span>
            <ArrowRight size={10} />
            <span>{formatMan(current)}</span>
          </div>
        );
      },
      width: 140,
    },
    {
      title: "목표월",
      dataIndex: "adoptionDecision",
      filterDropdownProps: {
        onOpenChange: (open) => {
          if (open) {
            skipAutoApplyRef.current = false;
          } else {
            if (skipAutoApplyRef.current) {
              skipAutoApplyRef.current = false;
              return;
            }

            const startDate = targetMonthRangeStartDraft ? targetMonthRangeStartDraft.format('YYYY-MM-DD') : '';
            const endDate = targetMonthRangeEndDraft ? targetMonthRangeEndDraft.format('YYYY-MM-DD') : '';
            setTargetMonthRangeStart(startDate);
            setTargetMonthRangeEnd(endDate);
            let finalSortField = sortField;
            let finalSortOrder = sortOrder;
            if (sortFieldDraft["targetDate"] !== undefined) {
              finalSortField = sortFieldDraft["targetDate"];
              finalSortOrder = sortOrderDraft["targetDate"] ?? "asc";
              setSortField(finalSortField);
              setSortOrder(finalSortOrder);
            }
            applyFilters({
              targetMonthRangeStart: startDate,
              targetMonthRangeEnd: endDate,
              sortField: finalSortField,
              sortOrder: finalSortOrder,
            });
          }
        }
      },
      filterDropdown: ({ confirm, clearFilters }) => {
        const currentSortField = sortFieldDraft["targetDate"] ?? (sortField === "targetDate" ? sortField : null);
        const currentSortOrder = sortOrderDraft["targetDate"] ?? (sortField === "targetDate" ? sortOrder : "asc");

        return (
          <Space direction="vertical" style={{ padding: 8 }}>
            <PresetDateRangePicker
              value={[targetMonthRangeStartDraft, targetMonthRangeEndDraft]}
              onChange={(dates) => {
                setTargetMonthRangeStartDraft(dates ? dates[0] : null);
                setTargetMonthRangeEndDraft(dates ? dates[1] : null);
              }}
            />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
            <Space>
              <Button
                size="small"
                type={currentSortField === "targetDate" && currentSortOrder === "asc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, targetDate: "targetDate" });
                  setSortOrderDraft({ ...sortOrderDraft, targetDate: "asc" });
                }}
              >
                오름차순
              </Button>
              <Button
                size="small"
                type={currentSortField === "targetDate" && currentSortOrder === "desc" ? "primary" : "default"}
                onClick={() => {
                  setSortFieldDraft({ ...sortFieldDraft, targetDate: "targetDate" });
                  setSortOrderDraft({ ...sortOrderDraft, targetDate: "desc" });
                }}
              >
                내림차순
              </Button>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  const startDate = targetMonthRangeStartDraft ? targetMonthRangeStartDraft.format('YYYY-MM-DD') : '';
                  const endDate = targetMonthRangeEndDraft ? targetMonthRangeEndDraft.format('YYYY-MM-DD') : '';
                  setTargetMonthRangeStart(startDate);
                  setTargetMonthRangeEnd(endDate);
                  let finalSortField = sortField;
                  let finalSortOrder = sortOrder;
                  if (sortFieldDraft["targetDate"] !== undefined) {
                    finalSortField = sortFieldDraft["targetDate"];
                    finalSortOrder = sortOrderDraft["targetDate"] ?? "asc";
                    setSortField(finalSortField);
                    setSortOrder(finalSortOrder);
                  }
                  applyFilters({
                    targetMonthRangeStart: startDate,
                    targetMonthRangeEnd: endDate,
                    sortField: finalSortField,
                    sortOrder: finalSortOrder,
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                적용
              </Button>
              <Button
                size="small"
                onClick={() => {
                  skipAutoApplyRef.current = true;
                  clearFilters?.();
                  setTargetMonthRangeStartDraft(null);
                  setTargetMonthRangeEndDraft(null);
                  setTargetMonthRangeStart('');
                  setTargetMonthRangeEnd('');
                  const newFieldDraft = { ...sortFieldDraft };
                  const newOrderDraft = { ...sortOrderDraft };
                  delete newFieldDraft.targetDate;
                  delete newOrderDraft.targetDate;
                  setSortFieldDraft(newFieldDraft);
                  setSortOrderDraft(newOrderDraft);
                  if (sortField === "targetDate") {
                    setSortField(null);
                  }
                  applyFilters({
                    targetMonthRangeStart: '',
                    targetMonthRangeEnd: ''
                  });
                  confirm({ closeDropdown: true });
                }}
              >
                초기화
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: () => (
        <FilterFilled
          style={{
            color:
              (targetMonthRangeStart || targetMonthRangeEnd) || sortField === "targetDate"
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (_, record) => {
        const past = record._periodData?.pastTargetDate || "-";
        const current = record.adoptionDecision?.targetDate || "-";
        const pastDate = parseTargetDate(past);
        const currentDate = parseTargetDate(current);
        // 목표일자가 당겨지면 긍정적 (더 빨리 매출 발생), 늦춰지면 부정적
        const isPositive = pastDate && currentDate && currentDate.getTime() < pastDate.getTime();
        const isNegative = pastDate && currentDate && currentDate.getTime() > pastDate.getTime();
        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

        return (
          <div className={`${styles.changeTag} ${styles[changeType]}`}>
            <span>{past}</span>
            <ArrowRight size={10} />
            <span>{current}</span>
          </div>
        );
      },
      width: 200,
    },
    {
      title: "이번반기 달성",
      dataIndex: "_periodData",
      render: (_, record) => {
        const past = record._periodData?.pastCurrentQuarterRevenue ?? 0;
        const current = record._periodData?.currentCurrentQuarterRevenue ?? 0;
        const isPositive = current > past;
        const isNegative = current < past;
        const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

        return (
          <div className={`${styles.changeTag} ${styles[changeType]}`}>
            <span>{formatMan(past)}</span>
            <ArrowRight size={10} />
            <span>{formatMan(current)}</span>
          </div>
        );
      },
      width: 140,
    },
  ];

  return (
    <Card
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={paginationProp || { pageSize: 10 }}
        loading={loading}
        size="small"
        onRow={(record) => ({
          onClick: () => setSelectedCustomer(record),
          style: { cursor: "pointer" },
        })}
        scroll={{ x: 1800, y: 'calc(100vh - 300px)' }}
      />

      <Modal
        open={!!selectedCustomer}
        onCancel={() => setSelectedCustomer(null)}
        footer={null}
        title={selectedCustomer?.companyName || "고객 상세"}
        width={720}
      >
        {selectedCustomer && (
          <Tabs
            defaultActiveKey="summary"
            items={[
              {
                key: "summary",
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={16} />
                    <span>요약</span>
                  </span>
                ),
                children: (
                  <>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                      <Space>
                        <span>조회 기간</span>
                        <PresetDateRangePicker
                          value={summaryDateRange}
                          onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                              setSummaryDateRange([dates[0], dates[1]]);
                            }
                          }}
                        />
                      </Space>
                    </div>

                    {/* 기본 정보 */}
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5} style={{ marginBottom: 12 }}>기본 정보</Title>
                      <div style={{ overflow: 'hidden', borderRadius: token.borderRadius }}>
                        <Table
                          dataSource={[
                            {
                              key: 'row1',
                              label1: '담당자',
                              value1: selectedCustomer.manager,
                              label2: '카테고리',
                              value2: selectedCustomer.category
                            },
                            {
                              key: 'row2',
                              label1: '기업 규모',
                              value1: selectedCustomer.companySize || '미정',
                              label2: '계약 금액',
                              value2: formatMan(selectedCustomer.contractAmount)
                            },
                            {
                              key: 'row3',
                              label1: '제품 사용',
                              value1: (
                                <Space size={4} wrap>
                                  {selectedCustomer.productUsage?.map((product, idx) => (
                                    <Tag key={idx} color="blue">
                                      {ProductTypeLabel[product as ProductType] || product}
                                    </Tag>
                                  )) || "-"}
                                </Space>
                              ),
                              label2: '',
                              value2: ''
                            },
                          ]}
                          columns={[
                            {
                              dataIndex: 'label1',
                              key: 'label1',
                              width: 120,
                              onCell: (record) => ({
                                style: {
                                  backgroundColor: token.colorFillAlter,
                                  fontWeight: 600
                                },
                                ...(record.key === 'row3' ? { colSpan: 1 } : {})
                              }),
                              render: (text) => <AntText strong>{text}</AntText>
                            },
                            {
                              dataIndex: 'value1',
                              key: 'value1',
                              onCell: (record) => ({
                                ...(record.key === 'row3' ? { colSpan: 3 } : {})
                              })
                            },
                            {
                              dataIndex: 'label2',
                              key: 'label2',
                              width: 120,
                              onCell: (record) => ({
                                style: {
                                  backgroundColor: token.colorFillAlter,
                                  fontWeight: 600
                                },
                                ...(record.key === 'row3' ? { colSpan: 0 } : {})
                              }),
                              render: (text) => text ? <AntText strong>{text}</AntText> : null
                            },
                            {
                              dataIndex: 'value2',
                              key: 'value2',
                              onCell: (record) => ({
                                ...(record.key === 'row3' ? { colSpan: 0 } : {})
                              })
                            }
                          ]}
                          pagination={false}
                          size="small"
                          showHeader={false}
                          bordered
                        />
                      </div>
                    </div>

                    {/* 상태 변화 */}
                    <div>
                      <Title level={5} style={{ marginBottom: 12 }}>상태 변화</Title>
                      <div style={{ overflow: 'hidden', borderRadius: token.borderRadius }}>
                        <Table
                          dataSource={[
                            {
                              key: 'row1',
                              label1: '신뢰 점수',
                              value1: (() => {
                                const past = selectedCustomer._periodData?.pastTrustIndex ?? null;
                                const current = selectedCustomer.trustIndex || 0;
                                const isPositive = past !== null && current > past;
                                const isNegative = past !== null && current < past;
                                const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

                                return (
                                  <div className={`${styles.changeTag} ${styles[changeType]}`}>
                                    <span>{past ?? current}</span>
                                    <ArrowRight size={10} />
                                    <span>{current}</span>
                                  </div>
                                );
                              })(),
                              label2: '목표 매출',
                              value2: (() => {
                                const past = selectedCustomer._periodData?.pastTargetRevenue ?? null;
                                const current = selectedCustomer.adoptionDecision?.targetRevenue ?? 0;
                                const isPositive = past !== null && current > past;
                                const isNegative = past !== null && current < past;
                                const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

                                return (
                                  <div className={`${styles.changeTag} ${styles[changeType]}`}>
                                    <span>{formatMan(past)}</span>
                                    <ArrowRight size={10} />
                                    <span>{formatMan(current)}</span>
                                  </div>
                                );
                              })()
                            },
                            {
                              key: 'row2',
                              label1: '가능성',
                              value1: (() => {
                                const past = selectedCustomer._periodData?.pastPossibility ?? null;
                                const current = selectedCustomer.adoptionDecision?.possibility || "0%";
                                const isPositive = past !== null &&
                                  Number(current.replace("%", "")) > Number(past.replace("%", ""));
                                const isNegative = past !== null &&
                                  Number(current.replace("%", "")) < Number(past.replace("%", ""));
                                const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

                                return (
                                  <div className={`${styles.changeTag} ${styles[changeType]}`}>
                                    <span>{past ?? current}</span>
                                    <ArrowRight size={10} />
                                    <span>{current}</span>
                                  </div>
                                );
                              })(),
                              label2: '예상 매출',
                              value2: (() => {
                                const past = selectedCustomer._periodData?.pastExpectedRevenue ?? null;
                                const current = selectedCustomer._periodData?.currentExpectedRevenue ??
                                  calculateExpectedRevenue(
                                    selectedCustomer.adoptionDecision?.targetRevenue,
                                    selectedCustomer.adoptionDecision?.possibility
                                  );
                                const isPositive = past !== null && (current || 0) > past;
                                const isNegative = past !== null && (current || 0) < past;
                                const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

                                return (
                                  <div className={`${styles.changeTag} ${styles[changeType]}`}>
                                    <span>{formatMan(past)}</span>
                                    <ArrowRight size={10} />
                                    <span>{formatMan(current)}</span>
                                  </div>
                                );
                              })()
                            },
                            {
                              key: 'row3',
                              label1: '도입 결정 단계',
                              value1: renderProgressTags(selectedCustomer, true, progressColors),
                              label2: '목표 일자',
                              value2: (() => {
                                const past = selectedCustomer._periodData?.pastTargetDate || null;
                                const current = selectedCustomer.adoptionDecision?.targetDate || null;

                                // 날짜를 월로 변환하는 함수
                                const toMonth = (dateStr: string | null): string => {
                                  if (!dateStr || dateStr === '-') return '-';
                                  const match = dateStr.match(/(\d{4})-(\d{2})/);
                                  if (match) {
                                    return `${match[2]}월`;
                                  }
                                  return dateStr;
                                };

                                if (!past && !current) {
                                  return <span>-</span>;
                                }

                                const pastMonth = toMonth(past);
                                const currentMonth = toMonth(current);

                                // 날짜 비교 (앞당겨지면 positive, 늦춰지면 negative)
                                let changeType = "neutral";
                                if (past && current && past !== '-' && current !== '-') {
                                  const pastDate = new Date(past);
                                  const currentDate = new Date(current);
                                  if (currentDate < pastDate) {
                                    changeType = "positive"; // 앞당겨짐
                                  } else if (currentDate > pastDate) {
                                    changeType = "negative"; // 늦춰짐
                                  }
                                }

                                return (
                                  <div className={`${styles.changeTag} ${styles[changeType]}`}>
                                    <span>{pastMonth}</span>
                                    <ArrowRight size={10} />
                                    <span>{currentMonth}</span>
                                  </div>
                                );
                              })()
                            },
                          ]}
                          columns={[
                            {
                              dataIndex: 'label1',
                              key: 'label1',
                              width: 120,
                              onCell: () => ({
                                style: {
                                  backgroundColor: token.colorFillAlter,
                                  fontWeight: 600
                                }
                              }),
                              render: (text) => <AntText strong>{text}</AntText>
                            },
                            {
                              dataIndex: 'value1',
                              key: 'value1',
                            },
                            {
                              dataIndex: 'label2',
                              key: 'label2',
                              width: 120,
                              onCell: () => ({
                                style: {
                                  backgroundColor: token.colorFillAlter,
                                  fontWeight: 600
                                }
                              }),
                              render: (text) => <AntText strong>{text}</AntText>
                            },
                            {
                              dataIndex: 'value2',
                              key: 'value2',
                            }
                          ]}
                          pagination={false}
                          size="small"
                          showHeader={false}
                          bordered
                        />
                      </div>
                    </div>

                    {/* HubSpot Link */}
                    <div style={{ marginTop: 16 }}>
                      <Button
                        type="primary"
                        icon={<Building2 size={16} />}
                        href={_customerSummary?.data?.hubspotUrl || `https://app-na2.hubspot.com/contacts/21626933/record/0-2/${selectedCustomer.no}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        block
                      >
                        HubSpot Company 보기
                      </Button>
                    </div>
                  </>
                ),
              },
              {
                key: "actions",
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} />
                    <span>영업 히스토리</span>
                  </span>
                ),
                children: (
                  <>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                      <Space>
                        <span>조회 기간</span>
                        <PresetDateRangePicker
                          value={actionDateRange}
                          onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                              setActionDateRange([dates[0], dates[1]]);
                            }
                          }}
                        />
                      </Space>
                    </div>

                    {isSalesHistoryLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>
                    ) : (
                      <>
                        {/* 팔로업 추이 그래프 */}
                        <div style={{ marginBottom: 24 }}>
                          <Title level={5} style={{ marginBottom: 12 }}>팔로업 추이</Title>
                          {salesHistoryData?.data?.salesActions && salesHistoryData.data.salesActions.length > 0 ? (
                            <div style={{ width: '100%', height: 300 }}>
                              <ResponsiveContainer>
                                <ComposedChart
                                  data={salesHistoryData.data.salesActions
                                    .slice()
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map((action) => {
                                      const possibility = action.stateChange?.after?.possibility;
                                      const possibilityIndex = possibility != null ? Number(possibility) : 0;

                                      return {
                                        date: action.date,
                                        possibilityIndex,
                                        targetRevenue: action.stateChange?.after?.targetRevenue
                                          ? action.stateChange.after.targetRevenue / 10000
                                          : null,
                                        expectedRevenue: action.stateChange?.after?.targetRevenue && action.stateChange?.after?.possibility
                                          ? (action.stateChange.after.targetRevenue * Number(action.stateChange.after.possibility)) / 100 / 10000
                                          : null,
                                      };
                                    })}
                                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" style={{ fontSize: 12 }} />
                                  <YAxis
                                    yAxisId="left"
                                    style={{ fontSize: 12 }}
                                    domain={[0, 100]}
                                    ticks={[0, 40, 90, 100]}
                                  />
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    style={{ fontSize: 12 }}
                                  />
                                  <Tooltip {...DARK_TOOLTIP_STYLE} />
                                  <Legend />
                                  <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="possibilityIndex"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="가능성 지수"
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                  />
                                  <Bar
                                    yAxisId="right"
                                    dataKey="targetRevenue"
                                    fill="#f97316"
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
                            <div style={{ textAlign: 'center', padding: '40px', color: token.colorTextSecondary }}>
                              영업 액션 데이터가 없습니다.
                            </div>
                          )}
                        </div>

                        {/* 영업 액션 타임라인 */}
                        <div>
                          <Title level={5} style={{ marginBottom: 12 }}>영업 액션 타임라인</Title>
                          {salesHistoryData?.data?.salesActions && salesHistoryData.data.salesActions.length > 0 ? (
                            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                {salesHistoryData.data.salesActions
                                  .slice()
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .map((action, idx) => (
                                    <Card
                                      key={idx}
                                      size="small"
                                      style={{ width: '100%', cursor: 'pointer' }}
                                      hoverable
                                      onClick={() => {
                                        setSelectedAction(action);
                                        setIsActionDetailModalOpen(true);
                                      }}
                                    >
                                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                          <AntText strong>{action.date}</AntText>
                                          <Tag color={action.type === 'CALL' ? 'blue' : 'green'}>
                                            {action.type === 'CALL' ? '콜' : '미팅'}
                                          </Tag>
                                        </Space>
                                        <AntText type="secondary" style={{ fontSize: 12 }}>
                                          담당자: {selectedCustomer.manager}
                                        </AntText>
                                        <AntText
                                          style={{
                                            display: 'block',
                                            wordBreak: 'break-word'
                                          }}
                                          title={action.content && action.content.length > 50 ? action.content : undefined}
                                        >
                                          {action.content
                                            ? action.content.length > 50
                                              ? `${action.content.substring(0, 50)}...`
                                              : action.content
                                            : '-'}
                                        </AntText>
                                        <Space wrap size="small">
                                          {action.stateChange?.after?.possibility && (
                                            <Tag color="blue">
                                              가능성: {action.stateChange.after.possibility}
                                            </Tag>
                                          )}
                                          {(() => {
                                            const after = action.stateChange?.after;
                                            if (after?.contract) return <Tag color="cyan">도입결정: 클로징</Tag>;
                                            if (after?.approval) return <Tag color="cyan">도입결정: 승인</Tag>;
                                            if (after?.quote) return <Tag color="cyan">도입결정: 견적</Tag>;
                                            if (after?.test) return <Tag color="cyan">도입결정: 테스트</Tag>;
                                            return null;
                                          })()}
                                          {action.stateChange?.after?.targetRevenue && (
                                            <Tag>
                                              목표 매출: {formatMan(action.stateChange.after.targetRevenue)}
                                            </Tag>
                                          )}
                                          {action.stateChange?.after?.targetDate && (
                                            <Tag>
                                              목표 일자: {action.stateChange.after.targetDate}
                                            </Tag>
                                          )}
                                        </Space>
                                      </Space>
                                    </Card>
                                  ))}
                              </Space>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: token.colorTextSecondary }}>
                              영업 액션 이력이 없습니다.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ),
              },
              {
                key: "content",
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} />
                    <span>마케팅 히스토리</span>
                  </span>
                ),
                children: (
                  <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                      <Space>
                        <span>조회 기간</span>
                        <PresetDateRangePicker
                          value={contentDateRange}
                          onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                              setContentDateRange([dates[0], dates[1]]);
                            }
                          }}
                        />
                      </Space>
                    </div>

                    {isTrustChangeDetailLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>
                    ) : (
                      <>
                        {/* 차트 영역 */}
                        <div style={{ marginBottom: 24 }}>
                          <Row gutter={16}>
                            {/* 콘텐츠 퍼널별 조회수 */}
                            <Col span={12}>
                              <Title level={5} style={{ marginBottom: 16 }}>
                                콘텐츠 퍼널별 조회수
                              </Title>
                              {trustChangeDetailData?.data?.engagementItems && trustChangeDetailData.data.engagementItems.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                  <PieChart>
                                    <Pie
                                      data={(() => {
                                        const funnelStats: Record<string, number> = {};
                                        const colors: Record<string, string> = {
                                          'TOFU': '#3b82f6',
                                          'MOFU': '#a855f7',
                                          'BOFU': '#22c55e',
                                        };
                                        trustChangeDetailData.data.engagementItems.forEach(item => {
                                          if (item.funnelType && item.viewCount) {
                                            funnelStats[item.funnelType] = (funnelStats[item.funnelType] || 0) + item.viewCount;
                                          }
                                        });
                                        return Object.entries(funnelStats).map(([name, value]) => ({
                                          name,
                                          value,
                                          color: colors[name] || '#f97316'
                                        }));
                                      })()}
                                      cx="50%"
                                      cy="40%"
                                      outerRadius={70}
                                      paddingAngle={2}
                                      dataKey="value"
                                      label={(entry) => {
                                        const data = (() => {
                                          const funnelStats: Record<string, number> = {};
                                          trustChangeDetailData.data.engagementItems.forEach(item => {
                                            if (item.funnelType && item.viewCount) {
                                              funnelStats[item.funnelType] = (funnelStats[item.funnelType] || 0) + item.viewCount;
                                            }
                                          });
                                          const total = Object.values(funnelStats).reduce((sum, val) => sum + val, 0);
                                          return { total };
                                        })();
                                        const percent = ((entry.value / data.total) * 100).toFixed(0);
                                        return `${percent}%`;
                                      }}
                                      labelLine={false}
                                    >
                                      {(() => {
                                        const funnelStats: Record<string, number> = {};
                                        const colors: Record<string, string> = {
                                          'TOFU': '#3b82f6',
                                          'MOFU': '#a855f7',
                                          'BOFU': '#22c55e',
                                        };
                                        trustChangeDetailData.data.engagementItems.forEach(item => {
                                          if (item.funnelType && item.viewCount) {
                                            funnelStats[item.funnelType] = (funnelStats[item.funnelType] || 0) + item.viewCount;
                                          }
                                        });
                                        return Object.entries(funnelStats).map(([type], index) => (
                                          <Cell key={`cell-${index}`} fill={colors[type] || '#f97316'} />
                                        ));
                                      })()}
                                    </Pie>
                                    <Tooltip {...DARK_TOOLTIP_STYLE} />
                                    <Legend
                                      verticalAlign="bottom"
                                      height={36}
                                      formatter={(value) => <span style={{ color: token.colorText }}>{value}</span>}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: token.colorTextSecondary }}>
                                  콘텐츠 소비 데이터가 없습니다.
                                </div>
                              )}
                            </Col>

                            {/* 콘텐츠 유형별 조회수 */}
                            <Col span={12}>
                              <Title level={5} style={{ marginBottom: 16 }}>
                                콘텐츠 유형별 조회수
                              </Title>
                              {trustChangeDetailData?.data?.engagementItems && trustChangeDetailData.data.engagementItems.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                  <PieChart>
                                    <Pie
                                      data={(() => {
                                        const contentStats: Record<string, number> = {};
                                        const colors = ['#a855f7', '#ec4899', '#06b6d4', '#14b8a6', '#8b5cf6', '#f59e0b'];
                                        trustChangeDetailData.data.engagementItems.forEach(item => {
                                          if (item.contentType && item.viewCount) {
                                            contentStats[item.contentType] = (contentStats[item.contentType] || 0) + item.viewCount;
                                          }
                                        });
                                        return Object.entries(contentStats).map(([name, value], index) => ({
                                          name,
                                          value,
                                          color: colors[index % colors.length]
                                        }));
                                      })()}
                                      cx="50%"
                                      cy="40%"
                                      outerRadius={70}
                                      paddingAngle={2}
                                      dataKey="value"
                                      label={(entry) => {
                                        const data = (() => {
                                          const contentStats: Record<string, number> = {};
                                          trustChangeDetailData.data.engagementItems.forEach(item => {
                                            if (item.contentType && item.viewCount) {
                                              contentStats[item.contentType] = (contentStats[item.contentType] || 0) + item.viewCount;
                                            }
                                          });
                                          const total = Object.values(contentStats).reduce((sum, val) => sum + val, 0);
                                          return { total };
                                        })();
                                        const percent = ((entry.value / data.total) * 100).toFixed(0);
                                        return `${percent}%`;
                                      }}
                                      labelLine={false}
                                    >
                                      {(() => {
                                        const contentStats: Record<string, number> = {};
                                        const colors = ['#a855f7', '#ec4899', '#06b6d4', '#14b8a6', '#8b5cf6', '#f59e0b'];
                                        trustChangeDetailData.data.engagementItems.forEach(item => {
                                          if (item.contentType && item.viewCount) {
                                            contentStats[item.contentType] = (contentStats[item.contentType] || 0) + item.viewCount;
                                          }
                                        });
                                        return Object.entries(contentStats).map(([_name], index) => (
                                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                        ));
                                      })()}
                                    </Pie>
                                    <Tooltip {...DARK_TOOLTIP_STYLE} />
                                    <Legend
                                      verticalAlign="bottom"
                                      height={36}
                                      formatter={(value) => <span style={{ color: token.colorText }}>{value}</span>}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: token.colorTextSecondary }}>
                                  콘텐츠 소비 데이터가 없습니다.
                                </div>
                              )}
                            </Col>
                          </Row>
                        </div>

                        {/* 콘텐츠 소비 이력 */}
                        <div style={{ marginBottom: 24 }}>
                          <Title level={5} style={{ marginBottom: 16 }}>
                            콘텐츠 소비 이력
                          </Title>
                          {trustChangeDetailData?.data?.engagementItems && trustChangeDetailData.data.engagementItems.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                {[...trustChangeDetailData.data.engagementItems]
                                  .sort((a, b) => new Date(b.latestViewDate).getTime() - new Date(a.latestViewDate).getTime())
                                  .map((item, index) => (
                                    <Card
                                      key={index}
                                      size="small"
                                      hoverable={!!item.url}
                                      onClick={() => {
                                        if (item.url) {
                                          window.open(item.url, '_blank');
                                        }
                                      }}
                                    >
                                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Space size={12}>
                                          <BookOpen size={20} style={{ color: token.colorPrimary }} />
                                          <Space direction="vertical" size={4}>
                                            <Space size={8}>
                                              <AntText strong style={{ fontSize: 15 }}>
                                                {item.title}
                                              </AntText>
                                            </Space>
                                            <Space size={8}>
                                              {item.funnelType && (
                                                <Tag
                                                  color={
                                                    item.funnelType === 'TOFU' ? 'blue' :
                                                      item.funnelType === 'MOFU' ? 'purple' :
                                                        item.funnelType === 'BOFU' ? 'green' :
                                                          'default'
                                                  }
                                                  style={{ margin: 0 }}
                                                >
                                                  {item.funnelType}
                                                </Tag>
                                              )}
                                              {item.contentType && (
                                                <Tag
                                                  color={
                                                    item.contentType === '리포트' ? 'cyan' :
                                                      item.contentType === '툴즈' ? 'orange' :
                                                        item.contentType === '아티클' ? 'gold' :
                                                          item.contentType === '온에어' ? 'magenta' :
                                                            'default'
                                                  }
                                                  style={{ margin: 0 }}
                                                >
                                                  {item.contentType}
                                                </Tag>
                                              )}
                                              {item.viewCount !== null && item.viewCount !== undefined && (
                                                <Space size={4}>
                                                  <Eye size={14} style={{ color: token.colorTextSecondary }} />
                                                  <AntText type="secondary" style={{ fontSize: 12 }}>
                                                    조회 {item.viewCount}회
                                                  </AntText>
                                                </Space>
                                              )}
                                            </Space>
                                            <AntText type="secondary" style={{ fontSize: 12 }}>
                                              최근 조회: {item.latestViewDate}
                                            </AntText>
                                          </Space>
                                        </Space>
                                        {item.url && (
                                          <ExternalLink size={18} style={{ color: token.colorPrimary }} />
                                        )}
                                      </Space>
                                    </Card>
                                  ))}
                              </Space>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: token.colorTextSecondary }}>
                              콘텐츠 소비 이력이 없습니다.
                            </div>
                          )}
                        </div>

                        {/* MBM 참여 이력 */}
                        <div style={{ marginBottom: 24 }}>
                          <Title level={5} style={{ marginBottom: 16 }}>
                            MBM 참여 이력
                          </Title>
                          {trustChangeDetailData?.data?.marketingEvents && trustChangeDetailData.data.marketingEvents.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                {[...trustChangeDetailData.data.marketingEvents]
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .map((event, index) => {
                                    return (
                                      <Card
                                        key={index}
                                        size="small"
                                        hoverable={!!event.event_url}
                                        onClick={() => {
                                          if (event.event_url) {
                                            window.open(event.event_url, '_blank');
                                          }
                                        }}
                                      >
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                          <Space size={12}>
                                            <Calendar size={20} style={{ color: '#f59e0b' }} />
                                            <Space direction="vertical" size={4}>
                                              <AntText strong style={{ fontSize: 15 }}>
                                                {event.title}
                                              </AntText>
                                              <Space size={8} wrap>
                                                {event.event_type && (
                                                  <Tag color="blue" style={{ margin: 0 }}>
                                                    {event.event_type}
                                                  </Tag>
                                                )}
                                                {event.product && (
                                                  <Tag color="purple" style={{ margin: 0 }}>
                                                    {event.product}
                                                  </Tag>
                                                )}
                                                {event.event_target && event.event_target.length > 0 && (
                                                  <>
                                                    {event.event_target.map((target, idx) => (
                                                      <Tag key={idx} color="cyan" style={{ margin: 0 }}>
                                                        {target}
                                                      </Tag>
                                                    ))}
                                                  </>
                                                )}
                                                {event.npsScore !== undefined && event.npsScore !== null && (
                                                  <Tag
                                                    color={
                                                      event.npsScore >= 9 ? 'green' :
                                                        event.npsScore >= 7 ? 'lime' :
                                                          event.npsScore >= 5 ? 'gold' : 'orange'
                                                    }
                                                    style={{ margin: 0 }}
                                                  >
                                                    NPS {event.npsScore}
                                                  </Tag>
                                                )}
                                              </Space>
                                              <AntText type="secondary" style={{ fontSize: 12 }}>
                                                진행일: {event.date}
                                              </AntText>
                                            </Space>
                                          </Space>
                                          {event.event_url && (
                                            <ExternalLink size={18} style={{ color: token.colorPrimary }} />
                                          )}
                                        </Space>
                                      </Card>
                                    );
                                  })}
                              </Space>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: token.colorTextSecondary }}>
                              MBM 참여 이력이 없습니다.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>
      <Modal
        open={!!selectedContent}
        onCancel={() => setSelectedContent(null)}
        footer={null}
        title={selectedContent?.title || "콘텐츠 상세"}
      >
        {selectedContent && (
          <Space size={8}>
            <Space>
              <Tag color="blue">{selectedContent.category}</Tag>
              <AntText type="secondary">{selectedContent.date}</AntText>
            </Space>
            <AntText>{selectedContent.title}</AntText>
          </Space>
        )}
      </Modal>

      {/* 영업 액션 상세 모달 */}
      <Modal
        open={isActionDetailModalOpen}
        onCancel={() => {
          setIsActionDetailModalOpen(false);
          setSelectedAction(null);
        }}
        footer={null}
        title="영업 액션 상세"
        width={600}
      >
        {selectedAction && selectedCustomer && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 헤더 */}
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Tag
                color={selectedAction.type === 'CALL' ? 'cyan' : 'purple'}
                icon={selectedAction.type === 'CALL' ? <Phone size={12} /> : <Users size={12} />}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {selectedAction.type === 'CALL' ? '콜' : '미팅'}
              </Tag>
              <Space size="small" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: token.colorTextSecondary }} />
                <AntText type="secondary">{selectedAction.date}</AntText>
              </Space>
            </Space>

            {/* 활동 내용 */}
            <div>
              <AntText type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                활동 내용
              </AntText>
              <AntText strong style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selectedAction.content}
              </AntText>
            </div>

            {/* 영업 액션 상세 정보 테이블 */}
            <div style={{ overflow: 'hidden', borderRadius: token.borderRadius }}>
              <Table
                dataSource={[
                  {
                    key: 'row1',
                    label1: '담당자',
                    value1: selectedCustomer.manager,
                    label2: '가능성 변화',
                    value2: (() => {
                      const before = selectedAction.stateChange?.before?.possibility;
                      const after = selectedAction.stateChange?.after?.possibility;

                      if (!before && !after) return <span>-</span>;

                      const beforeNum = before != null ? Number(before) : 0;
                      const afterNum = after != null ? Number(after) : 0;
                      const changeType = afterNum > beforeNum ? 'positive' : afterNum < beforeNum ? 'negative' : 'neutral';

                      return (
                        <div className={`${styles.changeTag} ${styles[changeType]}`}>
                          <span>{before || after}</span>
                          <ArrowRight size={10} />
                          <span>{after || '-'}</span>
                        </div>
                      );
                    })()
                  },
                  {
                    key: 'row2',
                    label1: '목표 매출 변화',
                    value1: (() => {
                      const before = selectedAction.stateChange?.before?.targetRevenue;
                      const after = selectedAction.stateChange?.after?.targetRevenue;

                      if (!before && !after) return <span>-</span>;

                      const changeType = after && before && after > before ? 'positive' :
                        after && before && after < before ? 'negative' : 'neutral';

                      return (
                        <div className={`${styles.changeTag} ${styles[changeType]}`}>
                          <span>{formatMan(before ?? after)}</span>
                          <ArrowRight size={10} />
                          <span>{formatMan(after)}</span>
                        </div>
                      );
                    })(),
                    label2: '목표 일자',
                    value2: (() => {
                      const before = selectedAction.stateChange?.before?.targetDate;
                      const after = selectedAction.stateChange?.after?.targetDate;

                      if (!before && !after) return <span>-</span>;

                      // 날짜를 월로 변환
                      const toMonth = (dateStr: string | null | undefined): string => {
                        if (!dateStr || dateStr === '-') return '-';
                        const match = dateStr.match(/(\d{4})-(\d{2})/);
                        if (match) return `${match[2]}월`;
                        return dateStr;
                      };

                      const beforeMonth = toMonth(before);
                      const afterMonth = toMonth(after);

                      // 날짜 비교 (앞당겨지면 positive, 늦춰지면 negative)
                      let changeType = 'neutral';
                      if (before && after && before !== '-' && after !== '-') {
                        const beforeDate = new Date(before);
                        const afterDate = new Date(after);
                        if (afterDate < beforeDate) {
                          changeType = 'positive'; // 앞당겨짐
                        } else if (afterDate > beforeDate) {
                          changeType = 'negative'; // 늦춰짐
                        }
                      }

                      return (
                        <div className={`${styles.changeTag} ${styles[changeType]}`}>
                          <span>{beforeMonth}</span>
                          <ArrowRight size={10} />
                          <span>{afterMonth}</span>
                        </div>
                      );
                    })()
                  },
                  {
                    key: 'row3',
                    label1: '진행 상태 변화',
                    value1: (() => {
                      const before = selectedAction.stateChange?.before;
                      const after = selectedAction.stateChange?.after;

                      if (!after) return <span>-</span>;

                      const activeStyle = {
                        borderColor: progressColors.activeBorder,
                        color: progressColors.activeText,
                        background: 'transparent',
                      };
                      const inactiveStyle = {
                        borderColor: progressColors.inactiveBorder,
                        color: progressColors.inactiveText,
                        background: 'transparent',
                      };
                      const newStyle = {
                        borderColor: progressColors.newBorder,
                        color: progressColors.newText,
                        background: progressColors.newBg || 'rgba(34,197,94,0.08)',
                      };

                      const stages: {
                        key: 'test' | 'quote' | 'approval' | 'contract';
                        label: string;
                        pastFlag?: boolean;
                        active: boolean;
                      }[] = [
                          { key: 'test', label: 'T', pastFlag: before?.test, active: !!after.test },
                          { key: 'quote', label: 'Q', pastFlag: before?.quote, active: !!after.quote },
                          { key: 'approval', label: 'A', pastFlag: before?.approval, active: !!after.approval },
                          { key: 'contract', label: 'C', pastFlag: before?.contract, active: !!after.contract },
                        ];

                      return (
                        <Space size={6}>
                          {stages.map((stage) => {
                            const wasPast = !!stage.pastFlag;
                            const isNew = before && stage.active && !wasPast;
                            const style = stage.active
                              ? isNew
                                ? newStyle
                                : activeStyle
                              : inactiveStyle;
                            return (
                              <Tag key={stage.key} style={style} bordered>
                                {stage.label}
                              </Tag>
                            );
                          })}
                        </Space>
                      );
                    })(),
                    label2: '',
                    value2: ''
                  }
                ]}
                columns={[
                  {
                    dataIndex: 'label1',
                    key: 'label1',
                    width: 120,
                    onCell: (record) => ({
                      style: {
                        backgroundColor: token.colorFillAlter,
                        fontWeight: 600
                      },
                      ...(record.key === 'row3' ? { colSpan: 1 } : {})
                    }),
                    render: (text) => <AntText strong>{text}</AntText>
                  },
                  {
                    dataIndex: 'value1',
                    key: 'value1',
                    onCell: (record) => ({
                      ...(record.key === 'row3' ? { colSpan: 3 } : {})
                    })
                  },
                  {
                    dataIndex: 'label2',
                    key: 'label2',
                    width: 120,
                    onCell: (record) => ({
                      style: {
                        backgroundColor: token.colorFillAlter,
                        fontWeight: 600
                      },
                      ...(record.key === 'row3' ? { colSpan: 0 } : {})
                    }),
                    render: (text) => text ? <AntText strong>{text}</AntText> : null
                  },
                  {
                    dataIndex: 'value2',
                    key: 'value2',
                    onCell: (record) => ({
                      ...(record.key === 'row3' ? { colSpan: 0 } : {})
                    })
                  }
                ]}
                pagination={false}
                showHeader={false}
                size="small"
                bordered
              />
            </div>
          </Space>
        )}
      </Modal>
    </Card>
  );
};
