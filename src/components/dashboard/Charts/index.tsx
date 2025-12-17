import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { Text, Card } from '@/components/common/atoms';
import { Customer } from '@/types/customer';
import { formatCompactCurrency, getDataWithPeriodChange } from '@/data/mockData';
import type { TimePeriodType } from '@/types/common';
import styles from './index.module.scss';

interface ChartsProps {
  data: Customer[];
  timePeriod: TimePeriodType;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  cyan: '#06b6d4',
  pink: '#ec4899',
};

const PIE_COLORS = [COLORS.success, COLORS.warning, COLORS.error];

const TIME_PERIOD_LABELS: Record<TimePeriodType, string> = {
  '1w': '1주일',
  '1m': '1개월',
  '6m': '6개월',
  '1y': '1년',
};

// 기간에 따른 주 수 매핑
const PERIOD_WEEKS: Record<TimePeriodType, number> = {
  '1w': 1,
  '1m': 4,
  '6m': 26,
  '1y': 52,
};

export const Charts = ({ data, timePeriod }: ChartsProps) => {
  // 기간에 맞게 변화량 재계산
  const periodData = useMemo(() => getDataWithPeriodChange(data, timePeriod), [data, timePeriod]);
  // 담당자별 계약금액
  const revenueByManager = useMemo(() => {
    const grouped = data.reduce((acc, c) => {
      acc[c.manager] = (acc[c.manager] || 0) + (c.contractAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // 가능성별 분포
  const possibilityDistribution = useMemo(() => {
    const counts = { '90%': 0, '40%': 0, '0%': 0 };
    data.forEach(c => {
      const p = c.adoptionDecision.possibility;
      if (p in counts) counts[p as keyof typeof counts]++;
    });
    return [
      { name: '높음 (90%)', value: counts['90%'] },
      { name: '중간 (40%)', value: counts['40%'] },
      { name: '낮음 (0%)', value: counts['0%'] },
    ];
  }, [data]);

  // 신뢰등급별 분포 (필요시 활성화)
  // const trustLevelDistribution = useMemo(() => {
  //   const counts = { P1: 0, P2: 0, P3: 0 };
  //   data.forEach(c => {
  //     if (c.trustLevel && c.trustLevel in counts) {
  //       counts[c.trustLevel as keyof typeof counts]++;
  //     }
  //   });
  //   return [
  //     { name: 'P1 (우수)', value: counts.P1, fill: COLORS.success },
  //     { name: 'P2 (보통)', value: counts.P2, fill: COLORS.warning },
  //     { name: 'P3 (관심)', value: counts.P3, fill: COLORS.error },
  //   ];
  // }, [data]);

  // 주간 신뢰지수 트렌드 (기간에 따라 표시할 주 수 결정)
  const weeklyTrustTrend = useMemo(() => {
    const allWeeks = ['1104', '1111', '1118', '1125', '1202', '1209'];
    const allWeekLabels = ['11/04', '11/11', '11/18', '11/25', '12/02', '12/09'];
    
    // 기간에 따라 보여줄 주 수 결정 (최소 2주, 최대 전체 주)
    const weeksToShow = Math.min(PERIOD_WEEKS[timePeriod] + 1, allWeeks.length);
    const startIndex = Math.max(0, allWeeks.length - weeksToShow);
    
    const weeks = allWeeks.slice(startIndex);
    const weekLabels = allWeekLabels.slice(startIndex);
    
    return weeks.map((week, i) => {
      let totalIndex = 0;
      let count = 0;
      let p1Count = 0;
      let p2Count = 0;
      let p3Count = 0;

      periodData.forEach(customer => {
        const history = customer.trustHistory?.[week];
        if (history) {
          totalIndex += history.trustIndex;
          count++;
          if (history.trustLevel === 'P1') p1Count++;
          else if (history.trustLevel === 'P2') p2Count++;
          else if (history.trustLevel === 'P3') p3Count++;
        }
      });

      return {
        week: weekLabels[i],
        avgIndex: count > 0 ? Math.round(totalIndex / count) : 0,
        P1: p1Count,
        P2: p2Count,
        P3: p3Count,
      };
    });
  }, [periodData, timePeriod]);

  // 카테고리별 계약금액
  const revenueByCategory = useMemo(() => {
    const grouped = data.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + (c.contractAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // 컨텐츠 퍼널 분석
  const contentFunnelData = useMemo(() => {
    const funnelCounts = { TOFU: 0, MOFU: 0, BOFU: 0 };
    
    periodData.forEach(customer => {
      customer.contentEngagements?.forEach(engagement => {
        funnelCounts[engagement.category]++;
      });
    });

    return [
      { name: 'TOFU (인지)', value: funnelCounts.TOFU, fill: COLORS.primary },
      { name: 'MOFU (고려)', value: funnelCounts.MOFU, fill: COLORS.secondary },
      { name: 'BOFU (결정)', value: funnelCounts.BOFU, fill: COLORS.success },
    ];
  }, [periodData]);

  // 기간별 신뢰지수 변동 분포 (상승/유지/하락)
  const trustChangeDistribution = useMemo(() => {
    const upCount = periodData.filter(c => c.changeDirection === 'up').length;
    const noneCount = periodData.filter(c => c.changeDirection === 'none').length;
    const downCount = periodData.filter(c => c.changeDirection === 'down').length;

    return [
      { name: '상승', value: upCount, fill: COLORS.success },
      { name: '유지', value: noneCount, fill: COLORS.warning },
      { name: '하락', value: downCount, fill: COLORS.error },
    ];
  }, [periodData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <Text variant="body-sm" weight="semibold">{label}</Text>
          {payload.map((entry: any, index: number) => (
            <span key={index} className={styles.tooltipEntry} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
                ? formatCompactCurrency(entry.value) 
                : entry.value}
            </span>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartsGrid}>
      {/* 담당자별 계약금액 */}
      <Card className={styles.chartCard} padding="lg">
        <Text variant="body-md" weight="semibold" className={styles.chartTitle}>
          담당자별 계약금액
        </Text>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByManager} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                type="number"
                tickFormatter={(v) => formatCompactCurrency(v)}
                stroke="var(--color-text-tertiary)"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="var(--color-text-tertiary)"
                fontSize={12}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 가능성별 분포 */}
      <Card className={styles.chartCard} padding="lg">
        <Text variant="body-md" weight="semibold" className={styles.chartTitle}>
          도입 가능성 분포
        </Text>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={possibilityDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {possibilityDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 주간 신뢰지수 트렌드 */}
      <Card className={`${styles.chartCard} ${styles.wideChart}`} padding="lg">
        <Text variant="body-md" weight="semibold" className={styles.chartTitle}>
          평균 신뢰지수 트렌드 (최근 {TIME_PERIOD_LABELS[timePeriod]})
        </Text>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyTrustTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="week" stroke="var(--color-text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--color-text-tertiary)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="avgIndex"
                name="평균 신뢰지수"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 신뢰등급별 추이 */}
      <Card className={`${styles.chartCard} ${styles.wideChart}`} padding="lg">
        <Text variant="body-md" weight="semibold" className={styles.chartTitle}>
          신뢰등급 분포 추이 (최근 {TIME_PERIOD_LABELS[timePeriod]})
        </Text>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTrustTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="week" stroke="var(--color-text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--color-text-tertiary)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="P1" name="P1 (우수)" stroke={COLORS.success} strokeWidth={2} />
              <Line type="monotone" dataKey="P2" name="P2 (보통)" stroke={COLORS.warning} strokeWidth={2} />
              <Line type="monotone" dataKey="P3" name="P3 (관심)" stroke={COLORS.error} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 카테고리별 계약금액 */}
      <Card className={styles.chartCard} padding="lg">
        <Text variant="body-md" weight="semibold" className={styles.chartTitle}>
          카테고리별 계약금액
        </Text>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-text-tertiary)" fontSize={12} />
              <YAxis
                tickFormatter={(v) => formatCompactCurrency(v)}
                stroke="var(--color-text-tertiary)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 컨텐츠 퍼널 */}
      <Card className={styles.chartCard} padding="lg">
        <Text variant="body-md" weight="semibold" className={styles.chartTitle}>
          컨텐츠 퍼널 분석
        </Text>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contentFunnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--color-text-tertiary)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {contentFunnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 기간별 신뢰지수 변동 분포 */}
      <Card className={styles.chartCard} padding="lg">
        <Text variant="body-md" weight="semibold" className={styles.chartTitle}>
          신뢰지수 변동 분포 (최근 {TIME_PERIOD_LABELS[timePeriod]})
        </Text>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trustChangeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}개사`}
                labelLine={false}
              >
                {trustChangeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
