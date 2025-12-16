import { formatCompactCurrency } from "@/data/mockData";
import { Modal, Typography } from "antd";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

interface ContractAmountModalProps {
  open: boolean;
  onClose: () => void;
}

interface ContractData {
  month: string;
  목표금액: number;
  실제계약: number;
  계약잔여: number;
}

// Mock 데이터: 2024년 7월부터 12월까지 월별 계약금액 추이
const MOCK_CONTRACT_DATA: ContractData[] = [
  { month: "2024-07", 목표금액: 8000000000, 실제계약: 8000000000, 계약잔여: 9000000000 * 0.9 },
  { month: "2024-08", 목표금액: 9000000000, 실제계약: 8500000000, 계약잔여: 9500000000 * 0.9 },
  { month: "2024-09", 목표금액: 10000000000, 실제계약: 9500000000, 계약잔여: 10000000000 * 0.9 },
  { month: "2024-10", 목표금액: 11000000000, 실제계약: 10500000000, 계약잔여: 11000000000 * 0.9 },
  { month: "2024-11", 목표금액: 12000000000, 실제계약: 12000000000, 계약잔여: 12500000000 * 0.9 },
  { month: "2024-12", 목표금액: 13000000000, 실제계약: 13500000000, 계약잔여: 13500000000 * 0.9 },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <Typography.Text strong style={{ color: "#fff", display: "block", marginBottom: 8 }}>
          {label}
        </Typography.Text>
        {payload.map((entry, index: number) => (
          <div key={index} style={{ marginBottom: 4 }}>
            <Typography.Text style={{ color: entry.color, fontSize: 12 }}>
              {entry.name}: {formatCompactCurrency(Number(entry.value))}
            </Typography.Text>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ContractAmountModal = ({ open, onClose }: ContractAmountModalProps) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="총 계약금액 추이"
      width={900}
    >
      <div style={{ marginTop: 16 }}>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          2024년 7월부터 12월까지의 월별 계약금액 추이입니다.
        </Typography.Text>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={MOCK_CONTRACT_DATA}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRemain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const [, month] = value.split("-");
                return `${month}월`;
              }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickFormatter={(value) => formatCompactCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="line"
            />
            <Area
              type="monotone"
              dataKey="목표금액"
              stroke="#fbbf24"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTarget)"
            />
            <Area
              type="monotone"
              dataKey="계약잔여"
              stroke="#9ca3af"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRemain)"
            />
            <Area
              type="monotone"
              dataKey="실제계약"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorActual)"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <div style={{ padding: 16, background: "#1f2937", borderRadius: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              현재 총 계약금액
            </Typography.Text>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700, color: "#ef4444" }}>
              {formatCompactCurrency(MOCK_CONTRACT_DATA[MOCK_CONTRACT_DATA.length - 1].실제계약)}
            </div>
          </div>
          <div style={{ padding: 16, background: "#1f2937", borderRadius: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              목표 달성률
            </Typography.Text>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700, color: "#22c55e" }}>
              {(
                (MOCK_CONTRACT_DATA[MOCK_CONTRACT_DATA.length - 1].실제계약 /
                  MOCK_CONTRACT_DATA[MOCK_CONTRACT_DATA.length - 1].목표금액) *
                100
              ).toFixed(1)}
              %
            </div>
          </div>
          <div style={{ padding: 16, background: "#1f2937", borderRadius: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              전월 대비 증가
            </Typography.Text>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700, color: "#22c55e" }}>
              +
              {formatCompactCurrency(
                MOCK_CONTRACT_DATA[MOCK_CONTRACT_DATA.length - 1].실제계약 -
                MOCK_CONTRACT_DATA[MOCK_CONTRACT_DATA.length - 2].실제계약
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

