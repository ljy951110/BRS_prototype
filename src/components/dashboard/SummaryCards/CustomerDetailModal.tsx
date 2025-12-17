import { SalesActionHistory } from "@/components/dashboard/SalesActionHistory";
import { Customer, SalesAction } from "@/types/customer";
import { List, Modal, Tag, Typography } from "antd";
import { BookOpen, Star } from "lucide-react";

type ModalType = "revenue" | "trust" | "possibility" | null;

interface CustomerDetailModalProps {
  customer: Customer | null;
  modalType: ModalType;
  selectedActions: SalesAction[];
  onClose: () => void;
}

// MBM 이벤트 정보
type MBMEvent = {
  date: string;
  label: string;
  topic: string;
  description: string;
};

const MBM_EVENTS: Record<string, MBMEvent> = {
  "1107": {
    date: "2024-11-07",
    label: "11/7 MBM",
    topic: "HR Tech 트렌드와 채용 자동화",
    description: "최신 HR Tech 동향과 영상면접 큐레이터/역검 활용 사례를 공유하는 분기 세미나",
  },
  "1218": {
    date: "2024-12-18",
    label: "12/18 MBM",
    topic: "영상면접 고도화 & 리텐션 전략",
    description: "영상면접 큐레이터 고도화 기능 소개와 리텐션/재계약 사례 공유",
  },
  "1209": {
    date: "2024-12-12",
    label: "12/12 MBM",
    topic: "AI 면접 신뢰도 개선",
    description: "현재 주간 라이브 MBM 세션",
  },
};

// 컨텐츠 카테고리 레이블
const CONTENT_CATEGORY_LABELS: Record<string, { label: string; color: "blue" | "purple" | "green" }> = {
  TOFU: { label: "인지 단계", color: "blue" },
  MOFU: { label: "고려 단계", color: "purple" },
  BOFU: { label: "결정 단계", color: "green" },
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
      {customer && modalType === "revenue" && (
        <div style={{ marginTop: 16 }}>
          <Typography.Title level={5}>영업 히스토리</Typography.Title>
          <SalesActionHistory
            actions={selectedActions}
            customer={customer}
          />
        </div>
      )}

      {customer && modalType === "trust" && (
        <div style={{ marginTop: 16 }}>
          {/* 콘텐츠 조회 기록 */}
          <Typography.Title level={5}>
            콘텐츠 소비 히스토리 ({customer.contentEngagements?.length || 0}건)
          </Typography.Title>
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            고객이 조회한 콘텐츠입니다. TOFU(+1), MOFU(+2), BOFU(+3) 포인트씩 신뢰지수가 증가합니다.
          </Typography.Text>

          {customer.contentEngagements && customer.contentEngagements.length > 0 ? (
            <List
              size="small"
              bordered
              dataSource={customer.contentEngagements}
              style={{ marginBottom: 24 }}
              renderItem={(content) => {
                const categoryInfo = CONTENT_CATEGORY_LABELS[content.category] || {
                  label: content.category,
                  color: "blue" as const,
                };
                return (
                  <List.Item>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, width: "100%" }}>
                      <BookOpen size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Typography.Text strong>{content.title}</Typography.Text>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {content.date}
                          </Typography.Text>
                          <Tag color={categoryInfo.color}>
                            {content.category} · {categoryInfo.label}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          ) : (
            <Typography.Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
              조회한 콘텐츠가 없습니다.
            </Typography.Text>
          )}

          {/* MBM 참석 이력 */}
          <Typography.Title level={5}>
            MBM 참석 이력
          </Typography.Title>
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            MBM 세미나 참석 시 신뢰지수가 증가합니다.
          </Typography.Text>

          <List
            size="small"
            bordered
            dataSource={Object.entries(MBM_EVENTS).filter(([key]) =>
              customer.attendance && customer.attendance[key as keyof typeof customer.attendance] !== undefined
            )}
            renderItem={([key, event]) => {
              const attended = customer.attendance?.[key as keyof typeof customer.attendance];
              return (
                <List.Item>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, width: "100%" }}>
                    <Star
                      size={16}
                      style={{ marginTop: 2, flexShrink: 0 }}
                      fill={attended ? "currentColor" : "none"}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <Typography.Text strong>{event.label}</Typography.Text>
                          <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                            {event.topic}
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {event.date}
                          </Typography.Text>
                        </div>
                        <Tag color={attended ? "green" : "red"}>
                          {attended ? "참석" : "불참"}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      )}
    </Modal>
  );
};

