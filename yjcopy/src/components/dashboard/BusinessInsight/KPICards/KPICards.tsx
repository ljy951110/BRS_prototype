import React, { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, HelpCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, Text, Modal, Badge } from "@/components/common/atoms";
import styles from "./KPICards.module.scss";

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
  onClick: () => void;
  status?: "normal" | "warning" | "danger";
}

const KPICardItem = ({
  title,
  value,
  subValue,
  trend,
  trendValue,
  onClick,
  status = "normal",
}: KPICardProps) => {
  return (
    <Card
      padding="md"
      className={`${styles.kpiCard} ${styles[status]}`}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <Text variant="body-sm" color="secondary">
          {title}
        </Text>
        {status === "warning" && <div className={styles.statusDot} />}
      </div>
      <div className={styles.cardBody}>
        <Text variant="h2" weight="bold">
          {value}
        </Text>
        {subValue && (
          <Text variant="body-sm" color="tertiary">
            {subValue}
          </Text>
        )}
      </div>
      <div className={styles.cardFooter}>
        {trend && (
          <div className={`${styles.trend} ${styles[trend]}`}>
            {trend === "up" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            <Text variant="caption" weight="medium">
              {trendValue}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

// 차트 색상
const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#eab308"];

// 기업 규모 옵션
const COMPANY_SIZE_OPTIONS = ["전체", "T0 (대기업)", "T1 (중견)", "T2 (중소)", "T3 (소기업)"];

// 각 KPI별 더미 데이터
const modalData = {
  total_customers: {
    title: "고객 구성 요약",
    companySizeData: [
      { name: "T0 (대기업)", value: 120, color: "#3b82f6" },
      { name: "T1 (중견)", value: 180, color: "#22c55e" },
      { name: "T2 (중소)", value: 250, color: "#f97316" },
      { name: "T3 (소기업)", value: 150, color: "#a855f7" },
    ],
    productData: [
      { name: "채용", value: 320 },
      { name: "공공", value: 180 },
      { name: "성과", value: 120 },
      { name: "기타", value: 80 },
    ],
    weeklyTrendData: [
      { week: "11월 1주", total: 665, t0: 115, t1: 170, t2: 240, t3: 140 },
      { week: "11월 2주", total: 678, t0: 117, t1: 173, t2: 243, t3: 145 },
      { week: "11월 3주", total: 685, t0: 118, t1: 175, t2: 245, t3: 147 },
      { week: "11월 4주", total: 692, t0: 119, t1: 177, t2: 248, t3: 148 },
      { week: "12월 1주", total: 700, t0: 120, t1: 180, t2: 250, t3: 150 },
    ],
    insight: "최근 채용 신규 고객 유입이 전체 고객 수 증가를 견인했습니다.",
  },
  mbm_status: {
    title: "MBM 현황 상세",
    statusData: {
      all: { invited: 700, participated: 50, followup: 50, stagnant: 0, closed: 3 },
      "T0 (대기업)": { invited: 120, participated: 10, followup: 10, stagnant: 0, closed: 1 },
      "T1 (중견)": { invited: 180, participated: 15, followup: 15, stagnant: 0, closed: 1 },
      "T2 (중소)": { invited: 250, participated: 15, followup: 15, stagnant: 0, closed: 1 },
      "T3 (소기업)": { invited: 150, participated: 10, followup: 10, stagnant: 0, closed: 0 },
    },
    insight: "팔로업 진행 중인 고객이 가장 많으며, 정체 상태의 고객에 대한 관리가 필요합니다.",
  },
  completeness: {
    title: "완검화 주차별 추이",
    data: [
      { week: "11월 1주", actual: 85, target: 90 },
      { week: "11월 2주", actual: 95, target: 100 },
      { week: "11월 3주", actual: 102, target: 110 },
      { week: "11월 4주", actual: 112, target: 125 },
      { week: "12월 1주", actual: 120, target: 140 },
      { week: "12월 2주", actual: 128, target: 155 },
    ],
    insight: "12월 1주차 이후 목표 대비 격차가 확대되고 있습니다. 완검화 속도 개선이 필요합니다.",
  },
  target_vs_revenue: {
    title: "목표 대비 예상 매출 추이",
    data: [
      { week: "11월 1주", target: 150, expected: 120 },
      { week: "11월 2주", target: 180, expected: 165 },
      { week: "11월 3주", target: 220, expected: 180 },
      { week: "11월 4주", target: 280, expected: 220 },
      { week: "12월 1주", target: 350, expected: 350 },
      { week: "12월 2주", target: 420, expected: 280 },
      { week: "12월 3주", target: 480, expected: 160 },
      { week: "12월 4주", target: 520, expected: 99 },
    ],
    summary: {
      targetTotal: 2600,
      expectedTotal: 1574,
      achievementRate: 60.5,
      gap: -1026,
    },
    insight: "현재 예상 매출은 목표의 60.5% 수준입니다. 12월 2주차 이후 목표 대비 격차가 확대되고 있어 집중 관리가 필요합니다.",
  },
  revenue_timing: {
    title: "매출 발생 시기 분포",
    data: [
      { month: "2024.11", amount: 280 },
      { month: "2024.12", amount: 520 },
      { month: "2025.01", amount: 320 },
      { month: "2025.02", amount: 169 },
    ],
    insight: "12월에 매출 집중도가 높으며(40%), 1월 이후 불확실성이 큽니다.",
  },
};

// 전체 고객 수 모달 콘텐츠 (필터 포함)
const TotalCustomersModalContent = () => {
  const [sizeFilter, setSizeFilter] = useState("전체");
  const data = modalData.total_customers;
  
  // 필터에 따른 주간 추이 데이터 키 매핑
  const getTrendDataKey = () => {
    switch (sizeFilter) {
      case "T0 (대기업)": return "t0";
      case "T1 (중견)": return "t1";
      case "T2 (중소)": return "t2";
      case "T3 (소기업)": return "t3";
      default: return "total";
    }
  };
  
  const filteredCompanySizeData = sizeFilter === "전체" 
    ? data.companySizeData 
    : data.companySizeData.filter(d => d.name === sizeFilter);

  return (
    <div className={styles.chartContainer}>
      {/* 기업 규모 필터 */}
      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <Text variant="body-sm" weight="medium" color="secondary">기업 규모</Text>
            <select 
              className={styles.filterSelect}
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
            >
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.chartRow}>
        <div className={styles.chartSection}>
          <Text variant="body-sm" weight="medium" color="secondary">기업 규모 분포</Text>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={filteredCompanySizeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {filteredCompanySizeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                labelStyle={{ color: '#fafafa' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartSection}>
          <Text variant="body-sm" weight="medium" color="secondary">제품 구분 분포</Text>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.productData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                labelStyle={{ color: '#fafafa' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 주간 추이 그래프 */}
      <div className={styles.chartSection}>
        <Text variant="body-sm" weight="medium" color="secondary">
          주간 추이 {sizeFilter !== "전체" ? `(${sizeFilter})` : "(전체)"}
        </Text>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data.weeklyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="week" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip 
              contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
              labelStyle={{ color: '#fafafa' }}
            />
            <Line 
              type="monotone" 
              dataKey={getTrendDataKey()} 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ fill: '#3b82f6' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.insightBox}>
        <Text variant="body-sm" color="secondary">{data.insight}</Text>
      </div>
    </div>
  );
};

// MBM 필터 옵션
const MBM_OPTIONS = ["전체 MBM", "11/7"];

// MBM 단계별 기업 리스트 더미 데이터
const mbmCompanyList = {
  invited: [
    { companyName: "테크솔루션", companySize: "T1 (중견)", manager: "김민수", adoptionStage: "-" },
    { companyName: "스마트팩토리", companySize: "T2 (중소)", manager: "이지은", adoptionStage: "-" },
    { companyName: "글로벌테크", companySize: "T0 (대기업)", manager: "박준영", adoptionStage: "-" },
    { companyName: "이노베이션랩", companySize: "T3 (소기업)", manager: "최서연", adoptionStage: "-" },
  ],
  participated: [
    { companyName: "비전바이오켐", companySize: "T0 (대기업)", manager: "정현우", adoptionStage: "-" },
    { companyName: "퓨처모빌리티", companySize: "T1 (중견)", manager: "한지민", adoptionStage: "-" },
    { companyName: "넥스트젠AI", companySize: "T2 (중소)", manager: "김민수", adoptionStage: "-" },
    { companyName: "블루오션", companySize: "T1 (중견)", manager: "이지은", adoptionStage: "-" },
    { companyName: "그린에너지", companySize: "T0 (대기업)", manager: "박준영", adoptionStage: "-" },
  ],
  followup: [
    { companyName: "스카이네트워크", companySize: "T2 (중소)", manager: "최서연", adoptionStage: "견적", lastContact: "2024.12.15" },
    { companyName: "메가시스템", companySize: "T1 (중견)", manager: "정현우", adoptionStage: "품의", lastContact: "2024.12.14" },
    { companyName: "알파테크", companySize: "T3 (소기업)", manager: "한지민", adoptionStage: "테스트", lastContact: "2024.12.16" },
    { companyName: "베타소프트", companySize: "T2 (중소)", manager: "김민수", adoptionStage: "견적", lastContact: "2024.12.10" },
    { companyName: "델타시스템즈", companySize: "T0 (대기업)", manager: "이지은", adoptionStage: "품의", lastContact: "2024.12.13" },
    { companyName: "오메가테크", companySize: "T1 (중견)", manager: "박준영", adoptionStage: "테스트", lastContact: "2024.12.12" },
  ],
  stagnant: [
    { companyName: "레드플래닛", companySize: "T3 (소기업)", manager: "이지은", adoptionStage: "-" },
    { companyName: "옐로우스톤", companySize: "T2 (중소)", manager: "박준영", adoptionStage: "-" },
    { companyName: "오렌지코퍼", companySize: "T1 (중견)", manager: "최서연", adoptionStage: "-" },
  ],
  closed: [
    { companyName: "다이아몬드그룹", companySize: "T0 (대기업)", manager: "정현우", adoptionStage: "계약" },
    { companyName: "플래티넘솔루션", companySize: "T1 (중견)", manager: "한지민", adoptionStage: "계약" },
    { companyName: "골드스타", companySize: "T2 (중소)", manager: "김민수", adoptionStage: "계약" },
  ],
};

// 도입결정 필터 옵션
const ADOPTION_STAGE_OPTIONS = ["전체", "테스트", "견적", "품의"];

// MBM 현황 모달 콘텐츠
const MBMStatusModalContent = () => {
  const [sizeFilter, setSizeFilter] = useState("전체");
  const [mbmFilter, setMbmFilter] = useState("전체 MBM");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [adoptionFilter, setAdoptionFilter] = useState("전체");
  const data = modalData.mbm_status;
  
  const currentData = sizeFilter === "전체" 
    ? data.statusData.all 
    : data.statusData[sizeFilter as keyof typeof data.statusData] || data.statusData.all;

  // 퍼널 단계 (정체 제외)
  const funnelStages = [
    { key: "invited", label: "전체 모수", color: "#71717a" },
    { key: "participated", label: "참석", color: "#3b82f6" },
    { key: "followup", label: "팔로업 진행", color: "#a855f7" },
    { key: "closed", label: "계약완료", color: "#22c55e" },
  ];

  // 전환율 계산
  const getConversionRate = (fromKey: string, toKey: string) => {
    const fromValue = currentData[fromKey as keyof typeof currentData];
    const toValue = currentData[toKey as keyof typeof currentData];
    if (fromValue === 0) return 0;
    return Math.round((toValue / fromValue) * 100);
  };

  const statusLabels = [
    { key: "invited", label: "전체 모수", color: "#71717a" },
    { key: "participated", label: "참석", color: "#3b82f6" },
    { key: "followup", label: "팔로업 진행", color: "#a855f7" },
    { key: "stagnant", label: "정체", color: "#f97316" },
    { key: "closed", label: "계약완료", color: "#22c55e" },
  ];

  const chartData = statusLabels.map(s => ({
    name: s.label,
    value: currentData[s.key as keyof typeof currentData],
    color: s.color,
  }));

  const total = Object.values(currentData).reduce((a, b) => a + b, 0);

  // 선택된 단계에 해당하는 기업 리스트
  const selectedCompanies = selectedStage 
    ? mbmCompanyList[selectedStage as keyof typeof mbmCompanyList] || []
    : [];

  // 기업 규모 필터 적용
  let filteredCompanies = sizeFilter === "전체"
    ? selectedCompanies
    : selectedCompanies.filter(c => c.companySize === sizeFilter);

  // 팔로업 진행 단계에서 도입결정 필터 적용
  if (selectedStage === "followup" && adoptionFilter !== "전체") {
    filteredCompanies = filteredCompanies.filter(c => c.adoptionStage === adoptionFilter);
  }

  const handleStageClick = (stageKey: string) => {
    setSelectedStage(selectedStage === stageKey ? null : stageKey);
  };

  return (
    <div className={styles.chartContainer}>
      {/* 필터 섹션 */}
      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <Text variant="body-sm" weight="medium" color="secondary">MBM 필터</Text>
            <select 
              className={styles.filterSelect}
              value={mbmFilter}
              onChange={(e) => setMbmFilter(e.target.value)}
            >
              {MBM_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <Text variant="body-sm" weight="medium" color="secondary">기업 규모</Text>
            <select 
              className={styles.filterSelect}
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
            >
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 퍼널 구조 */}
      <div className={styles.funnelContainer}>
        {funnelStages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            <div 
              className={`${styles.funnelStage} ${selectedStage === stage.key ? styles.selected : ""}`}
              style={{ borderColor: stage.color }}
              onClick={() => handleStageClick(stage.key)}
            >
              <Text variant="caption" color="secondary">{stage.label}</Text>
              <Text variant="h3" weight="bold" style={{ color: stage.color }}>
                {currentData[stage.key as keyof typeof currentData]}
              </Text>
            </div>
            {index < funnelStages.length - 1 && (
              <div className={styles.funnelArrow}>
                <span className={styles.arrowIcon}>▶</span>
                <span className={styles.conversionRate}>
                  {getConversionRate(stage.key, funnelStages[index + 1].key)}%
                </span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 선택된 단계의 기업 리스트 */}
      {selectedStage && (
        <div className={styles.companyListSection}>
          <Text variant="body-sm" weight="medium" color="secondary">
            {statusLabels.find(s => s.key === selectedStage)?.label} 단계 기업 리스트 ({filteredCompanies.length}개)
          </Text>
          <div className={styles.companyTable}>
            <table>
              <thead>
                <tr>
                  <th>기업명</th>
                  <th>기업 규모</th>
                  <th>담당자</th>
                  {selectedStage === "followup" && (
                    <>
                      <th className={styles.filterableTh}>
                        <select 
                          className={styles.thFilterSelect}
                          value={adoptionFilter}
                          onChange={(e) => setAdoptionFilter(e.target.value)}
                        >
                          {ADOPTION_STAGE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option === "전체" ? "도입결정" : option}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th>마지막 컨택</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company, idx) => (
                  <tr key={idx}>
                    <td>{company.companyName}</td>
                    <td>{company.companySize}</td>
                    <td>{company.manager}</td>
                    {selectedStage === "followup" && (
                      <>
                        <td>
                          <Badge 
                            variant={
                              company.adoptionStage === "계약" ? "success" :
                              company.adoptionStage === "품의" ? "purple" :
                              company.adoptionStage === "견적" ? "info" :
                              company.adoptionStage === "테스트" ? "warning" : "default"
                            } 
                            size="sm"
                          >
                            {company.adoptionStage}
                          </Badge>
                        </td>
                        <td>{company.lastContact || "-"}</td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={selectedStage === "followup" ? 5 : 3} style={{ textAlign: 'center', color: '#71717a' }}>
                      해당하는 기업이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={styles.insightBox}>
        <Text variant="body-sm" color="secondary">참석했으나, 팔로업 전인 고객 수가 가장 많습니다. 해당 고객에 대한 관리가 필요합니다.</Text>
      </div>
    </div>
  );
};

// 모달 콘텐츠 컴포넌트
const ModalContent = ({ cardId }: { cardId: string }) => {
  const data = modalData[cardId as keyof typeof modalData];
  
  if (!data) return null;

  switch (cardId) {
    case "total_customers":
      return <TotalCustomersModalContent />;

    case "mbm_status":
      return <MBMStatusModalContent />;

    case "completeness":
      return (
        <div className={styles.chartContainer}>
          <div className={styles.chartSection}>
            <Text variant="body-sm" weight="medium" color="secondary">목표 vs 실제 진척도</Text>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="week" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#fafafa' }}
                />
                <Legend />
                <Line type="monotone" dataKey="target" stroke="#71717a" strokeWidth={2} strokeDasharray="5 5" name="목표" />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="실제" dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.insightBox}>
            <Text variant="body-sm" color="warning">{data.insight}</Text>
          </div>
        </div>
      );

    case "target_vs_revenue":
      const targetData = data as typeof modalData.target_vs_revenue;
      return (
        <div className={styles.chartContainer}>
          {/* 요약 카드 */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <Text variant="caption" color="secondary">목표 매출</Text>
              <Text variant="h3" weight="bold">₩{(targetData.summary.targetTotal / 100).toFixed(1)}B</Text>
            </div>
            <div className={styles.summaryCard}>
              <Text variant="caption" color="secondary">예상 매출</Text>
              <Text variant="h3" weight="bold" color="primary">₩{(targetData.summary.expectedTotal / 100).toFixed(2)}B</Text>
            </div>
            <div className={`${styles.summaryCard} ${styles.warning}`}>
              <Text variant="caption" color="secondary">달성률</Text>
              <Text variant="h3" weight="bold" color="warning">{targetData.summary.achievementRate}%</Text>
            </div>
            <div className={`${styles.summaryCard} ${styles.danger}`}>
              <Text variant="caption" color="secondary">GAP</Text>
              <Text variant="h3" weight="bold" color="error">₩{Math.abs(targetData.summary.gap)}M</Text>
            </div>
          </div>
          
          {/* 꺾은선 그래프 */}
          <div className={styles.chartSection}>
            <Text variant="body-sm" weight="medium" color="secondary">주차별 목표 vs 예상 매출 (단위: 백만원)</Text>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={targetData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="week" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#fafafa' }}
                  formatter={(value: number, name: string) => [
                    `₩${value}M`, 
                    name === 'target' ? '목표' : '예상 매출'
                  ]}
                />
                <Legend 
                  formatter={(value) => value === 'target' ? '목표' : '예상 매출'}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#71717a" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={{ fill: '#71717a', r: 4 }}
                  name="target"
                />
                <Line 
                  type="monotone" 
                  dataKey="expected" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="expected"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.insightBox}>
            <Text variant="body-sm" color="warning">{targetData.insight}</Text>
          </div>
        </div>
      );

    case "revenue_timing":
      return (
        <div className={styles.chartContainer}>
          <div className={styles.chartSection}>
            <Text variant="body-sm" weight="medium" color="secondary">월별 매출 발생 분포 (단위: 백만원)</Text>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#fafafa' }}
                  formatter={(value: number) => [`₩${value}M`, '예상 매출']}
                />
                <Bar dataKey="amount" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {data.data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.amount === Math.max(...data.data.map(d => d.amount)) ? '#3b82f6' : '#06b6d4'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.insightBox}>
            <Text variant="body-sm" color="secondary">{data.insight}</Text>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export const KPICards = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const kpiData = [
    {
      id: "total_customers",
      title: "전체 고객사",
      value: "700사",
      subValue: "",
      trend: "up" as const,
      trendValue: "전주 대비 1.7%",
    },
    {
      id: "mbm_status",
      title: "MBM 참석사 계약 전환율",
      value: "0.4%",
      subValue: "",
      trend: "" as const,
      trendValue: "변화없음",
    },
    {
      id: "completeness",
      title: "완검화 진척도",
      value: "36.6%",
      subValue: "",
      trend: "up" as const,
      trendValue: "전주 대비 8%",
    },
    {
      id: "target_vs_revenue",
      title: "목표 대비 예상 매출",
      value: "60.5%",
      subValue: "",
      trend: "down" as const,
      trendValue: "전주 대비 39.5%",
    },
    {
      id: "revenue_timing",
      title: "최대 예상 매출 시기",
      value: "12월",
    },
  ];

  const getModalTitle = () => {
    if (!selectedCard) return "상세 분석";
    const data = modalData[selectedCard as keyof typeof modalData];
    return data?.title || kpiData.find((k) => k.id === selectedCard)?.title || "상세 분석";
  };

  return (
    <>
      <div className={styles.grid}>
        {kpiData.map((kpi) => (
          <KPICardItem
            key={kpi.id}
            {...kpi}
            onClick={() => setSelectedCard(kpi.id)}
          />
        ))}
      </div>

      <Modal
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title={getModalTitle()}
        size="lg"
      >
        <div className={styles.modalContent}>
          {selectedCard && <ModalContent cardId={selectedCard} />}
          
          <div className={styles.aiSection}>
             <div className={styles.aiButton}>
               <HelpCircle size={16} />
               <Text weight="medium">BRS AI로 질문하기</Text>
             </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
