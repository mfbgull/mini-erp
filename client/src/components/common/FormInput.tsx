import { ChangeEvent } from 'react';
import './FormInput.css';
import SearchableSelect from './SearchableSelect';

interface SelectOption {
  value: string | number;
  label: string;
}

type InputType = 'text' | 'number' | 'email' | 'password' | 'date' | 'textarea' | 'select' | 'searchable-select' | 'checkbox';

interface FormInputProps {
  label?: string;
  name?: string;
  type?: InputType;
  value: string | number | boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: SelectOption[];
  rows?: number;
  tooltip?: string;
  step?: string;
  className?: string;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  rows = 3,
  tooltip,
  step,
  className
}: FormInputProps) {
  const inputId = `input-${name || 'default'}`;

  return (
    <div className="form-input-group">
      {type !== 'searchable-select' && (
        <div className="form-label-container">
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && <span className="required">*</span>}
          </label>
          {tooltip && (
            <div className="tooltip-wrapper">
              <span className="tooltip-icon" title={tooltip}>i</span>
              <div className="tooltip-popup">{tooltip}</div>
            </div>
          )}
        </div>
      )}

      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value as string}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className="form-textarea"
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value as string | number}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="form-select"
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'searchable-select' ? (
        <div className="searchable-select-with-tooltip">
          <SearchableSelect
            name={name}
            value={value as string | number}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            label={label}
          />
          {tooltip && (
            <div className="tooltip-wrapper tooltip-select">
              <span className="tooltip-icon" title={tooltip}>i</span>
              <div className="tooltip-popup">{tooltip}</div>
            </div>
          )}
        </div>
      ) : type === 'checkbox' ? (
        <div className="form-checkbox">
          <input
            id={inputId}
            type="checkbox"
            name={name}
            checked={value as boolean}
            onChange={onChange}
            disabled={disabled}
          />
          <label htmlFor={inputId} className="checkbox-label">
            {placeholder || label}
          </label>
        </div>
      ) : (
        <input
          id={inputId}
          type={type}
          name={name}
          value={value as string | number}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          step={step || (type === 'number' ? '0.01' : undefined)}
          className={className || "form-input"}
        />
      )}
    </div>
  );
}
