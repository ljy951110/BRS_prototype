import { useMemo, useState } from 'react';
import { Activity, Eye, Users, ArrowUpDown, ArrowRight, TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Text, Card, Badge, Modal } from '@/components/common/atoms';
import { CompanyInfoCard } from '@/components/dashboard/CompanyInfoCard';
import { ContentInfoCard } from '@/components/dashboard/ContentInfoCard';
import { Customer } from '@/types/customer';
import type { TimePeriod } from '@/App';
import styles from './index.module.scss';

interface ContentAnalysisProps {
  data: Customer[];
  timePeriod: TimePeriod;
}

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  '1w': '1주일',
  '1m': '1개월',
  '6m': '6개월',
  '1y': '1년',
};

// 기간에 따른 일수
const PERIOD_DAYS: Record<TimePeriod, number> = {
  '1w': 7,
  '1m': 30,
  '6m': 180,
  '1y': 365,
};

// 콘텐츠 카테고리 색상
const CATEGORY_COLORS: Record<string, { bg: string; label: string; variant: 'info' | 'warning' | 'success' }> = {
  'TOFU': { bg: 'cyan', label: '인지 단계 (Top of Funnel)', variant: 'info' },
  'MOFU': { bg: 'purple', label: '고려 단계 (Middle of Funnel)', variant: 'warning' },
  'BOFU': { bg: 'green', label: '결정 단계 (Bottom of Funnel)', variant: 'success' },
};

// 카테고리 정렬 순서
const CATEGORY_ORDER: Record<string, number> = { 'TOFU': 1, 'MOFU': 2, 'BOFU': 3 };

// MBM 이벤트 정의 (액션 타임라인과 동일)
const MBM_EVENTS: Record<string, { date: string; label: string }> = {
  "1107": { date: "2024-11-07", label: "11/7 MBM 세미나" },
  "1218": { date: "2024-12-18", label: "12/18 후속 미팅" },
};

// 활동 탭 타입
type ActivityTab = 'content' | 'mbm';

// 콘텐츠 조회 기업 정보
interface ContentViewer {
  companyName: string;
  date: string;
  category: string;
  companySize: string | null;
  manager: string;
  contractAmount: number;
  targetRevenue: number;
  possibility: string;
  test: boolean;
  quote: boolean;
  approval: boolean;
  contract: boolean;
}

// 콘텐츠 통계 타입
interface ContentStat {
  title: string;
  category: 'TOFU' | 'MOFU' | 'BOFU';
  pastViews: number;        // 기간 시작 전 누적 조회수
  currentViews: number;     // 현재 누적 조회수
  periodViews: number;      // 기간 내 조회수 (currentViews - pastViews)
  viewers: ContentViewer[];  // 기간 내 조회자
  changeDirection: 'up' | 'down' | 'none';
  // 진행상태별 조회 기업 수
  progressCounts: {
    test: number;
    quote: number;
    approval: number;
    contract: number;
  };
}

// MBM 참석 기업 정보
interface MbmAttendee {
  companyName: string;
  category: string;
  companySize: string | null;
  manager: string;
  contractAmount: number;
  targetRevenue: number;
  possibility: string;
  test: boolean;
  quote: boolean;
  approval: boolean;
  contract: boolean;
}

// MBM 참석 통계 타입
interface MbmStat {
  key: string;            // MBM 이벤트 키 (예: "1107")
  title: string;          // MBM 이벤트 이름
  date: string;           // MBM 이벤트 날짜
  totalAttendees: number; // 총 참석자 수
  periodAttendees: number; // 기간 내 참석자 수 (기간에 해당 이벤트가 있으면 totalAttendees, 아니면 0)
  attendees: MbmAttendee[];  // 참석 기업 목록
  // 진행상태별 참석 기업 수
  progressCounts: {
    test: number;
    quote: number;
    approval: number;
    contract: number;
  };
}

// 정렬 필드 타입
type SortField = 'title' | 'category' | 'totalViews' | 'viewers' | 'type' | 'test' | 'quote' | 'approval' | 'contract';
type SortDirection = 'asc' | 'desc' | null;

export const CustomerActivityAnalysis = ({ data, timePeriod }: ContentAnalysisProps) => {
  const [activeTab, setActiveTab] = useState<ActivityTab>('content');
  const [selectedContent, setSelectedContent] = useState<ContentStat | null>(null);
  const [selectedMbm, setSelectedMbm] = useState<MbmStat | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'TOFU' | 'MOFU' | 'BOFU' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // 기간 내 콘텐츠 통계 계산
  const contentStats = useMemo(() => {
    const now = new Date('2024-12-10');
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - PERIOD_DAYS[timePeriod]);

    // 콘텐츠별 조회 데이터 수집 (전체 기간)
    const contentMap = new Map<string, ContentStat>();
    // 콘텐츠별 조회 기업 Set (중복 방지)
    const contentViewers = new Map<string, Set<string>>();

    data.forEach(customer => {
      if (!customer.contentEngagements) return;

      customer.contentEngagements.forEach(content => {
        const contentDate = new Date(content.date);
        if (contentDate > now) return; // 미래 데이터는 제외

        const key = content.title;
        if (!contentMap.has(key)) {
          contentMap.set(key, {
            title: content.title,
            category: content.category,
            pastViews: 0,
            currentViews: 0,
            periodViews: 0,
            viewers: [],
            changeDirection: 'none',
            progressCounts: { test: 0, quote: 0, approval: 0, contract: 0 },
          });
          contentViewers.set(key, new Set());
        }

        const stat = contentMap.get(key)!;
        const viewers = contentViewers.get(key)!;
        stat.currentViews++; // 현재까지 누적

        // 기간 시작 전 조회인지 확인
        if (contentDate < periodStart) {
          stat.pastViews++;
        } else {
          // 기간 내 조회
          stat.periodViews++;
          const adoption = customer.adoptionDecision;
          stat.viewers.push({
            companyName: customer.companyName,
            date: content.date,
            category: customer.category,
            companySize: customer.companySize,
            manager: customer.manager,
            contractAmount: customer.contractAmount ?? 0,
            targetRevenue: adoption?.targetRevenue ?? 0,
            possibility: adoption?.possibility ?? '0%',
            test: adoption?.test ?? false,
            quote: adoption?.quote ?? false,
            approval: adoption?.approval ?? false,
            contract: adoption?.contract ?? false,
          });

          // 진행상태별 기업 수 집계 (기간 내 조회 기업만, 중복 방지)
          if (!viewers.has(customer.companyName)) {
            viewers.add(customer.companyName);
            if (adoption) {
              if (adoption.contract) {
                stat.progressCounts.contract++;
              } else if (adoption.approval) {
                stat.progressCounts.approval++;
              } else if (adoption.quote) {
                stat.progressCounts.quote++;
              } else if (adoption.test) {
                stat.progressCounts.test++;
              }
            }
          }
        }
      });
    });

    // 변화 방향 계산
    contentMap.forEach(stat => {
      if (stat.periodViews > 0) {
        stat.changeDirection = 'up';
      } else {
        stat.changeDirection = 'none';
      }
    });

    // 기간 내 조회가 있는 콘텐츠만 반환 (또는 전체 반환)
    return Array.from(contentMap.values()).filter(s => s.periodViews > 0 || s.currentViews > 0);
  }, [data, timePeriod]);

  // 기간 내 MBM 참석 통계 계산 (attendance 데이터 사용)
  const mbmStats = useMemo(() => {
    const now = new Date('2024-12-10');
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - PERIOD_DAYS[timePeriod]);

    const results: MbmStat[] = [];

    // 각 MBM 이벤트별로 참석자 계산
    Object.entries(MBM_EVENTS).forEach(([key, event]) => {
      const eventDate = new Date(event.date);

      const attendees: MbmAttendee[] = [];
      const progressCounts = { test: 0, quote: 0, approval: 0, contract: 0 };
      
      data.forEach(customer => {
        if (customer.attendance && customer.attendance[key as keyof typeof customer.attendance]) {
          const adoption = customer.adoptionDecision;
          attendees.push({
            companyName: customer.companyName,
            category: customer.category,
            companySize: customer.companySize,
            manager: customer.manager,
            contractAmount: customer.contractAmount ?? 0,
            targetRevenue: adoption?.targetRevenue ?? 0,
            possibility: adoption?.possibility ?? '0%',
            test: adoption?.test ?? false,
            quote: adoption?.quote ?? false,
            approval: adoption?.approval ?? false,
            contract: adoption?.contract ?? false,
          });
          
          // 진행상태별 기업 수 집계
          if (adoption) {
            if (adoption.contract) {
              progressCounts.contract++;
            } else if (adoption.approval) {
              progressCounts.approval++;
            } else if (adoption.quote) {
              progressCounts.quote++;
            } else if (adoption.test) {
              progressCounts.test++;
            }
          }
        }
      });

      // 참석자가 없으면 제외
      if (attendees.length === 0) return;

      // 기간 내 이벤트인지 확인 (미래 이벤트도 포함)
      const isInPeriod = eventDate >= periodStart;

      results.push({
        key,
        title: event.label,
        date: event.date,
        totalAttendees: attendees.length,
        periodAttendees: isInPeriod ? attendees.length : 0,
        attendees,
        progressCounts,
      });
    });

    return results;
  }, [data, timePeriod]);

  // 총 MBM 참석 통계
  const totalMbmStats = useMemo(() => {
    return mbmStats.reduce((acc, m) => ({
      total: acc.total + m.totalAttendees,
      period: acc.period + m.periodAttendees,
    }), { total: 0, period: 0 });
  }, [mbmStats]);

  // 정렬된 콘텐츠 목록
  const sortedContentStats = useMemo(() => {
    // 정렬이 없으면 원본 순서 유지
    if (!sortField || !sortDirection) {
      return contentStats;
    }

    return [...contentStats].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'title':
          aVal = a.title;
          bVal = b.title;
          break;
        case 'category':
          aVal = CATEGORY_ORDER[a.category];
          bVal = CATEGORY_ORDER[b.category];
          break;
        case 'totalViews':
          aVal = a.periodViews; // 기간 내 조회수로 정렬
          bVal = b.periodViews;
          break;
        case 'viewers':
          aVal = a.viewers.length;
          bVal = b.viewers.length;
          break;
        case 'test':
          aVal = a.progressCounts.test;
          bVal = b.progressCounts.test;
          break;
        case 'quote':
          aVal = a.progressCounts.quote;
          bVal = b.progressCounts.quote;
          break;
        case 'approval':
          aVal = a.progressCounts.approval;
          bVal = b.progressCounts.approval;
          break;
        case 'contract':
          aVal = a.progressCounts.contract;
          bVal = b.progressCounts.contract;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contentStats, sortField, sortDirection]);

  // 정렬 핸들러 (desc -> asc -> 해제)
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        // asc -> 정렬 해제
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 카테고리별 통계 (과거 → 현재)
  const categoryStats = useMemo(() => {
    const stats = { 
      TOFU: { past: 0, current: 0, period: 0 }, 
      MOFU: { past: 0, current: 0, period: 0 }, 
      BOFU: { past: 0, current: 0, period: 0 } 
    };
    contentStats.forEach(content => {
      stats[content.category].past += content.pastViews;
      stats[content.category].current += content.currentViews;
      stats[content.category].period += content.periodViews;
    });
    return stats;
  }, [contentStats]);

  // 총 조회수 (과거 → 현재)
  const totalViewStats = useMemo(() => {
    return contentStats.reduce((acc, c) => ({
      past: acc.past + c.pastViews,
      current: acc.current + c.currentViews,
      period: acc.period + c.periodViews,
    }), { past: 0, current: 0, period: 0 });
  }, [contentStats]);

  // 상위 콘텐츠 (카테고리별) - 기간 내 조회수 기준
  const topContentByCategory = useMemo(() => {
    const result: Record<string, ContentStat | null> = { TOFU: null, MOFU: null, BOFU: null };
    contentStats.forEach(content => {
      if (!result[content.category] || content.periodViews > (result[content.category]?.periodViews || 0)) {
        result[content.category] = content;
      }
    });
    return result;
  }, [contentStats]);

  const openContentDetail = (content: ContentStat) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedContent(null);
    setSelectedMbm(null);
  };

  const openCategoryModal = (category: 'all' | 'TOFU' | 'MOFU' | 'BOFU') => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
  };

  // 선택된 카테고리의 콘텐츠 목록
  const categoryContents = useMemo(() => {
    if (!selectedCategory) return [];
    if (selectedCategory === 'all') return contentStats;
    return contentStats.filter(c => c.category === selectedCategory);
  }, [contentStats, selectedCategory]);

  // 카테고리 모달 제목
  const getCategoryModalTitle = () => {
    switch (selectedCategory) {
      case 'all': return '전체 콘텐츠';
      case 'TOFU': return '인지단계 (TOFU) 콘텐츠';
      case 'MOFU': return '고려단계 (MOFU) 콘텐츠';
      case 'BOFU': return '결정단계 (BOFU) 콘텐츠';
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Activity size={24} />
          <Text variant="h3" weight="bold">고객 활동 분석</Text>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'content' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <Eye size={16} />
              콘텐츠 조회
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'mbm' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('mbm')}
            >
              <Calendar size={16} />
              MBM 참석
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 조회 탭 */}
      {activeTab === 'content' && (
        <>
          {/* 요약 카드 */}
          <div className={styles.summaryCards}>
            <Card className={`${styles.summaryCard} ${styles.clickableCard}`} padding="lg" onClick={() => openCategoryModal('all')}>
              <div className={styles.cardIcon}>
                <Eye size={20} />
              </div>
              <div className={styles.valueChange}>
                <span className={styles.pastValueText}>
                  <Text variant="h3" weight="bold" mono>{totalViewStats.past}</Text>
                </span>
                <ArrowRight size={12} className={styles.arrowIcon} />
                <Text variant="h3" weight="bold" mono color={totalViewStats.period > 0 ? 'success' : 'primary'}>
                  {totalViewStats.current}
                </Text>
              </div>
              {totalViewStats.period > 0 && (
                <Badge variant="success" size="sm">
                  <TrendingUp size={10} /> +{totalViewStats.period}
                </Badge>
              )}
              <Text variant="caption" color="secondary">총 조회수</Text>
            </Card>

            {Object.entries(CATEGORY_COLORS).map(([category, config]) => {
              const stat = categoryStats[category as keyof typeof categoryStats];
              return (
                <Card 
                  key={category} 
                  className={`${styles.summaryCard} ${styles[config.bg]} ${styles.clickableCard}`} 
                  padding="lg"
                  onClick={() => openCategoryModal(category as 'TOFU' | 'MOFU' | 'BOFU')}
                >
                  <Badge variant={config.variant} size="sm">{category}</Badge>
                  <div className={styles.valueChange}>
                    <span className={styles.pastValueText}>
                      <Text variant="h3" weight="bold" mono>{stat.past}</Text>
                    </span>
                    <ArrowRight size={12} className={styles.arrowIcon} />
                    <Text variant="h3" weight="bold" mono color={stat.period > 0 ? 'success' : 'primary'}>
                      {stat.current}
                    </Text>
                  </div>
                  {stat.period > 0 && (
                    <Badge variant="success" size="sm">+{stat.period}</Badge>
                  )}
                  <Text variant="caption" color="secondary">{config.label.split(' (')[0]}</Text>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* MBM 참석 탭 */}
      {activeTab === 'mbm' && (
        <>
          {/* MBM 요약 카드 */}
          <div className={styles.summaryCards}>
            <Card className={styles.summaryCard} padding="lg">
              <div className={styles.cardIcon}>
                <Calendar size={20} />
              </div>
              <Text variant="h3" weight="bold" mono color={totalMbmStats.period > 0 ? 'success' : 'primary'}>
                {totalMbmStats.total}
              </Text>
              {totalMbmStats.period > 0 && (
                <Badge variant="success" size="sm">
                  <TrendingUp size={10} /> 기간 내 +{totalMbmStats.period}
                </Badge>
              )}
              <Text variant="caption" color="secondary">총 참석 (연인원)</Text>
            </Card>

            {/* 각 MBM 이벤트별 카드 */}
            {mbmStats.map(mbm => (
              <Card key={mbm.key} className={styles.summaryCard} padding="lg">
                <Text variant="body-sm" weight="medium">{mbm.title}</Text>
                <Text variant="h3" weight="bold" mono color={mbm.periodAttendees > 0 ? 'success' : 'primary'}>
                  {mbm.totalAttendees}
                </Text>
                {mbm.periodAttendees > 0 && (
                  <Badge variant="success" size="sm">기간 내</Badge>
                )}
                <Text variant="caption" color="secondary">{mbm.date}</Text>
              </Card>
            ))}
          </div>

          {/* MBM 이벤트 목록 */}
          <div className={styles.contentList}>
            <Text variant="h4" weight="semibold">MBM 이벤트 ({mbmStats.length})</Text>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>이벤트</th>
                    <th className={styles.th}>날짜</th>
                    <th className={styles.th}>참석 기업 수</th>
                    <th className={styles.th}>기간 내 여부</th>
                  </tr>
                </thead>
                <tbody>
                  {mbmStats.map((mbm) => (
                    <tr 
                      key={mbm.key} 
                      className={`${styles.tr} ${styles.clickableRow}`}
                      onClick={() => { setSelectedMbm(mbm); setIsModalOpen(true); }}
                    >
                      <td className={styles.td}>
                        <Text variant="body-sm" weight="medium">{mbm.title}</Text>
                      </td>
                      <td className={styles.td}>
                        <Text variant="body-sm" color="secondary">{mbm.date}</Text>
                      </td>
                      <td className={styles.td}>
                        <Text variant="body-sm" weight="semibold" mono color={mbm.periodAttendees > 0 ? 'success' : 'primary'}>
                          {mbm.totalAttendees}개사
                        </Text>
                      </td>
                      <td className={styles.td}>
                        {mbm.periodAttendees > 0 ? (
                          <Badge variant="success" size="sm">기간 내</Badge>
                        ) : (
                          <Badge variant="default" size="sm">기간 외</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {mbmStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className={styles.emptyRow}>
                        <Text variant="body-sm" color="tertiary">MBM 이벤트가 없습니다.</Text>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 콘텐츠 탭 - 카테고리별 인기 콘텐츠 */}
      {activeTab === 'content' && (
        <>
      <div className={styles.topContents}>
        <Text variant="h4" weight="semibold">카테고리별 인기 콘텐츠 (최근 {TIME_PERIOD_LABELS[timePeriod]})</Text>
        <div className={styles.topContentGrid}>
          {Object.entries(topContentByCategory).map(([category, content]) => (
            <Card 
              key={category} 
              className={`${styles.topContentCard} ${content ? styles.clickable : ''}`} 
              padding="md"
              onClick={() => content && openContentDetail(content)}
            >
              <Badge variant={CATEGORY_COLORS[category].variant} size="sm">{category}</Badge>
              {content && content.periodViews > 0 ? (
                <>
                  <Text variant="body-md" weight="medium" className={styles.contentTitle}>
                    {content.title}
                  </Text>
                  <div className={styles.contentStats}>
                    <div className={styles.statItem}>
                      <TrendingUp size={14} className={styles.trendUp} />
                      <Text variant="body-sm" weight="semibold" color="success">+{content.periodViews}회</Text>
                    </div>
                    <div className={styles.statItem}>
                      <Users size={14} />
                      <Text variant="body-sm" color="secondary">{content.viewers.length}개사</Text>
                    </div>
                  </div>
                  <div className={styles.viewsChange}>
                    <Text variant="caption" color="tertiary" mono>{content.pastViews}</Text>
                    <ArrowRight size={10} className={styles.arrowIcon} />
                    <Text variant="caption" weight="medium" mono>{content.currentViews}</Text>
                  </div>
                </>
              ) : (
                <Text variant="body-sm" color="tertiary">해당 기간 조회 없음</Text>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* 전체 콘텐츠 목록 */}
      <div className={styles.contentList}>
        <Text variant="h4" weight="semibold">전체 콘텐츠 ({contentStats.length})</Text>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th 
                  className={`${styles.th} ${styles.sortable}`} 
                  onClick={() => handleSort('title')}
                >
                  <div className={styles.thContent}>
                    콘텐츠
                    <ArrowUpDown size={12} className={sortField === 'title' ? styles.sortActive : ''} />
                  </div>
                </th>
                <th 
                  className={`${styles.th} ${styles.sortable}`} 
                  onClick={() => handleSort('category')}
                >
                  <div className={styles.thContent}>
                    카테고리
                    <ArrowUpDown size={12} className={sortField === 'category' ? styles.sortActive : ''} />
                  </div>
                </th>
                <th 
                  className={`${styles.th} ${styles.sortable}`} 
                  onClick={() => handleSort('totalViews')}
                >
                  <div className={styles.thContent}>
                    조회수
                    <ArrowUpDown size={12} className={sortField === 'totalViews' ? styles.sortActive : ''} />
                  </div>
                </th>
                <th 
                  className={`${styles.th} ${styles.sortable}`} 
                  onClick={() => handleSort('viewers')}
                >
                  <div className={styles.thContent}>
                    조회 기업
                    <ArrowUpDown size={12} className={sortField === 'viewers' ? styles.sortActive : ''} />
                  </div>
                </th>
                <th 
                  className={`${styles.th} ${styles.progressTh} ${styles.sortable} ${sortField === 'test' ? styles.sortActive : ''}`}
                  onClick={() => handleSort('test')}
                >
                  <div className={styles.progressThContent}>
                    <Badge variant="default" size="sm">T</Badge>
                    {sortField === 'test' && (
                      sortDirection === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />
                    )}
                  </div>
                </th>
                <th 
                  className={`${styles.th} ${styles.progressTh} ${styles.sortable} ${sortField === 'quote' ? styles.sortActive : ''}`}
                  onClick={() => handleSort('quote')}
                >
                  <div className={styles.progressThContent}>
                    <Badge variant="info" size="sm">Q</Badge>
                    {sortField === 'quote' && (
                      sortDirection === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />
                    )}
                  </div>
                </th>
                <th 
                  className={`${styles.th} ${styles.progressTh} ${styles.sortable} ${sortField === 'approval' ? styles.sortActive : ''}`}
                  onClick={() => handleSort('approval')}
                >
                  <div className={styles.progressThContent}>
                    <Badge variant="warning" size="sm">A</Badge>
                    {sortField === 'approval' && (
                      sortDirection === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />
                    )}
                  </div>
                </th>
                <th 
                  className={`${styles.th} ${styles.progressTh} ${styles.sortable} ${sortField === 'contract' ? styles.sortActive : ''}`}
                  onClick={() => handleSort('contract')}
                >
                  <div className={styles.progressThContent}>
                    <Badge variant="success" size="sm">C</Badge>
                    {sortField === 'contract' && (
                      sortDirection === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedContentStats.map((content, idx) => (
                <tr 
                  key={idx} 
                  className={`${styles.tr} ${styles.clickableRow}`}
                  onClick={() => openContentDetail(content)}
                >
                  <td className={styles.td}>
                    <Text variant="body-sm" weight="medium">{content.title}</Text>
                  </td>
                  <td className={styles.td}>
                    <Badge variant={CATEGORY_COLORS[content.category].variant} size="sm">
                      {content.category}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.viewsChangeCell}>
                      {content.periodViews > 0 ? (
                        <>
                          <Text variant="body-sm" color="tertiary" mono>{content.pastViews}</Text>
                          <ArrowRight size={10} className={styles.arrowIcon} />
                          <Text variant="body-sm" weight="semibold" mono color="success">
                            {content.currentViews}
                          </Text>
                        </>
                      ) : (
                        <Text variant="body-sm" mono>{content.currentViews}</Text>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <Text variant="body-sm" color="secondary">{content.viewers.length}개사</Text>
                  </td>
                  <td className={`${styles.td} ${styles.progressTd}`}>
                    <Text variant="body-sm" mono color={content.progressCounts.test > 0 ? 'primary' : 'tertiary'}>
                      {content.progressCounts.test || '-'}
                    </Text>
                  </td>
                  <td className={`${styles.td} ${styles.progressTd}`}>
                    <Text variant="body-sm" mono color={content.progressCounts.quote > 0 ? 'primary' : 'tertiary'}>
                      {content.progressCounts.quote || '-'}
                    </Text>
                  </td>
                  <td className={`${styles.td} ${styles.progressTd}`}>
                    <Text variant="body-sm" mono color={content.progressCounts.approval > 0 ? 'primary' : 'tertiary'}>
                      {content.progressCounts.approval || '-'}
                    </Text>
                  </td>
                  <td className={`${styles.td} ${styles.progressTd}`}>
                    <Text variant="body-sm" weight="semibold" mono color={content.progressCounts.contract > 0 ? 'success' : 'tertiary'}>
                      {content.progressCounts.contract || '-'}
                    </Text>
                  </td>
                </tr>
              ))}
              {sortedContentStats.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    <Text variant="body-sm" color="tertiary">해당 기간 내 조회된 콘텐츠가 없습니다.</Text>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* 상세 모달 */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedContent?.title || selectedMbm?.title || ''} size="lg">
        {selectedContent && (
          <div className={styles.contentDetail}>
            <div className={styles.detailHeader}>
              <Badge variant={CATEGORY_COLORS[selectedContent.category].variant}>
                {selectedContent.category}
              </Badge>
              <Text variant="caption" color="tertiary">
                {CATEGORY_COLORS[selectedContent.category].label}
              </Text>
            </div>

            <div className={styles.detailStats}>
              <div className={styles.detailStatItem}>
                <Eye size={18} />
                {selectedContent.periodViews > 0 ? (
                  <div className={styles.valueChange}>
                    <Text variant="h3" weight="bold" color="tertiary" mono>{selectedContent.pastViews}</Text>
                    <ArrowRight size={14} className={styles.arrowIcon} />
                    <Text variant="h3" weight="bold" mono color="success">
                      {selectedContent.currentViews}
                    </Text>
                  </div>
                ) : (
                  <Text variant="h3" weight="bold" mono>{selectedContent.currentViews}</Text>
                )}
                <Text variant="caption" color="secondary">총 조회수</Text>
              </div>
              <div className={styles.detailStatItem}>
                <Users size={18} />
                <Text variant="h3" weight="bold">{selectedContent.viewers.length}</Text>
                <Text variant="caption" color="secondary">조회 기업</Text>
              </div>
            </div>

            <div className={styles.viewerList}>
              <Text variant="body-md" weight="semibold">조회 기업 목록 ({selectedContent.viewers.length}개사)</Text>
              <div className={styles.viewers}>
                {selectedContent.viewers.length === 0 ? (
                  <div className={styles.emptyViewers}>
                    <Text variant="body-sm" color="tertiary">해당 기간에 조회한 기업이 없습니다.</Text>
                  </div>
                ) : (
                  selectedContent.viewers.map((viewer, idx) => (
                    <CompanyInfoCard 
                      key={idx}
                      viewer={viewer}
                      showDate={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {selectedMbm && (
          <div className={styles.contentDetail}>
            <div className={styles.detailHeader}>
              <Badge variant={selectedMbm.periodAttendees > 0 ? 'success' : 'default'}>
                {selectedMbm.periodAttendees > 0 ? '기간 내 이벤트' : '기간 외 이벤트'}
              </Badge>
              <Text variant="caption" color="tertiary">
                {selectedMbm.date}
              </Text>
            </div>

            <div className={styles.detailStats}>
              <div className={styles.detailStatItem}>
                <Users size={18} />
                <Text variant="h3" weight="bold" mono color={selectedMbm.periodAttendees > 0 ? 'success' : 'primary'}>
                  {selectedMbm.totalAttendees}
                </Text>
                <Text variant="caption" color="secondary">참석 기업</Text>
              </div>
              <div className={styles.detailStatItem}>
                <Text variant="caption" color="secondary">진행상태 분포</Text>
                <div className={styles.progressDots}>
                  <span className={`${styles.dot} ${selectedMbm.progressCounts.test > 0 ? styles.dotActive : ''}`}>
                    T:{selectedMbm.progressCounts.test}
                  </span>
                  <span className={`${styles.dot} ${selectedMbm.progressCounts.quote > 0 ? styles.dotActive : ''}`}>
                    Q:{selectedMbm.progressCounts.quote}
                  </span>
                  <span className={`${styles.dot} ${selectedMbm.progressCounts.approval > 0 ? styles.dotActive : ''}`}>
                    A:{selectedMbm.progressCounts.approval}
                  </span>
                  <span className={`${styles.dot} ${selectedMbm.progressCounts.contract > 0 ? styles.dotActive : ''}`}>
                    C:{selectedMbm.progressCounts.contract}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.viewerList}>
              <Text variant="body-md" weight="semibold">참석 기업 목록 ({selectedMbm.attendees.length}개사)</Text>
              <div className={styles.viewers}>
                {selectedMbm.attendees.map((attendee, idx) => (
                  <CompanyInfoCard 
                    key={idx}
                    viewer={attendee}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 카테고리 상세 모달 */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title={getCategoryModalTitle()}
        size="lg"
      >
        <div className={styles.categoryModalContent}>
          <div className={styles.categoryStats}>
            <Text variant="body-md" color="secondary">
              최근 {TIME_PERIOD_LABELS[timePeriod]} 동안 {categoryContents.length}개 콘텐츠
            </Text>
          </div>
          
          <div className={styles.categoryContentList}>
            {categoryContents.map((content, idx) => (
              <ContentInfoCard
                key={idx}
                title={content.title}
                category={content.category}
                currentViews={content.currentViews}
                pastViews={content.pastViews}
                periodViews={content.periodViews}
                viewerCount={content.viewers.length}
                progressCounts={content.progressCounts}
                onClick={() => {
                  closeCategoryModal();
                  openContentDetail(content);
                }}
              />
            ))}
            {categoryContents.length === 0 && (
              <div className={styles.emptyViewers}>
                <Text variant="body-sm" color="tertiary">해당 카테고리의 콘텐츠가 없습니다.</Text>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

