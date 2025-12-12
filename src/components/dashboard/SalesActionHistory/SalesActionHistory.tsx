import { useState } from "react";
import { Phone, Users, Calendar, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Text, Badge, Modal } from "@/components/common/atoms";
import { SalesAction, Customer, Possibility } from "@/types/customer";
import { formatCurrency } from "@/data/mockData";
import styles from "./index.module.scss";

export interface ActionModalData {
  action: SalesAction;
  weekLabel: string;
  customer?: Customer;
  prevPossibility?: Possibility | null;
  currentPossibility?: Possibility | null;
  prevCustomerResponse?: string | null;
  prevTargetRevenue?: number | null;
  prevTest?: boolean;
  prevQuote?: boolean;
  prevApproval?: boolean;
  prevContract?: boolean;
}

interface SalesActionHistoryProps {
  actions: SalesAction[];
  customer: Customer;
  title?: string;
  showDescription?: boolean;
}

export const SalesActionHistory = ({ 
  actions, 
  customer, 
  title = "영업활동 히스토리",
  showDescription = true 
}: SalesActionHistoryProps) => {
  const [actionModalData, setActionModalData] = useState<ActionModalData | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // 영업 액션 모달 열기
  const openActionModal = (action: SalesAction) => {
    // 이전 액션 찾기 (날짜순 정렬된 상태에서)
    const sortedActions = [...actions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const currentIndex = sortedActions.findIndex(a => a.date === action.date && a.content === action.content);
    const prevAction = currentIndex > 0 ? sortedActions[currentIndex - 1] : null;

    setActionModalData({
      action,
      weekLabel: action.date,
      customer,
      prevPossibility: prevAction?.possibility || null,
      currentPossibility: action.possibility || null,
      prevCustomerResponse: prevAction?.customerResponse || null,
      prevTargetRevenue: prevAction?.targetRevenue || null,
      prevTest: prevAction?.test || false,
      prevQuote: prevAction?.quote || false,
      prevApproval: prevAction?.approval || false,
      prevContract: prevAction?.contract || false,
    });
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setActionModalData(null);
  };

  // 날짜 내림차순 정렬
  const sortedActions = [...actions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <div className={styles.historyContainer}>
        <div className={styles.historyHeader}>
          <Text variant="body-md" weight="semibold">{title}</Text>
          <Badge variant="default" size="sm">{actions.length}건</Badge>
        </div>
        
        {showDescription && (
          <Text variant="caption" color="tertiary" className={styles.historyDesc}>
            영업 액션(콜/미팅)에 따라 가능성과 고객반응이 변경됩니다.
          </Text>
        )}

        <div className={styles.actionsList}>
          {sortedActions.map((action, idx) => (
            <button
              key={idx}
              className={styles.actionItem}
              onClick={() => openActionModal(action)}
            >
              <div className={styles.actionIcon}>
                {action.type === "call" ? <Phone size={14} /> : <Users size={14} />}
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionHeader}>
                  <Text variant="caption" color="tertiary">{action.date}</Text>
                  <Badge 
                    variant={action.type === "meeting" ? "purple" : "cyan"} 
                    size="sm"
                  >
                    {action.type === "meeting" ? "미팅" : "콜"}
                  </Badge>
                  {action.possibility && (
                    <Badge 
                      variant={
                        action.possibility === "90%" ? "success" :
                        action.possibility === "40%" ? "warning" : "error"
                      }
                      size="sm"
                    >
                      {action.possibility}
                    </Badge>
                  )}
                  {action.targetRevenue && (
                    <Text variant="caption" color="secondary" mono>
                      {formatCurrency(action.targetRevenue)}
                    </Text>
                  )}
                  {/* 진행상태 */}
                  <div className={styles.progressDots}>
                    <span className={`${styles.progressDot} ${action.test ? styles.active : ""}`}>T</span>
                    <span className={`${styles.progressDot} ${action.quote ? styles.active : ""}`}>Q</span>
                    <span className={`${styles.progressDot} ${action.approval ? styles.active : ""}`}>A</span>
                    <span className={`${styles.progressDot} ${action.contract ? styles.active : ""}`}>C</span>
                  </div>
                </div>
                <Text variant="body-sm">{action.content}</Text>
              </div>
            </button>
          ))}
          {actions.length === 0 && (
            <div className={styles.emptyActions}>
              <Text variant="body-sm" color="tertiary">해당 기간 내 영업 액션이 없습니다.</Text>
            </div>
          )}
        </div>
      </div>

      {/* 영업 액션 상세 모달 */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={closeActionModal}
        title="영업 액션 상세"
        size="sm"
      >
        {actionModalData && (
          <div className={styles.actionModal}>
            <div className={styles.actionModalHeader}>
              <Badge
                variant={actionModalData.action.type === "meeting" ? "purple" : "cyan"}
                size="md"
              >
                {actionModalData.action.type === "meeting" ? (
                  <>
                    <Users size={12} /> 미팅
                  </>
                ) : (
                  <>
                    <Phone size={12} /> 콜
                  </>
                )}
              </Badge>
              <div className={styles.actionDate}>
                <Calendar size={14} />
                <Text variant="body-sm" color="secondary">
                  {actionModalData.action.date}
                </Text>
              </div>
            </div>

            <div className={styles.actionModalContent}>
              <Text variant="label" color="tertiary">활동 내용</Text>
              <Text variant="body-sm" weight="medium">
                {actionModalData.action.content}
              </Text>
            </div>

            <div className={styles.actionModalMeta}>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">기간</Text>
                <Text variant="body-sm">{actionModalData.weekLabel}</Text>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">담당자</Text>
                <Text variant="body-sm">{customer.manager}</Text>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">가능성 변화</Text>
                <div className={styles.possibilityChange}>
                  {actionModalData.prevPossibility ? (
                    <>
                      <Badge variant="default" size="sm">
                        {actionModalData.prevPossibility}
                      </Badge>
                      <ArrowRight size={12} className={styles.arrowIcon} />
                    </>
                  ) : null}
                  <Badge
                    variant={
                      actionModalData.currentPossibility === "90%"
                        ? "success"
                        : actionModalData.currentPossibility === "40%"
                        ? "warning"
                        : "error"
                    }
                    size="sm"
                  >
                    {actionModalData.currentPossibility || "-"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 고객반응 및 목표매출 */}
            <div className={styles.actionModalMeta}>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">고객반응 변화</Text>
                <div className={styles.possibilityChange}>
                  {actionModalData.prevCustomerResponse && 
                   actionModalData.prevCustomerResponse !== actionModalData.action.customerResponse ? (
                    <>
                      <Badge variant="default" size="sm" className={styles.pastValue}>
                        {actionModalData.prevCustomerResponse}
                      </Badge>
                      <ArrowRight size={12} className={styles.arrowIcon} />
                    </>
                  ) : null}
                  <Badge
                    variant={
                      actionModalData.action.customerResponse === "상"
                        ? "success"
                        : actionModalData.action.customerResponse === "중"
                        ? "warning"
                        : "error"
                    }
                    size="sm"
                  >
                    {actionModalData.action.customerResponse || "-"}
                  </Badge>
                </div>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">목표매출 변화</Text>
                <div className={styles.possibilityChange}>
                  {actionModalData.prevTargetRevenue !== null && 
                   actionModalData.prevTargetRevenue !== undefined &&
                   actionModalData.prevTargetRevenue !== actionModalData.action.targetRevenue ? (
                    <>
                      <Text variant="body-sm" color="tertiary" className={styles.pastValue}>
                        {formatCurrency(actionModalData.prevTargetRevenue)}
                      </Text>
                      <ArrowRight size={12} className={styles.arrowIcon} />
                    </>
                  ) : null}
                  <Text variant="body-sm" weight="semibold">
                    {actionModalData.action.targetRevenue
                      ? formatCurrency(actionModalData.action.targetRevenue)
                      : "-"}
                  </Text>
                </div>
              </div>
              <div className={styles.metaItem}>
                <Text variant="caption" color="tertiary">목표 일자</Text>
                <Text variant="body-sm" weight="semibold">
                  {actionModalData.action.targetDate || "-"}
                </Text>
              </div>
            </div>

            {/* 진행 상태 체크리스트 */}
            <div className={styles.progressChecklist}>
              <Text variant="caption" color="tertiary">진행 상태 변화</Text>
              <div className={styles.checklistItems}>
                <div className={`${styles.checkItem} ${actionModalData.action.test ? styles.checked : ''} ${!actionModalData.prevTest && actionModalData.action.test ? styles.newlyChecked : ''}`}>
                  {actionModalData.action.test ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <Text variant="body-sm">테스트</Text>
                </div>
                <div className={`${styles.checkItem} ${actionModalData.action.quote ? styles.checked : ''} ${!actionModalData.prevQuote && actionModalData.action.quote ? styles.newlyChecked : ''}`}>
                  {actionModalData.action.quote ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <Text variant="body-sm">견적</Text>
                </div>
                <div className={`${styles.checkItem} ${actionModalData.action.approval ? styles.checked : ''} ${!actionModalData.prevApproval && actionModalData.action.approval ? styles.newlyChecked : ''}`}>
                  {actionModalData.action.approval ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <Text variant="body-sm">품의</Text>
                </div>
                <div className={`${styles.checkItem} ${actionModalData.action.contract ? styles.checked : ''} ${!actionModalData.prevContract && actionModalData.action.contract ? styles.newlyChecked : ''}`}>
                  {actionModalData.action.contract ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <Text variant="body-sm">계약</Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

