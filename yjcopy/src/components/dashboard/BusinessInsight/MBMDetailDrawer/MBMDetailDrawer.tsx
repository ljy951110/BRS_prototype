import React from "react";
import { X, HelpCircle } from "lucide-react";
import { Drawer, Text } from "@/components/common/atoms";
import styles from "./MBMDetailDrawer.module.scss";

interface MBMDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mbmId: string | null;
}

export const MBMDetailDrawer = ({ isOpen, onClose, mbmId }: MBMDetailDrawerProps) => {
  // Mock data fetching based on mbmId
  const detailData = {
    title: "2024 하반기 공공 부문 전략 세미나",
    date: "2024.12.01",
    funnel: [
      { label: "초대", value: 150 },
      { label: "참여", value: 117 },
      { label: "상담", value: 18 },
    ],
    followupStatus: {
      progress: 60,
      stagnant: 5,
      closed: 35,
    },
    voc: [
      "가격 정책에 대한 문의가 많음",
      "클라우드 보안 인증 관련 우려",
      "기존 시스템 연동 가능 여부",
    ]
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="lg">
      <div className={styles.drawerHeader}>
        <div className={styles.titleSection}>
          <Text variant="h3" weight="bold">{detailData.title}</Text>
          <Text variant="body-sm" color="tertiary">{detailData.date}</Text>
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={24} />
        </button>
      </div>

      <div className={styles.drawerBody}>
        {/* Funnel Summary */}
        <section className={styles.section}>
          <Text variant="h4" weight="bold" className={styles.sectionTitle}>퍼널 요약</Text>
          <div className={styles.funnelContainer}>
            {detailData.funnel.map((step, idx) => (
              <div key={idx} className={styles.funnelStep}>
                <Text variant="body-sm" color="secondary">{step.label}</Text>
                <Text variant="h3" weight="bold">{step.value}</Text>
              </div>
            ))}
          </div>
        </section>

        {/* Followup Status */}
        <section className={styles.section}>
          <Text variant="h4" weight="bold" className={styles.sectionTitle}>팔로업 상태</Text>
          <div className={styles.statusGrid}>
             <div className={styles.statusItem}>
               <Text variant="body-sm">진행 중</Text>
               <Text variant="h4" color="accent">{detailData.followupStatus.progress}%</Text>
             </div>
             <div className={styles.statusItem}>
               <Text variant="body-sm">정체</Text>
               <Text variant="h4" color="error">{detailData.followupStatus.stagnant}</Text>
             </div>
             <div className={styles.statusItem}>
               <Text variant="body-sm">종료</Text>
               <Text variant="h4" color="secondary">{detailData.followupStatus.closed}%</Text>
             </div>
          </div>
        </section>

        {/* VOC */}
        <section className={styles.section}>
          <Text variant="h4" weight="bold" className={styles.sectionTitle}>주요 VOC</Text>
          <ul className={styles.vocList}>
            {detailData.voc.map((item, idx) => (
              <li key={idx} className={styles.vocItem}>
                <Text variant="body">{item}</Text>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.drawerFooter}>
        <div className={styles.aiButton}>
          <HelpCircle size={18} />
          <div className={styles.aiText}>
            <Text weight="bold" color="accent">BRS AI로 매출 영향 물어보기</Text>
            <Text variant="caption" color="tertiary">예상 매출 금액과 시기를 분석해드립니다.</Text>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
