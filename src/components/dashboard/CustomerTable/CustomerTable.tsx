import { useState, useMemo } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, Phone, Users, Building2, Calendar, Star, BookOpen, ArrowRight } from 'lucide-react';
import { Text, Card, Badge, Modal } from '@/components/common/atoms';
import { Customer, SalesAction, ContentEngagement } from '@/types/customer';
import { formatCurrency, getDataWithPeriodChange, calculateExpectedRevenue } from '@/data/mockData';
import type { TimePeriod } from '@/App';
import styles from './index.module.scss';

// 금액 축약 포맷
const formatCompactCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || amount === 0) return '-';
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000000) return `${(amount / 10000).toFixed(0)}만`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
};

type ModalTab = 'info' | 'timeline';

interface CustomerTableProps {
  data: Customer[];
  timePeriod: TimePeriod;
}

// 컨텐츠 카테고리 레이블
const CONTENT_CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  'TOFU': { label: '인지 단계', color: 'blue' },
  'MOFU': { label: '고려 단계', color: 'purple' },
  'BOFU': { label: '결정 단계', color: 'green' },
};

type SortField = 'companyName' | 'manager' | 'category' | 'trustIndex' | 'contractAmount' | 'expectedRevenue' | 'possibility' | 'customerResponse';
type SortDirection = 'asc' | 'desc';

// 가능성 순서 (정렬용)
const POSSIBILITY_ORDER: Record<string, number> = { '90%': 3, '40%': 2, '0%': 1 };
// 고객반응 순서 (정렬용)
const RESPONSE_ORDER: Record<string, number> = { '상': 3, '중': 2, '하': 1 };

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  '1w': '1주일',
  '1m': '1개월',
  '6m': '6개월',
  '1y': '1년',
};

// 기간에 따라 표시할 주차 수
const PERIOD_WEEKS_COUNT: Record<TimePeriod, number> = {
  '1w': 2,  // 현재 주 + 1주 전
  '1m': 4,  // 최근 4주
  '6m': 6,  // 모든 주차
  '1y': 6,  // 모든 주차
};

const TrendIcon = ({ direction }: { direction: Customer['changeDirection'] }) => {
  if (direction === 'up') return <TrendingUp size={14} className={styles.trendUp} />;
  if (direction === 'down') return <TrendingDown size={14} className={styles.trendDown} />;
  return <Minus size={14} className={styles.trendNone} />;
};

const ActionIcon = ({ type }: { type: SalesAction['type'] }) => {
  if (type === 'call') return <Phone size={14} />;
  return <Users size={14} />;
};

const ContentCategoryBadge = ({ category }: { category: ContentEngagement['category'] }) => {
  const variants: Record<ContentEngagement['category'], 'info' | 'warning' | 'success'> = {
    'TOFU': 'info',
    'MOFU': 'warning',
    'BOFU': 'success'
  };
  return <Badge variant={variants[category]} size="sm">{category}</Badge>;
};

const getCategoryVariant = (category: string) => {
  switch (category) {
    case '채용': return 'info';
    case '공공': return 'purple';
    case '성과': return 'cyan';
    default: return 'default';
  }
};

// 주간 타임라인 정보
const WEEKS = [
  { key: '1104', label: '11월 1주', range: '11/4~10', startDate: '2024-11-04', endDate: '2024-11-10' },
  { key: '1111', label: '11월 2주', range: '11/11~17', startDate: '2024-11-11', endDate: '2024-11-17' },
  { key: '1118', label: '11월 3주', range: '11/18~24', startDate: '2024-11-18', endDate: '2024-11-24' },
  { key: '1125', label: '11월 4주', range: '11/25~12/1', startDate: '2024-11-25', endDate: '2024-12-01' },
  { key: '1202', label: '12월 1주', range: '12/2~8', startDate: '2024-12-02', endDate: '2024-12-08' },
  { key: '1209', label: '12월 2주', range: '12/9~15', startDate: '2024-12-09', endDate: '2024-12-15', isCurrent: true },
] as const;

// MBM 이벤트 목록
const MBM_EVENTS: Record<string, { date: string; label: string }> = {
  '1107': { date: '2024-11-07', label: '11/7 MBM' },
  '1218': { date: '2024-12-18', label: '12/18 MBM' },
};

// 특정 주에 MBM 이벤트가 있는지 확인
const getMBMForWeek = (weekStartDate: string, weekEndDate: string): { key: string; label: string } | null => {
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
const findWeekForAction = (dateStr: string): string | null => {
  const actionDate = new Date(dateStr);
  
  for (const week of WEEKS) {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    end.setHours(23, 59, 59);
    
    if (actionDate >= start && actionDate <= end) {
      return week.key;
    }
  }
  return null;
};

// 액션 모달 데이터 타입
interface ActionModalData {
  action: SalesAction;
  weekLabel: string;
}

// 컨텐츠 모달 데이터 타입
interface ContentModalData {
  weekLabel: string;
  weekRange: string;
  startDate: string;
  endDate: string;
  trustChange: number;
}

// 다중 정렬 상태 타입
interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export const CustomerTable = ({ data, timePeriod }: CustomerTableProps) => {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ field: 'trustIndex', direction: 'desc' }]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('info');
  const [actionModalData, setActionModalData] = useState<ActionModalData | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [contentModalData, setContentModalData] = useState<ContentModalData | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  // 기간에 맞게 변화량 재계산
  const periodData = useMemo(() => getDataWithPeriodChange(data, timePeriod), [data, timePeriod]);

  // 필드별 값 가져오기
  const getFieldValue = (customer: Customer, field: SortField): any => {
    switch (field) {
      case 'companyName':
        return customer.companyName;
      case 'manager':
        return customer.manager;
      case 'category':
        return customer.category;
      case 'trustIndex':
        return customer.trustIndex ?? 0;
      case 'contractAmount':
        return customer.contractAmount ?? 0;
      case 'expectedRevenue':
        return customer._periodData?.currentExpectedRevenue ?? 0;
      case 'possibility':
        return POSSIBILITY_ORDER[customer.adoptionDecision.possibility] ?? 0;
      case 'customerResponse':
        return RESPONSE_ORDER[customer.adoptionDecision.customerResponse] ?? 0;
      default:
        return 0;
    }
  };

  const sortedData = useMemo(() => {
    return [...periodData].sort((a, b) => {
      for (const config of sortConfigs) {
        const aVal = getFieldValue(a, config.field);
        const bVal = getFieldValue(b, config.field);

        if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [periodData, sortConfigs]);

  // 기간 필터에 따라 표시할 주차 필터링
  const filteredWeeks = useMemo(() => {
    const weeksCount = PERIOD_WEEKS_COUNT[timePeriod];
    // WEEKS 배열의 마지막(현재)부터 weeksCount만큼 가져오기
    return WEEKS.slice(-weeksCount);
  }, [timePeriod]);

  // 정렬 핸들러 (클릭으로 다중 정렬, 같은 컬럼 3번째 클릭 시 제거)
  const handleSort = (field: SortField) => {
    setSortConfigs(prev => {
      const existingIndex = prev.findIndex(c => c.field === field);
      
      if (existingIndex >= 0) {
        // 이미 정렬 목록에 있는 경우
        const current = prev[existingIndex];
        if (current.direction === 'desc') {
          // desc → asc
          const newConfigs = [...prev];
          newConfigs[existingIndex] = { ...current, direction: 'asc' };
          return newConfigs;
        } else {
          // asc → 제거 (모든 정렬이 해제되면 빈 배열 반환)
          return prev.filter((_, i) => i !== existingIndex);
        }
      } else {
        // 새로운 정렬 조건 추가
        return [...prev, { field, direction: 'desc' }];
      }
    });
  };

  // 정렬 상태 확인
  const getSortConfig = (field: SortField): { index: number; direction: SortDirection } | null => {
    const index = sortConfigs.findIndex(c => c.field === field);
    if (index < 0) return null;
    return { index: index + 1, direction: sortConfigs[index].direction };
  };

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('info');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
  };

  // 액션 모달 열기
  const openActionModal = (action: SalesAction, weekLabel: string) => {
    setActionModalData({ action, weekLabel });
    setIsActionModalOpen(true);
  };

  // 액션 모달 닫기
  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setActionModalData(null);
  };

  // 컨텐츠 모달 열기
  const openContentModal = (week: typeof WEEKS[number], trustChange: number) => {
    setContentModalData({
      weekLabel: week.label,
      weekRange: week.range,
      startDate: week.startDate,
      endDate: week.endDate,
      trustChange,
    });
    setIsContentModalOpen(true);
  };

  // 컨텐츠 모달 닫기
  const closeContentModal = () => {
    setIsContentModalOpen(false);
    setContentModalData(null);
  };

  // 해당 기간의 컨텐츠 필터링
  const getContentsForPeriod = (customer: Customer, startDate: string, endDate: string): ContentEngagement[] => {
    if (!customer.contentEngagements) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    
    return customer.contentEngagements.filter(content => {
      const contentDate = new Date(content.date);
      return contentDate >= start && contentDate <= end;
    });
  };

  // 해당 주의 영업 액션 가져오기
  const getActionsForWeek = (customer: Customer, weekKey: string) => {
    if (!customer.salesActions) return [];
    return customer.salesActions.filter(action => findWeekForAction(action.date) === weekKey);
  };

  // 신뢰지수 변화 계산
  const getTrustChange = (customer: Customer, weekKey: string, index: number) => {
    if (!customer.trustHistory || index === 0) return null;
    const currentData = customer.trustHistory[weekKey];
    const prevKey = WEEKS[index - 1].key;
    const prevData = customer.trustHistory[prevKey];
    if (!currentData || !prevData) return null;
    return currentData.trustIndex - prevData.trustIndex;
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const sortConfig = getSortConfig(field);
    return (
      <th 
        className={styles.th} 
        onClick={() => handleSort(field)}
        title="클릭: 정렬 추가/변경 (내림차순→오름차순→제거)"
      >
        <div className={styles.sortHeader}>
          {children}
          <div className={styles.sortIndicator}>
            {sortConfig ? (
              <>
                {sortConfig.direction === 'asc' ? (
                  <TrendingUp size={12} className={styles.sortActive} />
                ) : (
                  <TrendingDown size={12} className={styles.sortActive} />
                )}
                {sortConfigs.length > 1 && (
                  <span className={styles.sortOrder}>{sortConfig.index}</span>
                )}
              </>
            ) : (
              <ArrowUpDown size={12} />
            )}
          </div>
        </div>
      </th>
    );
  };

  const getTrustLevelVariant = (level: Customer['trustLevel']) => {
    switch (level) {
      case 'P1': return 'success';
      case 'P2': return 'warning';
      case 'P3': return 'error';
      default: return 'default';
    }
  };

  const getPossibilityVariant = (possibility: string) => {
    switch (possibility) {
      case '90%': return 'success';
      case '40%': return 'warning';
      case '0%': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <Card className={styles.tableCard} padding="none">
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortHeader field="companyName">기업명</SortHeader>
                <SortHeader field="manager">담당자</SortHeader>
                <SortHeader field="category">카테고리</SortHeader>
                <SortHeader field="trustIndex">신뢰지수</SortHeader>
                <SortHeader field="contractAmount">계약금액</SortHeader>
                <SortHeader field="expectedRevenue">예상매출</SortHeader>
                <SortHeader field="possibility">가능성</SortHeader>
                <SortHeader field="customerResponse">고객반응</SortHeader>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((customer) => (
                <tr key={customer.no} className={styles.tr}>
                  <td className={styles.td}>
                    <button
                      className={styles.companyLink}
                      onClick={() => openCustomerDetail(customer)}
                    >
                      <Text variant="body-sm" weight="medium">{customer.companyName}</Text>
                    </button>
                  </td>
                  <td className={styles.td}>
                    <Text variant="body-sm">{customer.manager}</Text>
                  </td>
                  <td className={styles.td}>
                    <Badge variant={getCategoryVariant(customer.category)} size="sm">{customer.category}</Badge>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.changeCell}>
                      {customer._periodData?.pastTrustIndex !== null && customer._periodData?.pastTrustIndex !== customer.trustIndex ? (
                        <>
                          <span className={styles.pastValue}>
                            <Text variant="body-sm" mono>{customer._periodData?.pastTrustIndex}</Text>
                          </span>
                          <ArrowRight size={10} className={styles.arrowIcon} />
                          <Text 
                            variant="body-sm" 
                            weight="semibold" 
                            mono
                            color={customer.changeDirection === 'up' ? 'success' : customer.changeDirection === 'down' ? 'error' : 'primary'}
                          >
                            {customer.trustIndex}
                          </Text>
                          <Badge variant={getTrustLevelVariant(customer.trustLevel)} size="sm">
                            {customer.trustLevel}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Text variant="body-sm" mono>{customer.trustIndex}</Text>
                          <Badge variant={getTrustLevelVariant(customer.trustLevel)} size="sm">
                            {customer.trustLevel}
                          </Badge>
                        </>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <Text variant="body-sm" mono>{formatCurrency(customer.contractAmount)}</Text>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.changeCell}>
                      {customer._periodData && customer._periodData.pastExpectedRevenue !== customer._periodData.currentExpectedRevenue ? (
                        <>
                          <span className={styles.pastValue}>
                            <Text variant="body-sm" mono>{formatCompactCurrency(customer._periodData.pastExpectedRevenue)}</Text>
                          </span>
                          <ArrowRight size={10} className={styles.arrowIcon} />
                          <Text 
                            variant="body-sm" 
                            weight="semibold" 
                            mono 
                            color={customer._periodData.currentExpectedRevenue > customer._periodData.pastExpectedRevenue ? 'success' : 'error'}
                          >
                            {formatCompactCurrency(customer._periodData.currentExpectedRevenue)}
                          </Text>
                        </>
                      ) : (
                        <Text variant="body-sm" mono color={customer._periodData?.currentExpectedRevenue ? 'primary' : 'tertiary'}>
                          {formatCompactCurrency(customer._periodData?.currentExpectedRevenue)}
                        </Text>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.changeCell}>
                      {customer._periodData && customer._periodData.pastPossibility !== customer.adoptionDecision.possibility ? (
                        <>
                          <span className={styles.pastBadge}>
                            <Badge variant={getPossibilityVariant(customer._periodData.pastPossibility)} size="sm">
                              {customer._periodData.pastPossibility}
                            </Badge>
                          </span>
                          <ArrowRight size={10} className={styles.arrowIcon} />
                          <Badge variant={getPossibilityVariant(customer.adoptionDecision.possibility)} size="sm">
                            {customer.adoptionDecision.possibility}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant={getPossibilityVariant(customer.adoptionDecision.possibility)} size="sm">
                          {customer.adoptionDecision.possibility}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.changeCell}>
                      {customer._periodData && customer._periodData.pastCustomerResponse !== customer.adoptionDecision.customerResponse ? (
                        <>
                          <span className={styles.pastBadge}>
                            <Badge
                              variant={
                                customer._periodData.pastCustomerResponse === '상' ? 'success' :
                                customer._periodData.pastCustomerResponse === '중' ? 'warning' : 'error'
                              }
                              size="sm"
                            >
                              {customer._periodData.pastCustomerResponse}
                            </Badge>
                          </span>
                          <ArrowRight size={10} className={styles.arrowIcon} />
                          <Badge
                            variant={
                              customer.adoptionDecision.customerResponse === '상' ? 'success' :
                              customer.adoptionDecision.customerResponse === '중' ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {customer.adoptionDecision.customerResponse}
                          </Badge>
                        </>
                      ) : (
                        <Badge
                          variant={
                            customer.adoptionDecision.customerResponse === '상' ? 'success' :
                            customer.adoptionDecision.customerResponse === '중' ? 'warning' : 'error'
                          }
                          size="sm"
                        >
                          {customer.adoptionDecision.customerResponse}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedCustomer?.companyName || ''}
        size="xl"
      >
        {selectedCustomer && (
          <div className={styles.modalContent}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
              <button
                className={`${styles.tabButton} ${activeTab === 'info' ? styles.active : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <Building2 size={16} />
                <span>회사 정보</span>
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'timeline' ? styles.active : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                <Calendar size={16} />
                <span>MBM 타임라인</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === 'info' && (
                <div className={styles.infoTab}>
                  {/* Basic Info */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">기본 정보</Text>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">담당자</Text>
                        <Text variant="body-sm">{selectedCustomer.manager}</Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">카테고리</Text>
                        <Text variant="body-sm">{selectedCustomer.category}</Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">기업규모</Text>
                        <Text variant="body-sm">{selectedCustomer.companySize || '-'}</Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">사용제품</Text>
                        <Text variant="body-sm">{selectedCustomer.productUsage}</Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">계약금액</Text>
                        <Text variant="body-sm" mono>{formatCurrency(selectedCustomer.contractAmount)}</Text>
                      </div>
                      <div className={styles.infoItem}>
                        <Text variant="caption" color="tertiary">예상매출</Text>
                        <Text variant="body-sm" mono color="success">
                          {formatCurrency(calculateExpectedRevenue(selectedCustomer.adoptionDecision.targetRevenue, selectedCustomer.adoptionDecision.possibility))}
                        </Text>
                      </div>
                    </div>
                  </section>

                  {/* Trust Info */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">신뢰 정보</Text>
                    <div className={styles.trustInfo}>
                      <div className={styles.trustMain}>
                        <div className={styles.trustScore}>
                          <Text variant="h1" weight="bold">{selectedCustomer.trustIndex}</Text>
                          <Badge variant={getTrustLevelVariant(selectedCustomer.trustLevel)} size="md">
                            {selectedCustomer.trustLevel}
                          </Badge>
                        </div>
                        <div className={styles.trustChange}>
                          <TrendIcon direction={selectedCustomer.changeDirection} />
                          <Text
                            variant="body-sm"
                            color={selectedCustomer.changeDirection === 'up' ? 'success' : selectedCustomer.changeDirection === 'down' ? 'error' : 'secondary'}
                          >
                            {selectedCustomer.changeDirection === 'up' ? '+' : selectedCustomer.changeDirection === 'down' ? '-' : ''}
                            {selectedCustomer.changeAmount} (최근 {TIME_PERIOD_LABELS[timePeriod]})
                          </Text>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Trust Formation */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">신뢰형성</Text>
                    <div className={styles.formationInfo}>
                      <div className={styles.formationHeader}>
                        <Badge
                          variant={
                            selectedCustomer.trustFormation.customerResponse === '상' ? 'success' :
                            selectedCustomer.trustFormation.customerResponse === '중' ? 'warning' : 'error'
                          }
                        >
                          고객반응: {selectedCustomer.trustFormation.customerResponse}
                        </Badge>
                        {selectedCustomer.trustFormation.targetDate && (
                          <Text variant="body-sm" color="secondary">
                            목표: {selectedCustomer.trustFormation.targetDate}
                          </Text>
                        )}
                      </div>
                      <Text variant="body-sm">{selectedCustomer.trustFormation.detail}</Text>
                      {selectedCustomer.trustFormation.interestFunction && (
                        <div className={styles.interestBadges}>
                          <Text variant="caption" color="tertiary">관심기능:</Text>
                          {selectedCustomer.trustFormation.interestFunction.split(/[/,]/).map((fn, i) => (
                            <Badge key={i} variant="info" size="sm">{fn.trim()}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Adoption Decision */}
                  <section className={styles.modalSection}>
                    <Text variant="body-md" weight="semibold">도입결정</Text>
                    <div className={styles.adoptionInfo}>
                      <div className={styles.adoptionHeader}>
                        <Badge variant={getPossibilityVariant(selectedCustomer.adoptionDecision.possibility)}>
                          가능성: {selectedCustomer.adoptionDecision.possibility}
                        </Badge>
                        {selectedCustomer.adoptionDecision.targetDate && (
                          <Text variant="body-sm" color="secondary">
                            목표: {selectedCustomer.adoptionDecision.targetDate}
                          </Text>
                        )}
                      </div>
                      {selectedCustomer.adoptionDecision.targetRevenue && (
                        <div className={styles.revenueInfo}>
                          <Text variant="caption" color="tertiary">목표매출</Text>
                          <Text variant="body-md" weight="semibold" mono>
                            {formatCurrency(selectedCustomer.adoptionDecision.targetRevenue)}
                          </Text>
                        </div>
                      )}
                      <div className={styles.progressSteps}>
                        <div className={`${styles.step} ${selectedCustomer.adoptionDecision.test ? styles.completed : ''}`}>
                          <span className={styles.stepDot} />
                          <Text variant="caption">테스트</Text>
                        </div>
                        <div className={`${styles.step} ${selectedCustomer.adoptionDecision.quote ? styles.completed : ''}`}>
                          <span className={styles.stepDot} />
                          <Text variant="caption">견적</Text>
                        </div>
                        <div className={`${styles.step} ${selectedCustomer.adoptionDecision.approval ? styles.completed : ''}`}>
                          <span className={styles.stepDot} />
                          <Text variant="caption">승인</Text>
                        </div>
                        <div className={`${styles.step} ${selectedCustomer.adoptionDecision.contract ? styles.completed : ''}`}>
                          <span className={styles.stepDot} />
                          <Text variant="caption">계약</Text>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Sales Actions */}
                  {selectedCustomer.salesActions && selectedCustomer.salesActions.length > 0 && (
                    <section className={styles.modalSection}>
                      <Text variant="body-md" weight="semibold">영업활동 히스토리</Text>
                      <div className={styles.actionsTimeline}>
                        {selectedCustomer.salesActions.map((action, i) => (
                          <div key={i} className={styles.timelineItem}>
                            <div className={styles.timelineIcon}>
                              <ActionIcon type={action.type} />
                            </div>
                            <div className={styles.timelineContent}>
                              <Text variant="caption" color="tertiary">{action.date}</Text>
                              <Text variant="body-sm">{action.content}</Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Content Engagements */}
                  {selectedCustomer.contentEngagements && selectedCustomer.contentEngagements.length > 0 && (
                    <section className={styles.modalSection}>
                      <Text variant="body-md" weight="semibold">콘텐츠 조회 이력</Text>
                      <div className={styles.contentList}>
                        {selectedCustomer.contentEngagements.map((content, i) => (
                          <div key={i} className={styles.contentItem}>
                            <div className={styles.contentHeader}>
                              <ContentCategoryBadge category={content.category} />
                              <Text variant="caption" color="tertiary">{content.date}</Text>
                            </div>
                            <Text variant="body-sm">{content.title}</Text>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className={styles.timelineTab}>
                  {/* 기간 필터 표시 */}
                  <div className={styles.periodBadge}>
                    <Text variant="caption" color="tertiary">
                      최근 {TIME_PERIOD_LABELS[timePeriod]} 타임라인
                    </Text>
                  </div>
                  {/* Timeline Header */}
                  <div className={styles.timelineHeader}>
                    {filteredWeeks.map((week) => {
                      const mbmEvent = getMBMForWeek(week.startDate, week.endDate);
                      const hasMBM = !!mbmEvent;
                      return (
                        <div 
                          key={week.key} 
                          className={`${styles.weekHeader} ${hasMBM ? styles.mbmWeek : ''} ${'isCurrent' in week && week.isCurrent ? styles.currentWeek : ''}`}
                        >
                          <Text variant="caption" weight="semibold" color={hasMBM ? 'accent' : 'secondary'}>
                            {week.label}
                          </Text>
                          <Text variant="caption" color="tertiary">{week.range}</Text>
                          {hasMBM && mbmEvent && (
                            <div className={styles.mbmBadge}>
                              <Star size={10} />
                              <Text variant="caption" color="accent">{mbmEvent.label}</Text>
                            </div>
                          )}
                          {'isCurrent' in week && week.isCurrent && (
                            <Badge variant="success" size="sm">현재</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Timeline Content */}
                  <div className={styles.timelineCells}>
                    {filteredWeeks.map((week, index) => {
                      const trustData = selectedCustomer.trustHistory?.[week.key];
                      const actions = getActionsForWeek(selectedCustomer, week.key);
                      const trustChange = getTrustChange(selectedCustomer, week.key, index);
                      const mbmEvent = getMBMForWeek(week.startDate, week.endDate);
                      const mbmAttended = mbmEvent && selectedCustomer.attendance?.[mbmEvent.key as keyof typeof selectedCustomer.attendance];

                      return (
                        <div 
                          key={week.key} 
                          className={`${styles.timelineCell} ${'isCurrent' in week && week.isCurrent ? styles.currentCell : ''}`}
                        >
                          {/* MBM 참석 표시 */}
                          {mbmAttended && mbmEvent && (
                            <div className={styles.mbmAttendedBadge}>
                              <Star size={12} fill="currentColor" />
                              <Text variant="caption" weight="semibold">{mbmEvent.label} 참석</Text>
                            </div>
                          )}

                          {/* 신뢰지수 */}
                          {trustData && (
                            <div className={styles.trustCell}>
                              <div className={styles.trustValue}>
                                <Text variant="body-sm" weight="semibold" mono>
                                  {trustData.trustIndex}
                                </Text>
                                {trustChange !== null && trustChange !== 0 && (() => {
                                  const weekContents = trustChange > 0 ? getContentsForPeriod(selectedCustomer, week.startDate, week.endDate) : [];
                                  const hasContents = weekContents.length > 0;
                                  return (
                                    <button
                                      className={`${styles.trustChangeButton} ${trustChange > 0 ? styles.up : styles.down} ${hasContents ? styles.clickable : ''}`}
                                      onClick={() => hasContents && openContentModal(week, trustChange)}
                                      title={hasContents ? `클릭하여 ${weekContents.length}건의 컨텐츠 확인` : undefined}
                                      disabled={!hasContents}
                                    >
                                      {trustChange > 0 ? (
                                        <><TrendingUp size={10} /> +{trustChange}</>
                                      ) : (
                                        <><TrendingDown size={10} /> {trustChange}</>
                                      )}
                                    </button>
                                  );
                                })()}
                              </div>
                              <Badge 
                                variant={getTrustLevelVariant(trustData.trustLevel as Customer['trustLevel'])} 
                                size="sm"
                              >
                                {trustData.trustLevel}
                              </Badge>
                            </div>
                          )}

                          {/* 영업 액션 */}
                          {actions.length > 0 && (
                            <div className={styles.cellActions}>
                              {actions.map((action, i) => (
                                <button 
                                  key={i} 
                                  className={`${styles.cellAction} ${styles[action.type]}`}
                                  onClick={() => openActionModal(action, week.label)}
                                  title="클릭하여 상세 정보 확인"
                                >
                                  {action.type === 'call' ? <Phone size={10} /> : <Users size={10} />}
                                  <Text variant="caption">
                                    {action.content.length > 12 ? action.content.slice(0, 12) + '...' : action.content}
                                  </Text>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 데이터 없음 */}
                          {!trustData && actions.length === 0 && !mbmAttended && (
                            <Text variant="caption" color="muted">-</Text>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* MBM 참석 현황 요약 */}
                  <div className={styles.attendanceSummary}>
                    <Text variant="body-md" weight="semibold">MBM 참석 현황</Text>
                    <div className={styles.attendanceList}>
                      <div className={styles.attendanceItem}>
                        <Text variant="body-sm">11/7 세미나</Text>
                        <Badge variant={selectedCustomer.attendance['1107'] ? 'success' : 'default'}>
                          {selectedCustomer.attendance['1107'] ? '참석' : '불참'}
                        </Badge>
                      </div>
                      {selectedCustomer.attendance['1218'] !== undefined && (
                        <div className={styles.attendanceItem}>
                          <Text variant="body-sm">12/18 후속 미팅</Text>
                          <Badge variant={selectedCustomer.attendance['1218'] ? 'success' : 'default'}>
                            {selectedCustomer.attendance['1218'] ? '참석' : '불참'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 영업 액션 상세 모달 */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={closeActionModal}
        title="영업 액션 상세"
        size="sm"
      >
        {actionModalData && selectedCustomer && (
          <div className={styles.actionModal}>
            <div className={styles.actionModalHeader}>
              <Badge 
                variant={actionModalData.action.type === 'meeting' ? 'purple' : 'cyan'} 
                size="md"
              >
                {actionModalData.action.type === 'meeting' ? (
                  <><Users size={12} /> 미팅</>
                ) : (
                  <><Phone size={12} /> 콜</>
                )}
              </Badge>
              <div className={styles.actionDate}>
                <Calendar size={14} />
                <Text variant="body-sm" color="secondary">{actionModalData.action.date}</Text>
              </div>
            </div>

            <div className={styles.actionModalContent}>
              <Text variant="label" color="tertiary">활동 내용</Text>
              <Text variant="body-sm" weight="medium">{actionModalData.action.content}</Text>
            </div>

            <div className={styles.actionModalMeta}>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">기간</Text>
                <Text variant="body-sm">{actionModalData.weekLabel}</Text>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">담당자</Text>
                <Text variant="body-sm">{selectedCustomer.manager}</Text>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">신뢰레벨</Text>
                <Badge variant={getTrustLevelVariant(selectedCustomer.trustLevel)} size="sm">
                  {selectedCustomer.trustLevel}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 컨텐츠 조회 모달 */}
      <Modal
        isOpen={isContentModalOpen}
        onClose={closeContentModal}
        title={selectedCustomer ? `${selectedCustomer.companyName} - 조회 컨텐츠` : '조회 컨텐츠'}
        size="md"
      >
        {contentModalData && selectedCustomer && (() => {
          const filteredContents = getContentsForPeriod(selectedCustomer, contentModalData.startDate, contentModalData.endDate);
          return (
            <div className={styles.contentModal}>
              <div className={styles.contentModalHeader}>
                <div className={styles.periodBadge}>
                  <Text variant="body-sm" weight="semibold">{contentModalData.weekLabel}</Text>
                  <Text variant="caption" color="tertiary">({contentModalData.weekRange})</Text>
                </div>
                <div className={styles.contentStats}>
                  <div className={styles.statItem}>
                    <Text variant="caption" color="tertiary">조회 컨텐츠</Text>
                    <Text variant="h4" weight="bold" mono>{filteredContents.length}건</Text>
                  </div>
                  <div className={styles.statItem}>
                    <Text variant="caption" color="tertiary">신뢰지수 변화</Text>
                    <Text variant="h4" weight="bold" mono color="success">+{contentModalData.trustChange}</Text>
                  </div>
                </div>
                <Text variant="body-sm" color="secondary">
                  해당 기간 동안 조회한 컨텐츠로 신뢰지수가 상승했습니다.
                </Text>
              </div>

              <div className={styles.contentModalList}>
                {filteredContents.map((content, idx) => {
                  const categoryInfo = CONTENT_CATEGORY_LABELS[content.category] || { label: content.category, color: 'default' };
                  return (
                    <div key={idx} className={styles.contentModalItem}>
                      <div className={styles.contentIcon}>
                        <BookOpen size={16} />
                      </div>
                      <div className={styles.contentInfo}>
                        <Text variant="body-sm" weight="medium">{content.title}</Text>
                        <div className={styles.contentMeta}>
                          <Text variant="caption" color="tertiary">{content.date}</Text>
                          <Badge 
                            variant={content.category === 'BOFU' ? 'success' : content.category === 'MOFU' ? 'warning' : 'info'} 
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
                    <Text variant="body-sm" color="tertiary">해당 기간에 조회한 컨텐츠가 없습니다.</Text>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
};
