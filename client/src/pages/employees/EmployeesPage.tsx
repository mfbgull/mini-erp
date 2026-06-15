import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, FileText, Upload, Download, Paperclip, Eye, X, DollarSign } from 'lucide-react';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import Modal from '../../components/common/Modal';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import type { Employee, EmployeeDocument } from '../../types';
import EmployeePreview from './EmployeePreview';
import SalaryPayModal from './SalaryPayModal';
import './EmployeesPage.css';

export default function EmployeesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
  const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const { t } = useTranslation();

  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees', { params: { limit: 100 } });
      return response.data.data || [];
    }
  });

  // Filter employees based on search and tab
  const filteredEmployees = employees.filter((employee: Employee) => {
    const matchesSearch = searchTerm === '' ||
      employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.cnic_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' ||
      (activeTab === 'active' && employee.is_active === 1) ||
      (activeTab === 'inactive' && employee.is_active === 0);

    const matchesDepartment = !departmentFilter || employee.department === departmentFilter;

    return matchesSearch && matchesTab && matchesDepartment;
  });

  // Get unique departments for filter
  const departments = [...new Set(employees.map((e: Employee) => e.department).filter(Boolean))] as string[];

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      toast.success(t('employees.messages.deleted'));
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete employee');
    }
  });

  const handleDelete = (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete employee "${employee.first_name} ${employee.last_name}"?`)) {
      deleteMutation.mutate(employee.id);
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="employees-page">
      <div className="page-header">
        <div>
          <h1>{t('employees.title')}</h1>
          <p className="page-subtitle">{t('employees.subtitle')}</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            {t('employees.addNew')}
          </Button>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <select
            className="filter-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="tab-container">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button
            className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="no-employees">
          <p>No employees found</p>
        </div>
      ) : (
        <div className="employee-cards-grid">
          {filteredEmployees.map((employee: Employee) => (
            <div key={employee.id} className="employee-card">
              <div className="employee-header">
                <div className="employee-code">{employee.employee_code}</div>
                <div className={`employee-status-badge ${employee.is_active ? 'active' : 'inactive'}`}>
                  {employee.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="employee-name">{employee.first_name} {employee.last_name}</div>
              <div className="employee-details">
                {employee.department && <div className="detail-row"><span className="detail-label">Dept:</span><span className="detail-value">{employee.department}</span></div>}
                {employee.designation && <div className="detail-row"><span className="detail-label">Designation:</span><span className="detail-value">{employee.designation}</span></div>}
                {employee.email && <div className="detail-row"><span className="detail-label">Email:</span><span className="detail-value">{employee.email}</span></div>}
                {employee.phone && <div className="detail-row"><span className="detail-label">Phone:</span><span className="detail-value">{employee.phone}</span></div>}
                {employee.employment_type && <div className="detail-row"><span className="detail-label">Type:</span><span className="detail-value">{employee.employment_type}</span></div>}
              </div>
              <div className="employee-actions">
                <button className="action-btn view-btn" onClick={() => setPreviewEmployee(employee)} title="View Details">
                  <Eye size={16} />
                </button>
                <button className="action-btn pay-btn" onClick={() => setPayingEmployee(employee)} title="Pay Salary">
                  <DollarSign size={16} />
                </button>
                <button className="action-btn edit-btn" onClick={() => handleEdit(employee)} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button className="action-btn delete-btn" onClick={() => handleDelete(employee)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employee Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedEmployee ? t('employees.editEmployee') : t('employees.addNew')}
        size="large"
      >
        <EmployeeForm
          employee={selectedEmployee}
          onClose={handleModalClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            handleModalClose();
          }}
        />
      </Modal>

      {/* Employee Preview Dialog */}
      {previewEmployee && (
        <EmployeePreview
          employee={previewEmployee}
          onClose={() => setPreviewEmployee(null)}
          onEdit={(emp) => {
            setPreviewEmployee(null);
            handleEdit(emp);
          }}
          onPay={(emp) => {
            setPreviewEmployee(null);
            setPayingEmployee(emp);
          }}
        />
      )}

      {/* Pay Salary Modal */}
      {payingEmployee && (
        <SalaryPayModal
          employee={payingEmployee}
          onClose={() => setPayingEmployee(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }}
        />
      )}
    </div>
  );
}

interface EmployeeFormProps {
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

function EmployeeForm({ employee, onClose, onSuccess }: EmployeeFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('personal');

  const [formData, setFormData] = useState({
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    mobile: employee?.mobile || '',
    cnic_no: employee?.cnic_no || '',
    address: employee?.address || '',
    city: employee?.city || '',
    state: employee?.state || '',
    postal_code: employee?.postal_code || '',
    country: employee?.country || 'Pakistan',
    date_of_birth: employee?.date_of_birth || '',
    gender: employee?.gender || '',
    department: employee?.department || '',
    designation: employee?.designation || '',
    employment_type: employee?.employment_type || 'Full-time',
    date_of_joining: employee?.date_of_joining || '',
    date_of_leaving: employee?.date_of_leaving || '',
    salary: employee?.salary || 0,
    bank_name: employee?.bank_name || '',
    bank_account_no: employee?.bank_account_no || '',
    bank_iban: employee?.bank_iban || '',
    emergency_contact_name: employee?.emergency_contact_name || '',
    emergency_contact_phone: employee?.emergency_contact_phone || '',
    notes: employee?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        salary: Number(data.salary) || 0,
      };
      if (employee) {
        return api.put(`/employees/${employee.id}`, payload);
      } else {
        return api.post('/employees', payload);
      }
    },
    onSuccess: () => {
      toast.success(employee ? t('employees.messages.updated') : t('employees.messages.created'));
      onSuccess();
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || (employee ? 'Failed to update employee' : 'Failed to create employee');
      toast.error(errorMsg);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = t('employees.validation.firstNameRequired');
    if (!formData.last_name.trim()) newErrors.last_name = t('employees.validation.lastNameRequired');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('employees.validation.invalidEmail');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="employee-form">
      {/* Section Tabs */}
      <div className="form-section-tabs">
        <button
          type="button"
          className={`section-tab ${activeSection === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveSection('personal')}
        >
          Personal Info
        </button>
        <button
          type="button"
          className={`section-tab ${activeSection === 'employment' ? 'active' : ''}`}
          onClick={() => setActiveSection('employment')}
        >
          Employment
        </button>
        <button
          type="button"
          className={`section-tab ${activeSection === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveSection('bank')}
        >
          Bank & Salary
        </button>
        <button
          type="button"
          className={`section-tab ${activeSection === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveSection('emergency')}
        >
          Emergency
        </button>
        {employee && (
          <button
            type="button"
            className={`section-tab ${activeSection === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveSection('documents')}
          >
            Documents
          </button>
        )}
      </div>

      {/* Personal Info Section */}
      {activeSection === 'personal' && (
        <div className="form-section-content">
          <div className="form-row">
            <FormInput
              label={`${t('employees.fields.first_name')} *`}
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              required
            />
            <FormInput
              label={`${t('employees.fields.last_name')} *`}
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name}
              required
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.fields.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            <FormInput
              label={t('employees.fields.phone')}
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.fields.mobile')}
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handleChange}
            />
            <FormInput
              label={t('employees.fields.cnic_no')}
              name="cnic_no"
              value={formData.cnic_no}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.fields.date_of_birth')}
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
            />
            <FormInput
              label={t('employees.fields.gender')}
              name="gender"
              type="select"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Gender' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
            />
          </div>
          <FormInput
            label={t('employees.fields.address')}
            name="address"
            type="textarea"
            value={formData.address}
            onChange={handleChange}
            rows={3}
          />
          <div className="form-row">
            <FormInput
              label={t('employees.fields.city')}
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
            <FormInput
              label={t('employees.fields.state')}
              name="state"
              value={formData.state}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.fields.postal_code')}
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
            />
            <FormInput
              label={t('employees.fields.country')}
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {/* Employment Section */}
      {activeSection === 'employment' && (
        <div className="form-section-content">
          <div className="form-row">
            <FormInput
              label={t('employees.fields.department')}
              name="department"
              type="select"
              value={formData.department}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Department' },
                { value: 'HR', label: 'HR' },
                { value: 'Finance', label: 'Finance' },
                { value: 'IT', label: 'IT' },
                { value: 'Operations', label: 'Operations' },
                { value: 'Sales', label: 'Sales' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Production', label: 'Production' },
                { value: 'Quality', label: 'Quality' },
                { value: 'Warehouse', label: 'Warehouse' },
                { value: 'Other', label: 'Other' }
              ]}
            />
            <FormInput
              label={t('employees.fields.designation')}
              name="designation"
              value={formData.designation}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.fields.employment_type')}
              name="employment_type"
              type="select"
              value={formData.employment_type}
              onChange={handleChange}
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Intern', label: 'Intern' },
                { value: 'Probation', label: 'Probation' }
              ]}
            />
            <FormInput
              label={t('employees.fields.salary')}
              name="salary"
              type="number"
              value={formData.salary}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.fields.date_of_joining')}
              name="date_of_joining"
              type="date"
              value={formData.date_of_joining}
              onChange={handleChange}
            />
            <FormInput
              label={t('employees.fields.date_of_leaving')}
              name="date_of_leaving"
              type="date"
              value={formData.date_of_leaving}
              onChange={handleChange}
            />
          </div>
          <FormInput
            label={t('employees.fields.notes')}
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>
      )}

      {/* Bank & Salary Section */}
      {activeSection === 'bank' && (
        <div className="form-section-content">
          <div className="form-row">
            <FormInput
              label={t('employees.fields.bank_name')}
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
            />
            <FormInput
              label={t('employees.fields.bank_account_no')}
              name="bank_account_no"
              value={formData.bank_account_no}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.fields.bank_iban')}
              name="bank_iban"
              value={formData.bank_iban}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {/* Emergency Section */}
      {activeSection === 'emergency' && (
        <div className="form-section-content">
          <div className="form-row">
            <FormInput
              label={t('employees.fields.emergency_contact_name')}
              name="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={handleChange}
            />
            <FormInput
              label={t('employees.fields.emergency_contact_phone')}
              name="emergency_contact_phone"
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {/* Documents Section — only when editing */}
      {activeSection === 'documents' && employee && (
        <EmployeeDocumentsSection employeeId={employee.id} />
      )}

      {activeSection !== 'documents' && (
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {employee ? t('actions.update') : t('actions.create')} {t('nav.employees')}
          </Button>
        </div>
      )}
    </form>
  );
}

/* ── Employee Documents Section ──────────────────────────────────── *//* ── Helper: is this file an image or PDF? ── */
function isPreviewable(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(ext);
}

function isImageFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
}

function getFileExtension(filePath: string): string {
  return (filePath.split('.').pop()?.toLowerCase() || '').toUpperCase();
}

/* ── Upload Progress Ring ── */
function UploadProgressRing({ progress }: { progress: number }) {
  const radius = 32;
  const stroke = 4;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="upload-progress-ring-container">
      <svg
        className="upload-progress-ring"
        height={radius * 2}
        width={radius * 2}
      >
        <circle
          className="upload-progress-ring-bg"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="upload-progress-ring-fill"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="upload-progress-ring-text">
        {progress < 100 ? `${Math.round(progress)}%` : '✓'}
      </span>
    </div>
  );
}

/* ── Document Preview Modal ── */
interface DocumentPreviewModalProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

function DocumentPreviewModal({ fileUrl, fileName, onClose }: DocumentPreviewModalProps) {
  const { t } = useTranslation();
  const isImage = isImageFile(fileUrl);
  const isPDF = fileUrl.toLowerCase().endsWith('.pdf');

  return (
    <div className="doc-preview-overlay" onClick={onClose}>
      <div className="doc-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="doc-preview-header">
          <div className="doc-preview-title">
            <FileText size={18} />
            <span>{fileName}</span>
            <span className="doc-preview-ext">{getFileExtension(fileUrl)}</span>
          </div>
          <button className="doc-preview-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="doc-preview-body">
          {isImage ? (
            <img src={fileUrl} alt={fileName} className="doc-preview-image" />
          ) : isPDF ? (
            <iframe src={fileUrl} title={fileName} className="doc-preview-pdf" />
          ) : (
            <div className="doc-preview-unsupported">
              <FileText size={48} />
              <p>{t('employees.documents.previewNotSupported')}</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="doc-preview-download-link">
                <Download size={16} /> {t('actions.download')} {t('employees.documents.file')}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeeDocumentsSection({ employeeId }: { employeeId: number }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docForm, setDocForm] = useState({
    document_name: '',
    document_type: '',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
  });

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['employeeDocuments', employeeId],
    queryFn: async () => {
      const response = await api.get(`/employees/${employeeId}/documents`);
      return response.data.data || [];
    }
  });

  // Add document mutation — uses raw axios for onUploadProgress
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const handleDocSubmit = useCallback(() => {
    if (!docForm.document_name.trim()) {
      toast.error(t('employees.documents.nameRequired'));
      return;
    }

    const formData = new FormData();
    formData.append('document_name', docForm.document_name);
    if (docForm.document_type) formData.append('document_type', docForm.document_type);
    if (docForm.document_number) formData.append('document_number', docForm.document_number);
    if (docForm.issue_date) formData.append('issue_date', docForm.issue_date);
    if (docForm.expiry_date) formData.append('expiry_date', docForm.expiry_date);
    if (docForm.notes) formData.append('notes', docForm.notes);
    if (selectedFile) formData.append('file', selectedFile);

    setUploadProgress(0);

    api.post(`/employees/${employeeId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(percent);
        }
      },
    }).then(() => {
      toast.success(t('employees.documents.created'));
      queryClientRef.current.invalidateQueries({ queryKey: ['employeeDocuments', employeeId] });
      setShowAddForm(false);
      setSelectedFile(null);
      setUploadProgress(null);
      setDocForm({ document_name: '', document_type: '', document_number: '', issue_date: '', expiry_date: '', notes: '' });
    }).catch((error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add document');
      setUploadProgress(null);
    });
  }, [docForm, selectedFile, employeeId, t]);

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId: number) => {
      return api.delete(`/employees/${employeeId}/documents/${docId}`);
    },
    onSuccess: () => {
      toast.success(t('employees.documents.deleted'));
      queryClient.invalidateQueries({ queryKey: ['employeeDocuments', employeeId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete document');
    }
  });

  const handleDeleteDoc = (doc: EmployeeDocument) => {
    if (window.confirm(`Delete document "${doc.document_name}"?`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('employees.documents.fileTooLarge'));
      return;
    }
    setSelectedFile(file);
    if (!docForm.document_name.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setDocForm(prev => ({ ...prev, document_name: nameWithoutExt }));
    }
  };

  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setSelectedFile(null);
    setUploadProgress(null);
    setDocForm({ document_name: '', document_type: '', document_number: '', issue_date: '', expiry_date: '', notes: '' });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="form-section-content documents-section">
      <div className="documents-header">
        <h4>{t('employees.documents.title')}</h4>
        <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} />
          {t('employees.documents.add')}
        </Button>
      </div>

      {/* Add Document Form */}
      {showAddForm && (
        <div className="document-form">
          {/* File Upload Area */}
          <div
            className={`document-dropzone ${isDragOver ? 'dragover' : ''} ${selectedFile ? 'has-file' : ''} ${uploadProgress !== null ? 'uploading' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDocDrop}
            onClick={() => { if (uploadProgress === null) fileInputRef.current?.click(); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = '';
              }}
            />
            {uploadProgress !== null ? (
              <div className="dropzone-uploading">
                <UploadProgressRing progress={uploadProgress} />
                <span className="dropzone-upload-status">
                  {uploadProgress < 100 ? t('employees.documents.uploading') : t('employees.documents.processing')}
                </span>
              </div>
            ) : selectedFile ? (
              <div className="dropzone-file-info">
                <Paperclip size={20} />
                <div>
                  <div className="dropzone-file-name">{selectedFile.name}</div>
                  <div className="dropzone-file-size">{formatFileSize(selectedFile.size)}</div>
                </div>
                <button
                  type="button"
                  className="dropzone-remove-btn"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="dropzone-content">
                <Upload size={24} />
                <div className="dropzone-text">
                  {t('employees.documents.dropHere')}<br />
                  <span className="dropzone-hint">{t('employees.documents.fileTypes')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <FormInput
              label={`${t('employees.documents.name')} *`}
              name="document_name"
              value={docForm.document_name}
              onChange={(e) => setDocForm(prev => ({ ...prev, document_name: e.target.value }))}
              required
            />
            <FormInput
              label={t('employees.documents.type')}
              name="document_type"
              type="select"
              value={docForm.document_type}
              onChange={(e) => setDocForm(prev => ({ ...prev, document_type: e.target.value }))}
              options={[
                { value: '', label: 'Select Type' },
                { value: 'Identity', label: 'Identity (CNIC/Passport)' },
                { value: 'Education', label: 'Education Certificate' },
                { value: 'Experience', label: 'Experience Letter' },
                { value: 'Contract', label: 'Employment Contract' },
                { value: 'Tax', label: 'Tax Document' },
                { value: 'Other', label: 'Other' }
              ]}
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.documents.number')}
              name="document_number"
              value={docForm.document_number}
              onChange={(e) => setDocForm(prev => ({ ...prev, document_number: e.target.value }))}
            />
            <FormInput
              label={t('employees.documents.issueDate')}
              name="issue_date"
              type="date"
              value={docForm.issue_date}
              onChange={(e) => setDocForm(prev => ({ ...prev, issue_date: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <FormInput
              label={t('employees.documents.expiryDate')}
              name="expiry_date"
              type="date"
              value={docForm.expiry_date}
              onChange={(e) => setDocForm(prev => ({ ...prev, expiry_date: e.target.value }))}
            />
          </div>
          <FormInput
            label={t('employees.documents.notes')}
              name="notes"
            type="textarea"
            value={docForm.notes}
            onChange={(e) => setDocForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />
          <div className="document-form-actions">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={uploadProgress !== null}>
              {t('actions.cancel')}
            </Button>
            <Button type="button" variant="primary" loading={uploadProgress !== null} onClick={handleDocSubmit} disabled={uploadProgress !== null}>
              {uploadProgress !== null ? t('employees.documents.uploading') : t('employees.documents.add')}
            </Button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {isLoading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : documents.length === 0 ? (
        <div className="no-documents">
          <FileText size={32} />
          <p>{t('employees.documents.noDocuments')}</p>
        </div>
      ) : (
        <div className="documents-list">
          {documents.map((doc: EmployeeDocument) => (
            <div key={doc.id} className="document-card">
              <div className="document-info">
                <div className="document-name">
                  {doc.file_path ? <Paperclip size={16} /> : <FileText size={16} />}
                  {doc.document_name}
                </div>
                <div className="document-meta">
                  {doc.document_type && <span className="doc-type-badge">{doc.document_type}</span>}
                  {doc.document_number && <span className="doc-number">#{doc.document_number}</span>}
                  {doc.issue_date && <span className="doc-date">Issued: {doc.issue_date}</span>}
                  {doc.expiry_date && <span className="doc-date">Expires: {doc.expiry_date}</span>}
                </div>
                {doc.notes && <div className="document-notes">{doc.notes}</div>}
              </div>
              <div className="document-actions">
                {doc.file_path && isPreviewable(doc.file_path) && (
                  <button
                    className="action-btn preview-btn"
                    onClick={() => setPreviewDoc(doc)}
                    title={t('employees.documents.preview')}
                  >
                    <Eye size={14} />
                  </button>
                )}
                {doc.file_path && (
                  <a
                    href={`/api/employees/${employeeId}/documents/file/${doc.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn download-btn"
                    title={t('actions.download')}
                  >
                    <Download size={14} />
                  </a>
                )}
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteDoc(doc)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && previewDoc.file_path && (
        <DocumentPreviewModal
          fileUrl={`/api/employees/${employeeId}/documents/file/${previewDoc.file_path}`}
          fileName={previewDoc.document_name}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
