import { ArrowRight, Eye } from "lucide-react";
import { Text, Badge } from "@/components/common/atoms";
import styles from "./index.module.scss";

type ContentCategory = 'TOFU' | 'MOFU' | 'BOFU';

interface ProgressCounts {
  test: number;
  quote: number;
  approval: number;
  contract: number;
}

interface ContentInfoCardProps {
  title: string;
  category: ContentCategory;
  currentViews: number;
  pastViews?: number;
  periodViews?: number;
  viewerCount: number;
  progressCounts?: ProgressCounts;
  onClick?: () => void;
}

const CATEGORY_COLORS: Record<ContentCategory, { variant: 'cyan' | 'purple' | 'success'; label: string }> = {
  'TOFU': { variant: 'cyan', label: '인지단계' },
  'MOFU': { variant: 'purple', label: '고려단계' },
  'BOFU': { variant: 'success', label: '결정단계' },
};

export const ContentInfoCard = ({ 
  title, 
  category, 
  currentViews, 
  pastViews, 
  periodViews = 0, 
  viewerCount, 
  progressCounts,
  onClick 
}: ContentInfoCardProps) => {
  const content = (
    <>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <Text variant="body-sm" weight="semibold">{title}</Text>
          <Badge variant={CATEGORY_COLORS[category].variant} size="sm">
            {category}
          </Badge>
        </div>
        <div className={styles.cardViews}>
          <Eye size={12} className={styles.viewsIcon} />
          <Text variant="caption" color="tertiary">조회</Text>
          {periodViews > 0 && pastViews !== undefined ? (
            <>
              <Text variant="body-sm" color="tertiary" mono>{pastViews}</Text>
              <ArrowRight size={10} className={styles.arrowIcon} />
              <Text variant="body-sm" weight="semibold" mono color="success">
                {currentViews}
              </Text>
            </>
          ) : (
            <Text variant="body-sm" mono>{currentViews}</Text>
          )}
        </div>
      </div>
      <div className={styles.cardMeta}>
        <Text variant="caption" color="secondary">
          조회 기업: {viewerCount}개사
        </Text>
        {progressCounts && (
          <div className={styles.progressDots}>
            <span className={`${styles.dot} ${progressCounts.test > 0 ? styles.dotActive : ''}`}>
              T:{progressCounts.test}
            </span>
            <span className={`${styles.dot} ${progressCounts.quote > 0 ? styles.dotActive : ''}`}>
              Q:{progressCounts.quote}
            </span>
            <span className={`${styles.dot} ${progressCounts.approval > 0 ? styles.dotActive : ''}`}>
              A:{progressCounts.approval}
            </span>
            <span className={`${styles.dot} ${progressCounts.contract > 0 ? styles.dotActive : ''}`}>
              C:{progressCounts.contract}
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button className={styles.contentCard} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div className={styles.contentCard}>
      {content}
    </div>
  );
};

