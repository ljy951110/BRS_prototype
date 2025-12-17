import { DashboardTableRequest, fetchDashboardTable, ProgressStage, TimePeriodApi } from "@/api";
import { Charts } from "@/components/dashboard/Charts";
import { CustomerActivityAnalysis } from "@/components/dashboard/CustomerActivityAnalysis";
import { CustomerTable } from "@/components/dashboard/CustomerTable";
import { MBMTimeline } from "@/components/dashboard/MBMTimeline";
import { PipelineBoard } from "@/components/dashboard/PipelineBoard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { Customer, PossibilityType } from "@/types/customer";
import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SearchOutlined,
  TableOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  ConfigProvider,
  DatePicker,
  Input,
  Layout,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  theme,
  Typography
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import styles from "./App.module.scss";

const { RangePicker } = DatePicker;

type ViewMode = "table" | "pipeline" | "chart" | "timeline" | "activity";
export type TimePeriodType = "1w" | "1m" | "6m" | "1y";

const TIME_PERIOD_TO_API: Record<TimePeriodType, TimePeriodApi> = {
  "1w": "WEEK",
  "1m": "MONTH",
  "6m": "HALF_YEAR",
  "1y": "YEAR",
};

const PROGRESS_STAGE_MAP: Record<ProgressStatus, ProgressStage | null> = {
  all: null,
  test: "TEST",
  quote: "QUOTE",
  approval: "APPROVAL",
  contract: "CLOSING",
  none: null,
};

// 진행상태 필터 타입
type ProgressStatus =
  | "all"
  | "test"
  | "quote"
  | "approval"
  | "contract"
  | "none";

// 탭별 필터 상태 타입
interface TabFilters {
  searchQuery: string;
  selectedManager: string;
  selectedCategory: string;
  selectedCompanySize: string;
  selectedPossibility: string;
  selectedProgress: ProgressStatus;
}

type TabFilterState = Record<ViewMode, TabFilters>;

const DEFAULT_FILTERS: TabFilters = {
  searchQuery: "",
  selectedManager: "all",
  selectedCategory: "all",
  selectedCompanySize: "all",
  selectedPossibility: "all",
  selectedProgress: "all",
};

const TIME_PERIOD_OPTIONS: { value: TimePeriodType; label: string }[] = [
  { value: "1w", label: "최근 1주일" },
  { value: "1m", label: "최근 1달" },
  { value: "6m", label: "최근 반기" },
  { value: "1y", label: "최근 1년" },
];

const TAB_FILTER_UI: Record<
  ViewMode,
  {
    showSearch: boolean;
    showManager: boolean;
    showCompanySize: boolean;
    showCategory: boolean;
    showProgress: boolean;
  }
> = {
  table: {
    showSearch: true,
    showManager: true,
    showCompanySize: true,
    showCategory: false,
    showProgress: true,
  },
  timeline: {
    showSearch: true,
    showManager: true,
    showCompanySize: true,
    showCategory: true,
    showProgress: false,
  },
  activity: {
    showSearch: true,
    showManager: false,
    showCompanySize: true,
    showCategory: true,
    showProgress: false,
  },
  pipeline: {
    showSearch: true,
    showManager: true,
    showCompanySize: true,
    showCategory: false,
    showProgress: true,
  },
  chart: {
    showSearch: false,
    showManager: false,
    showCompanySize: true,
    showCategory: true,
    showProgress: true,
  },
};

interface AppContentProps {
  isDark: boolean;
  onToggleTheme: (checked: boolean) => void;
}

function AppContent({ isDark, onToggleTheme }: AppContentProps) {
  const { token } = theme.useToken();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  // 기본값: 최근 1주일 (오늘 - 7일 ~ 오늘)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);

  // 탭별 독립적인 필터 상태
  const [tabFilters, setTabFilters] = useState<TabFilterState>({
    table: { ...DEFAULT_FILTERS },
    pipeline: { ...DEFAULT_FILTERS },
    timeline: { ...DEFAULT_FILTERS },
    activity: { ...DEFAULT_FILTERS },
    chart: { ...DEFAULT_FILTERS },
  });

  // 현재 탭의 필터 접근
  const currentFilters = tabFilters[viewMode];

  // 현재 탭의 필터 업데이트 헬퍼
  const updateCurrentFilter = (key: keyof TabFilters, value: string) => {
    setTabFilters((prev) => ({
      ...prev,
      [viewMode]: { ...prev[viewMode], [key]: value },
    }));
  };

  // dateRange에서 일수를 계산하여 가장 가까운 TimePeriodType으로 변환
  const timePeriod: TimePeriodType = useMemo(() => {
    const days = dateRange[1].diff(dateRange[0], "day");
    if (days <= 7) return "1w";
    if (days <= 30) return "1m";
    if (days <= 180) return "6m";
    return "1y";
  }, [dateRange]);

  // API 요청 바디 생성
  const requestBody: DashboardTableRequest = useMemo(() => {
    const filters: DashboardTableRequest["filters"] = {};

    if (currentFilters.selectedManager !== "all") {
      filters.managers = [currentFilters.selectedManager];
    }
    if (currentFilters.selectedCategory !== "all") {
      filters.categories = [currentFilters.selectedCategory as Customer["category"]];
    }
    if (currentFilters.selectedCompanySize !== "all") {
      filters.companySizes = [currentFilters.selectedCompanySize as Customer["companySize"]];
    }
    if (currentFilters.selectedPossibility !== "all") {
      filters.possibilities = [currentFilters.selectedPossibility as PossibilityType];
    }
    const stage = PROGRESS_STAGE_MAP[currentFilters.selectedProgress];
    if (stage) {
      filters.stages = [stage];
    }

    return {
      timePeriod: TIME_PERIOD_TO_API[timePeriod],
      search:
        currentFilters.searchQuery.trim().length > 0
          ? { companyName: currentFilters.searchQuery.trim() }
          : undefined,
      filters: Object.keys(filters).length ? filters : undefined,
      pagination: { page: 1, pageSize: 300 },
    };
  }, [currentFilters, timePeriod]);

  // React Query로 API 호출 (약간의 지연으로 MSW 준비 대기)
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    // MSW가 준비될 시간을 주기 위한 짧은 지연
    const timer = setTimeout(() => {
      console.log('[App] Enabling React Query...');
      setMswReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["dashboard-table", requestBody],
    queryFn: () => fetchDashboardTable(requestBody),
    staleTime: 60 * 1000,
    enabled: mswReady, // MSW 준비 후에만 쿼리 실행
  });

  // DashboardTableRow를 Customer로 타입 변환
  const tableRows = useMemo(
    () => (apiData?.rows ?? []) as unknown as Customer[],
    [apiData?.rows]
  );

  // 고유 담당자 목록 (API 응답 기반)
  const managers = useMemo(
    () => [...new Set(tableRows.map((c) => c.manager))].sort(),
    [tableRows]
  );

  const categories = useMemo(
    () => [...new Set(tableRows.map((c) => c.category))].sort(),
    [tableRows]
  );

  const companySizes = useMemo(
    () => [...new Set(tableRows.map((c) => c.companySize || "미정"))].sort(),
    [tableRows]
  );

  // 진행상태 "없음" 필터는 프론트에서 추가 처리
  const filteredData = useMemo(() => {
    if (currentFilters.selectedProgress === "none") {
      return tableRows.filter((customer) => {
        const ad = customer.adoptionDecision;
        return !(ad.test || ad.quote || ad.approval || ad.contract);
      });
    }
    return tableRows;
  }, [tableRows, currentFilters.selectedProgress]);

  const filterControls = (
    <Space wrap size="middle" className={styles.filterInline}>
      {TAB_FILTER_UI[viewMode].showSearch && (
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="기업명 검색..."
          value={currentFilters.searchQuery}
          onChange={(e) => updateCurrentFilter("searchQuery", e.target.value)}
          style={{ width: 260 }}
        />
      )}

      {TAB_FILTER_UI[viewMode].showManager && (
        <Select
          value={currentFilters.selectedManager}
          onChange={(val) => updateCurrentFilter("selectedManager", val)}
          style={{ minWidth: 160 }}
          options={[
            { value: "all", label: "전체 담당자" },
            ...managers.map((m) => ({ value: m, label: m })),
          ]}
        />
      )}

      {TAB_FILTER_UI[viewMode].showCompanySize && (
        <Select
          value={currentFilters.selectedCompanySize}
          onChange={(val) => updateCurrentFilter("selectedCompanySize", val)}
          style={{ minWidth: 160 }}
          options={[
            { value: "all", label: "전체 기업 규모" },
            ...companySizes.map((size) => ({ value: size, label: size })),
          ]}
        />
      )}

      {TAB_FILTER_UI[viewMode].showCategory && (
        <Select
          value={currentFilters.selectedCategory}
          onChange={(val) => updateCurrentFilter("selectedCategory", val)}
          style={{ minWidth: 160 }}
          options={[
            { value: "all", label: "조직 구분" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
      )}

      {TAB_FILTER_UI[viewMode].showProgress && (
        <Select
          value={currentFilters.selectedProgress}
          onChange={(val) =>
            updateCurrentFilter("selectedProgress", val as ProgressStatus)
          }
          style={{ minWidth: 160 }}
          options={[
            { value: "all", label: "전체 진행상태" },
            { value: "contract", label: "계약 완료" },
            { value: "approval", label: "승인 단계" },
            { value: "quote", label: "견적 단계" },
            { value: "test", label: "테스트 단계" },
            { value: "none", label: "미진행" },
          ]}
        />
      )}
    </Space>
  );

  const tabItems = [
    {
      key: "table",
      label: (
        <Space size={6}>
          <TableOutlined />
          전체 현황
        </Space>
      ),
    },
    {
      key: "timeline",
      label: (
        <Space size={6}>
          <CalendarOutlined />
          타임라인
        </Space>
      ),
    },
    {
      key: "activity",
      label: (
        <Space size={6}>
          <ThunderboltOutlined />
          고객 활동 분석
        </Space>
      ),
    },
    {
      key: "pipeline",
      label: (
        <Space size={6}>
          <AppstoreOutlined />딜
        </Space>
      ),
    },
    {
      key: "chart",
      label: (
        <Space size={6}>
          <BarChartOutlined />
          차트
        </Space>
      ),
    },
  ];

  return (
    <Layout
      className={styles.app}
      data-theme={isDark ? "dark" : "light"}
      style={{
        background: token.colorBgLayout,
        color: token.colorText,
      }}
    >
      <Layout.Header
        className={styles.header}
        style={{
          background: token.colorBgElevated,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Space align="center" size="large">
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <BarChartOutlined />
            </div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Bgent
            </Typography.Title>
          </div>
        </Space>
        <Space align="center" size="middle">
          <Space align="center" size={6}>
            <Typography.Text type="secondary">Light</Typography.Text>
            <Switch checked={isDark} onChange={onToggleTheme} size="small" />
            <Typography.Text type="secondary">Dark</Typography.Text>
          </Space>
        </Space>
      </Layout.Header>

      <Layout.Content
        className={styles.main}
        style={{ background: token.colorBgLayout }}
      >
        <div className={styles.viewToggleSection}>
          <Tabs
            activeKey={viewMode}
            onChange={(key) => setViewMode(key as ViewMode)}
            items={tabItems}
            size="large"
          />
        </div>

        <Spin spinning={isLoading}>
          {viewMode === "table" && (
            <section className={styles.section}>
              <SummaryCards data={filteredData} timePeriod={timePeriod} />
            </section>
          )}

          <section className={styles.contentSection}>
            {viewMode === "table" && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Space size="middle" align="center">
                    <Typography.Text strong>조회 기간:</Typography.Text>
                    <RangePicker
                      value={dateRange}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setDateRange([dates[0], dates[1]]);
                        }
                      }}
                      format="YYYY-MM-DD"
                      style={{ width: 280 }}
                    />
                  </Space>
                </div>
                <CustomerTable
                  data={filteredData}
                  timePeriod={timePeriod}
                  loading={isLoading}
                />
              </>
            )}
            {viewMode === "pipeline" && (
              <PipelineBoard data={filteredData} timePeriod={timePeriod} />
            )}
            {viewMode === "chart" && (
              <Charts data={filteredData} timePeriod={timePeriod} />
            )}
            {viewMode === "timeline" && (
              <MBMTimeline
                data={filteredData}
                timePeriod={timePeriod}
                filters={filterControls}
              />
            )}
            {viewMode === "activity" && (
              <CustomerActivityAnalysis
                data={filteredData}
                timePeriod={timePeriod}
                filters={filterControls}
              />
            )}
          </section>
        </Spin>
      </Layout.Content>
    </Layout>
  );
}

function App() {
  const [isDark, setIsDark] = useState(true);

  const handleToggleTheme = (checked: boolean) => {
    setIsDark(checked);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AppContent isDark={isDark} onToggleTheme={handleToggleTheme} />
    </ConfigProvider>
  );
}

export default App;
