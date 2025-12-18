import React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Card, Text } from "@/components/common/atoms";
import styles from "./PerformanceTable.module.scss";

interface PerformanceData {
  id: string;
  name: string;
  date: string;
  targetCount: number;
  t3Rate: number;
  participationRate: number;
  consultationRate: number;
  followupRate: number;
  stagnantCount: number;
  status: "normal" | "warning" | "danger";
}

interface PerformanceTableProps {
  onRowClick: (id: string) => void;
}

export const PerformanceTable = ({ onRowClick }: PerformanceTableProps) => {
  const data: PerformanceData[] = [
    {
      id: "mbm-001",
      name: "2024 하반기 공공 부문 전략 세미나",
      date: "2024.12.01",
      targetCount: 150,
      t3Rate: 45,
      participationRate: 78,
      consultationRate: 12,
      followupRate: 60,
      stagnantCount: 5,
      status: "warning",
    },
    {
      id: "mbm-002",
      name: "AI 도입 혁신 포럼",
      date: "2024.11.24",
      targetCount: 200,
      t3Rate: 60,
      participationRate: 85,
      consultationRate: 25,
      followupRate: 80,
      stagnantCount: 2,
      status: "normal",
    },
    {
      id: "mbm-003",
      name: "금융권 보안 트렌드 2025",
      date: "2024.11.15",
      targetCount: 80,
      t3Rate: 30,
      participationRate: 55,
      consultationRate: 8,
      followupRate: 40,
      stagnantCount: 12,
      status: "danger",
    },
  ];

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <Text variant="h3" weight="bold">MBM 성과 상세</Text>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>MBM명</th>
              <th>진행일</th>
              <th>대상 기업</th>
              <th>T3 비중</th>
              <th>참여율</th>
              <th>상담 전환</th>
              <th>팔로업</th>
              <th>정체</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} onClick={() => onRowClick(row.id)} className={styles.row}>
                <td className={styles.nameCell}>
                  <Text weight="medium">{row.name}</Text>
                </td>
                <td>{row.date}</td>
                <td>{row.targetCount}</td>
                <td>{row.t3Rate}%</td>
                <td>{row.participationRate}%</td>
                <td>{row.consultationRate}%</td>
                <td>{row.followupRate}%</td>
                <td>
                   <Text color={row.stagnantCount > 5 ? "error" : "primary"} weight={row.stagnantCount > 5 ? "bold" : "normal"}>
                     {row.stagnantCount}
                   </Text>
                </td>
                <td>
                  <div className={`${styles.statusBadge} ${styles[row.status]}`}>
                    {row.status === "normal" && "정상"}
                    {row.status === "warning" && "주의"}
                    {row.status === "danger" && "위험"}
                  </div>
                </td>
                <td>
                  <ArrowRight size={16} color="#71717a" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

