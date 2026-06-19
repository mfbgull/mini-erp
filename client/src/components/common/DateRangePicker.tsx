import './DateRangePicker.css';

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  label?: string;
}

const DateRangePicker = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DateRangePickerProps) => {
  return (
    <div className="date-range-picker">
      <div className="date-range-inputs">
        <div className="date-input-group">
          <label>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFromDateChange(e.target.value)}
            className="date-input"
          />
        </div>
        <div className="date-input-group">
          <label>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onToDateChange(e.target.value)}
            className="date-input"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
