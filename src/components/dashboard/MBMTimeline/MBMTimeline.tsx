import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Phone,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  AlertCircle,
  Eye,
  Zap,
  Filter,
  BookOpen,
  Calendar,
  Building2,
  User,
  CalendarDays,
  Banknote,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Text, Badge, Card, Modal, Drawer } from "@/components/common/atoms";
import {
  Customer,
  ContentEngagement,
  SalesAction,
  Possibility,
} from "@/types/customer";
import { formatCurrency } from "@/data/mockData";
import type { TimePeriod } from "@/App";
import styles from "./index.module.scss";

interface MBMTimelineProps {
  data: Customer[];
  timePeriod: TimePeriod;
  filters?: ReactNode;
}

// 넛지 타입 정의
type NudgeType = "contact" | "interest" | "action" | null;

// 필터 옵션
const FILTER_OPTIONS = [
  { value: "all", label: "전체", icon: null, color: null },
  { value: "contact", label: "컨택 필요", icon: Zap, color: "green" },
  { value: "interest", label: "관심 필요", icon: Eye, color: "blue" },
  { value: "action", label: "액션 권장", icon: AlertCircle, color: "orange" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

type MBMEvent = {
  date: string;
  label: string;
  topic: string;
  description: string;
};

// MBM 이벤트 목록 (attendance 키와 매핑)
const MBM_EVENTS: Record<string, MBMEvent> = {
  "1107": {
    date: "2024-11-07",
    label: "11/7 MBM",
    topic: "HR Tech 트렌드와 채용 자동화",
    description:
      "최신 HR Tech 동향과 영상면접 큐레이터/역검 활용 사례를 공유하는 분기 세미나",
  },
  "1218": {
    date: "2024-12-18",
    label: "12/18 MBM",
    topic: "영상면접 고도화 & 리텐션 전략",
    description: "영상면접 큐레이터 고도화 기능 소개와 리텐션/재계약 사례 공유",
  },
  "0112": {
    date: "2025-01-12",
    label: "1/12 MBM",
    topic: "공공/교육 시장 사례 집중 공유",
    description: "공공·교육 고객의 평가 표준화 및 보안 요구 대응 사례",
  },
  "0116": {
    date: "2025-01-16",
    label: "1/16 MBM",
    topic: "AI 면접 신뢰도와 평가 자동화",
    description:
      "AI 면접의 신뢰도 개선 로드맵과 평가 자동화 워크플로우 데모 세션",
  },
};

// 주간 타임라인 정보 (월요일 기준)
const WEEKS = [
  {
    key: "1104",
    label: "11월 1주",
    range: "11/4~10",
    startDate: "2024-11-04",
    endDate: "2024-11-10",
    isCurrent: false,
  },
  {
    key: "1111",
    label: "11월 2주",
    range: "11/11~17",
    startDate: "2024-11-11",
    endDate: "2024-11-17",
    isCurrent: false,
  },
  {
    key: "1118",
    label: "11월 3주",
    range: "11/18~24",
    startDate: "2024-11-18",
    endDate: "2024-11-24",
    isCurrent: false,
  },
  {
    key: "1125",
    label: "11월 4주",
    range: "11/25~12/1",
    startDate: "2024-11-25",
    endDate: "2024-12-01",
    isCurrent: false,
  },
  {
    key: "1202",
    label: "12월 1주",
    range: "12/2~8",
    startDate: "2024-12-02",
    endDate: "2024-12-08",
    isCurrent: false,
  },
  {
    key: "1209",
    label: "12월 2주",
    range: "12/9~15",
    startDate: "2024-12-09",
    endDate: "2024-12-15",
    isCurrent: true,
  },
  {
    key: "1216",
    label: "12월 3주",
    range: "12/16~22",
    startDate: "2024-12-16",
    endDate: "2024-12-22",
    isCurrent: false,
  },
  {
    key: "1223",
    label: "12월 4주",
    range: "12/23~29",
    startDate: "2024-12-23",
    endDate: "2024-12-29",
    isCurrent: false,
  },
] as const;

type WeekKey = (typeof WEEKS)[number]["key"];

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
const findWeekForAction = (dateStr: string): WeekKey | null => {
  const actionDate = new Date(dateStr);

  for (const week of WEEKS) {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    end.setHours(23, 59, 59); // 해당 주 끝까지 포함

    if (actionDate >= start && actionDate <= end) {
      return week.key;
    }
  }

  // 범위 밖인 경우
  const firstWeekStart = new Date(WEEKS[0].startDate);
  if (actionDate < firstWeekStart) {
    return WEEKS[0].key;
  }
  return WEEKS[WEEKS.length - 1].key;
};

// 신뢰레벨에 따른 색상
const getTrustLevelVariant = (
  level: string | null
): "success" | "warning" | "error" | "default" => {
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

// 컨텐츠 카테고리 레이블
const CONTENT_CATEGORY_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  TOFU: { label: "인지 단계", color: "blue" },
  MOFU: { label: "고려 단계", color: "purple" },
  BOFU: { label: "결정 단계", color: "green" },
};

// 컨텐츠 모달에 표시할 정보
interface ContentModalData {
  customer: Customer;
  weekLabel: string;
  weekRange: string;
  startDate: string;
  endDate: string;
  trustChange: number;
}

// 영업 액션 모달에 표시할 정보
interface ActionModalData {
  customer: Customer;
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

export const MBMTimeline = ({
  data,
  timePeriod: _timePeriod,
  filters,
}: MBMTimelineProps) => {
  void _timePeriod; // 향후 사용 예정
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [modalData, setModalData] = useState<ContentModalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionModalData, setActionModalData] =
    useState<ActionModalData | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Customer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [nudgeModalData, setNudgeModalData] = useState<{
    customer: Customer;
    nudgeType: Exclude<NudgeType, null>;
    trustChange: number | null;
    hasActionAfterMBM: boolean;
    lastMBM:
      | {
          key: string;
          label: string;
          date: string;
        }
      | null;
  } | null>(null);
  const [isMBMModalOpen, setIsMBMModalOpen] = useState(false);
  const [mbmModalData, setMbmModalData] = useState<{
    key: string;
    event: MBMEvent;
  } | null>(null);

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

  // 모달 열기
  const openContentModal = (
    customer: Customer,
    week: (typeof WEEKS)[number],
    trustChange: number
  ) => {
    setModalData({
      customer,
      weekLabel: week.label,
      weekRange: week.range,
      startDate: week.startDate,
      endDate: week.endDate,
      trustChange,
    });
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeContentModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  // 액션 모달 열기
  const openActionModal = (
    customer: Customer,
    action: SalesAction,
    weekLabel: string
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
      customer,
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

  // 기업 상세 드로어 열기
  const openCompanyDrawer = (customer: Customer) => {
    setSelectedCompany(customer);
    setIsDrawerOpen(true);
  };

  // 기업 상세 드로어 닫기
  const closeCompanyDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedCompany(null);
  };

  // hDot이 true인 고객만 필터링 (신뢰지수가 있는 고객)
  const baseData = useMemo(() => {
    return data.filter((customer) => customer.hDot && customer.trustHistory);
  }, [data]);

  // 각 고객의 주간별 액션 매핑
  const getActionsForWeek = (customer: Customer, weekKey: WeekKey) => {
    if (!customer.salesActions) return [];

    return customer.salesActions.filter((action) => {
      const actionWeekKey = findWeekForAction(action.date);
      return actionWeekKey === weekKey;
    });
  };

  // 신뢰지수 변화 계산
  const getTrustChange = (
    customer: Customer,
    weekKey: WeekKey,
    index: number
  ) => {
    if (!customer.trustHistory || index === 0) return null;

    const currentData = customer.trustHistory[weekKey];
    const prevKey = WEEKS[index - 1].key;
    const prevData = customer.trustHistory[prevKey];

    if (!currentData || !prevData) return null;

    const change = currentData.trustIndex - prevData.trustIndex;
    return change;
  };

  // 마지막 참석 MBM 인덱스 찾기
  const getLastAttendedMBMWeekIndex = (customer: Customer): number => {
    let lastIndex = -1;

    WEEKS.forEach((week, index) => {
      const mbmEvent = getMBMForWeek(week.startDate, week.endDate);
      if (
        mbmEvent &&
        customer.attendance?.[mbmEvent.key as keyof typeof customer.attendance]
      ) {
        lastIndex = index;
      }
    });

    return lastIndex;
  };

  // MBM 이후 신뢰지수 변화량 계산
  const getTrustChangeAfterMBM = (customer: Customer): number | null => {
    const lastMBMIndex = getLastAttendedMBMWeekIndex(customer);
    if (lastMBMIndex === -1 || !customer.trustHistory) return null;

    const mbmWeekKey = WEEKS[lastMBMIndex].key;
    const currentWeekIndex = WEEKS.findIndex((w) => w.isCurrent);
    const currentWeekKey = WEEKS[currentWeekIndex].key;

    const mbmTrust = customer.trustHistory[mbmWeekKey];
    const currentTrust = customer.trustHistory[currentWeekKey];

    if (!mbmTrust || !currentTrust) return null;

    return currentTrust.trustIndex - mbmTrust.trustIndex;
  };

  // MBM 이후 액션이 있는지 확인
  const hasActionAfterMBM = (customer: Customer): boolean => {
    const lastMBMIndex = getLastAttendedMBMWeekIndex(customer);
    if (lastMBMIndex === -1) return true;

    const currentWeekIndex = WEEKS.findIndex((w) => w.isCurrent);

    for (let i = lastMBMIndex + 1; i <= currentWeekIndex; i++) {
      const actions = getActionsForWeek(customer, WEEKS[i].key);
      if (actions.length > 0) return true;
    }

    return false;
  };

  const getLastAttendedMBMEvent = (customer: Customer) => {
    let last: { key: string; label: string; date: string } | null = null;

    WEEKS.forEach((week) => {
      const mbmEvent = getMBMForWeek(week.startDate, week.endDate);
      if (
        mbmEvent &&
        customer.attendance?.[mbmEvent.key as keyof typeof customer.attendance]
      ) {
        last = { key: mbmEvent.key, ...MBM_EVENTS[mbmEvent.key] };
      }
    });

    return last;
  };

  // 넛지 타입 결정
  const getNudgeType = (customer: Customer): NudgeType => {
    const lastMBMIndex = getLastAttendedMBMWeekIndex(customer);
    if (lastMBMIndex === -1) return null;

    const trustChange = getTrustChangeAfterMBM(customer);
    const hasAction = hasActionAfterMBM(customer);

    // 우선순위: 컨택 필요 > 관심 필요 > 액션 권장
    if (trustChange !== null && trustChange >= 10) {
      return "contact"; // 신뢰도 10 이상 상승 → 컨택 필요
    }

    if (trustChange !== null && trustChange > 0) {
      return "interest"; // 신뢰도 상승 → 관심 필요
    }

    if (!hasAction) {
      return "action"; // 액션 없음 → 액션 권장
    }

    return null;
  };

  const openNudgeReasonModal = (customer: Customer) => {
    const nudgeType = getNudgeType(customer);
    if (!nudgeType) return;
    const trustChange = getTrustChangeAfterMBM(customer);
    const lastMBM = getLastAttendedMBMEvent(customer);
    const hasAction = hasActionAfterMBM(customer);

    setNudgeModalData({
      customer,
      nudgeType,
      trustChange,
      lastMBM,
      hasActionAfterMBM: hasAction,
    });
    setIsNudgeModalOpen(true);
  };

  const closeNudgeReasonModal = () => {
    setIsNudgeModalOpen(false);
    setNudgeModalData(null);
  };

  const openMBMInfoModal = (eventKey: string) => {
    const event = MBM_EVENTS[eventKey];
    if (!event) return;
    setMbmModalData({ key: eventKey, event });
    setIsMBMModalOpen(true);
  };

  const closeMBMInfoModal = () => {
    setIsMBMModalOpen(false);
    setMbmModalData(null);
  };

  // 필터 적용된 데이터
  const filteredData = useMemo(() => {
    if (activeFilter === "all") return baseData;
    return baseData.filter(
      (customer) => getNudgeType(customer) === activeFilter
    );
  }, [baseData, activeFilter]);

  // 각 넛지 타입별 고객 수
  const nudgeCounts = useMemo(() => {
    return {
      all: baseData.length,
      contact: baseData.filter((c) => getNudgeType(c) === "contact").length,
      interest: baseData.filter((c) => getNudgeType(c) === "interest").length,
      action: baseData.filter((c) => getNudgeType(c) === "action").length,
    };
  }, [baseData]);

  return (
    <div className={styles.container}>
      {/* 필터 */}
      <div className={styles.filterBar}>
        <div className={styles.filterLabel}>
          <Filter size={14} />
          <Text variant="label" color="tertiary">
            필터
          </Text>
        </div>
        <div className={styles.filterControls}>
          {filters && <div className={styles.externalFilters}>{filters}</div>}
          <div className={styles.filterButtons}>
            {FILTER_OPTIONS.map((option) => {
              const Icon = option.icon;
              const count = nudgeCounts[option.value];
              const isActive = activeFilter === option.value;

              return (
                <button
                  key={option.value}
                  className={`${styles.filterButton} ${
                    isActive ? styles.active : ""
                  } ${option.color ? styles[`filter_${option.color}`] : ""}`}
                  onClick={() => setActiveFilter(option.value)}
                >
                  {Icon && <Icon size={12} />}
                  <span>{option.label}</span>
                  <span className={styles.filterCount}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 헤더: 주간 타임라인 */}
      <div className={styles.header}>
        <div className={styles.companyHeader}>
          <Text variant="label" color="tertiary">
            기업명
          </Text>
        </div>
        <div className={styles.timelineHeader}>
          {WEEKS.map((week) => {
            const mbmEvent = getMBMForWeek(week.startDate, week.endDate);
            const hasMBM = !!mbmEvent;

            return (
              <div
                key={week.key}
                className={`${styles.weekColumn} ${
                  hasMBM ? styles.mbmWeek : ""
                } ${week.isCurrent ? styles.currentWeek : ""}`}
              >
                <Text
                  variant="label"
                  weight="semibold"
                  color={
                    hasMBM ? "accent" : week.isCurrent ? "success" : "secondary"
                  }
                >
                  {week.label}
                </Text>
                <Text variant="caption" color={hasMBM ? "accent" : "tertiary"}>
                  {week.range}
                </Text>
                {hasMBM && mbmEvent && (
                  <div className={styles.mbmBadge}>
                    <Star size={10} />
                    <Text variant="caption" weight="semibold" color="accent">
                      {mbmEvent.label}
                    </Text>
                  </div>
                )}
                {week.isCurrent && (
                  <Badge variant="success" size="sm">
                    현재
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 고객별 타임라인 */}
      <div className={styles.timeline}>
        {filteredData.map((customer) => {
          const nudgeType = getNudgeType(customer);
          const trustChangeAfterMBM = getTrustChangeAfterMBM(customer);

          return (
            <Card
              key={customer.no}
              className={`${styles.customerRow} ${
                nudgeType ? styles[`nudge_${nudgeType}`] : ""
              }`}
              padding="none"
            >
              {/* 기업 정보 */}
              <div className={styles.companyInfo}>
                <div className={styles.companyMain}>
                  <div className={styles.companyNameRow}>
                    <button
                      className={styles.companyNameButton}
                      onClick={() => openCompanyDrawer(customer)}
                      title="클릭하여 상세 정보 보기"
                    >
                      <Text variant="body-sm" weight="semibold">
                        {customer.companyName}
                      </Text>
                    </button>
                    {nudgeType === "contact" && (
                      <button
                        type="button"
                        className={styles.contactBadge}
                        title={`MBM 이후 신뢰지수 +${trustChangeAfterMBM} 상승! 지금 컨택하세요`}
                        onClick={() => openNudgeReasonModal(customer)}
                      >
                        <Zap size={12} />
                        <Text variant="caption" weight="semibold">
                          컨택 필요
                        </Text>
                      </button>
                    )}
                    {nudgeType === "interest" && (
                      <button
                        type="button"
                        className={styles.interestBadge}
                        title={`MBM 이후 신뢰지수 +${trustChangeAfterMBM} 상승`}
                        onClick={() => openNudgeReasonModal(customer)}
                      >
                        <Eye size={12} />
                        <Text variant="caption" weight="semibold">
                          관심 필요
                        </Text>
                      </button>
                    )}
                    {nudgeType === "action" && (
                      <button
                        type="button"
                        className={styles.actionBadge}
                        title="MBM 참석 이후 팔로업 액션이 없습니다"
                        onClick={() => openNudgeReasonModal(customer)}
                      >
                        <AlertCircle size={12} />
                        <Text variant="caption" weight="semibold">
                          액션 권장
                        </Text>
                      </button>
                    )}
                  </div>
                  <div className={styles.companyMeta}>
                    <Badge
                      variant={getTrustLevelVariant(customer.trustLevel)}
                      size="sm"
                    >
                      {customer.trustLevel || "-"}
                    </Badge>
                    <Text variant="caption" color="tertiary">
                      {customer.manager}
                    </Text>
                  </div>
                </div>
                <div className={styles.currentTrust}>
                  <Text variant="caption" color="tertiary">
                    현재
                  </Text>
                  <Text variant="h4" weight="bold" color="primary" mono>
                    {customer.trustIndex ?? "-"}
                  </Text>
                </div>
              </div>

              {/* 주간 타임라인 셀 */}
              <div className={styles.timelineCells}>
                {WEEKS.map((week, index) => {
                  const trustData = customer.trustHistory?.[week.key];
                  const actions = getActionsForWeek(customer, week.key);
                  const trustChange = getTrustChange(customer, week.key, index);
                  const mbmEvent = getMBMForWeek(week.startDate, week.endDate);
                  const hasMBM = !!mbmEvent;
                  // MBM이 있는 주에서 해당 MBM에 참석했는지 확인
                  const mbmAttended =
                    mbmEvent &&
                    customer.attendance?.[
                      mbmEvent.key as keyof typeof customer.attendance
                    ];
                  // 현재 주에만 넛지 표시
                  const showNudge = week.isCurrent && nudgeType;

                  return (
                    <div
                      key={week.key}
                      className={`${styles.cell} ${
                        hasMBM ? styles.mbmCell : ""
                      } ${week.isCurrent ? styles.currentCell : ""} ${
                        showNudge ? styles[`nudgeCell_${nudgeType}`] : ""
                      }`}
                    >
                      {/* 신뢰지수 */}
                      {trustData && (
                        <div className={styles.trustInfo}>
                          <div className={styles.trustIndex}>
                            <Text variant="body-sm" weight="semibold" mono>
                              {trustData.trustIndex}
                            </Text>
                            {trustChange !== null &&
                              trustChange !== 0 &&
                              (() => {
                                const weekContents =
                                  trustChange > 0
                                    ? getContentsForPeriod(
                                        customer,
                                        week.startDate,
                                        week.endDate
                                      )
                                    : [];
                                const hasContents = weekContents.length > 0;
                                return (
                                  <button
                                    className={`${styles.change} ${
                                      trustChange > 0 ? styles.up : styles.down
                                    } ${hasContents ? styles.clickable : ""}`}
                                    onClick={() =>
                                      hasContents &&
                                      openContentModal(
                                        customer,
                                        week,
                                        trustChange
                                      )
                                    }
                                    title={
                                      hasContents
                                        ? `클릭하여 ${weekContents.length}건의 컨텐츠 확인`
                                        : undefined
                                    }
                                  >
                                    {trustChange > 0 ? (
                                      <>
                                        <TrendingUp size={10} /> +{trustChange}
                                      </>
                                    ) : (
                                      <>
                                        <TrendingDown size={10} /> {trustChange}
                                      </>
                                    )}
                                  </button>
                                );
                              })()}
                            {trustChange === 0 && index > 0 && (
                              <span className={styles.noChange}>
                                <Minus size={10} />
                              </span>
                            )}
                          </div>
                          <Badge
                            variant={getTrustLevelVariant(trustData.trustLevel)}
                            size="sm"
                          >
                            {trustData.trustLevel}
                          </Badge>
                        </div>
                      )}

                      {/* MBM 참석 + 영업 액션 */}
                      {(mbmAttended || actions.length > 0) && (
                        <div className={styles.actions}>
                          {mbmAttended && mbmEvent && (
                            <button
                              type="button"
                              className={styles.mbmAction}
                              onClick={() => openMBMInfoModal(mbmEvent.key)}
                              title="클릭하여 MBM 정보를 확인"
                            >
                              <Star size={10} fill="currentColor" />
                              <div className={styles.mbmActionText}>
                                <Text variant="caption" weight="semibold">
                                  {mbmEvent.label} 참석
                                </Text>
                              </div>
                            </button>
                          )}
                          {actions.map((action, i) => (
                            <button
                              key={i}
                              className={`${styles.action} ${
                                styles[action.type]
                              }`}
                              onClick={() =>
                                openActionModal(customer, action, week.label)
                              }
                              title="클릭하여 상세 정보 확인"
                            >
                              {action.type === "call" ? (
                                <Phone size={10} />
                              ) : (
                                <Users size={10} />
                              )}
                              <Text
                                variant="caption"
                                className={styles.actionText}
                              >
                                {action.content.length > 15
                                  ? action.content.slice(0, 15) + "..."
                                  : action.content}
                              </Text>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 넛지 또는 데이터 없음 */}
                      {actions.length === 0 && !mbmAttended && showNudge && (
                        <div
                          className={`${styles.cellNudge} ${
                            styles[`cellNudge_${nudgeType}`]
                          }`}
                        >
                          {nudgeType === "contact" && (
                            <>
                              <Zap size={12} />
                              <Text variant="caption" weight="medium">
                                지금 컨택!
                              </Text>
                            </>
                          )}
                          {nudgeType === "interest" && (
                            <>
                              <Eye size={12} />
                              <Text variant="caption" weight="medium">
                                관심 필요
                              </Text>
                            </>
                          )}
                          {nudgeType === "action" && (
                            <>
                              <AlertCircle size={12} />
                              <Text variant="caption" weight="medium">
                                액션 권장
                              </Text>
                            </>
                          )}
                        </div>
                      )}
                      {actions.length === 0 &&
                        !mbmAttended &&
                        !showNudge &&
                        !trustData && (
                          <div className={styles.empty}>
                            <Text variant="caption" color="muted">
                              -
                            </Text>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 범례 */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <Star size={12} className={styles.legendMbm} fill="currentColor" />
          <Text variant="caption" color="tertiary">
            MBM 참석
          </Text>
        </div>
        <div className={styles.legendItem}>
          <Phone size={12} className={styles.legendCall} />
          <Text variant="caption" color="tertiary">
            콜
          </Text>
        </div>
        <div className={styles.legendItem}>
          <Users size={12} className={styles.legendMeeting} />
          <Text variant="caption" color="tertiary">
            미팅
          </Text>
        </div>
        <div className={styles.legendItem}>
          <Zap size={12} className={styles.legendContact} />
          <Text variant="caption" color="tertiary">
            컨택 필요 (+10↑)
          </Text>
        </div>
        <div className={styles.legendItem}>
          <Eye size={12} className={styles.legendInterest} />
          <Text variant="caption" color="tertiary">
            관심 필요 (상승)
          </Text>
        </div>
        <div className={styles.legendItem}>
          <AlertCircle size={12} className={styles.legendAction} />
          <Text variant="caption" color="tertiary">
            액션 권장
          </Text>
        </div>
      </div>

      {/* 컨텐츠 조회 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeContentModal}
        title={modalData ? `${modalData.customer.companyName}` : "조회 컨텐츠"}
        size="md"
      >
        {modalData &&
          (() => {
            const filteredContents = getContentsForPeriod(
              modalData.customer,
              modalData.startDate,
              modalData.endDate
            );
            return (
              <div className={styles.contentModal}>
                <div className={styles.contentHeader}>
                  <div className={styles.periodBadge}>
                    <Text variant="body-sm" weight="semibold">
                      {modalData.weekLabel}
                    </Text>
                    <Text variant="caption" color="tertiary">
                      ({modalData.weekRange})
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
                        +{modalData.trustChange}
                      </Text>
                    </div>
                  </div>
                  <Text variant="body-sm" color="secondary">
                    해당 기간 동안 조회한 컨텐츠로 신뢰지수가 상승했습니다.
                  </Text>
                </div>

                <div className={styles.contentList}>
                  {filteredContents.map((content, idx) => {
                    const categoryInfo = CONTENT_CATEGORY_LABELS[
                      content.category
                    ] || { label: content.category, color: "default" };
                    return (
                      <div key={idx} className={styles.contentItem}>
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
          })()}
      </Modal>

      {/* 영업 액션 상세 모달 */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={closeActionModal}
        title={
          actionModalData
            ? `${actionModalData.customer.companyName}`
            : "영업 액션"
        }
        size="sm"
      >
        {actionModalData && (
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
              <Text variant="body" weight="medium">
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
                <Text variant="body-sm">
                  {actionModalData.customer.manager}
                </Text>
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
                  actionModalData.prevCustomerResponse !==
                    actionModalData.action.customerResponse ? (
                    <>
                      <Badge
                        variant="default"
                        size="sm"
                        className={styles.pastValue}
                      >
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
                  actionModalData.prevTargetRevenue !==
                    actionModalData.action.targetRevenue ? (
                    <>
                      <Text
                        variant="body-sm"
                        color="tertiary"
                        className={styles.pastValue}
                      >
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
            </div>

            {/* 진행 상태 체크리스트 */}
            <div className={styles.progressChecklist}>
              <Text variant="caption" color="tertiary">
                진행 상태 변화
              </Text>
              <div className={styles.checklistItems}>
                <div
                  className={`${styles.checkItem} ${
                    actionModalData.action.test ? styles.checked : ""
                  } ${
                    !actionModalData.prevTest && actionModalData.action.test
                      ? styles.newlyChecked
                      : ""
                  }`}
                >
                  {actionModalData.action.test ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <Text variant="body-sm">테스트</Text>
                </div>
                <div
                  className={`${styles.checkItem} ${
                    actionModalData.action.quote ? styles.checked : ""
                  } ${
                    !actionModalData.prevQuote && actionModalData.action.quote
                      ? styles.newlyChecked
                      : ""
                  }`}
                >
                  {actionModalData.action.quote ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <Text variant="body-sm">견적</Text>
                </div>
                <div
                  className={`${styles.checkItem} ${
                    actionModalData.action.approval ? styles.checked : ""
                  } ${
                    !actionModalData.prevApproval &&
                    actionModalData.action.approval
                      ? styles.newlyChecked
                      : ""
                  }`}
                >
                  {actionModalData.action.approval ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <Text variant="body-sm">품의</Text>
                </div>
                <div
                  className={`${styles.checkItem} ${
                    actionModalData.action.contract ? styles.checked : ""
                  } ${
                    !actionModalData.prevContract &&
                    actionModalData.action.contract
                      ? styles.newlyChecked
                      : ""
                  }`}
                >
                  {actionModalData.action.contract ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <Text variant="body-sm">계약</Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 넛지 이유 모달 */}
      <Modal
        isOpen={isNudgeModalOpen}
        onClose={closeNudgeReasonModal}
        title={
          nudgeModalData
            ? `${nudgeModalData.customer.companyName} · 넛지 이유`
            : "넛지 이유"
        }
        size="sm"
      >
        {nudgeModalData && (
          <div className={styles.nudgeModal}>
            <div className={styles.nudgeBadgeRow}>
              {nudgeModalData.nudgeType === "contact" && (
                <div className={styles.contactBadge}>
                  <Zap size={12} />
                  <Text variant="caption" weight="semibold">
                    컨택 필요
                  </Text>
                </div>
              )}
              {nudgeModalData.nudgeType === "interest" && (
                <div className={styles.interestBadge}>
                  <Eye size={12} />
                  <Text variant="caption" weight="semibold">
                    관심 필요
                  </Text>
                </div>
              )}
              {nudgeModalData.nudgeType === "action" && (
                <div className={styles.actionBadge}>
                  <AlertCircle size={12} />
                  <Text variant="caption" weight="semibold">
                    액션 권장
                  </Text>
                </div>
              )}
            </div>

            <div className={styles.nudgeReasons}>
              <Text variant="body-sm" weight="semibold">
                왜 이 넛지가 떴나요?
              </Text>
              <div className={styles.nudgeReasonList}>
                {nudgeModalData.lastMBM && (
                  <div className={styles.nudgeReasonItem}>
                    <Star size={12} />
                    <Text variant="body-sm">
                      마지막 MBM 참석: {nudgeModalData.lastMBM.label} (
                      {nudgeModalData.lastMBM.date})
                    </Text>
                  </div>
                )}

                {nudgeModalData.nudgeType === "contact" &&
                  typeof nudgeModalData.trustChange === "number" && (
                    <div className={styles.nudgeReasonItem}>
                      <Zap size={12} />
                      <Text variant="body-sm">
                        MBM 이후 신뢰지수 +{nudgeModalData.trustChange}p
                        상승(10p 이상) → 바로 컨택 추천
                      </Text>
                    </div>
                  )}

                {nudgeModalData.nudgeType === "interest" &&
                  typeof nudgeModalData.trustChange === "number" && (
                    <div className={styles.nudgeReasonItem}>
                      <Eye size={12} />
                      <Text variant="body-sm">
                        MBM 이후 신뢰지수가 +{nudgeModalData.trustChange}p
                        상승 → 관심도 상승으로 판단
                      </Text>
                    </div>
                  )}

                {nudgeModalData.nudgeType === "action" && (
                  <div className={styles.nudgeReasonItem}>
                    <AlertCircle size={12} />
                    <Text variant="body-sm">
                      MBM 이후 추가 팔로업 액션이 없습니다. 이번 주에 액션을
                      권장합니다.
                    </Text>
                  </div>
                )}

                {nudgeModalData.trustChange === null && (
                  <div className={styles.nudgeReasonItem}>
                    <Minus size={12} />
                    <Text variant="body-sm">
                      신뢰지수 변화 데이터가 부족해 기본 규칙으로 넛지를
                      표시했습니다.
                    </Text>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.nudgeMeta}>
              <div>
                <Text variant="caption" color="tertiary">
                  MBM 참석 이후 팔로업 액션
                </Text>
                <Badge
                  variant={nudgeModalData.hasActionAfterMBM ? "success" : "error"}
                  size="sm"
                >
                  {nudgeModalData.hasActionAfterMBM ? "있음" : "없음"}
                </Badge>
              </div>
              <div>
                <Text variant="caption" color="tertiary">
                  MBM 이후 신뢰지수 변화
                </Text>
                <Badge
                  variant={
                    nudgeModalData.trustChange && nudgeModalData.trustChange > 0
                      ? "success"
                      : "default"
                  }
                  size="sm"
                >
                  {nudgeModalData.trustChange !== null
                    ? `${nudgeModalData.trustChange > 0 ? "+" : ""}${
                        nudgeModalData.trustChange
                      }p`
                    : "데이터 없음"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MBM 상세 모달 */}
      <Modal
        isOpen={isMBMModalOpen}
        onClose={closeMBMInfoModal}
        title={
          mbmModalData
            ? `${mbmModalData.event.label} · MBM 상세`
            : "MBM 상세"
        }
        size="sm"
      >
        {mbmModalData && (
          <div className={styles.mbmModal}>
            <div className={styles.mbmModalHeader}>
              <div className={styles.mbmMeta}>
                <Badge variant="default" size="sm">
                  {mbmModalData.event.label}
                </Badge>
                <Text variant="body-sm" color="tertiary">
                  {mbmModalData.event.date}
                </Text>
              </div>
              <div className={styles.mbmTopic}>
                <Text variant="body-sm" weight="semibold">
                  주제: {mbmModalData.event.topic}
                </Text>
                <Text variant="caption" color="secondary">
                  {mbmModalData.event.description}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 기업 상세 정보 드로어 */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={closeCompanyDrawer}
        title={selectedCompany?.companyName}
        width="lg"
      >
        {selectedCompany && (
          <div className={styles.companyDrawer}>
            {/* 기본 정보 */}
            <section className={styles.drawerSection}>
              <Text
                variant="label"
                color="tertiary"
                className={styles.sectionTitle}
              >
                기본 정보
              </Text>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <Building2 size={14} />
                  <Text variant="caption" color="tertiary">
                    기업 규모
                  </Text>
                  <Badge variant="default" size="sm">
                    {selectedCompany.companySize || "-"}
                  </Badge>
                </div>
                <div className={styles.infoItem}>
                  <Target size={14} />
                  <Text variant="caption" color="tertiary">
                    카테고리
                  </Text>
                  <Text variant="body-sm">{selectedCompany.category}</Text>
                </div>
                <div className={styles.infoItem}>
                  <User size={14} />
                  <Text variant="caption" color="tertiary">
                    담당자
                  </Text>
                  <Text variant="body-sm">{selectedCompany.manager}</Text>
                </div>
                <div className={styles.infoItem}>
                  <CalendarDays size={14} />
                  <Text variant="caption" color="tertiary">
                    재계약일
                  </Text>
                  <Text variant="body-sm">
                    {selectedCompany.renewalDate || "-"}
                  </Text>
                </div>
                <div className={styles.infoItem}>
                  <Banknote size={14} />
                  <Text variant="caption" color="tertiary">
                    계약금액
                  </Text>
                  <Text variant="body-sm" weight="semibold">
                    {formatCurrency(selectedCompany.contractAmount)}
                  </Text>
                </div>
                <div className={styles.infoItem}>
                  <Star size={14} />
                  <Text variant="caption" color="tertiary">
                    사용 제품
                  </Text>
                  <Text variant="body-sm">{selectedCompany.productUsage}</Text>
                </div>
              </div>
            </section>

            {/* 신뢰 지표 */}
            <section className={styles.drawerSection}>
              <Text
                variant="label"
                color="tertiary"
                className={styles.sectionTitle}
              >
                신뢰 지표
              </Text>
              <div className={styles.trustStats}>
                <div className={styles.trustStatCard}>
                  <Text variant="caption" color="tertiary">
                    신뢰지수
                  </Text>
                  <Text variant="h3" weight="bold" mono>
                    {selectedCompany.trustIndex ?? "-"}
                  </Text>
                </div>
                <div className={styles.trustStatCard}>
                  <Text variant="caption" color="tertiary">
                    신뢰레벨
                  </Text>
                  <Badge
                    variant={getTrustLevelVariant(selectedCompany.trustLevel)}
                    size="md"
                  >
                    {selectedCompany.trustLevel || "-"}
                  </Badge>
                </div>
                <div className={styles.trustStatCard}>
                  <Text variant="caption" color="tertiary">
                    변화량
                  </Text>
                  <div className={styles.changeIndicator}>
                    {selectedCompany.changeDirection === "up" ? (
                      <>
                        <TrendingUp size={16} className={styles.upIcon} />
                        <Text variant="h4" weight="bold" color="success">
                          +{selectedCompany.changeAmount}
                        </Text>
                      </>
                    ) : selectedCompany.changeDirection === "down" ? (
                      <>
                        <TrendingDown size={16} className={styles.downIcon} />
                        <Text variant="h4" weight="bold" color="error">
                          -{selectedCompany.changeAmount}
                        </Text>
                      </>
                    ) : (
                      <Text variant="h4" weight="bold" color="tertiary">
                        -
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 영업 파이프라인 */}
            <section className={styles.drawerSection}>
              <Text
                variant="label"
                color="tertiary"
                className={styles.sectionTitle}
              >
                영업 파이프라인
              </Text>
              <div className={styles.pipelineCards}>
                {/* 신뢰형성 */}
                <div className={styles.pipelineCard}>
                  <div className={styles.pipelineHeader}>
                    <Text variant="body-sm" weight="semibold">
                      신뢰형성
                    </Text>
                    <Badge
                      variant={
                        selectedCompany.trustFormation.customerResponse === "상"
                          ? "success"
                          : selectedCompany.trustFormation.customerResponse ===
                            "중"
                          ? "warning"
                          : "error"
                      }
                      size="sm"
                    >
                      {selectedCompany.trustFormation.customerResponse}
                    </Badge>
                  </div>
                  <Text variant="caption" color="secondary">
                    {selectedCompany.trustFormation.detail}
                  </Text>
                  {selectedCompany.trustFormation.interestFunction && (
                    <div className={styles.interestTag}>
                      <Text variant="caption" color="accent">
                        관심: {selectedCompany.trustFormation.interestFunction}
                      </Text>
                    </div>
                  )}
                </div>

                {/* 가치인식 */}
                <div className={styles.pipelineCard}>
                  <div className={styles.pipelineHeader}>
                    <Text variant="body-sm" weight="semibold">
                      가치인식
                    </Text>
                    <Badge variant="info" size="sm">
                      {selectedCompany.valueRecognition.possibility}
                    </Badge>
                  </div>
                  <div className={styles.checkList}>
                    <div
                      className={`${styles.checkItem} ${
                        selectedCompany.valueRecognition.test
                          ? styles.checked
                          : ""
                      }`}
                    >
                      {selectedCompany.valueRecognition.test ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      <Text variant="caption">테스트</Text>
                    </div>
                    <div
                      className={`${styles.checkItem} ${
                        selectedCompany.valueRecognition.quote
                          ? styles.checked
                          : ""
                      }`}
                    >
                      {selectedCompany.valueRecognition.quote ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      <Text variant="caption">견적</Text>
                    </div>
                    <div
                      className={`${styles.checkItem} ${
                        selectedCompany.valueRecognition.approval
                          ? styles.checked
                          : ""
                      }`}
                    >
                      {selectedCompany.valueRecognition.approval ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      <Text variant="caption">품의</Text>
                    </div>
                    <div
                      className={`${styles.checkItem} ${
                        selectedCompany.valueRecognition.contract
                          ? styles.checked
                          : ""
                      }`}
                    >
                      {selectedCompany.valueRecognition.contract ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      <Text variant="caption">계약</Text>
                    </div>
                  </div>
                </div>

                {/* 도입결정 */}
                <div className={styles.pipelineCard}>
                  <div className={styles.pipelineHeader}>
                    <Text variant="body-sm" weight="semibold">
                      도입결정
                    </Text>
                    <Badge variant="info" size="sm">
                      {selectedCompany.adoptionDecision.possibility}
                    </Badge>
                  </div>
                  {selectedCompany.adoptionDecision.targetRevenue && (
                    <Text variant="body-sm" weight="semibold" color="success">
                      목표:{" "}
                      {formatCurrency(
                        selectedCompany.adoptionDecision.targetRevenue
                      )}
                    </Text>
                  )}
                  {selectedCompany.adoptionDecision.targetDate && (
                    <Text variant="caption" color="tertiary">
                      예상 시기: {selectedCompany.adoptionDecision.targetDate}
                    </Text>
                  )}
                </div>
              </div>
            </section>

            {/* 영업 액션 히스토리 */}
            <section className={styles.drawerSection}>
              <Text
                variant="label"
                color="tertiary"
                className={styles.sectionTitle}
              >
                영업 액션 ({selectedCompany.salesActions?.length || 0}건)
              </Text>
              <div className={styles.actionHistory}>
                {selectedCompany.salesActions?.map((action, idx) => (
                  <div key={idx} className={styles.actionHistoryItem}>
                    <div
                      className={`${styles.actionIcon} ${styles[action.type]}`}
                    >
                      {action.type === "call" ? (
                        <Phone size={12} />
                      ) : (
                        <Users size={12} />
                      )}
                    </div>
                    <div className={styles.actionDetails}>
                      <Text variant="body-sm">{action.content}</Text>
                      <Text variant="caption" color="tertiary">
                        {action.date}
                      </Text>
                    </div>
                  </div>
                ))}
                {(!selectedCompany.salesActions ||
                  selectedCompany.salesActions.length === 0) && (
                  <Text variant="body-sm" color="tertiary">
                    등록된 액션이 없습니다.
                  </Text>
                )}
              </div>
            </section>

            {/* 컨텐츠 조회 기록 */}
            {selectedCompany.contentEngagements &&
              selectedCompany.contentEngagements.length > 0 && (
                <section className={styles.drawerSection}>
                  <Text
                    variant="label"
                    color="tertiary"
                    className={styles.sectionTitle}
                  >
                    컨텐츠 조회 ({selectedCompany.contentEngagements.length}건)
                  </Text>
                  <div className={styles.contentHistory}>
                    {selectedCompany.contentEngagements.map((content, idx) => (
                      <div key={idx} className={styles.contentHistoryItem}>
                        <BookOpen size={12} />
                        <Text variant="caption">{content.title}</Text>
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
                          {content.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>
              )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
