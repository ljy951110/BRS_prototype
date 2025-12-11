import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Percent, ArrowRight, Phone, Users as UsersIcon, Calendar, ChevronLeft, BookOpen } from 'lucide-react';
import { Text, Card, Modal, Badge } from '@/components/common/atoms';
import { Customer, SalesAction, ContentEngagement } from '@/types/customer';
import { formatCompactCurrency, getDataWithPeriodChange } from '@/data/mockData';
import type { TimePeriod } from '@/App';
import styles from './index.module.scss';

// 기간에 따른 일수
const PERIOD_DAYS: Record<TimePeriod, number> = {
  '1w': 7,
  '1m': 30,
  '6m': 180,
  '1y': 365,
};

// 콘텐츠 카테고리별 신뢰지수 증가량
const CONTENT_TRUST_POINTS: Record<string, number> = {
  'TOFU': 1,
  'MOFU': 2,
  'BOFU': 3,
};

// 기간 내 영업 액션 가져오기
const getActionsInPeriod = (customer: Customer, period: TimePeriod): SalesAction[] => {
  if (!customer.salesActions || customer.salesActions.length === 0) return [];
  
  const now = new Date('2024-12-10');
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - PERIOD_DAYS[period]);
  
  return customer.salesActions
    .filter(action => {
      const actionDate = new Date(action.date);
      return actionDate >= periodStart && actionDate <= now;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// 기간 내 콘텐츠 소비 기록 가져오기
const getContentsInPeriod = (customer: Customer, period: TimePeriod): ContentEngagement[] => {
  if (!customer.contentEngagements || customer.contentEngagements.length === 0) return [];
  
  const now = new Date('2024-12-10');
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - PERIOD_DAYS[period]);
  
  return customer.contentEngagements
    .filter(content => {
      const contentDate = new Date(content.date);
      return contentDate >= periodStart && contentDate <= now;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// 최근 영업 액션 가져오기
const getRecentAction = (customer: Customer) => {
  if (!customer.salesActions || customer.salesActions.length === 0) return null;
  const sorted = [...customer.salesActions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0];
};

interface SummaryCardsProps {
  data: Customer[];
  timePeriod: TimePeriod;
}

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  '1w': '1주일',
  '1m': '1개월',
  '6m': '6개월',
  '1y': '1년',
};

type ModalType = 'revenue' | 'trust' | 'possibility' | null;

export const SummaryCards = ({ data, timePeriod }: SummaryCardsProps) => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCompany, setSelectedCompany] = useState<Customer | null>(null);
  
  // 기간에 맞게 변화량 재계산
  const periodData = useMemo(() => getDataWithPeriodChange(data, timePeriod), [data, timePeriod]);

  // 변동된 회사들 분류
  const changedCompanies = useMemo(() => {
    // 예상 매출 변동 회사
    const revenueUp = periodData.filter(c => 
      c._periodData && c._periodData.currentExpectedRevenue > c._periodData.pastExpectedRevenue
    );
    const revenueDown = periodData.filter(c => 
      c._periodData && c._periodData.currentExpectedRevenue < c._periodData.pastExpectedRevenue
    );
    
    // 신뢰지수 변동 회사
    const trustUp = periodData.filter(c => c.changeDirection === 'up');
    const trustDown = periodData.filter(c => c.changeDirection === 'down');
    
    // 가능성 변동 회사
    const possibilityUp = periodData.filter(c => c._periodData?.possibilityChange === 'up');
    const possibilityDown = periodData.filter(c => c._periodData?.possibilityChange === 'down');
    
    return {
      revenue: { up: revenueUp, down: revenueDown },
      trust: { up: trustUp, down: trustDown },
      possibility: { up: possibilityUp, down: possibilityDown },
    };
  }, [periodData]);

  const stats = useMemo(() => {
    const totalCustomers = periodData.length;
    
    // 계약 금액 합계
    const totalContract = periodData.reduce((sum, c) => sum + (c.contractAmount || 0), 0);
    
    // 현재 예상 매출 합계
    const currentExpectedRevenue = periodData.reduce(
      (sum, c) => sum + (c._periodData?.currentExpectedRevenue || 0), 0
    );
    
    // 과거 예상 매출 합계
    const pastExpectedRevenue = periodData.reduce(
      (sum, c) => sum + (c._periodData?.pastExpectedRevenue || 0), 0
    );

    return {
      totalCustomers,
      totalContract,
      currentExpectedRevenue,
      pastExpectedRevenue,
      trustTrend: { 
        up: changedCompanies.trust.up.length, 
        down: changedCompanies.trust.down.length 
      },
      possibilityTrend: { 
        up: changedCompanies.possibility.up.length, 
        down: changedCompanies.possibility.down.length 
      },
    };
  }, [periodData, changedCompanies]);

  const openModal = (type: ModalType) => {
    setModalType(type);
    setSelectedCompany(null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedCompany(null);
  };

  const openCompanyDetail = (customer: Customer) => {
    setSelectedCompany(customer);
  };

  const closeCompanyDetail = () => {
    setSelectedCompany(null);
  };

  // 모달 제목
  const getModalTitle = () => {
    switch (modalType) {
      case 'revenue': return `예상 매출 변동 (최근 ${TIME_PERIOD_LABELS[timePeriod]})`;
      case 'trust': return `신뢰지수 변동 (최근 ${TIME_PERIOD_LABELS[timePeriod]})`;
      case 'possibility': return `가능성 변동 (최근 ${TIME_PERIOD_LABELS[timePeriod]})`;
      default: return '';
    }
  };

  // 모달 데이터
  const getModalData = () => {
    if (!modalType) return { up: [], down: [] };
    return changedCompanies[modalType];
  };

  return (
    <>
    <div className={styles.summaryCards}>
        {/* 전체 고객 */}
        <Card className={styles.card} padding="lg">
          <div className={styles.cardHeader}>
            <Text variant="body-sm" color="secondary">전체 고객</Text>
            <div className={`${styles.iconWrapper} ${styles.blue}`}>
              <Users size={18} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.valueRow}>
              <Text variant="h2" weight="bold">{stats.totalCustomers}</Text>
              <Text variant="body-md" color="secondary">개사</Text>
            </div>
          </div>
        </Card>

        {/* 총 계약금액 */}
        <Card className={styles.card} padding="lg">
          <div className={styles.cardHeader}>
            <Text variant="body-sm" color="secondary">총 계약금액</Text>
            <div className={`${styles.iconWrapper} ${styles.green}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.valueRow}>
              <Text variant="h2" weight="bold">{formatCompactCurrency(stats.totalContract)}</Text>
            </div>
          </div>
        </Card>

        {/* 예상 매출 */}
        <Card className={`${styles.card} ${styles.clickable}`} padding="lg" onClick={() => openModal('revenue')}>
          <div className={styles.cardHeader}>
            <Text variant="body-sm" color="secondary">예상 매출</Text>
            <div className={`${styles.iconWrapper} ${styles.purple}`}>
              <Target size={18} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.changeValueRow}>
              <span className={styles.pastValue}>
                <Text variant="h3" weight="bold" mono>{formatCompactCurrency(stats.pastExpectedRevenue)}</Text>
              </span>
              <ArrowRight size={14} className={styles.arrowIcon} />
              <Text 
                variant="h3" 
                weight="bold" 
                mono
                color={stats.currentExpectedRevenue > stats.pastExpectedRevenue ? 'success' : stats.currentExpectedRevenue < stats.pastExpectedRevenue ? 'error' : 'primary'}
              >
                {formatCompactCurrency(stats.currentExpectedRevenue)}
              </Text>
            </div>
            <div className={styles.trendBadges}>
              <span className={`${styles.trendBadge} ${styles.up}`}>
                <TrendingUp size={10} /> {changedCompanies.revenue.up.length}
              </span>
              <span className={`${styles.trendBadge} ${styles.down}`}>
                <TrendingDown size={10} /> {changedCompanies.revenue.down.length}
                </span>
            </div>
            <Text variant="caption" color="tertiary">클릭하여 상세 보기</Text>
          </div>
        </Card>

        {/* 신뢰지수 변동 */}
        <Card className={`${styles.card} ${styles.clickable}`} padding="lg" onClick={() => openModal('trust')}>
        <div className={styles.cardHeader}>
            <Text variant="body-sm" color="secondary">신뢰지수 변동</Text>
            <div className={`${styles.iconWrapper} ${styles.cyan}`}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.valueRow}>
              <Text variant="h2" weight="bold" color="success">+{stats.trustTrend.up}</Text>
              <Text variant="h3" color="error" className={styles.secondaryValue}>-{stats.trustTrend.down}</Text>
            </div>
            <Text variant="caption" color="tertiary">최근 {TIME_PERIOD_LABELS[timePeriod]} · 클릭하여 상세 보기</Text>
          </div>
        </Card>

        {/* 가능성 변동 */}
        <Card className={`${styles.card} ${styles.clickable}`} padding="lg" onClick={() => openModal('possibility')}>
          <div className={styles.cardHeader}>
            <Text variant="body-sm" color="secondary">가능성 변동</Text>
            <div className={`${styles.iconWrapper} ${styles.orange}`}>
              <Percent size={18} />
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.valueRow}>
              <Text variant="h2" weight="bold" color="success">+{stats.possibilityTrend.up}</Text>
              <Text variant="h3" color="error" className={styles.secondaryValue}>-{stats.possibilityTrend.down}</Text>
            </div>
            <Text variant="caption" color="tertiary">최근 {TIME_PERIOD_LABELS[timePeriod]} · 클릭하여 상세 보기</Text>
          </div>
        </Card>
      </div>

      {/* 상세 모달 */}
      <Modal isOpen={modalType !== null} onClose={closeModal} title={getModalTitle()} size="lg">
        <div className={styles.detailModal}>
          {/* 상승 섹션 */}
          <div className={styles.modalSection}>
            <div className={styles.sectionHeader}>
              <TrendingUp size={16} className={styles.upIcon} />
              <Text variant="body-md" weight="semibold" color="success">
                상승 ({getModalData().up.length}개사)
              </Text>
            </div>
            <div className={styles.companyList}>
              {getModalData().up.map((customer) => {
                const recentAction = getRecentAction(customer);
                return (
                  <button 
                    key={customer.no} 
                    className={styles.companyItem}
                    onClick={() => openCompanyDetail(customer)}
                    title="클릭하여 상세 히스토리 보기"
                  >
                    <div className={styles.companyInfo}>
                      <Text variant="body-sm" weight="medium">{customer.companyName}</Text>
                      <Text variant="caption" color="tertiary">{customer.manager}</Text>
                    </div>
                    <div className={styles.changeDetails}>
                      {modalType === 'revenue' && customer._periodData && (
                        <>
                          <div className={styles.changeRow}>
                            <Text variant="caption" color="tertiary">예상매출:</Text>
                            <Text variant="caption" color="tertiary" mono>
                              {formatCompactCurrency(customer._periodData.pastExpectedRevenue)}
                            </Text>
                            <ArrowRight size={10} />
                            <Text variant="body-sm" weight="medium" color="success" mono>
                              {formatCompactCurrency(customer._periodData.currentExpectedRevenue)}
                            </Text>
                          </div>
                          {customer._periodData.pastPossibility !== customer.adoptionDecision.possibility && (
                            <div className={styles.changeRow}>
                              <Text variant="caption" color="tertiary">가능성:</Text>
                              <Badge variant="default" size="sm">{customer._periodData.pastPossibility}</Badge>
                              <ArrowRight size={10} />
                              <Badge variant="success" size="sm">{customer.adoptionDecision.possibility}</Badge>
                            </div>
                          )}
                          {recentAction && (
                            <div className={styles.actionRow}>
                              {recentAction.type === 'call' ? <Phone size={10} /> : <UsersIcon size={10} />}
                              <Text variant="caption" color="secondary">
                                {recentAction.date} · {recentAction.content.length > 20 ? recentAction.content.slice(0, 20) + '...' : recentAction.content}
                              </Text>
                            </div>
                          )}
                        </>
                      )}
                      {modalType === 'trust' && (
                        <div className={styles.changeRow}>
                          <Text variant="caption" color="tertiary" mono>
                            {customer._periodData?.pastTrustIndex ?? '-'}
                          </Text>
                          <ArrowRight size={10} />
                          <Text variant="body-sm" weight="medium" color="success" mono>
                            {customer.trustIndex}
                          </Text>
                          <Badge variant="success" size="sm">+{customer.changeAmount}</Badge>
                        </div>
                      )}
                      {modalType === 'possibility' && customer._periodData && (
                        <>
                          <div className={styles.changeRow}>
                            <Badge variant="default" size="sm">{customer._periodData.pastPossibility}</Badge>
                            <ArrowRight size={10} />
                            <Badge variant="success" size="sm">{customer.adoptionDecision.possibility}</Badge>
                          </div>
                          {recentAction && (
                            <div className={styles.actionRow}>
                              {recentAction.type === 'call' ? <Phone size={10} /> : <UsersIcon size={10} />}
                              <Text variant="caption" color="secondary">
                                {recentAction.date} · {recentAction.content.length > 20 ? recentAction.content.slice(0, 20) + '...' : recentAction.content}
                              </Text>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
              {getModalData().up.length === 0 && (
                <Text variant="body-sm" color="tertiary" className={styles.emptyText}>상승한 고객이 없습니다.</Text>
              )}
            </div>
          </div>

          {/* 하락 섹션 */}
          <div className={styles.modalSection}>
            <div className={styles.sectionHeader}>
              <TrendingDown size={16} className={styles.downIcon} />
              <Text variant="body-md" weight="semibold" color="error">
                하락 ({getModalData().down.length}개사)
              </Text>
            </div>
            <div className={styles.companyList}>
              {getModalData().down.map((customer) => {
                const recentAction = getRecentAction(customer);
                return (
                  <button 
                    key={customer.no} 
                    className={styles.companyItem}
                    onClick={() => openCompanyDetail(customer)}
                    title="클릭하여 상세 히스토리 보기"
                  >
                    <div className={styles.companyInfo}>
                      <Text variant="body-sm" weight="medium">{customer.companyName}</Text>
                      <Text variant="caption" color="tertiary">{customer.manager}</Text>
                    </div>
                    <div className={styles.changeDetails}>
                      {modalType === 'revenue' && customer._periodData && (
                        <>
                          <div className={styles.changeRow}>
                            <Text variant="caption" color="tertiary">예상매출:</Text>
                            <Text variant="caption" color="tertiary" mono>
                              {formatCompactCurrency(customer._periodData.pastExpectedRevenue)}
                            </Text>
                            <ArrowRight size={10} />
                            <Text variant="body-sm" weight="medium" color="error" mono>
                              {formatCompactCurrency(customer._periodData.currentExpectedRevenue)}
                            </Text>
                          </div>
                          {customer._periodData.pastPossibility !== customer.adoptionDecision.possibility && (
                            <div className={styles.changeRow}>
                              <Text variant="caption" color="tertiary">가능성:</Text>
                              <Badge variant="default" size="sm">{customer._periodData.pastPossibility}</Badge>
                              <ArrowRight size={10} />
                              <Badge variant="error" size="sm">{customer.adoptionDecision.possibility}</Badge>
                            </div>
                          )}
                          {recentAction && (
                            <div className={styles.actionRow}>
                              {recentAction.type === 'call' ? <Phone size={10} /> : <UsersIcon size={10} />}
                              <Text variant="caption" color="secondary">
                                {recentAction.date} · {recentAction.content.length > 20 ? recentAction.content.slice(0, 20) + '...' : recentAction.content}
                              </Text>
                            </div>
                          )}
                        </>
                      )}
                      {modalType === 'trust' && (
                        <div className={styles.changeRow}>
                          <Text variant="caption" color="tertiary" mono>
                            {customer._periodData?.pastTrustIndex ?? '-'}
                          </Text>
                          <ArrowRight size={10} />
                          <Text variant="body-sm" weight="medium" color="error" mono>
                            {customer.trustIndex}
                          </Text>
                          <Badge variant="error" size="sm">-{customer.changeAmount}</Badge>
                        </div>
                      )}
                      {modalType === 'possibility' && customer._periodData && (
                        <>
                          <div className={styles.changeRow}>
                            <Badge variant="default" size="sm">{customer._periodData.pastPossibility}</Badge>
                            <ArrowRight size={10} />
                            <Badge variant="error" size="sm">{customer.adoptionDecision.possibility}</Badge>
                          </div>
                          {recentAction && (
                            <div className={styles.actionRow}>
                              {recentAction.type === 'call' ? <Phone size={10} /> : <UsersIcon size={10} />}
                              <Text variant="caption" color="secondary">
                                {recentAction.date} · {recentAction.content.length > 20 ? recentAction.content.slice(0, 20) + '...' : recentAction.content}
                              </Text>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
              {getModalData().down.length === 0 && (
                <Text variant="body-sm" color="tertiary" className={styles.emptyText}>하락한 고객이 없습니다.</Text>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* 회사 상세 히스토리 모달 */}
      <Modal 
        isOpen={selectedCompany !== null} 
        onClose={closeCompanyDetail} 
        title={selectedCompany?.companyName || ''} 
        size="lg"
      >
        {selectedCompany && (() => {
          const actionsInPeriod = getActionsInPeriod(selectedCompany, timePeriod);
          return (
            <div className={styles.companyDetailModal}>
              {/* 헤더 - 뒤로가기 */}
              <button className={styles.backButton} onClick={closeCompanyDetail}>
                <ChevronLeft size={16} />
                <Text variant="body-sm" color="secondary">목록으로 돌아가기</Text>
              </button>

              {/* 요약 정보 */}
              <div className={styles.companySummary}>
                <div className={styles.summaryItem}>
                  <Text variant="caption" color="tertiary">담당자</Text>
                  <Text variant="body-sm" weight="medium">{selectedCompany.manager}</Text>
                </div>
                <div className={styles.summaryItem}>
                  <Text variant="caption" color="tertiary">카테고리</Text>
                  <Badge variant="default" size="sm">{selectedCompany.category}</Badge>
                </div>
                <div className={styles.summaryItem}>
                  <Text variant="caption" color="tertiary">현재 가능성</Text>
                  <Badge 
                    variant={selectedCompany.adoptionDecision.possibility === '90%' ? 'success' : selectedCompany.adoptionDecision.possibility === '40%' ? 'warning' : 'error'} 
                    size="sm"
                  >
                    {selectedCompany.adoptionDecision.possibility}
                  </Badge>
                </div>
              </div>

              {/* 변화 요약 */}
              <div className={styles.changesSummary}>
                <Text variant="body-md" weight="semibold">최근 {TIME_PERIOD_LABELS[timePeriod]} 변화</Text>
                <div className={styles.changesGrid}>
                  {modalType === 'revenue' && selectedCompany._periodData && (
                    <>
                      <div className={styles.changeCard}>
                        <Text variant="caption" color="tertiary">예상 매출</Text>
                        <div className={styles.changeValueDisplay}>
                          <Text variant="body-sm" color="tertiary" mono>
                            {formatCompactCurrency(selectedCompany._periodData.pastExpectedRevenue)}
                          </Text>
                          <ArrowRight size={12} />
                          <Text 
                            variant="body-md" 
                            weight="bold" 
                            mono
                            color={selectedCompany._periodData.currentExpectedRevenue > selectedCompany._periodData.pastExpectedRevenue ? 'success' : 'error'}
                          >
                            {formatCompactCurrency(selectedCompany._periodData.currentExpectedRevenue)}
                          </Text>
                        </div>
                      </div>
                      <div className={styles.changeCard}>
                        <Text variant="caption" color="tertiary">가능성</Text>
                        <div className={styles.changeValueDisplay}>
                          <Badge variant="default" size="sm">{selectedCompany._periodData.pastPossibility}</Badge>
                          <ArrowRight size={12} />
                          <Badge 
                            variant={selectedCompany.adoptionDecision.possibility === '90%' ? 'success' : selectedCompany.adoptionDecision.possibility === '40%' ? 'warning' : 'error'} 
                            size="sm"
                          >
                            {selectedCompany.adoptionDecision.possibility}
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                  {modalType === 'trust' && selectedCompany._periodData && (
                    <div className={styles.changeCard}>
                      <Text variant="caption" color="tertiary">신뢰지수</Text>
                      <div className={styles.changeValueDisplay}>
                        <Text variant="body-sm" color="tertiary" mono>
                          {selectedCompany._periodData.pastTrustIndex}
                        </Text>
                        <ArrowRight size={12} />
                        <Text 
                          variant="body-md" 
                          weight="bold" 
                          mono
                          color={selectedCompany.changeDirection === 'up' ? 'success' : 'error'}
                        >
                          {selectedCompany.trustIndex}
                        </Text>
                        <Badge 
                          variant={selectedCompany.changeDirection === 'up' ? 'success' : 'error'} 
                          size="sm"
                        >
                          {selectedCompany.changeDirection === 'up' ? '+' : '-'}{selectedCompany.changeAmount}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {modalType === 'possibility' && selectedCompany._periodData && (
                    <div className={styles.changeCard}>
                      <Text variant="caption" color="tertiary">가능성</Text>
                      <div className={styles.changeValueDisplay}>
                        <Badge variant="default" size="sm">{selectedCompany._periodData.pastPossibility}</Badge>
                        <ArrowRight size={12} />
                        <Badge 
                          variant={selectedCompany.adoptionDecision.possibility === '90%' ? 'success' : selectedCompany.adoptionDecision.possibility === '40%' ? 'warning' : 'error'} 
                          size="sm"
                        >
                          {selectedCompany.adoptionDecision.possibility}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 신뢰지수 변동: 콘텐츠 소비 히스토리 */}
              {modalType === 'trust' && (() => {
                const contentsInPeriod = getContentsInPeriod(selectedCompany, timePeriod);
                return (
                  <div className={styles.actionsHistory}>
                    <div className={styles.actionsHeader}>
                      <BookOpen size={16} />
                      <Text variant="body-md" weight="semibold">콘텐츠 소비 히스토리</Text>
                      <Badge variant="default" size="sm">{contentsInPeriod.length}건</Badge>
                    </div>
                    <Text variant="caption" color="tertiary" className={styles.historyDesc}>
                      TOFU/MOFU/BOFU 콘텐츠 조회 시 신뢰지수가 증가합니다.
                    </Text>
                    <div className={styles.actionsList}>
                      {contentsInPeriod.map((content, idx) => (
                        <div key={idx} className={styles.actionItem}>
                          <div className={styles.actionDate}>
                            <Text variant="caption" weight="medium">{content.date}</Text>
                          </div>
                          <div className={styles.actionContent}>
                            <div className={styles.actionType}>
                              <BookOpen size={14} />
                              <Badge 
                                variant={content.category === 'BOFU' ? 'success' : content.category === 'MOFU' ? 'warning' : 'cyan'} 
                                size="sm"
                              >
                                {content.category}
                              </Badge>
                              <Badge variant="success" size="sm">+{CONTENT_TRUST_POINTS[content.category]}p</Badge>
                            </div>
                            <Text variant="body-sm">{content.title}</Text>
                          </div>
                        </div>
                      ))}
                      {contentsInPeriod.length === 0 && (
                        <div className={styles.emptyActions}>
                          <Text variant="body-sm" color="tertiary">해당 기간 내 조회한 콘텐츠가 없습니다.</Text>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 예상 매출/가능성 변동: 영업 액션 히스토리 */}
              {(modalType === 'revenue' || modalType === 'possibility') && (
                <div className={styles.actionsHistory}>
                  <div className={styles.actionsHeader}>
                    <Calendar size={16} />
                    <Text variant="body-md" weight="semibold">영업 액션 히스토리</Text>
                    <Badge variant="default" size="sm">{actionsInPeriod.length}건</Badge>
                  </div>
                  <Text variant="caption" color="tertiary" className={styles.historyDesc}>
                    영업 액션(콜/미팅)에 따라 가능성과 고객반응이 변경됩니다.
                  </Text>
                  <div className={styles.actionsList}>
                    {actionsInPeriod.map((action, idx) => (
                      <div key={idx} className={styles.actionItem}>
                        <div className={styles.actionDate}>
                          <Text variant="caption" weight="medium">{action.date}</Text>
                        </div>
                        <div className={styles.actionContent}>
                          <div className={styles.actionType}>
                            {action.type === 'call' ? <Phone size={14} /> : <UsersIcon size={14} />}
                            <Badge variant={action.type === 'call' ? 'cyan' : 'purple'} size="sm">
                              {action.type === 'call' ? '콜' : '미팅'}
                            </Badge>
                          </div>
                          <Text variant="body-sm">{action.content}</Text>
                          {action.possibility && action.customerResponse && (
                            <div className={styles.actionResult}>
                              <Text variant="caption" color="tertiary">결과:</Text>
                              <Badge 
                                variant={action.possibility === '90%' ? 'success' : action.possibility === '40%' ? 'warning' : 'error'} 
                                size="sm"
                              >
                                가능성 {action.possibility}
                              </Badge>
                              <Badge 
                                variant={action.customerResponse === '상' ? 'success' : action.customerResponse === '중' ? 'warning' : 'error'} 
                                size="sm"
                              >
                                고객반응 {action.customerResponse}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {actionsInPeriod.length === 0 && (
                      <div className={styles.emptyActions}>
                        <Text variant="body-sm" color="tertiary">해당 기간 내 영업 액션이 없습니다.</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
    </div>
          );
        })()}
      </Modal>
    </>
  );
};
