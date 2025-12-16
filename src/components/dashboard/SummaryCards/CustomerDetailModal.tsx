import { SalesActionHistory } from "@/components/dashboard/SalesActionHistory";
import { formatCompactCurrency } from "@/data/mockData";
import { Customer, SalesAction } from "@/types/customer";
import { Descriptions, Modal, Tag, Typography } from "antd";

type ModalType = "revenue" | "trust" | "possibility" | null;

interface CustomerDetailModalProps {
  customer: Customer | null;
  modalType: ModalType;
  selectedActions: SalesAction[];
  onClose: () => void;
}

const getPossibilityColor = (p: string) => {
  if (p === "90%") return "green";
  if (p === "40%") return "orange";
  return "red";
};

export const CustomerDetailModal = ({
  customer,
  modalType,
  selectedActions,
  onClose,
}: CustomerDetailModalProps) => {
  return (
    <Modal
      open={!!customer}
      onCancel={onClose}
      footer={null}
      title={customer?.companyName || "고객 상세"}
      width={720}
    >
      {customer && (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="담당자">
            {customer.manager}
          </Descriptions.Item>
          <Descriptions.Item label="카테고리">
            {customer.category}
          </Descriptions.Item>
          <Descriptions.Item label="기업규모">
            {customer.companySize || "미정"}
          </Descriptions.Item>
          <Descriptions.Item label="가능성">
            <Tag color={getPossibilityColor(customer.adoptionDecision.possibility)}>
              {customer.adoptionDecision.possibility}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="계약금액">
            {formatCompactCurrency(customer.contractAmount ?? 0)}
          </Descriptions.Item>
          <Descriptions.Item label="신뢰지수">
            <Tag
              color={
                customer._periodData?.pastTrustIndex !== undefined &&
                  (customer.trustIndex || 0) >
                  (customer._periodData?.pastTrustIndex || 0)
                  ? "green"
                  : "red"
              }
            >
              {customer._periodData?.pastTrustIndex ?? "-"} →{" "}
              {customer.trustIndex} ({customer.trustLevel})
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="목표매출" span={2}>
            <Tag
              color={
                customer._periodData?.pastTargetRevenue !== undefined &&
                  (customer.adoptionDecision.targetRevenue || 0) >
                  (customer._periodData?.pastTargetRevenue || 0)
                  ? "green"
                  : customer._periodData?.pastTargetRevenue !== undefined &&
                    (customer.adoptionDecision.targetRevenue || 0) <
                    (customer._periodData?.pastTargetRevenue || 0)
                    ? "red"
                    : "default"
              }
            >
              {formatCompactCurrency(
                customer._periodData?.pastTargetRevenue ?? 0
              )}{" "}
              →{" "}
              {formatCompactCurrency(
                customer.adoptionDecision.targetRevenue ?? 0
              )}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="예상매출" span={2}>
            <Tag
              color={
                customer._periodData?.pastExpectedRevenue !== undefined &&
                  (customer._periodData?.currentExpectedRevenue || 0) >
                  (customer._periodData?.pastExpectedRevenue || 0)
                  ? "green"
                  : "red"
              }
            >
              {formatCompactCurrency(
                customer._periodData?.pastExpectedRevenue ?? 0
              )}{" "}
              →{" "}
              {formatCompactCurrency(
                customer._periodData?.currentExpectedRevenue ?? 0
              )}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      )}
      {customer && modalType === "revenue" && (
        <div style={{ marginTop: 16 }}>
          <Typography.Title level={5}>영업 히스토리</Typography.Title>
          <SalesActionHistory
            actions={selectedActions}
            customer={customer}
          />
        </div>
      )}
    </Modal>
  );
};

