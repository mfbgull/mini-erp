import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MiniERPGrid from '../../components/common/MiniERPGrid';
import { Plus, Edit2, Trash2, Eye, Search, RefreshCw, MoreVertical } from 'lucide-react';

import CustomerPreview from './CustomerPreview';
import Button from '../../components/common/Button';
import CompactCustomerCardView from '../../components/common/CompactCustomerCard';
import DropdownMenu from '../../components/common/DropdownMenu';
import Modal from '../../components/common/Modal';
import CustomerForm from '../../components/customers/CustomerForm';
import PaymentModal from '../../components/customers/PaymentModal';
import { useSettings } from '../../context/SettingsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import { getIsActiveCellClass, getBalanceCellClass, getCreditUtilizationClass } from '../../utils/statusCellUtils';
import api from '../../utils/api';
import { createActionColDef } from '../../utils/agGridIntegration';
import type { Customer } from '../../utils/customerTypes';
import './CustomersPage.css';
import '../../styles/ag-grid-status-cells.css';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { isMobile } = useMobileDetection();

  const queryClient = useQueryClient();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/customers?action=create');
  }, { context: 'customers', id: 'customers-new', label: 'New customer' });

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', searchTerm, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('search', searchTerm);
      params.append('status', activeTab);

      const response = await api.get(`/customers?${params.toString()}`);
      return response.data.data;
    }
  });

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setSelectedCustomer(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete customer');
    }
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      return api.post('/customers/recalculate-balances');
    },
    onSuccess: (response: { data: { message?: string } }) => {
      toast.success(response.data.message || 'Balances recalculated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to recalculate balances');
    }
  });

  const handleDelete = (id: number, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${customerName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const columnDefs = [
    {
      headerName: 'Customer Code',
      field: 'customer_code',
      filter: true,
      width: 120,
      cellRenderer: (params: { value: string }) => (
        <span className="customer-code">{params.value}</span>
      )
    },
    {
      headerName: 'Customer Name',
      field: 'customer_name',
      filter: true,
      flex: 1,
      cellRenderer: (params: { value: string; data: Customer }) => (
        <div>
          <div className="customer-name">{params.value}</div>
          {params.data.contact_person && (
            <div className="contact-person">{params.data.contact_person}</div>
          )}
        </div>
      )
    },
    {
      headerName: 'Contact Info',
      field: 'phone',
      filter: true,
      width: 180,
      cellRenderer: (params: { value: string; data: Customer }) => (
        <div>
          <div>{params.value}</div>
          <div className="email">{params.data.email}</div>
        </div>
      )
    },
    {
      headerName: 'Address',
      field: 'billing_address',
      filter: true,
      width: 200,
      cellRenderer: (params: { value: string }) => (
        <div className="address">
          {params.value && params.value.split('\n').map((line: string, idx: number) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      )
    },
    {
      headerName: 'Credit Limit',
      field: 'credit_limit',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params: { value: number }) => formatCurrency(params.value || 0),
      cellClass: (params: { data: Customer }) => getCreditUtilizationClass(
        params.data?.credit_utilization_percent || ((params.data?.current_balance || 0) / (params.data?.credit_limit || 1)) * 100,
        params.data?.credit_limit
      )
    },
    {
      headerName: 'Current Balance',
      field: 'current_balance',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params: { value: number }) => formatCurrency(params.value || 0),
      cellClass: (params: { value: number }) => getBalanceCellClass(params.value)
    },
    {
      headerName: 'Credit Utilization',
      field: 'credit_utilization_percent',
      filter: 'agNumberColumnFilter',
      width: 140,
      valueFormatter: (params: { data: Customer; value: number }) => {
        if (!params.data.credit_limit || params.data.credit_limit === 0) return 'N/A';
        return `${(params.value || 0).toFixed(2)}%`;
      },
      cellRenderer: (params: { data: Customer; value: number }) => {
        if (!params.data.credit_limit || params.data.credit_limit === 0) {
          return <span className="credit-utilization">N/A</span>;
        }

        const utilization = params.value || 0;
        let className = 'credit-utilization ';
        if (utilization >= 90) className += 'utilization-high';
        else if (utilization >= 75) className += 'utilization-medium';
        else className += 'utilization-low';

        return <span className={className}>{utilization.toFixed(2)}%</span>;
      }
    },
    {
      headerName: 'Payment Terms',
      field: 'payment_terms_days',
      filter: 'agNumberColumnFilter',
      width: 120,
      valueFormatter: (params: { value: number }) => `${params.value || 0} days`
    },
    {
      headerName: 'Status',
      field: 'is_active',
      filter: true,
      width: 100,
      cellRenderer: (params: { value: boolean }) => params.value ? 'Active' : 'Inactive',
      cellClass: (params: { value: boolean }) => getIsActiveCellClass(params.value)
    },
    createActionColDef({
      cellRenderer: (params: { data: Customer }) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: 'View', icon: <Eye size={16} />, onClick: () => navigate(`/customers/${params.data.id}`) },
            { label: 'Edit', icon: <Edit2 size={16} />, onClick: () => handleEdit(params.data) },
            { label: 'Delete', icon: <Trash2 size={16} />, onClick: () => handleDelete(params.data.id, params.data.customer_name), destructive: true },
          ]}
          align="end"
        />
      ),
    }),
  ];

  return (
    <div className="customers-page">
      <div className="page-header">
        <div>
          <h1>{t('customers.customers')}</h1>
          <p className="page-subtitle">Manage customer accounts and credit information</p>
        </div>
        <div className="header-actions">
          <Button
            variant="secondary"
            onClick={() => {
              if (window.confirm('This will recalculate all customer balances from unpaid invoices. Continue?')) {
                recalculateMutation.mutate();
              }
            }}
            loading={recalculateMutation.isPending}
          >
            <RefreshCw size={18} />
            Fix Balances
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
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
      ) : isMobile ? (
        <CompactCustomerCardView
          customers={customers}
          onView={(customer: Customer) => setSelectedCustomer(customer)}
          onEdit={handleEdit}
          onAddPayment={(customer: Customer) => {
            setSelectedCustomer(customer);
            setIsPaymentModalOpen(true);
          }}
        />
      ) : (
        <MiniERPGrid
          wrapperClassName="customers-grid"
          containerStyle={{ height: 600, width: '100%' }}
          rowData={customers}
          columnDefs={columnDefs as any}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          onRowDoubleClicked={(params: { data: Customer }) => navigate(`/customers/${params.data.id}`)}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}
        size="large"
      >
        <CustomerForm
          customer={selectedCustomer}
          onClose={handleModalClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            handleModalClose();
          }}
        />
      </Modal>

      {selectedCustomer && isMobile && (
        <CustomerPreview
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onView={() => navigate(`/customers/${selectedCustomer.id}`)}
          onEdit={() => {
            setIsModalOpen(true);
          }}
          onAddPayment={() => {
            setIsPaymentModalOpen(true);
          }}
        />
      )}

      {selectedCustomer && isPaymentModalOpen && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Record Payment - ${selectedCustomer.customer_name}`}
          size="large"
        >
          <PaymentModal
            customerId={selectedCustomer.id}
            customer={selectedCustomer}
            onClose={() => setIsPaymentModalOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['customers'] });
              setIsPaymentModalOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
