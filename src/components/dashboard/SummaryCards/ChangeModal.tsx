import type { TimePeriod } from "@/App";
import { formatCompactCurrency } from "@/data/mockData";
import { Customer, SalesAction } from "@/types/customer";
import { PhoneOutlined } from "@ant-design/icons";
import {
  Col,
  Divider,
  List,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";

type ModalType = "revenue" | "trust" | "possibility" | null;

interface ChangeModalProps {
  modalType: ModalType;
  timePeriod: TimePeriod;
  modalData: { up: Customer[]; down: Customer[] };
  onClose: () => void;
  onSelectCustomer: (customer: Customer, actions: SalesAction[]) => void;
  getActionsInPeriod: (customer: Customer, period: TimePeriod) => SalesAction[];
}

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  "1w": "1주일",
  "1m": "1개월",
  "6m": "6개월",
  "1y": "1년",
};

export const ChangeModal = ({
  modalType,
  timePeriod,
  modalData,
  onClose,
  onSelectCustomer,
  getActionsInPeriod,
}: ChangeModalProps) => {
  const modalTitle =
    modalType === "revenue"
      ? "예상 매출 변동"
      : modalType === "trust"
        ? "신뢰지수 변동"
        : modalType === "possibility"
          ? "가능성 변동"
          : "";

  const renderRevenueList = (
    items: Customer[],
    isUp: boolean,
    onSelect: (c: Customer) => void
  ) => {
    if (!items.length)
      return (
        <Typography.Text type="secondary">데이터가 없습니다.</Typography.Text>
      );

    return (
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        <List
          itemLayout="vertical"
          dataSource={items}
          renderItem={(item) => {
            const past = item._periodData?.pastExpectedRevenue ?? 0;
            const current = item._periodData?.currentExpectedRevenue ?? 0;
            const latestAction = item.salesActions
              ? [...item.salesActions].sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0]
              : null;

            return (
              <List.Item
                onClick={() => {
                  onSelect(item);
                  onSelectCustomer(item, getActionsInPeriod(item, timePeriod));
                }}
                style={{
                  padding: "12px 0",
                  borderBlockEnd: "1px solid #1f2933",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <Typography.Text strong>{item.companyName}</Typography.Text>
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {item.manager}
                      </Typography.Text>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      예상매출:
                    </Typography.Text>
                    <div style={{ fontWeight: 600, color: isUp ? "#22c55e" : "#ef4444" }}>
                      {formatCompactCurrency(past)} → {formatCompactCurrency(current)}
                    </div>
                  </div>
                </div>
                {latestAction && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <Tag icon={<PhoneOutlined />} color="default">
                      {latestAction.date}
                    </Tag>
                    <Typography.Text type="secondary">
                      {latestAction.content}
                    </Typography.Text>
                  </div>
                )}
              </List.Item>
            );
          }}
        />
      </div>
    );
  };

  return (
    <Modal
      open={modalType !== null}
      title={modalType === "revenue" ? `예상 매출 변동 (최근 ${TIME_PERIOD_LABELS[timePeriod]})` : modalTitle}
      footer={null}
      onCancel={onClose}
      width={860}
    >
      {modalType === "revenue" ? (
        <>
          <Typography.Title level={5} style={{ color: "#22c55e", marginBottom: 12 }}>
            상승 ({modalData.up.length}개사)
          </Typography.Title>
          {renderRevenueList(modalData.up, true, () => { })}
          <Divider />
          <Typography.Title level={5} style={{ color: "#ef4444", marginBottom: 12 }}>
            하락 ({modalData.down.length}개사)
          </Typography.Title>
          {renderRevenueList(modalData.down, false, () => { })}
        </>
      ) : (
        <Row gutter={16}>
          <Col span={12}>
            <Typography.Title level={5}>
              상승 ({modalData.up.length})
            </Typography.Title>
            <List
              dataSource={modalData.up}
              bordered
              renderItem={(item) => (
                <List.Item
                  onClick={() => {
                    onSelectCustomer(item, getActionsInPeriod(item, timePeriod));
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <List.Item.Meta
                    title={item.companyName}
                    description={`${item.manager} · ${item.category}`}
                  />
                  {modalType === "trust" && item._periodData && (
                    <Space>
                      <Tag color="green">
                        {item._periodData.pastTrustIndex} → {item.trustIndex}
                      </Tag>
                    </Space>
                  )}
                  {modalType === "possibility" && item._periodData && (
                    <Space>
                      <Tag color="green">
                        {item._periodData.pastPossibility} → {item.adoptionDecision.possibility}
                      </Tag>
                    </Space>
                  )}
                </List.Item>
              )}
            />
          </Col>
          <Col span={12}>
            <Typography.Title level={5}>
              하락 ({modalData.down.length})
            </Typography.Title>
            <List
              dataSource={modalData.down}
              bordered
              renderItem={(item) => (
                <List.Item
                  onClick={() => {
                    onSelectCustomer(item, getActionsInPeriod(item, timePeriod));
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <List.Item.Meta
                    title={item.companyName}
                    description={`${item.manager} · ${item.category}`}
                  />
                  {modalType === "trust" && item._periodData && (
                    <Space>
                      <Tag color="red">
                        {item._periodData.pastTrustIndex} → {item.trustIndex}
                      </Tag>
                    </Space>
                  )}
                  {modalType === "possibility" && item._periodData && (
                    <Space>
                      <Tag color="red">
                        {item._periodData.pastPossibility} → {item.adoptionDecision.possibility}
                      </Tag>
                    </Space>
                  )}
                </List.Item>
              )}
            />
          </Col>
        </Row>
      )}
    </Modal>
  );
};

