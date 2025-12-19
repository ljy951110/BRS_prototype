import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface PresetDateRangePickerProps {
  value?: [Dayjs | null, Dayjs | null];
  onChange?: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  placeholder?: [string, string];
  style?: React.CSSProperties;
  format?: string;
}

/**
 * 프리셋 날짜 범위 선택기
 * 
 * 프리셋 옵션과 함께 날짜 범위를 선택할 수 있는 컴포넌트
 * 
 * 프리셋:
 * - 1주: 현재 날짜 - 1주일 ~ 현재 날짜
 * - 1달: 현재 날짜 - 1달 ~ 현재 날짜
 * - 3달: 현재 날짜 - 3달 ~ 현재 날짜
 * - 6달: 현재 날짜 - 6달 ~ 현재 날짜
 * - 1년: 현재 날짜 - 1년 ~ 현재 날짜
 */
export const PresetDateRangePicker = ({
  value,
  onChange,
  placeholder = ['시작일', '종료일'],
  style = { width: 280 },
  format = 'YYYY-MM-DD',
}: PresetDateRangePickerProps) => {
  return (
    <RangePicker
      value={value}
      onChange={(dates) => {
        if (onChange) {
          onChange(dates ? [dates[0], dates[1]] : null);
        }
      }}
      placeholder={placeholder}
      style={style}
      format={format}
      presets={[
        {
          label: '1주',
          value: [dayjs().subtract(1, 'week'), dayjs()],
        },
        {
          label: '1달',
          value: [dayjs().subtract(1, 'month'), dayjs()],
        },
        {
          label: '3달',
          value: [dayjs().subtract(3, 'month'), dayjs()],
        },
        {
          label: '6달',
          value: [dayjs().subtract(6, 'month'), dayjs()],
        },
        {
          label: '1년',
          value: [dayjs().subtract(1, 'year'), dayjs()],
        },
      ]}
    />
  );
};

