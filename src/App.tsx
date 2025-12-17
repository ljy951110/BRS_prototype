import { Charts } from "@/components/dashboard/Charts";
import { CustomerActivityAnalysis } from "@/components/dashboard/CustomerActivityAnalysis";
import { CustomerTable } from "@/components/dashboard/CustomerTable";
import { MBMTimeline } from "@/components/dashboard/MBMTimeline";
import { PipelineBoard } from "@/components/dashboard/PipelineBoard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import type {
  Category,
  CompanySize,
  DashboardTableRequest,
  Possibility,
  ProgressStage as ProgressStageType,
} from "@/repository/openapi/model";
import { ProgressStage } from "@/repository/openapi/model";
import { useGetDashboardCompanies, useGetFilterOptions } from "@/repository/query/dashboardApiController/queryHook";
import { TimePeriodType } from "@/types/common";
import {
  CategoryType,
  ChangeDirectionType,
  CompanySizeType,
  Customer,
  PossibilityType,
  TrustLevelType
} from "@/types/customer";
import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SearchOutlined,
  TableOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
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

const PROGRESS_STAGE_MAP: Record<ProgressStatus, ProgressStageType | null> = {
  all: null,
  test: ProgressStage.TEST,
  quote: ProgressStage.QUOTE,
  approval: ProgressStage.APPROVAL,
  contract: ProgressStage.CONTRACT,
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

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  // dateRange 변경 시에도 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange]);

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
      filters.categories = [currentFilters.selectedCategory as Category];
    }
    if (currentFilters.selectedCompanySize !== "all") {
      filters.companySizes = [currentFilters.selectedCompanySize as CompanySize];
    }
    if (currentFilters.selectedPossibility !== "all") {
      filters.possibilities = [currentFilters.selectedPossibility as Possibility];
    }
    const stage = PROGRESS_STAGE_MAP[currentFilters.selectedProgress];
    if (stage) {
      filters.stages = [stage];
    }

    return {
      dateRange: {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      },
      search:
        currentFilters.searchQuery.trim().length > 0
          ? { companyName: currentFilters.searchQuery.trim() }
          : undefined,
      filters: Object.keys(filters).length ? filters : undefined,
      pagination: { page: currentPage, pageSize },
    };
  }, [currentFilters, dateRange, currentPage, pageSize]);

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

  // 필터 옵션 조회
  const { data: filterOptions } = useGetFilterOptions({
    enabled: mswReady,
  });

  // 테이블 데이터 조회
  const { data: apiData, isLoading } = useGetDashboardCompanies(requestBody, {
    staleTime: 60 * 1000,
    enabled: mswReady, // MSW 준비 후에만 쿼리 실행
  });

  // DashboardTableRow를 Customer로 변환
  const tableRows = useMemo(() => {
    if (!apiData?.data?.rows) return [];

    return apiData.data.rows.map((row) => {
      const current = row.current;
      const previous = row.previous;

      // 신뢰지수 변화 계산
      const currentTrust = current.trustIndex ?? 0;
      const previousTrust = previous.trustIndex ?? 0;
      const changeAmount = currentTrust - previousTrust;
      const changeDirection: ChangeDirectionType =
        changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'none';

      // 신뢰 레벨 계산 (P1: 80+, P2: 60-79, P3: 0-59)
      const getTrustLevel = (trust: number): TrustLevelType => {
        if (trust >= 80) return 'P1';
        if (trust >= 60) return 'P2';
        return 'P3';
      };

      // Category 매핑
      const mapCategory = (cat: string | null | undefined): CategoryType => {
        if (cat === 'recruit') return '채용';
        if (cat === 'public') return '공공';
        if (cat === 'performance') return '성과';
        return '채용'; // 기본값
      };

      return {
        no: row.companyId,
        companyName: row.companyName,
        companySize: row.companySize as CompanySizeType,
        category: mapCategory(row.category),
        productUsage: row.productUsage || [],
        manager: row.manager ?? '',
        renewalDate: null,
        contractAmount: row.contractAmount ?? null,
        hDot: false,
        trustLevel: getTrustLevel(currentTrust),
        trustIndex: currentTrust,
        changeAmount,
        changeDirection,
        rank: null,
        trustHistory: undefined,
        salesActions: [],
        contentEngagements: [],
        attendance: {},
        trustFormation: {
          customerResponse: '중',
          detail: '',
          targetDate: null,
          targetRevenueMin: null,
          targetRevenueMax: null,
          interestFunction: null,
        },
        valueRecognition: {
          customerResponse: '중',
          possibility: current.possibility as PossibilityType ?? '0%',
          targetRevenue: current.targetRevenue,
          targetDate: current.targetMonth ? `2024-${String(current.targetMonth).padStart(2, '0')}-01` : null,
          test: current.test ?? false,
          quote: current.quote ?? false,
          approval: current.approval ?? false,
          contract: current.contract ?? false,
          simulation: null,
        },
        adoptionDecision: {
          customerResponse: '중',
          possibility: current.possibility as PossibilityType ?? '0%',
          targetRevenue: current.targetRevenue,
          targetDate: current.targetMonth ? `2024-${String(current.targetMonth).padStart(2, '0')}-01` : null,
          test: current.test ?? false,
          quote: current.quote ?? false,
          approval: current.approval ?? false,
          contract: current.contract ?? false,
          simulation: null,
        },
        _periodData: {
          pastTrustIndex: previousTrust,
          pastPossibility: previous.possibility as PossibilityType ?? '0%',
          pastCustomerResponse: '중',
          pastTargetRevenue: previous.targetRevenue,
          pastTargetDate: previous.targetMonth ? `2024-${String(previous.targetMonth).padStart(2, '0')}-01` : null,
          pastTest: previous.test ?? false,
          pastQuote: previous.quote ?? false,
          pastApproval: previous.approval ?? false,
          pastContract: previous.contract ?? false,
          pastExpectedRevenue: previous.targetRevenue ?? 0,
          currentExpectedRevenue: current.targetRevenue ?? 0,
          possibilityChange: 'none',
          responseChange: 'none',
        },
      } as Customer;
    });
  }, [apiData?.data?.rows]);

  // 필터 옵션들 (API에서 가져옴)
  const managers = useMemo(
    () => filterOptions?.data?.managers ?? [],
    [filterOptions]
  );

  const categories = useMemo(
    () => filterOptions?.data?.categories ?? [],
    [filterOptions]
  );

  const companySizes = useMemo(
    () => filterOptions?.data?.companySizes ?? [],
    [filterOptions]
  );

  // 진행상태 "없음" 필터는 프론트에서 추가 처리
  const filteredData = useMemo(() => {
    if (currentFilters.selectedProgress === "none") {
      return tableRows.filter((customer: Customer) => {
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
            ...managers.map((m: string) => ({ value: m, label: m })),
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
            ...companySizes.map((size: CompanySize) => ({ value: size, label: size })),
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
            ...categories.map((c: Category) => ({ value: c, label: c })),
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
                    <Typography.Text strong>조회 기간</Typography.Text>
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
                  dateRange={{
                    startDate: dateRange[0].format('YYYY-MM-DD'),
                    endDate: dateRange[1].format('YYYY-MM-DD'),
                  }}
                  pagination={{
                    current: currentPage,
                    pageSize,
                    total: apiData?.data?.total ?? 0,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} / 전체 ${total}건`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    onChange: (page, newPageSize) => {
                      setCurrentPage(page);
                      if (newPageSize !== pageSize) {
                        setPageSize(newPageSize);
                        setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로
                      }
                    },
                  }}
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
