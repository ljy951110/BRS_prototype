import React, { useState } from "react";
import { Filter, MessageSquare } from "lucide-react";
import { Text } from "@/components/common/atoms";
import { KPICards } from "./KPICards/KPICards";
import { PipelineSummary } from "./PipelineSummary/PipelineSummary";
import { PerformanceTable } from "./PerformanceTable/PerformanceTable";
import { MBMDetailDrawer } from "./MBMDetailDrawer/MBMDetailDrawer";
import styles from "./BusinessInsight.module.scss";

export const BusinessInsight = () => {
  const [selectedMbmId, setSelectedMbmId] = useState<string | null>(null);
  
  // Filter States
  const [period, setPeriod] = useState("1m");
  const [businessType, setBusinessType] = useState("all");
  const [companySize, setCompanySize] = useState("all");
  const [followupStatus, setFollowupStatus] = useState("all");

  return (
    <div className={styles.container}>
      {/* Header & Global Filters */}
      <div className={styles.topSection}>
        <div className={styles.pageHeader}>
          <Text variant="h2" weight="bold">사업 인사이트</Text>
          <button className={styles.aiGlobalButton}>
            <MessageSquare size={18} />
            <span>BRS AI</span>
          </button>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <Filter size={16} className={styles.filterIcon} />
            
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className={styles.select}
            >
              <option value="4w">최근 4주</option>
              <option value="8w">최근 8주</option>
              <option value="1m">이번 달</option>
              <option value="custom">사용자 지정</option>
            </select>

            <select 
              value={businessType} 
              onChange={(e) => setBusinessType(e.target.value)}
              className={styles.select}
            >
              <option value="all">전체 사업 유형</option>
              <option value="recruit_high">채용 고가</option>
              <option value="recruit_new">채용 신규 (MVP)</option>
            </select>

            <select 
              value={companySize} 
              onChange={(e) => setCompanySize(e.target.value)}
              className={styles.select}
            >
              <option value="all">전체 기업 규모</option>
              <option value="t0">T0</option>
              <option value="t1">T1</option>
              <option value="t2">T2</option>
              <option value="t3">T3</option>
            </select>

            <select 
              value={followupStatus} 
              onChange={(e) => setFollowupStatus(e.target.value)}
              className={styles.select}
            >
              <option value="all">전체 팔로업 상태</option>
              <option value="progress">진행</option>
              <option value="stagnant">정체</option>
              <option value="closed">종료</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.scrollContent}>
        {/* 1. KPI Cards */}
        <section className={styles.section}>
          <KPICards />
        </section>

        {/* 2. Pipeline Summary */}
        <section className={styles.section}>
          <PipelineSummary />
        </section>

        {/* 3. Performance Table */}
        <section className={styles.section}>
          <PerformanceTable onRowClick={(id) => setSelectedMbmId(id)} />
        </section>
      </div>

      {/* 4. MBM Detail Drawer */}
      <MBMDetailDrawer 
        isOpen={!!selectedMbmId} 
        onClose={() => setSelectedMbmId(null)}
        mbmId={selectedMbmId}
      />
    </div>
  );
};
