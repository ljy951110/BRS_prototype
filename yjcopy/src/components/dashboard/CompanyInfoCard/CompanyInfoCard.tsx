import { ArrowRight } from "lucide-react";
import { Text, Badge } from "@/components/common/atoms";
import { Customer, ViewerDetail } from "@/types/customer";
import styles from "./index.module.scss";

interface TrustChange {
  pastValue: number | null | undefined;
  currentValue: number | null | undefined;
  changeAmount: number | null | undefined;
  direction: 'up' | 'down' | 'same';
}

interface CompanyInfoCardProps {
  customer?: Customer;
  viewer?: ViewerDetail;
  showDate?: boolean;
  date?: string;
  trustChange?: TrustChange;
  onClick?: () => void;
}

// 금액 포맷팅
const formatAmount = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || amount === 0) return "-";
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
};

export const CompanyInfoCard = ({ customer, viewer, showDate, date, trustChange, onClick }: CompanyInfoCardProps) => {
  // customer 또는 viewer 데이터에서 공통 정보 추출
  const companyName = customer?.companyName || viewer?.companyName || '';
  const category = customer?.category || viewer?.category || '';
  const companySize = customer?.companySize || viewer?.companySize;
  const manager = customer?.manager || viewer?.manager || '';
  const contractAmount = customer?.contractAmount || viewer?.contractAmount;
  const targetRevenue = customer?.adoptionDecision?.targetRevenue || viewer?.targetRevenue;
  const possibility = customer?.adoptionDecision?.possibility || viewer?.possibility;
  const test = customer?.adoptionDecision?.test || viewer?.test;
  const quote = customer?.adoptionDecision?.quote || viewer?.quote;
  const approval = customer?.adoptionDecision?.approval || viewer?.approval;
  const contract = customer?.adoptionDecision?.contract || viewer?.contract;
  const viewerDate = viewer?.date || date;
  
  const content = (
    <>
      <div className={styles.cardHeader}>
        <div className={styles.companyName}>
          <Text variant="body-sm" weight="semibold">{companyName}</Text>
          <Badge variant="default" size="sm">{category}</Badge>
          {companySize && (
            <Badge variant="purple" size="sm">{companySize}</Badge>
          )}
        </div>
        <div className={styles.cardHeaderRight}>
          {showDate && viewerDate && (
            <Text variant="caption" color="tertiary">{viewerDate}</Text>
          )}
          {trustChange && (
            <div className={styles.trustChange}>
              <Text variant="caption" color="tertiary" mono>
                {trustChange.pastValue ?? '-'}
              </Text>
              <ArrowRight size={10} className={styles.arrowIcon} />
              <Text 
                variant="body-sm" 
                weight="medium" 
                color={trustChange.direction === 'up' ? 'success' : trustChange.direction === 'down' ? 'error' : 'primary'} 
                mono
              >
                {trustChange.currentValue}
              </Text>
              {trustChange.changeAmount !== null && trustChange.changeAmount !== 0 && (
                <Badge 
                  variant={trustChange.direction === 'up' ? 'success' : 'error'} 
                  size="sm"
                >
                  {trustChange.direction === 'up' ? '+' : ''}{trustChange.changeAmount}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={styles.cardDetails}>
        <div className={styles.cardMeta}>
          <Text variant="caption" color="secondary">담당자: {manager}</Text>
          <Text variant="caption" color="secondary">
            계약금액: {formatAmount(contractAmount)}
          </Text>
          <Text variant="caption" color="secondary">
            목표매출: {formatAmount(targetRevenue)}
          </Text>
        </div>
        <div className={styles.cardProgress}>
          <Badge 
            variant={possibility === '90%' ? 'success' : possibility === '40%' ? 'warning' : 'error'} 
            size="sm"
          >
            {possibility || '0%'}
          </Badge>
          <div className={styles.progressDots}>
            <span className={`${styles.dot} ${test ? styles.dotActive : ''}`} title="Test">T</span>
            <span className={`${styles.dot} ${quote ? styles.dotActive : ''}`} title="Quote">Q</span>
            <span className={`${styles.dot} ${approval ? styles.dotActive : ''}`} title="Approval">A</span>
            <span className={`${styles.dot} ${contract ? styles.dotActive : ''}`} title="Contract">C</span>
          </div>
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button className={styles.companyCard} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div className={styles.companyCard}>
      {content}
    </div>
  );
};

