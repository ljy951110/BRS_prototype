import type { TimePeriodType } from "@/types/common";
import { formatCompactCurrency, getDataWithPeriodChange } from "@/data/mockData";
import { Customer, SalesAction } from "@/types/customer";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  TeamOutlined
} from "@ant-design/icons";
import {
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { ChangeModal } from "./ChangeModal";
import { ContractAmountModal } from "./ContractAmountModal";
import { CustomerDetailModal } from "./CustomerDetailModal";
import styles from "./index.module.scss";

type ModalType = "revenue" | "trust" | "possibility" | null;

interface SummaryCardsProps {
  data: Customer[];
  timePeriod: TimePeriodType;
}

const PERIOD_DAYS: Record<TimePeriodType, number> = {
  "1w": 7,
  "1m": 30,
  "6m": 180,
  "1y": 365,
};

export const SummaryCards = ({ data, timePeriod }: SummaryCardsProps) => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedActions, setSelectedActions] = useState<SalesAction[]>([]);
  const [contractModalOpen, setContractModalOpen] = useState(false);

  const periodData = useMemo(
    () => getDataWithPeriodChange(data, timePeriod),
    [data, timePeriod]
  );

  const changedCompanies = useMemo(() => {
    const revenueUp = periodData.filter(
      (c) =>
        c._periodData &&
        c._periodData.currentExpectedRevenue >
        c._periodData.pastExpectedRevenue
    );
    const revenueDown = periodData.filter(
      (c) =>
        c._periodData &&
        c._periodData.currentExpectedRevenue <
        c._periodData.pastExpectedRevenue
    );
    const trustUp = periodData.filter((c) => c.changeDirection === "up");
    const trustDown = periodData.filter((c) => c.changeDirection === "down");
    const possibilityUp = periodData.filter(
      (c) => c._periodData?.possibilityChange === "up"
    );
    const possibilityDown = periodData.filter(
      (c) => c._periodData?.possibilityChange === "down"
    );
    return {
      revenue: { up: revenueUp, down: revenueDown },
      trust: { up: trustUp, down: trustDown },
      possibility: { up: possibilityUp, down: possibilityDown },
    };
  }, [periodData]);

  const stats = useMemo(() => {
    const totalCustomers = periodData.length;
    const totalContract = periodData.reduce(
      (sum, c) => sum + (c.contractAmount || 0),
      0
    );
    const currentExpectedRevenue = periodData.reduce(
      (sum, c) => sum + (c._periodData?.currentExpectedRevenue || 0),
      0
    );
    const pastExpectedRevenue = periodData.reduce(
      (sum, c) => sum + (c._periodData?.pastExpectedRevenue || 0),
      0
    );

    const growth =
      pastExpectedRevenue === 0
        ? 0
        : ((currentExpectedRevenue - pastExpectedRevenue) /
          pastExpectedRevenue) *
        100;

    return {
      totalCustomers,
      totalContract,
      currentExpectedRevenue,
      pastExpectedRevenue,
      growth,
      trustUp: changedCompanies.trust.up.length,
      trustDown: changedCompanies.trust.down.length,
      possUp: changedCompanies.possibility.up.length,
      possDown: changedCompanies.possibility.down.length,
    };
  }, [periodData, changedCompanies]);

  const modalData =
    modalType === null ? { up: [], down: [] } : changedCompanies[modalType];

  const getActionsInPeriod = (customer: Customer, period: TimePeriodType) => {
    if (!customer.salesActions || customer.salesActions.length === 0) return [];
    const now = new Date("2024-12-10");
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - PERIOD_DAYS[period]);
    return [...customer.salesActions]
      .filter((action) => {
        const actionDate = new Date(action.date);
        return actionDate >= periodStart && actionDate <= now;
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  };

  const handleSelectCustomer = (customer: Customer, actions: SalesAction[]) => {
    setSelectedCustomer(customer);
    setSelectedActions(actions);
  };

  return (
    <>
      <Row gutter={[16, 16]} className={styles.summaryCards}>
        <Col span={6}>
          <Card>
            <Statistic
              title="전체 고객"
              value={stats.totalCustomers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => setContractModalOpen(true)}
            className={styles.hoverableCard}
          >
            <Statistic
              title="총 계약금액"
              value={stats.totalContract}
              formatter={(val) => formatCompactCurrency(Number(val))}
            />

          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => setModalType("revenue")}
            className={styles.hoverableCard}
          >
            <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
              <div>
                <Typography.Text type="secondary">예상 매출</Typography.Text>
                <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                  <span>{formatCompactCurrency(stats.pastExpectedRevenue)}</span>
                  <span style={{ margin: "0 6px" }}>→</span>
                  <span style={{ color: "#22c55e" }}>
                    {formatCompactCurrency(stats.currentExpectedRevenue)}
                  </span>
                </div>
              </div>

            </Space>
            <Space style={{ marginTop: 12 }} size={8}>
              <Tag color="green" icon={<ArrowUpOutlined />}>
                {changedCompanies.revenue.up.length}
              </Tag>
              <Tag color="red" icon={<ArrowDownOutlined />}>
                {changedCompanies.revenue.down.length}
              </Tag>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => setModalType("trust")}
            className={styles.hoverableCard}
          >
            <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
              <div>
                <Typography.Text type="secondary">신뢰지수 변동</Typography.Text>
                <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                  <span style={{ color: "#22c55e", marginRight: 12 }}>
                    +{changedCompanies.trust.up.length}
                  </span>
                  <span style={{ color: "#ef4444" }}>
                    -{changedCompanies.trust.down.length}
                  </span>
                </div>
              </div>

            </Space>
          </Card>
        </Col>
      </Row>

      <ChangeModal
        modalType={modalType}
        timePeriod={timePeriod}
        modalData={modalData}
        onClose={() => {
          setModalType(null);
          setSelectedCustomer(null);
        }}
        onSelectCustomer={handleSelectCustomer}
        getActionsInPeriod={getActionsInPeriod}
      />

      <CustomerDetailModal
        customer={selectedCustomer}
        modalType={modalType}
        selectedActions={selectedActions}
        onClose={() => setSelectedCustomer(null)}
      />

      <ContractAmountModal
        open={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
      />
    </>
  );
};
