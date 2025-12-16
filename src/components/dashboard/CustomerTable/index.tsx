import { SalesActionHistory } from "@/components/dashboard/SalesActionHistory";
import {
  calculateExpectedRevenue,
  getDataWithPeriodChange,
} from "@/data/mockData";
import { Customer, PossibilityType } from "@/types/customer";
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
import { useEffect, useMemo, useState } from "react";

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

const trustTagColor = (level: Customer["trustLevel"]) => {
  switch (level) {
    case "P1":
      return "green";
    case "P2":
      return "orange";
    case "P3":
      return "red";
    default:
      return "default";
  }
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

        return true;
      });
  }, [data, timePeriod, contractAmountMin, contractAmountMax, targetRevenueMin, targetRevenueMax, expectedRevenueMin, expectedRevenueMax, targetMonths, companySearch]);

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
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
      filterDropdown: ({ confirm, clearFilters }: FilterDropdownProps) => (
        <Space direction="vertical" style={{ padding: 8 }}>
          <Input
            placeholder="기업명 검색"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            onPressEnter={() => confirm({ closeDropdown: true })}
            allowClear
          />
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => confirm({ closeDropdown: true })}
            >
              검색
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
        <FilterFilled style={{ color: filtered || companySearch ? token.colorPrimary : undefined }} />
      ),
      width: 160,
    },
    {
      title: "기업 규모",
      dataIndex: "companySize",
      filters: Array.from(
        new Set(tableData.map((d) => d.companySize || "미정"))
      ).map((size) => ({ text: size || "미정", value: size || "미정" })),
      onFilter: (value, record) => (record.companySize || "미정") === value,
      width: 120,
    },
    {
      title: "담당자",
      dataIndex: "manager",
      sorter: (a, b) => a.manager.localeCompare(b.manager),
      filters: Array.from(new Set(tableData.map((d) => d.manager))).map(
        (m) => ({ text: m, value: m })
      ),
      onFilter: (value, record) => record.manager === value,
      width: 140,
    },
    {
      title: "신뢰지수",
      dataIndex: "trustIndex",
      sorter: (a, b) => (a.trustIndex || 0) - (b.trustIndex || 0),
      render: (_, record) => {
        const past = record._periodData?.pastTrustIndex ?? null;
        const current = record.trustIndex || 0;
        const color =
          past !== null && current > past
            ? "green"
            : past !== null && current < past
              ? "red"
              : trustTagColor(record.trustLevel);
        return (
          <Space size={4}>
            {past !== null && (
              <Tag color={color}>
                {past} → {current}
              </Tag>
            )}
            {past === null && (
              <Tag color={trustTagColor(record.trustLevel)}>{current}</Tag>
            )}
            <Tag color={trustTagColor(record.trustLevel)}>
              {record.trustLevel}
            </Tag>
          </Space>
        );
      },
      width: 140,
    },
    {
      title: "계약금액",
      dataIndex: "contractAmount",
      sorter: (a, b) => (a.contractAmount || 0) - (b.contractAmount || 0),
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
              contractAmountMin !== null || contractAmountMax !== null
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (val: number | null) => formatMan(val),
      width: 140,
    },
    {
      title: "목표매출",
      dataIndex: "_periodData",
      sorter: (a, b) => {
        const aDiff = (a.adoptionDecision.targetRevenue || 0) - (a._periodData?.pastTargetRevenue || 0);
        const bDiff = (b.adoptionDecision.targetRevenue || 0) - (b._periodData?.pastTargetRevenue || 0);
        return aDiff - bDiff;
      },
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
              targetRevenueMin !== null || targetRevenueMax !== null
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (_, record) => {
        const past = record._periodData?.pastTargetRevenue ?? 0;
        const current = record.adoptionDecision.targetRevenue ?? 0;
        const diff = current - past;
        const color = diff > 0 ? "green" : diff < 0 ? "red" : "default";
        return (
          <Tag color={color}>
            {formatMan(past)} → {formatMan(current)}
          </Tag>
        );
      },
      width: 180,
    },
    {
      title: "가능성",
      dataIndex: "_periodData",
      sorter: (a, b) => {
        const aCurrent = Number(
          (a.adoptionDecision.possibility || "0").replace("%", "")
        );
        const aPast = Number(
          (a._periodData?.pastPossibility || "0").replace("%", "")
        );
        const bCurrent = Number(
          (b.adoptionDecision.possibility || "0").replace("%", "")
        );
        const bPast = Number(
          (b._periodData?.pastPossibility || "0").replace("%", "")
        );
        return aCurrent - aPast - (bCurrent - bPast);
      },
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
        <FilterFilled style={{ color: filtered ? token.colorPrimary : undefined }} />
      ),
      onFilter: (value, record) => record.adoptionDecision.possibility === value,
      render: (_, record) => {
        const past = record._periodData?.pastPossibility;
        const current = record.adoptionDecision.possibility;
        const pastNum = Number((past || "0").replace("%", ""));
        const currentNum = Number((current || "0").replace("%", ""));
        const diff = currentNum - pastNum;
        const color = diff > 0 ? "green" : diff < 0 ? "red" : "default";
        return (
          <Tag color={color}>
            {past} → {current}
          </Tag>
        );
      },
      width: 140,
    },
    {
      title: "예상매출",
      dataIndex: "_periodData",
      sorter: (a, b) =>
        (a._periodData?.currentExpectedRevenue ?? a.expectedRevenue) -
        (a._periodData?.pastExpectedRevenue ?? 0) -
        ((b._periodData?.currentExpectedRevenue ?? b.expectedRevenue) -
          (b._periodData?.pastExpectedRevenue ?? 0)),
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
              expectedRevenueMin !== null || expectedRevenueMax !== null
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (_, record) => {
        const past = record._periodData?.pastExpectedRevenue ?? 0;
        const current =
          record._periodData?.currentExpectedRevenue ?? record.expectedRevenue;
        const diff = current - past;
        const color = diff > 0 ? "green" : diff < 0 ? "red" : "default";
        return (
          <Tag color={color}>
            {formatMan(past)} → {formatMan(current)}
          </Tag>
        );
      },
      width: 180,
    },
    {
      title: "진행상태",
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
      width: 160,
    },
    {
      title: "목표일자",
      dataIndex: "adoptionDecision",
      sorter: (a, b) =>
        new Date(a.adoptionDecision.targetDate || "1970-01-01").getTime() -
        new Date(b.adoptionDecision.targetDate || "1970-01-01").getTime(),
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
              targetMonths.length > 0
                ? token.colorPrimary
                : undefined,
          }}
        />
      ),
      render: (_, record) => {
        const past = record._periodData?.pastTargetDate || "-";
        const current = record.adoptionDecision.targetDate || "-";
        const color = targetDateColor(
          record._periodData?.pastTargetDate,
          record.adoptionDecision.targetDate
        );
        return (
          <Tag color={color}>
            {past} → {current}
          </Tag>
        );
      },
      width: 140,
    },
  ];

  return (
    <Card>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={{ pageSize: 10 }}
        loading={loading}
        onRow={(record) => ({
          onClick: () => setSelectedCustomer(record),
          style: { cursor: "pointer" },
        })}
        scroll={{ x: 1200 }}
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
                              : trustTagColor(selectedCustomer.trustLevel)
                        }
                      >
                        {selectedCustomer._periodData?.pastTrustIndex ?? "-"} →{" "}
                        {selectedCustomer.trustIndex} (
                        {selectedCustomer.trustLevel})
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
