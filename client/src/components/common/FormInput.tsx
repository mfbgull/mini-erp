import { ChangeEvent, RefObject } from 'react';

import '../../styles/components/form.css';
import SearchableSelect from './SearchableSelect';

interface SelectOption {
  value: string | number;
  label: string;
}

type InputType = 'text' | 'number' | 'email' | 'password' | 'date' | 'tel' | 'textarea' | 'select' | 'searchable-select' | 'checkbox';

interface FormInputProps {
  label?: string;
  name?: string;
  type?: InputType;
  value?: string | number | boolean;
  checked?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  options?: SelectOption[];
  rows?: number;
  helpText?: string;
  help?: string;
  tooltip?: string;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  readOnly?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  checked,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  options = [],
  rows = 3,
  helpText,
  help,
  tooltip,
  step,
  min,
  max,
  className,
  style,
  autoFocus,
  readOnly,
  inputRef
}: FormInputProps) {
  const inputId = `input-${name || 'default'}`;

  return (
    <div className={`form-input-group ${className || ''}`}>
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
            checked={checked ?? (value as boolean)}
            onChange={onChange}
            disabled={disabled}
          />
          <label htmlFor={inputId} className="checkbox-label">
            {placeholder || label}
          </label>
        </div>
      ) : (
        <input
          ref={inputRef}
          id={inputId}
          type={type}
          name={name}
          value={value as string | number}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          step={step || (type === 'number' ? '0.01' : undefined)}
          min={min}
          max={max}
          className={className ? `${className} form-input` : "form-input"}
          style={style}
        />
      )}
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
      {help && !error && <div className="form-help-text">{help}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
