import React from 'react';

import { X, Edit2, User, Calendar, Briefcase, CreditCard, Phone as PhoneIcon } from 'lucide-react';

import { formatCurrency } from '../../utils/formatters';
import './EmployeePreview.css';

interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  cnic_no?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: string;
  gender?: string;
  department?: string;
  designation?: string;
  employment_type?: string;
  date_of_joining?: string;
  date_of_leaving?: string;
  salary: number;
  bank_name?: string;
  bank_account_no?: string;
  bank_iban?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

interface EmployeePreviewProps {
  employee: Employee;
  onClose: () => void;
  onEdit?: () => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export default function EmployeePreview({
  employee,
  onClose,
  onEdit
}: EmployeePreviewProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const fullName = `${employee.first_name} ${employee.last_name}`;
  const hasBankInfo = employee.bank_name || employee.bank_account_no || employee.bank_iban;
  const hasEmergency = employee.emergency_contact_name || employee.emergency_contact_phone;
  const hasPersonalDetails = employee.date_of_birth || employee.gender || employee.cnic_no;

  return (
    <div className="mobile-preview-backdrop" onClick={handleBackdropClick}>
      <div className="mobile-preview-container">
        {/* Header */}
        <div className="preview-header employee-preview-header">
          <div className="preview-icon employee-icon">
            <User size={24} />
          </div>
          <div className="preview-title-section">
            <h2 className="preview-title">{fullName}</h2>
            <p className="preview-subtitle">{employee.employee_code}</p>
          </div>
          <button className="preview-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mobile-preview-content">
          {/* Status Banner */}
          <div className="preview-section">
            <div className={`employee-status-banner ${employee.is_active ? 'active' : 'inactive'}`}>
              <span className="status-indicator"></span>
              {employee.is_active ? 'Active Employee' : 'Inactive Employee'}
            </div>
          </div>

          {/* Employment Info */}
          <div className="preview-section">
            <h3 className="preview-section-title">
              <Briefcase size={14} />
              Employment
            </h3>
            <div className="preview-detail-grid">
              {employee.department && (
                <div className="preview-detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{employee.department}</span>
                </div>
              )}
              {employee.designation && (
                <div className="preview-detail-item">
                  <span className="detail-label">Designation</span>
                  <span className="detail-value">{employee.designation}</span>
                </div>
              )}
              {employee.employment_type && (
                <div className="preview-detail-item">
                  <span className="detail-label">Employment Type</span>
                  <span className="detail-value">{employee.employment_type}</span>
                </div>
              )}
              {employee.date_of_joining && (
                <div className="preview-detail-item">
                  <span className="detail-label">Date of Joining</span>
                  <span className="detail-value">{formatDate(employee.date_of_joining)}</span>
                </div>
              )}
              {employee.date_of_leaving && (
                <div className="preview-detail-item">
                  <span className="detail-label">Date of Leaving</span>
                  <span className="detail-value">{formatDate(employee.date_of_leaving)}</span>
                </div>
              )}
              {employee.salary > 0 && (
                <div className="preview-detail-item">
                  <span className="detail-label">Salary</span>
                  <span className="detail-value">{formatCurrency(employee.salary)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Personal Details */}
          <div className="preview-section">
            <h3 className="preview-section-title">
              <User size={14} />
              Personal Info
            </h3>
            <div className="preview-detail-grid">
              {employee.email && (
                <div className="preview-detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{employee.email}</span>
                </div>
              )}
              {employee.phone && (
                <div className="preview-detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{employee.phone}</span>
                </div>
              )}
              {employee.mobile && (
                <div className="preview-detail-item">
                  <span className="detail-label">Mobile</span>
                  <span className="detail-value">{employee.mobile}</span>
                </div>
              )}
              {employee.cnic_no && (
                <div className="preview-detail-item">
                  <span className="detail-label">CNIC</span>
                  <span className="detail-value">{employee.cnic_no}</span>
                </div>
              )}
              {employee.date_of_birth && (
                <div className="preview-detail-item">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-value">{formatDate(employee.date_of_birth)}</span>
                </div>
              )}
              {employee.gender && (
                <div className="preview-detail-item">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">{employee.gender}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {(employee.address || employee.city || employee.state || employee.country) && (
            <div className="preview-section">
              <h3 className="preview-section-title">Address</h3>
              <div className="preview-address-card">
                {employee.address && <p>{employee.address}</p>}
                <p>
                  {[employee.city, employee.state, employee.postal_code].filter(Boolean).join(', ')}
                  {employee.country && <><br />{employee.country}</>}
                </p>
              </div>
            </div>
          )}

          {/* Bank Info */}
          {hasBankInfo && (
            <div className="preview-section">
              <h3 className="preview-section-title">
                <CreditCard size={14} />
                Bank Details
              </h3>
              <div className="preview-detail-grid">
                {employee.bank_name && (
                  <div className="preview-detail-item">
                    <span className="detail-label">Bank Name</span>
                    <span className="detail-value">{employee.bank_name}</span>
                  </div>
                )}
                {employee.bank_account_no && (
                  <div className="preview-detail-item">
                    <span className="detail-label">Account No</span>
                    <span className="detail-value">{employee.bank_account_no}</span>
                  </div>
                )}
                {employee.bank_iban && (
                  <div className="preview-detail-item">
                    <span className="detail-label">IBAN</span>
                    <span className="detail-value">{employee.bank_iban}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {hasEmergency && (
            <div className="preview-section">
              <h3 className="preview-section-title">
                <PhoneIcon size={14} />
                Emergency Contact
              </h3>
              <div className="preview-detail-grid">
                {employee.emergency_contact_name && (
                  <div className="preview-detail-item">
                    <span className="detail-label">Contact Name</span>
                    <span className="detail-value">{employee.emergency_contact_name}</span>
                  </div>
                )}
                {employee.emergency_contact_phone && (
                  <div className="preview-detail-item">
                    <span className="detail-label">Contact Phone</span>
                    <span className="detail-value">{employee.emergency_contact_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {employee.notes && (
            <div className="preview-section">
              <h3 className="preview-section-title">Notes</h3>
              <div className="preview-address-card">
                <p>{employee.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mobile-preview-actions">
          {onEdit && (
            <button className="preview-action-btn primary" onClick={onEdit}>
              <Edit2 size={18} />
              <span>Edit Employee</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
