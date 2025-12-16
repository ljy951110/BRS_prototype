import { Charts } from "@/components/dashboard/Charts";
import { CustomerActivityAnalysis } from "@/components/dashboard/CustomerActivityAnalysis";
import { CustomerTable } from "@/components/dashboard/CustomerTable";
import { MBMTimeline } from "@/components/dashboard/MBMTimeline";
import { PipelineBoard } from "@/components/dashboard/PipelineBoard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { mockData } from "@/data/mockData";
import { Customer } from "@/types/customer";
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
  Input,
  Layout,
  Select,
  Space,
  Switch,
  Tabs,
  theme,
  Typography
} from "antd";
import { Activity, useMemo, useState } from "react";
import styles from "./App.module.scss";

type ViewMode = "table" | "pipeline" | "chart" | "timeline" | "activity";
export type TimePeriod = "1w" | "1m" | "6m" | "1y";

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

const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
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
    showCategory: true,
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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1w");

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

  // 고유 담당자 목록
  const managers = useMemo(
    () => [...new Set(mockData.map((c) => c.manager))].sort(),
    []
  );

  const categories = useMemo(
    () => [...new Set(mockData.map((c) => c.category))].sort(),
    []
  );

  const companySizes = useMemo(
    () => [...new Set(mockData.map((c) => c.companySize || "미정"))].sort(),
    []
  );

  // 필터링된 데이터 (현재 탭의 필터 사용)
  const filteredData = useMemo(() => {
    const {
      searchQuery,
      selectedManager,
      selectedCategory,
      selectedCompanySize,
      selectedPossibility,
      selectedProgress,
    } = currentFilters;

    return mockData.filter((customer: Customer) => {
      // 검색어 필터
      if (
        searchQuery &&
        !customer.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // 담당자 필터
      if (selectedManager !== "all" && customer.manager !== selectedManager) {
        return false;
      }
      // 카테고리 필터
      if (
        selectedCategory !== "all" &&
        customer.category !== selectedCategory
      ) {
        return false;
      }
      // 기업 규모 필터
      if (
        selectedCompanySize !== "all" &&
        (customer.companySize || "미정") !== selectedCompanySize
      ) {
        return false;
      }
      // 가능성 필터
      if (
        selectedPossibility !== "all" &&
        customer.adoptionDecision.possibility !== selectedPossibility
      ) {
        return false;
      }
      // 진행상태 필터
      if (selectedProgress !== "all") {
        const ad = customer.adoptionDecision;
        if (selectedProgress === "none") {
          // 아무 진행 상태도 없는 경우
          if (ad.test || ad.quote || ad.approval || ad.contract) {
            return false;
          }
        } else if (selectedProgress === "contract") {
          if (!ad.contract) return false;
        } else if (selectedProgress === "approval") {
          if (!ad.approval || ad.contract) return false;
        } else if (selectedProgress === "quote") {
          if (!ad.quote || ad.approval) return false;
        } else if (selectedProgress === "test") {
          if (!ad.test || ad.quote) return false;
        }
      }
      return true;
    });
  }, [currentFilters]);

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
          <Select
            value={timePeriod}
            onChange={(val) => setTimePeriod(val as TimePeriod)}
            options={TIME_PERIOD_OPTIONS}
            suffixIcon={<CalendarOutlined />}
            style={{ minWidth: 160 }}
          />
          <Tabs
            activeKey={viewMode}
            onChange={(key) => setViewMode(key as ViewMode)}
            items={tabItems}
            size="large"
          />
        </div>

        <Activity mode={viewMode === "table" ? "visible" : "hidden"}>
          <section className={styles.section}>
            <SummaryCards data={filteredData} timePeriod={timePeriod} />
          </section>
        </Activity>

        <section className={styles.contentSection}>
          <Activity mode={viewMode === "table" ? "visible" : "hidden"}>
            <CustomerTable data={filteredData} timePeriod={timePeriod} />
          </Activity>
          <Activity mode={viewMode === "pipeline" ? "visible" : "hidden"}>
            <PipelineBoard data={filteredData} timePeriod={timePeriod} />
          </Activity>
          <Activity mode={viewMode === "chart" ? "visible" : "hidden"}>
            <Charts data={filteredData} timePeriod={timePeriod} />
          </Activity>
          <Activity mode={viewMode === "timeline" ? "visible" : "hidden"}>
            <MBMTimeline
              data={filteredData}
              timePeriod={timePeriod}
              filters={filterControls}
            />
          </Activity>
          <Activity mode={viewMode === "activity" ? "visible" : "hidden"}>
            <CustomerActivityAnalysis
              data={filteredData}
              timePeriod={timePeriod}
              filters={filterControls}
            />
          </Activity>
        </section>
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
