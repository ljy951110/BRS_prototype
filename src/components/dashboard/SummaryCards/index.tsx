import { ProductTypeLabel } from "@/constants/commonMap";
import { calculateExpectedRevenue } from "@/data/mockData";
import { ProductType } from "@/repository/openapi/model";
import { ArrowDownOutlined, ArrowUpOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Alert, Badge, Button, Card, Col, Modal, Row, Select, Space, Statistic, Table, Tabs, Tag, theme, Typography } from "antd";
import { ArrowRight, BookOpen, Building2, Calendar, Eye } from "lucide-react";
import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import tableStyles from "../CustomerTable/index.module.scss";
import styles from "./index.module.scss";

const { Text, Title: AntTitle, Text: AntText } = Typography;

// 유틸리티 함수
const formatMan = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "-";
  const man = Math.round(val / 10000);
  return `${man}만`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderProgressTags = (customer: any, withColors: boolean, colors: any) => {
  const progress = customer.adoptionDecision?.progress || {};
  const stages = [
    { key: "test", label: "테스트", active: progress.test, past: customer._periodData?.pastProgress?.test },
    { key: "quote", label: "견적", active: progress.quote, past: customer._periodData?.pastProgress?.quote },
    { key: "approval", label: "품의", active: progress.approval, past: customer._periodData?.pastProgress?.approval },
    { key: "contract", label: "계약", active: progress.contract, past: customer._periodData?.pastProgress?.contract },
  ];

  return (
    <Space size={4} wrap>
      {stages.map((stage) => {
        const isNew = withColors && stage.active && !stage.past;
        return (
          <Tag
            key={stage.key}
            style={{
              borderColor: stage.active
                ? (isNew ? colors.newBorder : colors.activeBorder)
                : colors.inactiveBorder,
              color: stage.active
                ? (isNew ? colors.newText : colors.activeText)
                : colors.inactiveText,
              background: isNew ? colors.newBg : 'transparent',
            }}
            bordered
          >
            {stage.label}
          </Tag>
        );
      })}
    </Space>
  );
};

// 다크모드 툴팁 스타일 (고정)
const DARK_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '8px',
  },
  labelStyle: {
    color: '#fafafa',
  },
  itemStyle: {
    color: '#fafafa',
  },
};

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
      className={`${styles.kpiCard} ${styles[status]}`}
      onClick={onClick}
      hoverable
    >
      <div className={styles.cardHeader}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {title}
        </Text>
        {status === "warning" && <div className={styles.statusDot} />}
      </div>
      <div className={styles.cardBody}>
        <Text style={{ fontSize: 28, fontWeight: 700 }}>
          {value}
        </Text>
        {subValue && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {subValue}
          </Text>
        )}
      </div>
      <div className={styles.cardFooter}>
        {trend && (
          <div className={`${styles.trend} ${styles[trend]}`}>
            {trend === "up" ? <ArrowUpOutlined style={{ fontSize: 12 }} /> : <ArrowDownOutlined style={{ fontSize: 12 }} />}
            <Text style={{ fontSize: 12, fontWeight: 500 }}>
              {trendValue}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

// 기업 규모 옵션
const COMPANY_SIZE_OPTIONS = ["전체", "T0", "T1", "T2", "T3", "T4", "T9", "T10"];

// 각 KPI별 더미 데이터
const modalData = {
  total_customers: {
    title: "고객 구성 요약",
    companySizeData: [
      { name: "T0", value: 120, color: "#3b82f6" },
      { name: "T1", value: 180, color: "#22c55e" },
      { name: "T2", value: 250, color: "#f97316" },
      { name: "T3", value: 150, color: "#a855f7" },
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
      "T0": { invited: 120, participated: 10, followup: 10, stagnant: 0, closed: 1 },
      "T1": { invited: 180, participated: 15, followup: 15, stagnant: 0, closed: 1 },
      "T2": { invited: 250, participated: 15, followup: 15, stagnant: 0, closed: 1 },
      "T3": { invited: 150, participated: 10, followup: 10, stagnant: 0, closed: 0 },
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

// MBM 옵션
const MBM_OPTIONS = ["전체 MBM", "11/7"];

// MBM 단계별 기업 리스트 더미 데이터
const mbmCompanyList = {
  invited: [
    { companyName: "테크솔루션", companySize: "T1", manager: "김민수", adoptionStage: "-" },
    { companyName: "스마트팩토리", companySize: "T2", manager: "이지은", adoptionStage: "-" },
    { companyName: "글로벌테크", companySize: "T0", manager: "박준영", adoptionStage: "-" },
    { companyName: "이노베이션랩", companySize: "T3", manager: "최서연", adoptionStage: "-" },
  ],
  participated: [
    { companyName: "비전바이오켐", companySize: "T0", manager: "정현우", adoptionStage: "-" },
    { companyName: "퓨처모빌리티", companySize: "T1", manager: "한지민", adoptionStage: "-" },
    { companyName: "넥스트젠AI", companySize: "T2", manager: "김민수", adoptionStage: "-" },
    { companyName: "블루오션", companySize: "T1", manager: "이지은", adoptionStage: "-" },
    { companyName: "그린에너지", companySize: "T0", manager: "박준영", adoptionStage: "-" },
  ],
  followup: [
    { companyName: "스카이네트워크", companySize: "T2", manager: "최서연", adoptionStage: "견적", lastContact: "2024.12.15" },
    { companyName: "메가시스템", companySize: "T1", manager: "정현우", adoptionStage: "품의", lastContact: "2024.12.14" },
    { companyName: "알파테크", companySize: "T3", manager: "한지민", adoptionStage: "테스트", lastContact: "2024.12.16" },
    { companyName: "베타소프트", companySize: "T2", manager: "김민수", adoptionStage: "견적", lastContact: "2024.12.10" },
    { companyName: "델타시스템즈", companySize: "T0", manager: "이지은", adoptionStage: "품의", lastContact: "2024.12.13" },
    { companyName: "오메가테크", companySize: "T1", manager: "박준영", adoptionStage: "테스트", lastContact: "2024.12.12" },
  ],
  stagnant: [
    { companyName: "레드플래닛", companySize: "T3", manager: "이지은", adoptionStage: "-" },
    { companyName: "옐로우스톤", companySize: "T2", manager: "박준영", adoptionStage: "-" },
    { companyName: "오렌지코퍼", companySize: "T1", manager: "최서연", adoptionStage: "-" },
  ],
  closed: [
    { companyName: "다이아몬드그룹", companySize: "T0", manager: "정현우", adoptionStage: "계약" },
    { companyName: "플래티넘솔루션", companySize: "T1", manager: "한지민", adoptionStage: "계약" },
    { companyName: "골드스타", companySize: "T2", manager: "김민수", adoptionStage: "계약" },
  ],
};

// 도입결정 필터 옵션
const ADOPTION_STAGE_OPTIONS = ["전체", "테스트", "견적", "품의"];

// 전체 고객 수 모달 콘텐츠
const TotalCustomersModalContent = () => {
  const [sizeFilter, setSizeFilter] = useState("전체");
  const data = modalData.total_customers;

  const getTrendDataKey = () => {
    switch (sizeFilter) {
      case "T0": return "t0";
      case "T1": return "t1";
      case "T2": return "t2";
      case "T3": return "t3";
      default: return "total";
    }
  };

  const filteredCompanySizeData = sizeFilter === "전체"
    ? data.companySizeData
    : data.companySizeData.filter(d => d.name === sizeFilter);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>기업 규모</Text>
            <Select
              className={styles.filterSelect}
              value={sizeFilter}
              onChange={(val) => setSizeFilter(val)}
              options={COMPANY_SIZE_OPTIONS.map(option => ({ label: option, value: option }))}
              style={{ width: 160 }}
            />
          </div>
        </div>
      </div>

      <div className={styles.chartRow}>
        <div className={styles.chartSection}>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>기업 규모 분포</Text>
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
              <Tooltip {...DARK_TOOLTIP_STYLE} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartSection}>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>사업 구분 분포</Text>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.productData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" style={{ fontSize: 12 }} />
              <YAxis style={{ fontSize: 12 }} />
              <Tooltip {...DARK_TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartSection}>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
          주간 추이 {sizeFilter !== "전체" ? `(${sizeFilter})` : "(전체)"}
        </Text>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data.weeklyTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" style={{ fontSize: 11 }} />
            <YAxis style={{ fontSize: 12 }} domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip {...DARK_TOOLTIP_STYLE} />
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

      <Alert
        message={data.insight}
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  );
};

// MBM 현황 모달 콘텐츠
const MBMStatusModalContent = () => {
  const [sizeFilter, setSizeFilter] = useState("전체");
  const [mbmFilter, setMbmFilter] = useState("전체 MBM");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [adoptionFilter, setAdoptionFilter] = useState("전체");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const data = modalData.mbm_status;
  const { token } = theme.useToken();

  const progressColors = {
    activeText: token.colorTextBase,
    activeBorder: token.colorTextBase,
    inactiveText: token.colorTextTertiary,
    inactiveBorder: token.colorBorder,
    newText: token.colorSuccess,
    newBorder: token.colorSuccess,
    newBg: token.colorSuccessBg,
  };

  const currentData = sizeFilter === "전체"
    ? data.statusData.all
    : data.statusData[sizeFilter as keyof typeof data.statusData] || data.statusData.all;

  const funnelStages = [
    { key: "invited", label: "전체 모수", color: "#71717a" },
    { key: "participated", label: "참석", color: "#3b82f6" },
    { key: "followup", label: "팔로업 진행", color: "#a855f7" },
    { key: "closed", label: "계약완료", color: "#22c55e" },
  ];

  const getConversionRate = (fromKey: string, toKey: string) => {
    const fromValue = currentData[fromKey as keyof typeof currentData];
    const toValue = currentData[toKey as keyof typeof currentData];
    if (fromValue === 0) return 0;
    return Math.round((toValue / fromValue) * 100);
  };

  const selectedCompanies = selectedStage
    ? mbmCompanyList[selectedStage as keyof typeof mbmCompanyList] || []
    : [];

  let filteredCompanies = sizeFilter === "전체"
    ? selectedCompanies
    : selectedCompanies.filter(c => c.companySize === sizeFilter);

  if (selectedStage === "followup" && adoptionFilter !== "전체") {
    filteredCompanies = filteredCompanies.filter(c => c.adoptionStage === adoptionFilter);
  }

  const handleStageClick = (stageKey: string) => {
    setSelectedStage(selectedStage === stageKey ? null : stageKey);
  };

  const tableColumns = selectedStage === "followup"
    ? [
      {
        title: "기업명",
        dataIndex: "companyName",
        key: "companyName",
        onHeaderCell: () => ({
          style: {
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorSplit,
          }
        })
      },
      {
        title: "기업 규모",
        dataIndex: "companySize",
        key: "companySize",
        onHeaderCell: () => ({
          style: {
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorSplit,
          }
        })
      },
      {
        title: "담당자",
        dataIndex: "manager",
        key: "manager",
        onHeaderCell: () => ({
          style: {
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorSplit,
          }
        })
      },
      {
        title: (
          <Select
            value={adoptionFilter}
            onChange={(val) => setAdoptionFilter(val)}
            options={ADOPTION_STAGE_OPTIONS.map(option => ({
              label: option === "전체" ? "도입결정" : option,
              value: option
            }))}
            style={{ width: '100%' }}
            bordered={false}
            size="small"
          />
        ),
        dataIndex: "adoptionStage",
        key: "adoptionStage",
        onHeaderCell: () => ({
          style: {
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorSplit,
          }
        }),
        render: (stage: string) => (
          <Badge
            color={
              stage === "계약" ? "green" :
                stage === "품의" ? "purple" :
                  stage === "견적" ? "blue" :
                    stage === "테스트" ? "orange" : "default"
            }
            text={stage}
          />
        ),
      },
      {
        title: "마지막 컨택",
        dataIndex: "lastContact",
        key: "lastContact",
        onHeaderCell: () => ({
          style: {
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorSplit,
          }
        }),
        render: (text: string) => text || "-"
      },
    ]
    : [
      {
        title: "기업명",
        dataIndex: "companyName",
        key: "companyName",
        onHeaderCell: () => ({
          style: {
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorSplit,
          }
        })
      },
      {
        title: "기업 규모",
        dataIndex: "companySize",
        key: "companySize",
        onHeaderCell: () => ({
          style: {
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorSplit,
          }
        })
      },
      {
        title: "담당자",
        dataIndex: "manager",
        key: "manager",
        onHeaderCell: () => ({
          style: {
            backgroundColor: token.colorFillAlter,
            borderColor: token.colorSplit,
          }
        })
      },
    ];

  return (
    <div className={styles.chartContainer}>
      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>MBM 필터</Text>
            <Select
              value={mbmFilter}
              onChange={(val) => setMbmFilter(val)}
              options={MBM_OPTIONS.map(option => ({ label: option, value: option }))}
              style={{ width: 160 }}
            />
          </div>
          <div className={styles.filterGroup}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>기업 규모</Text>
            <Select
              value={sizeFilter}
              onChange={(val) => setSizeFilter(val)}
              options={COMPANY_SIZE_OPTIONS.map(option => ({ label: option, value: option }))}
              style={{ width: 160 }}
            />
          </div>
        </div>
      </div>

      <div className={styles.funnelContainer}>
        {funnelStages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            <Card
              hoverable
              onClick={() => handleStageClick(stage.key)}
              style={{
                minWidth: 120,
                borderLeftWidth: 3,
                borderLeftColor: stage.color,
                cursor: 'pointer',
                ...(selectedStage === stage.key && {
                  boxShadow: `0 0 0 2px ${stage.color}40`,
                  backgroundColor: token.colorBgTextHover,
                })
              }}
              bodyStyle={{
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>{stage.label}</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: stage.color }}>
                {currentData[stage.key as keyof typeof currentData]}
              </Text>
            </Card>
            {index < funnelStages.length - 1 && (
              <div className={styles.funnelArrow}>
                <span className={styles.arrowIcon}>▶</span>
                <Badge
                  count={`${getConversionRate(stage.key, funnelStages[index + 1].key)}%`}
                  style={{
                    backgroundColor: token.colorPrimaryBg,
                    color: token.colorPrimary,
                    fontWeight: 600,
                    fontSize: 13
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {selectedStage && (
        <div className={styles.companyListSection}>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, display: 'block' }}>
            {funnelStages.find(s => s.key === selectedStage)?.label} 단계 기업 리스트 ({filteredCompanies.length}개)
          </Text>
          <Table
            columns={tableColumns}
            dataSource={filteredCompanies}
            size="small"
            pagination={false}
            rowKey={(record) => record.companyName}
            locale={{ emptyText: "해당하는 기업이 없습니다." }}
            bordered
            onRow={(record) => ({
              onClick: () => setSelectedCustomer(record),
              style: { cursor: "pointer" },
            })}
          />
        </div>
      )}

      <Alert
        message="참석했으나, 팔로업 전인 고객 수가 가장 많습니다. 해당 고객에 대한 관리가 필요합니다."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />

      {/* 고객 상세 모달 - API 호출 없이 mock 데이터만 사용 */}
      <Modal
        open={!!selectedCustomer}
        onCancel={() => setSelectedCustomer(null)}
        footer={null}
        title={selectedCustomer?.companyName || "고객 상세"}
        width={720}
      >
        {selectedCustomer && (
          <Tabs
            defaultActiveKey="summary"
            items={[
              {
                key: "summary",
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={16} />
                    <span>요약</span>
                  </span>
                ),
                children: (
                  <>
                    {/* 기본 정보 */}
                    <div style={{ marginBottom: 24 }}>
                      <AntTitle level={5} style={{ marginBottom: 12 }}>기본 정보</AntTitle>
                      <div style={{ overflow: 'hidden', borderRadius: token.borderRadius }}>
                        <Table
                          dataSource={[
                            {
                              key: 'row1',
                              label1: '담당자',
                              value1: selectedCustomer.manager,
                              label2: '카테고리',
                              value2: selectedCustomer.category
                            },
                            {
                              key: 'row2',
                              label1: '기업 규모',
                              value1: selectedCustomer.companySize || '미정',
                              label2: '계약 금액',
                              value2: formatMan(selectedCustomer.contractAmount)
                            },
                            {
                              key: 'row3',
                              label1: '제품 사용',
                              value1: (
                                <Space size={4} wrap>
                                  {selectedCustomer.productUsage?.map((product: string, idx: number) => (
                                    <Tag key={idx} color="blue">
                                      {ProductTypeLabel[product as ProductType] || product}
                                    </Tag>
                                  )) || "-"}
                                </Space>
                              ),
                              label2: '',
                              value2: ''
                            },
                          ]}
                          columns={[
                            {
                              dataIndex: 'label1',
                              key: 'label1',
                              width: 120,
                              onCell: (record) => ({
                                style: {
                                  backgroundColor: token.colorFillAlter,
                                  fontWeight: 600
                                },
                                ...(record.key === 'row3' ? { colSpan: 1 } : {})
                              }),
                              render: (text) => <AntText strong>{text}</AntText>
                            },
                            {
                              dataIndex: 'value1',
                              key: 'value1',
                              onCell: (record) => ({
                                ...(record.key === 'row3' ? { colSpan: 3 } : {})
                              })
                            },
                            {
                              dataIndex: 'label2',
                              key: 'label2',
                              width: 120,
                              onCell: (record) => ({
                                style: {
                                  backgroundColor: token.colorFillAlter,
                                  fontWeight: 600
                                },
                                ...(record.key === 'row3' ? { colSpan: 0 } : {})
                              }),
                              render: (text) => text ? <AntText strong>{text}</AntText> : null
                            },
                            {
                              dataIndex: 'value2',
                              key: 'value2',
                              onCell: (record) => ({
                                ...(record.key === 'row3' ? { colSpan: 0 } : {})
                              })
                            }
                          ]}
                          pagination={false}
                          size="small"
                          showHeader={false}
                          bordered
                        />
                      </div>
                    </div>

                    {/* 상태 변화 */}
                    <div>
                      <AntTitle level={5} style={{ marginBottom: 12 }}>상태 변화</AntTitle>
                      <div style={{ overflow: 'hidden', borderRadius: token.borderRadius }}>
                        <Table
                          dataSource={[
                            {
                              key: 'row1',
                              label1: '신뢰 점수',
                              value1: (() => {
                                const past = selectedCustomer._periodData?.pastTrustIndex ?? null;
                                const current = selectedCustomer.trustIndex || 0;
                                const isPositive = past !== null && current > past;
                                const isNegative = past !== null && current < past;
                                const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

                                return (
                                  <div className={`${tableStyles.changeTag} ${tableStyles[changeType]}`}>
                                    <span>{past ?? current}</span>
                                    <ArrowRight size={10} />
                                    <span>{current}</span>
                                  </div>
                                );
                              })(),
                              label2: '목표 매출',
                              value2: (() => {
                                const past = selectedCustomer._periodData?.pastTargetRevenue ?? null;
                                const current = selectedCustomer.adoptionDecision?.targetRevenue ?? 0;
                                const isPositive = past !== null && current > past;
                                const isNegative = past !== null && current < past;
                                const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

                                return (
                                  <div className={`${tableStyles.changeTag} ${tableStyles[changeType]}`}>
                                    <span>{formatMan(past)}</span>
                                    <ArrowRight size={10} />
                                    <span>{formatMan(current)}</span>
                                  </div>
                                );
                              })()
                            },
                            {
                              key: 'row2',
                              label1: '가능성',
                              value1: (() => {
                                const past = selectedCustomer._periodData?.pastPossibility ?? null;
                                const current = selectedCustomer.adoptionDecision?.possibility || "0%";
                                const isPositive = past !== null &&
                                  Number(current.replace("%", "")) > Number(past.replace("%", ""));
                                const isNegative = past !== null &&
                                  Number(current.replace("%", "")) < Number(past.replace("%", ""));
                                const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

                                return (
                                  <div className={`${tableStyles.changeTag} ${tableStyles[changeType]}`}>
                                    <span>{past ?? current}</span>
                                    <ArrowRight size={10} />
                                    <span>{current}</span>
                                  </div>
                                );
                              })(),
                              label2: '예상 매출',
                              value2: (() => {
                                const past = selectedCustomer._periodData?.pastExpectedRevenue ?? null;
                                const current = selectedCustomer._periodData?.currentExpectedRevenue ??
                                  calculateExpectedRevenue(
                                    selectedCustomer.adoptionDecision?.targetRevenue,
                                    selectedCustomer.adoptionDecision?.possibility
                                  );
                                const isPositive = past !== null && (current || 0) > past;
                                const isNegative = past !== null && (current || 0) < past;
                                const changeType = isPositive ? "positive" : isNegative ? "negative" : "neutral";

                                return (
                                  <div className={`${tableStyles.changeTag} ${tableStyles[changeType]}`}>
                                    <span>{formatMan(past)}</span>
                                    <ArrowRight size={10} />
                                    <span>{formatMan(current)}</span>
                                  </div>
                                );
                              })()
                            },
                            {
                              key: 'row3',
                              label1: '도입 결정 단계',
                              value1: renderProgressTags(selectedCustomer, true, progressColors),
                              label2: '목표 일자',
                              value2: (() => {
                                const past = selectedCustomer._periodData?.pastTargetDate || null;
                                const current = selectedCustomer.adoptionDecision?.targetDate || null;

                                const toMonth = (dateStr: string | null): string => {
                                  if (!dateStr || dateStr === '-') return '-';
                                  const match = dateStr.match(/(\d{4})-(\d{2})/);
                                  if (match) {
                                    return `${match[2]}월`;
                                  }
                                  return dateStr;
                                };

                                if (!past && !current) {
                                  return <span>-</span>;
                                }

                                const pastMonth = toMonth(past);
                                const currentMonth = toMonth(current);

                                let changeType = "neutral";
                                if (past && current && past !== '-' && current !== '-') {
                                  const pastDate = new Date(past);
                                  const currentDate = new Date(current);
                                  if (currentDate < pastDate) {
                                    changeType = "positive";
                                  } else if (currentDate > pastDate) {
                                    changeType = "negative";
                                  }
                                }

                                return (
                                  <div className={`${tableStyles.changeTag} ${tableStyles[changeType]}`}>
                                    <span>{pastMonth}</span>
                                    <ArrowRight size={10} />
                                    <span>{currentMonth}</span>
                                  </div>
                                );
                              })()
                            },
                          ]}
                          columns={[
                            {
                              dataIndex: 'label1',
                              key: 'label1',
                              width: 120,
                              onCell: () => ({
                                style: {
                                  backgroundColor: token.colorFillAlter,
                                  fontWeight: 600
                                }
                              }),
                              render: (text) => <AntText strong>{text}</AntText>
                            },
                            {
                              dataIndex: 'value1',
                              key: 'value1',
                            },
                            {
                              dataIndex: 'label2',
                              key: 'label2',
                              width: 120,
                              onCell: () => ({
                                style: {
                                  backgroundColor: token.colorFillAlter,
                                  fontWeight: 600
                                }
                              }),
                              render: (text) => <AntText strong>{text}</AntText>
                            },
                            {
                              dataIndex: 'value2',
                              key: 'value2',
                            }
                          ]}
                          pagination={false}
                          size="small"
                          showHeader={false}
                          bordered
                        />
                      </div>
                    </div>
                  </>
                ),
              },
              {
                key: "actions",
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} />
                    <span>영업 히스토리</span>
                  </span>
                ),
                children: (
                  <div>
                    {/* Mock 영업 액션 데이터 생성 */}
                    {(() => {
                      // 임시 mock 데이터 생성
                      const mockSalesActions = [
                        {
                          date: "2024-12-18",
                          type: "CALL",
                          content: `${selectedCustomer.manager} 담당자와 제품 도입 관련 전화 미팅 진행. 현재 견적 검토 중이며, 다음 주 추가 미팅 예정.`
                        },
                        {
                          date: "2024-12-15",
                          type: "MEETING",
                          content: "사내 의사결정권자와 함께 제품 데모 진행. 긍정적인 반응을 얻었으며, 추가 기능 논의 필요."
                        },
                        {
                          date: "2024-12-10",
                          type: "CALL",
                          content: "초기 문의 응대 및 제품 소개. 관심도가 높아 후속 미팅 예정."
                        }
                      ];

                      return mockSalesActions.length > 0 ? (
                        <div>
                          <AntTitle level={5} style={{ marginBottom: 16 }}>영업 액션 타임라인</AntTitle>
                          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                              {mockSalesActions.map((action, idx) => (
                                <Card
                                  key={idx}
                                  size="small"
                                  style={{ width: '100%' }}
                                >
                                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                      <AntText strong>{action.date}</AntText>
                                      <Tag color={action.type === 'CALL' ? 'blue' : 'green'}>
                                        {action.type === 'CALL' ? '콜' : '미팅'}
                                      </Tag>
                                    </Space>
                                    <AntText type="secondary" style={{ fontSize: 12 }}>
                                      담당자: {selectedCustomer.manager}
                                    </AntText>
                                    <AntText style={{ display: 'block', wordBreak: 'break-word' }}>
                                      {action.content || '영업 활동 내용'}
                                    </AntText>
                                  </Space>
                                </Card>
                              ))}
                            </Space>
                          </div>
                        </div>
                      ) : (
                        <Alert
                          message="영업 히스토리가 없습니다"
                          description="현재 기간 동안의 영업 액션 이력이 없습니다."
                          type="info"
                          showIcon
                        />
                      );
                    })()}
                  </div>
                ),
              },
              {
                key: "content",
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} />
                    <span>마케팅 히스토리</span>
                  </span>
                ),
                children: (
                  <div>
                    {/* Mock 콘텐츠 소비 이력 생성 */}
                    {(() => {
                      // 임시 mock 데이터 생성
                      const mockContentEngagements = [
                        {
                          title: "2025 마케팅 트렌드 리포트",
                          category: "TOFU",
                          date: "2024-12-17",
                          views: 3
                        },
                        {
                          title: "성공적인 B2B 세일즈 전략",
                          category: "MOFU",
                          date: "2024-12-14",
                          views: 2
                        },
                        {
                          title: "제품 도입 사례 연구",
                          category: "BOFU",
                          date: "2024-12-11",
                          views: 1
                        }
                      ];

                      return mockContentEngagements.length > 0 ? (
                        <div style={{ marginBottom: 24 }}>
                          <AntTitle level={5} style={{ marginBottom: 16 }}>콘텐츠 소비 이력</AntTitle>
                          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                              {mockContentEngagements.map((item, index) => (
                                <Card
                                  key={index}
                                  size="small"
                                  hoverable
                                >
                                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <Space size={12}>
                                      <BookOpen size={20} style={{ color: token.colorPrimary }} />
                                      <Space direction="vertical" size={4}>
                                        <Space size={8}>
                                          <AntText strong style={{ fontSize: 15 }}>
                                            {item.title}
                                          </AntText>
                                        </Space>
                                        <Space size={8}>
                                          <Tag color="blue" style={{ margin: 0 }}>
                                            {item.category || 'TOFU'}
                                          </Tag>
                                          <Tag color="gold" style={{ margin: 0 }}>
                                            아티클
                                          </Tag>
                                          <Space size={4}>
                                            <Eye size={14} style={{ color: token.colorTextSecondary }} />
                                            <AntText type="secondary" style={{ fontSize: 12 }}>
                                              조회 {item.views || 1}회
                                            </AntText>
                                          </Space>
                                        </Space>
                                        <AntText type="secondary" style={{ fontSize: 12 }}>
                                          최근 조회: {item.date}
                                        </AntText>
                                      </Space>
                                    </Space>
                                  </Space>
                                </Card>
                              ))}
                            </Space>
                          </div>
                        </div>
                      ) : (
                        <Alert
                          message="활동 이력이 없습니다"
                          description="선택한 기간 동안의 콘텐츠 소비 이력이 없습니다."
                          type="info"
                          showIcon
                        />
                      );
                    })()}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>
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

    case "completeness": {
      const completenessData = data as typeof modalData.completeness;
      return (
        <div className={styles.chartContainer}>
          <div className={styles.chartSection}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>목표 vs 실제 진척도</Text>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completenessData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" style={{ fontSize: 11 }} />
                <YAxis style={{ fontSize: 12 }} />
                <Tooltip {...DARK_TOOLTIP_STYLE} />
                <Legend />
                <Line type="monotone" dataKey="target" stroke="#71717a" strokeWidth={2} strokeDasharray="5 5" name="목표" />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="실제" dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Alert
            message={completenessData.insight}
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      );
    }

    case "target_vs_revenue": {
      const targetData = data as typeof modalData.target_vs_revenue;
      return (
        <div className={styles.chartContainer}>
          <Row gutter={12}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="목표 매출"
                  value={(targetData.summary.targetTotal / 100).toFixed(1)}
                  prefix="₩"
                  suffix="B"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="예상 매출"
                  value={(targetData.summary.expectedTotal / 100).toFixed(2)}
                  prefix="₩"
                  suffix="B"
                  valueStyle={{ color: '#3b82f6' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ borderColor: '#f97316' }}>
                <Statistic
                  title="달성률"
                  value={targetData.summary.achievementRate}
                  suffix="%"
                  valueStyle={{ color: '#f97316' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ borderColor: '#ef4444' }}>
                <Statistic
                  title="GAP"
                  value={Math.abs(targetData.summary.gap)}
                  prefix="₩"
                  suffix="M"
                  valueStyle={{ color: '#ef4444' }}
                />
              </Card>
            </Col>
          </Row>

          <div className={styles.chartSection}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>주차별 목표 vs 예상 매출 (단위: 백만원)</Text>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={targetData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" style={{ fontSize: 11 }} />
                <YAxis style={{ fontSize: 12 }} />
                <Tooltip
                  {...DARK_TOOLTIP_STYLE}
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
          <Alert
            message={targetData.insight}
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      );
    }

    case "revenue_timing": {
      const revenueTimingData = data as typeof modalData.revenue_timing;
      return (
        <div className={styles.chartContainer}>
          <div className={styles.chartSection}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>월별 매출 발생 분포 (단위: 백만원)</Text>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueTimingData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" style={{ fontSize: 11 }} />
                <YAxis style={{ fontSize: 12 }} />
                <Tooltip
                  {...DARK_TOOLTIP_STYLE}
                  formatter={(value: number) => [`₩${value}M`, '예상 매출']}
                />
                <Bar dataKey="amount" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {revenueTimingData.data.map((entry: { month: string; amount: number }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.amount === Math.max(...revenueTimingData.data.map((d: { month: string; amount: number }) => d.amount)) ? '#3b82f6' : '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Alert
            message={revenueTimingData.insight}
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      );
    }

    default:
      return null;
  }
};

export const SummaryCards = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const { token } = theme.useToken();

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
      trend: undefined,
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
        open={!!selectedCard}
        onCancel={() => setSelectedCard(null)}
        title={getModalTitle()}
        width={900}
        footer={null}
      >
        <div className={styles.modalContent}>
          {selectedCard && <ModalContent cardId={selectedCard} />}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="default"
              icon={<QuestionCircleOutlined style={{ color: token.colorPrimary }} />}
              size="large"
            >
              BRS AI로 질문하기
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
