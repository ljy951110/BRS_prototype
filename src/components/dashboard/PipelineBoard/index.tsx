import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, FlaskConical, FileText, ThumbsUp, FileCheck, ArrowRight } from 'lucide-react';
import { Text, Card, Badge } from '@/components/common/atoms';
import { Customer } from '@/types/customer';
import { formatCompactCurrency } from '@/data/mockData';
import type { TimePeriodType } from '@/App';
import styles from './index.module.scss';

interface PipelineBoardProps {
  data: Customer[];
  timePeriod: TimePeriodType;
}

// 진행 상태 기준 단계
type DealStage = 'test' | 'quote' | 'approval' | 'contract';

const STAGE_CONFIG: Record<DealStage, { title: string; icon: React.ElementType; color: string; description: string }> = {
  test: { title: '테스트', icon: FlaskConical, color: 'purple', description: '파일럿 테스트 진행 중' },
  quote: { title: '견적', icon: FileText, color: 'blue', description: '견적서 발송/검토 중' },
  approval: { title: '승인', icon: ThumbsUp, color: 'orange', description: '내부 승인 대기 중' },
  contract: { title: '계약', icon: FileCheck, color: 'green', description: '계약 체결 완료' },
};

const TrendIcon = ({ direction }: { direction: Customer['changeDirection'] }) => {
  if (direction === 'up') return <TrendingUp size={12} className={styles.trendUp} />;
  if (direction === 'down') return <TrendingDown size={12} className={styles.trendDown} />;
  return <Minus size={12} className={styles.trendNone} />;
};

const getCategoryVariant = (category: string) => {
  switch (category) {
    case "채용":
      return "info";
    case "공공":
      return "purple";
    case "성과":
      return "cyan";
    default:
      return "default";
  }
};

export const PipelineBoard = ({ data, timePeriod }: PipelineBoardProps) => {
  void timePeriod; // 기간 필터 (데이터는 이미 App에서 처리됨)
  
  // 진행 상태별로 고객 분류
  const stageData = useMemo(() => {
    const stages: Record<DealStage, Customer[]> = {
      test: [],
      quote: [],
      approval: [],
      contract: [],
    };

    data.forEach(customer => {
      const ad = customer.adoptionDecision;
      
      // 가장 최신 진행 상태 기준으로 분류 (역순으로 체크)
      if (ad.contract) {
        stages.contract.push(customer);
      } else if (ad.approval) {
        stages.approval.push(customer);
      } else if (ad.quote) {
        stages.quote.push(customer);
      } else if (ad.test) {
        stages.test.push(customer);
      }
      // test도 false인 경우는 표시하지 않음 (아직 파이프라인에 없음)
    });

    // 각 단계 내에서 예상매출로 정렬 (높은 순)
    Object.keys(stages).forEach(key => {
      stages[key as DealStage].sort((a, b) => {
        const aRev = (a.adoptionDecision.targetRevenue || 0) * (parseFloat(a.adoptionDecision.possibility) / 100);
        const bRev = (b.adoptionDecision.targetRevenue || 0) * (parseFloat(b.adoptionDecision.possibility) / 100);
        return bRev - aRev;
      });
    });

    return stages;
  }, [data]);

  // 단계별 통계
  const stageStats = useMemo(() => {
    const stats: Record<DealStage, { count: number; revenue: number }> = {
      test: { count: 0, revenue: 0 },
      quote: { count: 0, revenue: 0 },
      approval: { count: 0, revenue: 0 },
      contract: { count: 0, revenue: 0 },
    };

    Object.entries(stageData).forEach(([stage, customers]) => {
      const possibilityMultiplier = stage === 'contract' ? 1 : 
        stage === 'approval' ? 0.9 : 
        stage === 'quote' ? 0.4 : 0.2;
      
      stats[stage as DealStage] = {
        count: customers.length,
        revenue: customers.reduce((sum, c) => {
          const targetRev = c.adoptionDecision?.targetRevenue || c.contractAmount || 0;
          return sum + (targetRev * possibilityMultiplier);
        }, 0),
      };
    });

    return stats;
  }, [stageData]);

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
    <div className={styles.pipelineBoard}>
      {(Object.keys(STAGE_CONFIG) as DealStage[]).map(stage => {
        const config = STAGE_CONFIG[stage];
        const customers = stageData[stage];
        const stats = stageStats[stage];

        return (
          <div key={stage} className={styles.column}>
            {/* Column Header */}
            <div className={`${styles.columnHeader} ${styles[config.color]}`}>
              <div className={styles.headerTop}>
                <div className={styles.headerTitle}>
                  <config.icon size={18} />
                  <Text variant="body-md" weight="semibold">{config.title}</Text>
                </div>
                <Badge variant="default" size="sm">{stats.count}</Badge>
              </div>
              <div className={styles.headerStats}>
                <Text variant="caption" color="secondary">
                  예상: {formatCompactCurrency(stats.revenue)}
                </Text>
              </div>
            </div>

            {/* Cards List */}
            <div className={styles.cardsList}>
              {customers.map(customer => {
                const ad = customer.adoptionDecision;
                const periodData = customer._periodData;
                const currentExpectedRevenue = periodData?.currentExpectedRevenue || 
                  (ad.targetRevenue || 0) * (parseFloat(ad.possibility) / 100);
                const pastExpectedRevenue = periodData?.pastExpectedRevenue;
                const pastPossibility = periodData?.pastPossibility;
                const pastTrustIndex = periodData?.pastTrustIndex;
                
                const hasExpectedRevenueChange = pastExpectedRevenue !== undefined && 
                  pastExpectedRevenue !== currentExpectedRevenue;
                const hasPossibilityChange = pastPossibility !== undefined && 
                  pastPossibility !== ad.possibility;
                const hasTrustChange = pastTrustIndex !== undefined && 
                  pastTrustIndex !== customer.trustIndex;
                
                return (
                  <Card key={customer.no} className={styles.customerCard} padding="md">
                    <div className={styles.cardHeader}>
                      <div className={styles.companyInfo}>
                        <Text variant="body-sm" weight="medium">{customer.companyName}</Text>
                      </div>
                      {/* 가능성: 과거 → 현재 */}
                      <div className={styles.possibilityValue}>
                        {hasPossibilityChange && pastPossibility && (
                          <>
                            <Badge variant={getPossibilityVariant(pastPossibility)} size="sm" className={styles.pastBadge}>
                              {pastPossibility}
                            </Badge>
                            <ArrowRight size={10} className={styles.arrowIcon} />
                          </>
                        )}
                        <Badge variant={getPossibilityVariant(ad.possibility)} size="sm">
                          {ad.possibility}
                        </Badge>
                      </div>
                    </div>

                    <div className={styles.cardMeta}>
                      <Badge variant={getCategoryVariant(customer.category)} size="sm">
                        {customer.category}
                      </Badge>
                      <Text variant="caption" color="secondary">{customer.manager}</Text>
                    </div>

                    {/* 예상매출: 과거 → 현재 */}
                    <div className={styles.revenueRow}>
                      <Text variant="caption" color="tertiary">예상매출</Text>
                      <div className={styles.valueChange}>
                        {hasExpectedRevenueChange && pastExpectedRevenue !== undefined && (
                          <>
                            <Text variant="caption" mono className={styles.pastValue}>
                              {formatCompactCurrency(pastExpectedRevenue)}
                            </Text>
                            <ArrowRight size={10} className={styles.arrowIcon} />
                          </>
                        )}
                        <Text 
                          variant="body-sm" 
                          mono 
                          weight="semibold"
                          color={hasExpectedRevenueChange ? 
                            (currentExpectedRevenue > (pastExpectedRevenue || 0) ? 'success' : 'error') : 
                            'primary'}
                        >
                          {formatCompactCurrency(currentExpectedRevenue)}
                        </Text>
                        {hasExpectedRevenueChange && (
                          <TrendIcon direction={currentExpectedRevenue > (pastExpectedRevenue || 0) ? 'up' : 'down'} />
                        )}
                      </div>
                    </div>

                    {/* 신뢰지수: 과거 → 현재 */}
                    <div className={styles.trustRow}>
                      <div className={styles.trustValue}>
                        <Text variant="caption" color="tertiary">신뢰</Text>
                        <div className={styles.valueChange}>
                          {hasTrustChange && pastTrustIndex !== undefined && (
                            <>
                              <Text variant="caption" mono className={styles.pastValue}>
                                {pastTrustIndex}
                              </Text>
                              <ArrowRight size={10} className={styles.arrowIcon} />
                            </>
                          )}
                          <Text 
                            variant="body-sm" 
                            mono
                            color={hasTrustChange ? 
                              ((customer.trustIndex || 0) > (pastTrustIndex || 0) ? 'success' : 'error') : 
                              'primary'}
                          >
                            {customer.trustIndex}
                          </Text>
                          {hasTrustChange && (
                            <TrendIcon direction={customer.changeDirection} />
                          )}
                        </div>
                      </div>
                      <Badge variant={getTrustLevelVariant(customer.trustLevel)} size="sm">
                        {customer.trustLevel}
                      </Badge>
                    </div>

                    {/* Progress indicators */}
                    <div className={styles.progressRow}>
                      <span className={`${styles.progressDot} ${ad.test ? styles.completed : ''}`} title="테스트" />
                      <span className={`${styles.progressDot} ${ad.quote ? styles.completed : ''}`} title="견적" />
                      <span className={`${styles.progressDot} ${ad.approval ? styles.completed : ''}`} title="승인" />
                      <span className={`${styles.progressDot} ${ad.contract ? styles.completed : ''}`} title="계약" />
                    </div>
                  </Card>
                );
              })}

              {customers.length === 0 && (
                <div className={styles.emptyState}>
                  <Text variant="body-sm" color="tertiary">해당 단계 고객 없음</Text>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
