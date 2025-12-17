import React from "react";
import { ArrowRight } from "lucide-react";
import { Text } from "@/components/common/atoms";
import { Customer, MBMPipelineStatus } from "@/types/customer";
import styles from "./PipelineSummary.module.scss";

interface PipelineStageProps {
  label: string;
  count: number;
  subText?: string;
  isActive?: boolean;
  onClick: () => void;
}

const PipelineStage = ({ label, count, subText, isActive, onClick }: PipelineStageProps) => {
  return (
    <div 
      className={`${styles.stageCard} ${isActive ? styles.active : ""}`}
      onClick={onClick}
    >
      <div className={styles.stageHeader}>
        <Text variant="body-sm" color={isActive ? "accent" : "secondary"}>
          {label}
        </Text>
      </div>
      <div className={styles.stageBody}>
        <Text variant="h3" weight="bold" color={isActive ? "accent" : "primary"}>
          {count}
        </Text>
        {subText && (
          <Text variant="caption" color="tertiary">
            {subText}
          </Text>
        )}
      </div>
    </div>
  );
};

interface PipelineSummaryProps {
  data?: Customer[];
  activeStage?: MBMPipelineStatus | null;
  onStageClick?: (stage: MBMPipelineStatus | null) => void;
}

export const PipelineSummary = ({ data, activeStage, onStageClick }: PipelineSummaryProps) => {
  const [internalActiveStage, setInternalActiveStage] = React.useState<string | null>(null);
  
  // 외부 제어 모드인지 확인
  const isControlled = onStageClick !== undefined;
  const currentActiveStage = isControlled ? activeStage : internalActiveStage;

  // 데이터 기반으로 각 단계별 카운트 계산
  const stageCounts = React.useMemo(() => {
    if (!data) {
      // 기본 더미 데이터
      return {
        invited: 0,
        participated: 4,
        followup: 11,
        stagnant: 4,
        closed: 7,
      };
    }

    const counts: Record<MBMPipelineStatus, number> = {
      invited: 0,
      participated: 0,
      followup: 0,
      stagnant: 0,
      closed: 0,
    };

    data.forEach((customer) => {
      if (customer.mbmPipelineStatus) {
        counts[customer.mbmPipelineStatus]++;
      }
    });

    return counts;
  }, [data]);

  const stages: { id: MBMPipelineStatus; label: string; count: number; subText: string }[] = [
    { id: "invited", label: "참여전", count: stageCounts.invited, subText: "응답 대기" },
    { id: "participated", label: "참여", count: stageCounts.participated, subText: "MBM 참석" },
    { id: "followup", label: "팔로업 진행", count: stageCounts.followup, subText: "진행 중" },
    { id: "stagnant", label: "정체", count: stageCounts.stagnant, subText: "N일 이상" },
    { id: "closed", label: "종료", count: stageCounts.closed, subText: "계약/실패" },
  ];

  const handleStageClick = (stageId: MBMPipelineStatus) => {
    const newStage = currentActiveStage === stageId ? null : stageId;
    
    if (isControlled) {
      onStageClick?.(newStage);
    } else {
      setInternalActiveStage(newStage);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text variant="h3" weight="bold">MBM 파이프라인 흐름</Text>
        <div className={styles.headerRight}>
          <Text variant="caption" color="tertiary">
            {currentActiveStage ? "클릭하여 필터 해제" : "클릭하여 필터 적용"}
          </Text>
        </div>
      </div>
      
      <div className={styles.pipelineWrapper}>
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <PipelineStage
              {...stage}
              isActive={currentActiveStage === stage.id}
              onClick={() => handleStageClick(stage.id)}
            />
            {index < stages.length - 1 && (
              <div className={styles.arrow}>
                <ArrowRight size={20} color="#71717a" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
