import { SalesActionHistory } from "@/components/dashboard/SalesActionHistory";
import {
  calculateExpectedRevenue,
  getDataWithPeriodChange,
} from "@/data/mockData";
import { Customer, PossibilityType, ProductType } from "@/types/customer";
import { FilterFilled } from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  theme,
  Typography
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./index.module.scss";

import type { TimePeriodType } from "@/App";
const { Title, Text: AntText } = Typography;

interface CustomerTableProps {
  data: Customer[];
  timePeriod: TimePeriodType;
  loading?: boolean;
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

const targetDateColor = (
  past: string | null | undefined,
  current: string | null | undefined
) => {
  if (!past || !current || past === "-" || current === "-") return "default";

  const pastDate = parseTargetDate(past);
  const currentDate = parseTargetDate(current);

  if (!pastDate || !currentDate) return "default";

  // 일자가 줄어들었으면 (더 가까운 미래) → 초록
  // 일자가 늘어났으면 (더 먼 미래) → 빨강
  if (currentDate.getTime() < pastDate.getTime()) {
    return "green"; // 줄어듦
  } else if (currentDate.getTime() > pastDate.getTime()) {
    return "red"; // 늘어남
  }

  return "default";
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
    key: keyof typeof ad;
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

export const CustomerTable = ({ data, timePeriod, loading }: CustomerTableProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedContent, setSelectedContent] = useState<{
    title: string;
    category: string;
    date: string;
  } | null>(null);
  const { token } = theme.useToken();

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
            c.adoptionDecision.targetRevenue,
            c.adoptionDecision.possibility
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
        if (targetRevenueMin !== null && (row.adoptionDecision.targetRevenue ?? 0) < targetRevenueMin) {
          return false;
        }
        if (targetRevenueMax !== null && (row.adoptionDecision.targetRevenue ?? 0) > targetRevenueMax) {
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
          const targetDate = parseTargetDate(row.adoptionDecision.targetDate);
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
            return ((a.adoptionDecision.targetRevenue ?? 0) - (b.adoptionDecision.targetRevenue ?? 0)) * modifier;
          case "possibility": {
            const aVal = Number((a.adoptionDecision.possibility || "0").replace("%", ""));
            const bVal = Number((b.adoptionDecision.possibility || "0").replace("%", ""));
            return (aVal - bVal) * modifier;
          }
          case "expectedRevenue":
            return (a.expectedRevenue - b.expectedRevenue) * modifier;
          case "targetDate": {
            const aDate = new Date(a.adoptionDecision.targetDate || 0).getTime();
            const bDate = new Date(b.adoptionDecision.targetDate || 0).getTime();
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
            .map((row) => row.adoptionDecision.possibility)
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

  const getProgressLevel = (ad: Customer["adoptionDecision"]) => {
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
        const current = record.adoptionDecision.targetRevenue ?? 0;
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
      onFilter: (value, record) => record.adoptionDecision.possibility === value,
      render: (_, record) => {
        const past = record._periodData?.pastPossibility || "0%";
        const current = record.adoptionDecision.possibility;
        const pastNum = Number(past.replace("%", ""));
        const currentNum = Number((current || "0").replace("%", ""));
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
        const current = record.adoptionDecision.targetDate || "-";
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
    <Card bodyStyle={{ padding: 0 }}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={{ pageSize: 10 }}
        loading={loading}
        size="small"
        onRow={(record) => ({
          onClick: () => setSelectedCustomer(record),
          style: { cursor: "pointer" },
        })}
        scroll={{ x: 1800 }}
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
                label: "요약",
                children: (
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="담당자">
                      {selectedCustomer.manager}
                    </Descriptions.Item>
                    <Descriptions.Item label="카테고리">
                      {selectedCustomer.category}
                    </Descriptions.Item>
                    <Descriptions.Item label="기업규모">
                      {selectedCustomer.companySize || "미정"}
                    </Descriptions.Item>
                    <Descriptions.Item label="제품사용" span={2}>
                      <Space size={4} wrap>
                        {selectedCustomer.productUsage?.map((product, idx) => (
                          <Tag key={idx} color="blue">
                            {product}
                          </Tag>
                        )) || "-"}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="가능성">
                      <Tag
                        color={
                          selectedCustomer._periodData?.pastPossibility !==
                            undefined &&
                            Number(
                              selectedCustomer.adoptionDecision.possibility.replace(
                                "%",
                                ""
                              )
                            ) >
                            Number(
                              selectedCustomer._periodData.pastPossibility.replace(
                                "%",
                                ""
                              )
                            )
                            ? "green"
                            : selectedCustomer._periodData?.pastPossibility !==
                              undefined &&
                              Number(
                                selectedCustomer.adoptionDecision.possibility.replace(
                                  "%",
                                  ""
                                )
                              ) <
                              Number(
                                selectedCustomer._periodData.pastPossibility.replace(
                                  "%",
                                  ""
                                )
                              )
                              ? "red"
                              : "default"
                        }
                      >
                        {selectedCustomer._periodData?.pastPossibility ?? "-"} →{" "}
                        {selectedCustomer.adoptionDecision.possibility}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="계약금액">
                      {formatMan(selectedCustomer.contractAmount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="신뢰지수">
                      <Tag
                        color={
                          selectedCustomer._periodData?.pastTrustIndex !==
                            undefined &&
                            (selectedCustomer.trustIndex || 0) >
                            (selectedCustomer._periodData?.pastTrustIndex || 0)
                            ? "green"
                            : selectedCustomer._periodData?.pastTrustIndex !==
                              undefined &&
                              (selectedCustomer.trustIndex || 0) <
                              (selectedCustomer._periodData?.pastTrustIndex ||
                                0)
                              ? "red"
                              : "default"
                        }
                      >
                        {selectedCustomer._periodData?.pastTrustIndex ?? "-"} →{" "}
                        {selectedCustomer.trustIndex}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="목표매출" span={2}>
                      <Tag
                        color={
                          selectedCustomer._periodData?.pastTargetRevenue !==
                            undefined &&
                            (selectedCustomer.adoptionDecision.targetRevenue || 0) >
                            (selectedCustomer._periodData?.pastTargetRevenue || 0)
                            ? "green"
                            : selectedCustomer._periodData?.pastTargetRevenue !==
                              undefined &&
                              (selectedCustomer.adoptionDecision.targetRevenue || 0) <
                              (selectedCustomer._periodData?.pastTargetRevenue || 0)
                              ? "red"
                              : "default"
                        }
                      >
                        {formatMan(
                          selectedCustomer._periodData?.pastTargetRevenue
                        )}{" "}
                        →{" "}
                        {formatMan(
                          selectedCustomer.adoptionDecision.targetRevenue
                        )}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="예상매출" span={2}>
                      <Tag
                        color={
                          selectedCustomer._periodData?.pastExpectedRevenue !==
                            undefined &&
                            (selectedCustomer._periodData
                              ?.currentExpectedRevenue || 0) >
                            (selectedCustomer._periodData
                              ?.pastExpectedRevenue || 0)
                            ? "green"
                            : selectedCustomer._periodData
                              ?.pastExpectedRevenue !== undefined &&
                              (selectedCustomer._periodData
                                ?.currentExpectedRevenue || 0) <
                              (selectedCustomer._periodData
                                ?.pastExpectedRevenue || 0)
                              ? "red"
                              : "default"
                        }
                      >
                        {formatMan(
                          selectedCustomer._periodData?.pastExpectedRevenue
                        )}{" "}
                        →{" "}
                        {formatMan(
                          selectedCustomer._periodData
                            ?.currentExpectedRevenue ??
                          calculateExpectedRevenue(
                            selectedCustomer.adoptionDecision.targetRevenue,
                            selectedCustomer.adoptionDecision.possibility
                          )
                        )}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="진행상태" span={2}>
                      {renderProgressTags(
                        selectedCustomer,
                        true,
                        progressColors
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="목표일자" span={2}>
                      <Tag
                        color={targetDateColor(
                          selectedCustomer._periodData?.pastTargetDate,
                          selectedCustomer.adoptionDecision.targetDate
                        )}
                      >
                        {(selectedCustomer._periodData?.pastTargetDate || "-") +
                          " → " +
                          (selectedCustomer.adoptionDecision.targetDate || "-")}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "actions",
                label: "영업 히스토리",
                children: (
                  <SalesActionHistory
                    actions={
                      selectedCustomer.salesActions
                        ? [...selectedCustomer.salesActions].sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        : []
                    }
                    customer={selectedCustomer}
                  />
                ),
              },
              {
                key: "content",
                label: "콘텐츠/MBM",
                children: (
                  <div>
                    <Title level={5} style={{ marginBottom: 8 }}>
                      콘텐츠 조회 이력
                    </Title>
                    <List
                      bordered
                      dataSource={
                        selectedCustomer.contentEngagements
                          ? [...selectedCustomer.contentEngagements].sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )
                          : []
                      }
                      locale={{ emptyText: "콘텐츠 조회 이력이 없습니다." }}
                      renderItem={(item) => (
                        <List.Item
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setSelectedContent({
                              title: item.title,
                              category: item.category,
                              date: item.date,
                            })
                          }
                        >
                          <Space direction="vertical" size={2}>
                            <Space size={6}>
                              <Tag color="blue">{item.category}</Tag>
                              <AntText>{item.title}</AntText>
                            </Space>
                            <AntText type="secondary" style={{ fontSize: 12 }}>
                              {item.date}
                            </AntText>
                          </Space>
                        </List.Item>
                      )}
                    />

                    <Divider style={{ margin: "16px 0" }} />

                    <Title level={5} style={{ marginBottom: 8 }}>
                      MBM 참석 여부
                    </Title>
                    <Space wrap>
                      {selectedCustomer.attendance &&
                        Object.entries(selectedCustomer.attendance).filter(
                          ([, attended]) => attended
                        ).length > 0 ? (
                        Object.entries(selectedCustomer.attendance)
                          .filter(([, attended]) => attended)
                          .map(([key]) => (
                            <Tag key={key} color="green">
                              참석: {key}
                            </Tag>
                          ))
                      ) : (
                        <AntText type="secondary" style={{ fontSize: 12 }}>
                          참석 이력이 없습니다.
                        </AntText>
                      )}
                    </Space>
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
          <Space direction="vertical" size={8}>
            <Space>
              <Tag color="blue">{selectedContent.category}</Tag>
              <AntText type="secondary">{selectedContent.date}</AntText>
            </Space>
            <AntText>{selectedContent.title}</AntText>
          </Space>
        )}
      </Modal>
    </Card>
  );
};
