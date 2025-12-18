import {
  calculateExpectedRevenue,
  getDataWithPeriodChange,
} from "@/data/mockData";
import type { SalesAction } from "@/repository/openapi/model";
import { useGetCustomerSummary, useGetSalesHistory } from "@/repository/query/customerDetailApiController/queryHook";
import { useGetTrustChangeDetail } from "@/repository/query/trustChangeDetailApiController/queryHook";
import { Customer, PossibilityType, ProductType } from "@/types/customer";
import { FilterFilled } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
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
import { ArrowRight, BookOpen, Building2, Calendar, CheckCircle2, ExternalLink, Eye, Phone, Users, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

import type { TimePeriodType } from "@/types/common";
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

interface CustomerTableProps {
  data: Customer[];
  timePeriod: TimePeriodType;
  loading?: boolean;
  pagination?: TablePaginationConfig;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
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

// 최근 MBM 날짜 계산
const getLastMBMDate = (attendance: Customer["attendance"]): string | null => {
  if (!attendance) return null;

  const MBM_DATES: Record<string, string> = {
    "1218": "2024-12-18",
    "1209": "2024-12-09",
    "1107": "2024-11-07",
  };

  // 가장 최근 MBM 참석 찾기 (키 역순으로 정렬)
  const attendedKeys = Object.keys(attendance)
    .filter(key => attendance[key as keyof typeof attendance])
    .sort((a, b) => parseInt(b) - parseInt(a));

  if (attendedKeys.length === 0) return null;
  return MBM_DATES[attendedKeys[0]] || null;
};

// 마지막 컨택일 계산 (날짜 반환)
const getLastContactDate = (salesActions: Customer["salesActions"]): string | null => {
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

  const stages: {
    key: "test" | "quote" | "approval" | "contract";
    label: string;
    pastFlag?: boolean;
    active: boolean;
  }[] = [
      { key: "test", label: "T", pastFlag: past?.pastTest, active: !!ad.test },
      { key: "quote", label: "Q", pastFlag: past?.pastQuote, active: !!ad.quote },
      {
        key: "approval",
        label: "A",
        pastFlag: past?.pastApproval,
        active: !!ad.approval,
      },
      {
        key: "contract",
        label: "C",
        pastFlag: past?.pastContract,
        active: !!ad.contract,
      },
    ];

  return (
    <Space size={6}>
      {stages.map((stage) => {
        const wasPast = !!stage.pastFlag;
        const isNew = showNew && hasPastData && stage.active && !wasPast;
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
};

export const CustomerTable = ({ data, timePeriod, loading, pagination: paginationProp, dateRange }: CustomerTableProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedContent, setSelectedContent] = useState<{
    title: string;
    category: string;
    date: string;
  } | null>(null);

  // 각 탭별 조회 기간 (전체 현황의 조회 기간을 초기값으로 사용)
  const getInitialDateRange = (): [dayjs.Dayjs, dayjs.Dayjs] => {
    if (dateRange?.startDate && dateRange?.endDate) {
      return [dayjs(dateRange.startDate), dayjs(dateRange.endDate)];
    }
    return [dayjs().subtract(30, 'day'), dayjs()];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [targetMonths, setTargetMonths] = useState<number[]>([]);
  const [contractAmountMinDraft, setContractAmountMinDraft] = useState<number | null>(null); // 만원 단위
  const [contractAmountMaxDraft, setContractAmountMaxDraft] = useState<number | null>(null); // 만원 단위
  const [targetRevenueMinDraft, setTargetRevenueMinDraft] = useState<number | null>(null); // 만원 단위
  const [targetRevenueMaxDraft, setTargetRevenueMaxDraft] = useState<number | null>(null); // 만원 단위
  const [expectedRevenueMinDraft, setExpectedRevenueMinDraft] = useState<number | null>(null); // 만원 단위
  const [expectedRevenueMaxDraft, setExpectedRevenueMaxDraft] = useState<number | null>(null); // 만원 단위
  const [targetMonthsDraft, setTargetMonthsDraft] = useState<number[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [lastContactStart, setLastContactStart] = useState<string>("");
  const [lastContactEnd, setLastContactEnd] = useState<string>("");

  // 정렬 state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
    setTargetMonthsDraft(targetMonths);
  }, [
    contractAmountMin,
    contractAmountMax,
    targetRevenueMin,
    targetRevenueMax,
    expectedRevenueMin,
    expectedRevenueMax,
    targetMonths,
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
    const periodData = getDataWithPeriodChange(data, timePeriod);

    return periodData
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

        // 목표일자 월 필터
        if (targetMonths.length > 0) {
          const targetDate = parseTargetDate(row.adoptionDecision?.targetDate);
          if (!targetDate) return false; // 목표일자가 없으면 제외
          const month = targetDate.getMonth() + 1;
          if (!targetMonths.includes(month)) return false;
        }

        // 기업명 검색 필터
        if (companySearch.trim()) {
          if (!row.companyName.toLowerCase().includes(companySearch.trim().toLowerCase())) {
            return false;
          }
        }

        // 마지막 컨택일 필터
        if (lastContactStart || lastContactEnd) {
          const lastContactDate = getLastContactDate(row.salesActions);
          if (!lastContactDate) return false;
          const lastContact = new Date(lastContactDate).getTime();
          if (lastContactStart && lastContact < new Date(lastContactStart).getTime()) {
            return false;
          }
          if (lastContactEnd && lastContact > new Date(lastContactEnd).getTime()) {
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
          case "lastContact": {
            const aContact = getLastContactDate(a.salesActions);
            const bContact = getLastContactDate(b.salesActions);
            const aTime = aContact ? new Date(aContact).getTime() : 0;
            const bTime = bContact ? new Date(bContact).getTime() : 0;
            return (aTime - bTime) * modifier;
          }
          default:
            return 0;
        }
      });
  }, [data, timePeriod, contractAmountMin, contractAmountMax, targetRevenueMin, targetRevenueMax, expectedRevenueMin, expectedRevenueMax, targetMonths, companySearch, lastContactStart, lastContactEnd, sortField, sortOrder]);

  const possibilityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tableData
            .map((row) => row.adoptionDecision?.possibility)
            .filter((p): p is PossibilityType => !!p)
        )
      ).map((value) => ({ label: value, value })),
    [tableData]
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => ({
        label: `${idx + 1}월`,
        value: idx + 1,
      })),
    []
  );

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
      filterDropdown: ({ confirm, clearFilters }: FilterDropdownProps) => (
        <Space direction="vertical" style={{ padding: 8, width: 200 }}>
          <Input
            placeholder="기업명 검색"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            onPressEnter={() => confirm({ closeDropdown: true })}
            allowClear
          />
          <Divider style={{ margin: "8px 0" }} />
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "companyName" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("companyName");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "companyName" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("companyName");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
              onClick={() => confirm({ closeDropdown: true })}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                setCompanySearch("");
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
      filterIcon: (filtered) => (
        <FilterFilled style={{ color: filtered || companySearch || sortField === "companyName" ? token.colorPrimary : undefined }} />
      ),
      minWidth: 200,
    },
    {
      title: "기업 규모",
      dataIndex: "companySize",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <Space direction="vertical" style={{ padding: 8, width: 200 }}>
          <Select
            mode="multiple"
            allowClear
            placeholder="기업 규모 선택"
            style={{ width: "100%" }}
            options={Array.from(new Set(tableData.map((d) => d.companySize || "미정"))).map((size) => ({ label: size || "미정", value: size || "미정" }))}
            value={selectedKeys as string[]}
            onChange={(values) => setSelectedKeys(values)}
          />
          <Divider style={{ margin: "8px 0" }} />
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "companySize" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("companySize");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "companySize" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("companySize");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
              onClick={() => confirm({ closeDropdown: true })}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
      filterIcon: (filtered) => (
        <FilterFilled style={{ color: filtered || sortField === "companySize" ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => (record.companySize || "미정") === value,
      minWidth: 120,
    },
    {
      title: "카테고리",
      dataIndex: "category",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <Space direction="vertical" style={{ padding: 8, width: 200 }}>
          <Select
            mode="multiple"
            allowClear
            placeholder="카테고리 선택"
            style={{ width: "100%" }}
            options={Array.from(new Set(tableData.map((d) => d.category))).map((c) => ({ label: c, value: c }))}
            value={selectedKeys as string[]}
            onChange={(values) => setSelectedKeys(values)}
          />
          <Divider style={{ margin: "8px 0" }} />
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "category" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("category");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "category" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("category");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
              onClick={() => confirm({ closeDropdown: true })}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
      filterIcon: (filtered) => (
        <FilterFilled style={{ color: filtered || sortField === "category" ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => record.category === value,
      render: (category: string) => {
        const colorMap: Record<string, string> = {
          "채용": "blue",
          "공공": "green",
          "병원": "cyan",
          "성과": "purple",
        };
        return <Tag color={colorMap[category] || "default"} bordered>{category}</Tag>;
      },
      minWidth: 100,
    },
    {
      title: "제품사용",
      dataIndex: "productUsage",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <Space direction="vertical" style={{ padding: 8, width: 200 }}>
          <Select
            mode="multiple"
            allowClear
            placeholder="제품사용 선택"
            style={{ width: "100%" }}
            options={Array.from(new Set(tableData.flatMap((d) => d.productUsage))).map((p) => ({ label: p, value: p }))}
            value={selectedKeys as string[]}
            onChange={(values) => setSelectedKeys(values)}
          />
          <Divider style={{ margin: "8px 0" }} />
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "productUsage" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("productUsage");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "productUsage" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("productUsage");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
              onClick={() => confirm({ closeDropdown: true })}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
      filterIcon: (filtered) => (
        <FilterFilled style={{ color: filtered || sortField === "productUsage" ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => record.productUsage.includes(value as ProductType),
      render: (products: string[]) => {
        const productColorMap: Record<string, string> = {
          "ATS": "blue",
          "역검SR": "purple",
          "INHR+통합": "orange",
          "역검": "green",
          "이탈사": "red",
        };
        return (
          <div className={styles.tagGroup}>
            {products.map((product) => (
              <Tag key={product} color={productColorMap[product] || "default"} bordered>
                {product}
              </Tag>
            ))}
          </div>
        );
      },
      minWidth: 150,
    },
    {
      title: "담당자",
      dataIndex: "manager",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <Space direction="vertical" style={{ padding: 8, width: 200 }}>
          <Select
            mode="multiple"
            allowClear
            placeholder="담당자 선택"
            style={{ width: "100%" }}
            options={Array.from(new Set(tableData.map((d) => d.manager))).map((m) => ({ label: m, value: m }))}
            value={selectedKeys as string[]}
            onChange={(values) => setSelectedKeys(values)}
          />
          <Divider style={{ margin: "8px 0" }} />
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "manager" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("manager");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "manager" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("manager");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
              onClick={() => confirm({ closeDropdown: true })}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
      filterIcon: (filtered) => (
        <FilterFilled style={{ color: filtered || sortField === "manager" ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => record.manager === value,
      minWidth: 100,
    },
    {
      title: "신뢰지수",
      dataIndex: "trustIndex",
      filterDropdown: ({ confirm }) => (
        <Space direction="vertical" style={{ padding: 8, width: 200 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "trustIndex" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("trustIndex");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "trustIndex" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("trustIndex");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
              }}
            >
              내림차순
            </Button>
          </Space>
        </Space>
      ),
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
      minWidth: 120,
    },
    {
      title: "계약금액",
      dataIndex: "contractAmount",
      filterDropdown: ({ confirm, clearFilters }) => (
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
              type={sortField === "contractAmount" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("contractAmount");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "contractAmount" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("contractAmount");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
                setContractAmountMin(
                  contractAmountMinDraft !== null
                    ? contractAmountMinDraft * 10000
                    : null
                );
                setContractAmountMax(
                  contractAmountMaxDraft !== null
                    ? contractAmountMaxDraft * 10000
                    : null
                );
                confirm({ closeDropdown: true });
              }}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                setContractAmountMinDraft(null);
                setContractAmountMaxDraft(null);
                setContractAmountMin(null);
                setContractAmountMax(null);
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
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
      minWidth: 120,
    },
    {
      title: "최근 MBM",
      dataIndex: "attendance",
      render: (attendance: Customer["attendance"]) => {
        const lastMBM = getLastMBMDate(attendance);
        const formattedDate = lastMBM ? formatDateShort(lastMBM) : "-";
        return (
          <span style={{ color: token.colorTextBase }}>
            {formattedDate}
          </span>
        );
      },
      minWidth: 110,
    },
    {
      title: "도입결정",
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
      render: (_, record) => renderProgressTags(record, true, progressColors),
      minWidth: 140,
    },
    {
      title: "마지막 컨택",
      dataIndex: "salesActions",
      filterDropdown: ({ confirm, clearFilters }) => (
        <Space direction="vertical" style={{ padding: 8, width: 200 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>날짜 범위</Typography.Text>
          <Input
            type="date"
            placeholder="시작일"
            value={lastContactStart}
            onChange={(e) => setLastContactStart(e.target.value)}
            style={{ width: "100%" }}
          />
          <Input
            type="date"
            placeholder="종료일"
            value={lastContactEnd}
            onChange={(e) => setLastContactEnd(e.target.value)}
            style={{ width: "100%" }}
          />
          <Divider style={{ margin: "8px 0" }} />
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "lastContact" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("lastContact");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "lastContact" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("lastContact");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
              onClick={() => confirm({ closeDropdown: true })}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                setLastContactStart("");
                setLastContactEnd("");
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
      filterIcon: () => (
        <FilterFilled
          style={{
            color:
              lastContactStart || lastContactEnd || sortField === "lastContact"
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (salesActions: Customer["salesActions"]) => {
        const lastContactDate = getLastContactDate(salesActions);
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
      minWidth: 110,
    },
    {
      title: "목표매출",
      dataIndex: "_periodData",
      filterDropdown: ({ confirm, clearFilters }) => (
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
              type={sortField === "targetRevenue" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("targetRevenue");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "targetRevenue" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("targetRevenue");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
                setTargetRevenueMin(
                  targetRevenueMinDraft !== null
                    ? targetRevenueMinDraft * 10000
                    : null
                );
                setTargetRevenueMax(
                  targetRevenueMaxDraft !== null
                    ? targetRevenueMaxDraft * 10000
                    : null
                );
                confirm({ closeDropdown: true });
              }}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                setTargetRevenueMinDraft(null);
                setTargetRevenueMaxDraft(null);
                setTargetRevenueMin(null);
                setTargetRevenueMax(null);
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
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
      minWidth: 140,
    },
    {
      title: "가능성",
      dataIndex: "_periodData",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8, minWidth: 200 }}>
          <Select
            mode="multiple"
            allowClear
            showSearch
            placeholder="가능성 선택"
            style={{ width: "100%" }}
            options={possibilityOptions}
            value={selectedKeys as string[]}
            onChange={(values) => {
              setSelectedKeys(values);
            }}
            optionFilterProp="label"
          />
          <Divider style={{ margin: "8px 0" }} />
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "possibility" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("possibility");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "possibility" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("possibility");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
              }}
            >
              내림차순
            </Button>
          </Space>
          <Divider style={{ margin: "8px 0" }} />
          <Space style={{ marginTop: 8 }}>
            <Button
              type="primary"
              size="small"
              onClick={() => confirm({ closeDropdown: true })}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <FilterFilled style={{ color: filtered || sortField === "possibility" ? token.colorPrimary : undefined }} />
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
      minWidth: 110,
    },
    {
      title: "예상매출",
      dataIndex: "_periodData",
      filterDropdown: ({ confirm, clearFilters }) => (
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
              type={sortField === "expectedRevenue" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("expectedRevenue");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "expectedRevenue" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("expectedRevenue");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
                setExpectedRevenueMin(
                  expectedRevenueMinDraft !== null
                    ? expectedRevenueMinDraft * 10000
                    : null
                );
                setExpectedRevenueMax(
                  expectedRevenueMaxDraft !== null
                    ? expectedRevenueMaxDraft * 10000
                    : null
                );
                confirm({ closeDropdown: true });
              }}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                setExpectedRevenueMinDraft(null);
                setExpectedRevenueMaxDraft(null);
                setExpectedRevenueMin(null);
                setExpectedRevenueMax(null);
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
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
      minWidth: 140,
    },
    {
      title: "목표일자",
      dataIndex: "adoptionDecision",
      filterDropdown: ({ confirm, clearFilters }) => (
        <Space direction="vertical" style={{ padding: 8 }}>
          <Select
            mode="multiple"
            allowClear
            placeholder="월 선택"
            options={monthOptions}
            style={{ width: 220 }}
            value={targetMonthsDraft}
            onChange={(value) => setTargetMonthsDraft(value)}
          />
          <Divider style={{ margin: "8px 0" }} />
          <Typography.Text strong style={{ fontSize: 12 }}>정렬</Typography.Text>
          <Space>
            <Button
              size="small"
              type={sortField === "targetDate" && sortOrder === "asc" ? "primary" : "default"}
              onClick={() => {
                setSortField("targetDate");
                setSortOrder("asc");
                confirm({ closeDropdown: true });
              }}
            >
              오름차순
            </Button>
            <Button
              size="small"
              type={sortField === "targetDate" && sortOrder === "desc" ? "primary" : "default"}
              onClick={() => {
                setSortField("targetDate");
                setSortOrder("desc");
                confirm({ closeDropdown: true });
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
                setTargetMonths(targetMonthsDraft);
                confirm({ closeDropdown: true });
              }}
            >
              적용
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                setTargetMonthsDraft([]);
                setTargetMonths([]);
                confirm({ closeDropdown: true });
              }}
            >
              초기화
            </Button>
          </Space>
        </Space>
      ),
      filterIcon: () => (
        <FilterFilled
          style={{
            color:
              targetMonths.length > 0 || sortField === "targetDate"
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
      minWidth: 120,
    },
  ];

  return (
    <Card
      styles={{
        body: {
          padding: 0,
          minHeight: '400px',
          maxHeight: 'calc(100vh - 200px)',
          overflow: 'auto',
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
        scroll={{ x: 1800, y: 'calc(100vh - 450px)' }}
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
                        <DatePicker.RangePicker
                          value={summaryDateRange}
                          onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                              setSummaryDateRange([dates[0], dates[1]]);
                            }
                          }}
                          format="YYYY-MM-DD"
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
                                      {product}
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
                    {_customerSummary?.data?.hubspotUrl && (
                      <div style={{ marginTop: 16 }}>
                        <Button
                          type="primary"
                          icon={<Building2 size={16} />}
                          href={_customerSummary.data.hubspotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          block
                        >
                          HubSpot Company 보기
                        </Button>
                      </div>
                    )}
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
                        <DatePicker.RangePicker
                          value={actionDateRange}
                          onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                              setActionDateRange([dates[0], dates[1]]);
                            }
                          }}
                          format="YYYY-MM-DD"
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
                                      const possibilityIndex = possibility
                                        ? parseFloat(possibility.replace('%', ''))
                                        : 0;

                                      return {
                                        date: action.date,
                                        possibilityIndex,
                                        targetRevenue: action.stateChange?.after?.targetRevenue
                                          ? action.stateChange.after.targetRevenue / 10000
                                          : null,
                                        expectedRevenue: action.stateChange?.after?.targetRevenue && action.stateChange?.after?.possibility
                                          ? (action.stateChange.after.targetRevenue * parseFloat(action.stateChange.after.possibility.replace('%', ''))) / 100 / 10000
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
                                        <AntText>{action.content || '-'}</AntText>
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
                        <DatePicker.RangePicker
                          value={contentDateRange}
                          onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                              setContentDateRange([dates[0], dates[1]]);
                            }
                          }}
                          format="YYYY-MM-DD"
                        />
                      </Space>
                    </div>

                    {isTrustChangeDetailLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>
                    ) : (
                      <>
                        {/* 차트 영역 */}
                        {trustChangeDetailData?.data?.engagementItems && trustChangeDetailData.data.engagementItems.length > 0 && (
                          <div style={{ marginBottom: 24 }}>
                            <Row gutter={16}>
                              {/* 콘텐츠 퍼널별 조회수 */}
                              <Col span={12}>
                                <Title level={5} style={{ marginBottom: 16 }}>
                                  콘텐츠 퍼널별 조회수
                                </Title>
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                                      cy="50%"
                                      outerRadius={80}
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
                                        return `${entry.name} ${percent}%`;
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
                                  </PieChart>
                                </ResponsiveContainer>
                              </Col>

                              {/* 콘텐츠 유형별 조회수 */}
                              <Col span={12}>
                                <Title level={5} style={{ marginBottom: 16 }}>
                                  콘텐츠 유형별 조회수
                                </Title>
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                                      cy="50%"
                                      outerRadius={80}
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
                                        return `${entry.name} ${percent}%`;
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
                                  </PieChart>
                                </ResponsiveContainer>
                              </Col>
                            </Row>
                          </div>
                        )}

                        {/* 콘텐츠 소비 이력 */}
                        {trustChangeDetailData?.data?.engagementItems && trustChangeDetailData.data.engagementItems.length > 0 && (
                          <div style={{ marginBottom: 24 }}>
                            <Title level={5} style={{ marginBottom: 16 }}>
                              콘텐츠 소비 이력
                            </Title>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                {[...trustChangeDetailData.data.engagementItems]
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
                                              최근 조회: {item.date}
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
                          </div>
                        )}

                        {/* MBM 참여 이력 */}
                        {trustChangeDetailData?.data?.marketingEvents && trustChangeDetailData.data.marketingEvents.length > 0 && (
                          <div style={{ marginBottom: 24 }}>
                            <Title level={5} style={{ marginBottom: 16 }}>
                              MBM 참여 이력
                            </Title>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                {[...trustChangeDetailData.data.marketingEvents]
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .map((event, index) => {
                                    const isAttended = new Date(event.date) < new Date();
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
                                              <Space size={8}>
                                                <Tag
                                                  color={isAttended ? 'green' : 'orange'}
                                                  style={{ margin: 0 }}
                                                >
                                                  {isAttended ? '참석' : '참석 예정'}
                                                </Tag>
                                                {event.event_type && (
                                                  <Tag color="blue" style={{ margin: 0 }}>
                                                    {event.event_type}
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
                          </div>
                        )}

                        {/* 데이터 없음 */}
                        {(!trustChangeDetailData?.data?.marketingEvents || trustChangeDetailData.data.marketingEvents.length === 0) &&
                          (!trustChangeDetailData?.data?.engagementItems || trustChangeDetailData.data.engagementItems.length === 0) && (
                            <Alert
                              message="활동 이력이 없습니다"
                              description="선택한 기간 동안의 MBM 참여 이력 및 콘텐츠 소비 이력이 없습니다."
                              type="info"
                              showIcon
                            />
                          )}
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
              >
                {selectedAction.type === 'CALL' ? '콜' : '미팅'}
              </Tag>
              <Space size="small">
                <Calendar size={14} style={{ color: token.colorTextSecondary }} />
                <AntText type="secondary">{selectedAction.date}</AntText>
              </Space>
            </Space>

            {/* 활동 내용 */}
            <div>
              <AntText type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                활동 내용
              </AntText>
              <AntText strong>{selectedAction.content}</AntText>
            </div>

            {/* 메타 정보 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <AntText type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  담당자
                </AntText>
                <AntText>{selectedCustomer.manager}</AntText>
              </div>
              <div>
                <AntText type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  가능성 변화
                </AntText>
                <Space size="small">
                  {selectedAction.stateChange?.before?.possibility && (
                    <>
                      <Tag>{selectedAction.stateChange.before.possibility}</Tag>
                      <ArrowRight size={12} style={{ color: token.colorTextSecondary }} />
                    </>
                  )}
                  <Tag color={
                    selectedAction.stateChange?.after?.possibility === '100%' ? 'blue' :
                      selectedAction.stateChange?.after?.possibility === '90%' ? 'green' :
                        selectedAction.stateChange?.after?.possibility === '40%' ? 'orange' : 'red'
                  }>
                    {selectedAction.stateChange?.after?.possibility || '-'}
                  </Tag>
                </Space>
              </div>
            </div>

            {/* 목표 매출 및 일자 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <AntText type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  목표 매출 변화
                </AntText>
                <Space size="small">
                  {selectedAction.stateChange?.before?.targetRevenue && (
                    <>
                      <AntText type="secondary">{formatMan(selectedAction.stateChange.before.targetRevenue)}</AntText>
                      <ArrowRight size={12} style={{ color: token.colorTextSecondary }} />
                    </>
                  )}
                  <AntText strong>
                    {selectedAction.stateChange?.after?.targetRevenue
                      ? formatMan(selectedAction.stateChange.after.targetRevenue)
                      : '-'}
                  </AntText>
                </Space>
              </div>
              <div>
                <AntText type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  목표 일자
                </AntText>
                <AntText strong>
                  {selectedAction.stateChange?.after?.targetDate || '-'}
                </AntText>
              </div>
            </div>

            {/* 진행 상태 */}
            <div>
              <AntText type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                진행 상태 변화
              </AntText>
              <Space size="middle">
                <Space size="small">
                  {selectedAction.stateChange?.after?.test ?
                    <CheckCircle2 size={16} style={{ color: token.colorSuccess }} /> :
                    <XCircle size={16} style={{ color: token.colorTextTertiary }} />
                  }
                  <AntText style={{ color: selectedAction.stateChange?.after?.test ? token.colorSuccess : token.colorTextTertiary }}>
                    테스트
                  </AntText>
                </Space>
                <Space size="small">
                  {selectedAction.stateChange?.after?.quote ?
                    <CheckCircle2 size={16} style={{ color: token.colorSuccess }} /> :
                    <XCircle size={16} style={{ color: token.colorTextTertiary }} />
                  }
                  <AntText style={{ color: selectedAction.stateChange?.after?.quote ? token.colorSuccess : token.colorTextTertiary }}>
                    견적
                  </AntText>
                </Space>
                <Space size="small">
                  {selectedAction.stateChange?.after?.approval ?
                    <CheckCircle2 size={16} style={{ color: token.colorSuccess }} /> :
                    <XCircle size={16} style={{ color: token.colorTextTertiary }} />
                  }
                  <AntText style={{ color: selectedAction.stateChange?.after?.approval ? token.colorSuccess : token.colorTextTertiary }}>
                    품의
                  </AntText>
                </Space>
                <Space size="small">
                  {selectedAction.stateChange?.after?.contract ?
                    <CheckCircle2 size={16} style={{ color: token.colorSuccess }} /> :
                    <XCircle size={16} style={{ color: token.colorTextTertiary }} />
                  }
                  <AntText style={{ color: selectedAction.stateChange?.after?.contract ? token.colorSuccess : token.colorTextTertiary }}>
                    계약
                  </AntText>
                </Space>
              </Space>
            </div>
          </Space>
        )}
      </Modal>
    </Card>
  );
};
