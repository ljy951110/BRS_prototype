import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Zap, CheckCircle2 } from 'lucide-react';
import { Text, Card, Badge } from '@/components/common/atoms';
import { Customer, PipelineStage } from '@/types/customer';
import { formatCompactCurrency } from '@/data/mockData';
import type { TimePeriod } from '@/App';
import styles from './index.module.scss';

interface PipelineBoardProps {
  data: Customer[];
  timePeriod: TimePeriod;
}

const STAGE_CONFIG: Record<PipelineStage, { title: string; icon: React.ElementType; color: string }> = {
  trustFormation: { title: '신뢰형성', icon: Target, color: 'purple' },
  valueRecognition: { title: '가치인식', icon: Zap, color: 'blue' },
  adoptionDecision: { title: '도입결정', icon: CheckCircle2, color: 'green' },
};

const TrendIcon = ({ direction }: { direction: Customer['changeDirection'] }) => {
  if (direction === 'up') return <TrendingUp size={12} className={styles.trendUp} />;
  if (direction === 'down') return <TrendingDown size={12} className={styles.trendDown} />;
  return <Minus size={12} className={styles.trendNone} />;
};

export const PipelineBoard = ({ data, timePeriod: _timePeriod }: PipelineBoardProps) => {
  void _timePeriod; // 향후 사용 예정
  // 단계별로 고객 분류
  const stageData = useMemo(() => {
    const stages: Record<PipelineStage, Customer[]> = {
      trustFormation: [],
      valueRecognition: [],
      adoptionDecision: [],
    };

    data.forEach(customer => {
      // 도입결정 가능성이 90%면 adoptionDecision 단계
      if (customer.adoptionDecision.possibility === '90%') {
        stages.adoptionDecision.push(customer);
      }
      // 가치인식 가능성이 90%이거나 40%면 valueRecognition 단계
      else if (customer.valueRecognition.possibility === '90%' || customer.valueRecognition.possibility === '40%') {
        stages.valueRecognition.push(customer);
      }
      // 나머지는 trustFormation 단계
      else {
        stages.trustFormation.push(customer);
      }
    });

    // 각 단계 내에서 신뢰지수로 정렬
    Object.keys(stages).forEach(key => {
      stages[key as PipelineStage].sort((a, b) => (b.trustIndex || 0) - (a.trustIndex || 0));
    });

    return stages;
  }, [data]);

  // 단계별 통계
  const stageStats = useMemo(() => {
    const stats: Record<PipelineStage, { count: number; revenue: number }> = {
      trustFormation: { count: 0, revenue: 0 },
      valueRecognition: { count: 0, revenue: 0 },
      adoptionDecision: { count: 0, revenue: 0 },
    };

    Object.entries(stageData).forEach(([stage, customers]) => {
      stats[stage as PipelineStage] = {
        count: customers.length,
        revenue: customers.reduce((sum, c) => {
          const stageObj = c[stage as PipelineStage];
          // adoptionDecision에만 targetRevenue가 있음
          const targetRev = stage === 'adoptionDecision' 
            ? (stageObj as Customer['adoptionDecision'])?.targetRevenue 
            : null;
          return sum + (targetRev || c.contractAmount || 0);
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

  const getResponseVariant = (response: string) => {
    switch (response) {
      case '상': return 'success';
      case '중': return 'warning';
      case '하': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className={styles.pipelineBoard}>
      {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map(stage => {
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
                const stageInfo = customer[stage];
                
                return (
                  <Card key={customer.no} className={styles.customerCard} padding="md">
                    <div className={styles.cardHeader}>
                      <div className={styles.companyInfo}>
                        <Text variant="body-sm" weight="medium">{customer.companyName}</Text>
                        {customer.hDot && <span className={styles.hDot} />}
                      </div>
                      <Badge variant={getTrustLevelVariant(customer.trustLevel)} size="sm">
                        {customer.trustLevel}
                      </Badge>
                    </div>

                    <div className={styles.cardMeta}>
                      <Text variant="caption" color="tertiary">{customer.manager}</Text>
                      <Text variant="caption" color="tertiary">·</Text>
                      <Text variant="caption" color="tertiary">{customer.category}</Text>
                    </div>

                    <div className={styles.trustRow}>
                      <div className={styles.trustValue}>
                        <Text variant="body-sm" mono weight="semibold">{customer.trustIndex}</Text>
                        <TrendIcon direction={customer.changeDirection} />
                      </div>
                      <Badge variant={getResponseVariant(stageInfo.customerResponse)} size="sm">
                        {stageInfo.customerResponse}
                      </Badge>
                    </div>

                    {stage === 'adoptionDecision' && 'targetRevenue' in stageInfo && stageInfo.targetRevenue && (
                      <div className={styles.revenueRow}>
                        <Text variant="caption" color="tertiary">목표매출</Text>
                        <Text variant="body-sm" mono>{formatCompactCurrency(stageInfo.targetRevenue)}</Text>
                      </div>
                    )}

                    {stageInfo.targetDate && (
                      <div className={styles.dateRow}>
                        <Text variant="caption" color="tertiary">목표일</Text>
                        <Text variant="caption">{stageInfo.targetDate}</Text>
                      </div>
                    )}

                    {/* Progress indicators for adoptionDecision */}
                    {stage === 'adoptionDecision' && (
                      <div className={styles.progressRow}>
                        <span className={`${styles.progressDot} ${customer.adoptionDecision.test ? styles.completed : ''}`} title="테스트" />
                        <span className={`${styles.progressDot} ${customer.adoptionDecision.quote ? styles.completed : ''}`} title="견적" />
                        <span className={`${styles.progressDot} ${customer.adoptionDecision.approval ? styles.completed : ''}`} title="승인" />
                        <span className={`${styles.progressDot} ${customer.adoptionDecision.contract ? styles.completed : ''}`} title="계약" />
                      </div>
                    )}
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
