import { useState } from 'react';
import FormInput from './FormInput';
import './DateRangePicker.css';

const DateRangePicker = ({ 
  fromDate, 
  toDate, 
  onFromDateChange, 
  onToDateChange,
  label = "Date Range"
}) => {
  return (
    <div className="date-range-picker">
      <div className="date-range-inputs">
        <div className="date-input-group">
          <label>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="date-input"
          />
        </div>
        <div className="date-input-group">
          <label>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="date-input"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;