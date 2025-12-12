import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Calendar,
  Activity,
} from "lucide-react";
import { Text, Card } from "@/components/common/atoms";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { CustomerTable } from "@/components/dashboard/CustomerTable";
import { PipelineBoard } from "@/components/dashboard/PipelineBoard";
import { Charts } from "@/components/dashboard/Charts";
import { MBMTimeline } from "@/components/dashboard/MBMTimeline";
import { CustomerActivityAnalysis } from "@/components/dashboard/CustomerActivityAnalysis";
import { mockData } from "@/data/mockData";
import { Customer } from "@/types/customer";
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
  selectedPossibility: string;
  selectedProgress: ProgressStatus;
}

type TabFilterState = Record<ViewMode, TabFilters>;

const DEFAULT_FILTERS: TabFilters = {
  searchQuery: "",
  selectedManager: "all",
  selectedCategory: "all",
  selectedPossibility: "all",
  selectedProgress: "all",
};

const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: "1w", label: "최근 1주일" },
  { value: "1m", label: "최근 1달" },
  { value: "6m", label: "최근 반기" },
  { value: "1y", label: "최근 1년" },
];

function App() {
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

  // 필터링된 데이터 (현재 탭의 필터 사용)
  const filteredData = useMemo(() => {
    const {
      searchQuery,
      selectedManager,
      selectedCategory,
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

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <BarChart3 size={24} />
            </div>
            <Text variant="h4">Bgent</Text>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.periodFilter}>
            <Calendar size={16} />
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className={styles.periodSelect}
            >
              {TIME_PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Text variant="body-sm" color="tertiary">
            마지막 업데이트: 2025.12.09
          </Text>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Summary Cards */}
        <section className={styles.section}>
          <SummaryCards data={filteredData} timePeriod={timePeriod} />
        </section>

        {/* Filters & View Toggle */}
        <section className={styles.filterSection}>
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="기업명 검색..."
                value={currentFilters.searchQuery}
                onChange={(e) =>
                  updateCurrentFilter("searchQuery", e.target.value)
                }
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <Filter size={16} />
              <select
                value={currentFilters.selectedManager}
                onChange={(e) =>
                  updateCurrentFilter("selectedManager", e.target.value)
                }
                className={styles.select}
              >
                <option value="all">전체 담당자</option>
                {managers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={currentFilters.selectedCategory}
                onChange={(e) =>
                  updateCurrentFilter("selectedCategory", e.target.value)
                }
                className={styles.select}
              >
                <option value="all">전체 카테고리</option>
                <option value="채용">채용</option>
                <option value="공공">공공</option>
                <option value="성과">성과</option>
              </select>

              <select
                value={currentFilters.selectedProgress}
                onChange={(e) =>
                  updateCurrentFilter(
                    "selectedProgress",
                    e.target.value as ProgressStatus
                  )
                }
                className={styles.select}
              >
                <option value="all">전체 진행상태</option>
                <option value="contract">계약 완료</option>
                <option value="approval">승인 단계</option>
                <option value="quote">견적 단계</option>
                <option value="test">테스트 단계</option>
                <option value="none">미진행</option>
              </select>
            </div>
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${
                viewMode === "table" ? styles.active : ""
              }`}
              onClick={() => setViewMode("table")}
            >
              <TableIcon size={18} />
              <span>테이블</span>
            </button>
            <button
              className={`${styles.viewBtn} ${
                viewMode === "timeline" ? styles.active : ""
              }`}
              onClick={() => setViewMode("timeline")}
            >
              <Calendar size={18} />
              <span>액션 타임라인</span>
            </button>
            <button
              className={`${styles.viewBtn} ${
                viewMode === "activity" ? styles.active : ""
              }`}
              onClick={() => setViewMode("activity")}
            >
              <Activity size={18} />
              <span>고객 활동 분석</span>
            </button>
            <button
              className={`${styles.viewBtn} ${
                viewMode === "pipeline" ? styles.active : ""
              }`}
              onClick={() => setViewMode("pipeline")}
            >
              <LayoutGrid size={18} />
              <span>딜</span>
            </button>
            <button
              className={`${styles.viewBtn} ${
                viewMode === "chart" ? styles.active : ""
              }`}
              onClick={() => setViewMode("chart")}
            >
              <BarChart3 size={18} />
              <span>차트</span>
            </button>
          </div>
        </section>

        {/* Content Area */}
        <section className={styles.contentSection}>
          {viewMode === "table" && (
            <CustomerTable data={filteredData} timePeriod={timePeriod} />
          )}
          {viewMode === "pipeline" && (
            <PipelineBoard data={filteredData} timePeriod={timePeriod} />
          )}
          {viewMode === "chart" && (
            <Charts data={filteredData} timePeriod={timePeriod} />
          )}
          {viewMode === "timeline" && (
            <MBMTimeline data={filteredData} timePeriod={timePeriod} />
          )}
          {viewMode === "activity" && (
            <CustomerActivityAnalysis
              data={filteredData}
              timePeriod={timePeriod}
            />
          )}
        </section>

        {/* Footer Stats */}
        <Card className={styles.footer} padding="sm">
          <Text variant="body-sm" color="secondary">
            총{" "}
            <Text as="span" weight="semibold" color="primary">
              {filteredData.length}
            </Text>
            개 고객 표시 중
            {currentFilters.selectedManager !== "all" &&
              ` · 담당자: ${currentFilters.selectedManager}`}
            {currentFilters.selectedCategory !== "all" &&
              ` · ${currentFilters.selectedCategory}`}
            {currentFilters.selectedPossibility !== "all" &&
              ` · ${currentFilters.selectedPossibility} 가능성`}
          </Text>
        </Card>
      </main>
    </div>
  );
}

export default App;
