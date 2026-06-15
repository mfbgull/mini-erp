import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { Search, X, CreditCard, MoreVertical, Trash2 } from 'lucide-react';

import Button from '../../components/common/Button';
import CompactPaymentCardView from '../../components/common/CompactPaymentCard';
import DropdownMenu from '../../components/common/DropdownMenu';
import Modal from '../../components/common/Modal';
import PaymentModal from '../../components/customers/PaymentModal';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import './PaymentsPage.css';

interface Payment {
  id: number;
  payment_no: string;
  customer_id: number;
  customer_name: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_no: string;
  notes: string;
  created_at: string;
}

interface Customer {
  id: number;
  customer_name: string;
  customer_code: string;
  phone?: string;
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gridReady, setGridReady] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const { isMobile } = useMobileDetection();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await api.get('/payments?limit=1000');
      return response.data.data || [];
    }
  });

  // Fetch customers for payment recording
  const { data: customersData = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return Array.isArray(response.data.data) ? response.data.data : [];
    },
    enabled: isRecordPaymentOpen
  });

  const filteredCustomers = useMemo(() =>
    customersData.filter((c: Customer) =>
      c.customer_name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      c.customer_code?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      c.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase())
    ), [customersData, customerSearchTerm]);

  // Local search filter
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter((p: Payment) =>
      p.payment_no?.toLowerCase().includes(term) ||
      p.customer_name?.toLowerCase().includes(term) ||
      p.payment_method?.toLowerCase().includes(term) ||
      p.reference_no?.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return api.delete(`/payments/${paymentId}`);
    },
    onSuccess: () => {
      toast.success('Payment deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPaymentToDelete(null);
      setIsDeleteModalOpen(false);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete payment');
    }
  });

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      deleteMutation.mutate(paymentToDelete.id);
    }
  };

  // Auto-open create modal when ?action=create is present
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsRecordPaymentOpen(true);
      setSelectedCustomerForPayment(null);
      setCustomerSearchTerm('');
    }
  }, [searchParams]);

  // Defer Ag-Grid mount until after initial paint
  useEffect(() => {
    const timer = setTimeout(() => setGridReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Payment No',
      field: 'payment_no',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 120,
    },
    {
      headerName: 'Customer',
      field: 'customer_name',
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 150,
    },
    {
      headerName: 'Date',
      field: 'payment_date',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 110,
      valueFormatter: (params: any) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      }
    },
    {
      headerName: 'Amount',
      field: 'amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1,
      minWidth: 110,
      valueFormatter: (params: any) => {
        return `$${Number(params.value || 0).toFixed(2)}`;
      },
      cellClass: 'amount-cell',
    },
    {
      headerName: 'Method',
      field: 'payment_method',
      filter: true,
      flex: 1,
      minWidth: 110,
    },
    {
      headerName: 'Reference',
      field: 'reference_no',
      filter: true,
      flex: 1,
      minWidth: 120,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 70,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: 'Delete', icon: <Trash2 size={16} />, onClick: () => handleDeletePayment(params.data), destructive: true },
          ]}
          align="end"
        />
      ),
    }
  ], [deleteMutation.isPending]);

  const openRecordPayment = () => {
    setIsRecordPaymentOpen(true);
    setSelectedCustomerForPayment(null);
    setCustomerSearchTerm('');
  };

  const closeRecordPayment = () => {
    setIsRecordPaymentOpen(false);
    setSelectedCustomerForPayment(null);
    setCustomerSearchTerm('');
  };

  return (
    <div className="items-page payments-page">
      <div className="page-header">
        <div>
          <h1>{t('payments.payments')}</h1>
          <p className="page-subtitle">Manage customer payments</p>
        </div>
        {!isMobile && (
          <Button variant="primary" onClick={openRecordPayment}>
            + Record Payment
          </Button>
        )}
      </div>

      <div className="search-section">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : filteredPayments.length === 0 && searchTerm ? (
        <div className="no-results">
          <CreditCard className="no-results-icon" size={48} />
          <h3>No payments found</h3>
          <p>No payments match "{searchTerm}"</p>
          <Button variant="secondary" onClick={() => setSearchTerm('')}>Clear Search</Button>
        </div>
      ) : isMobile ? (
        <CompactPaymentCardView
          payments={filteredPayments}
          onEdit={(payment: Payment) => {
            toast('Edit payment details from the customer page');
          }}
          onDelete={handleDeletePayment}
        />
      ) : gridReady ? (
        <div className="ag-theme-quartz payments-grid-wrapper">
          <AgGridReact theme="legacy"
            rowData={filteredPayments}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            rowSelection={{ mode: 'singleRow' }}
            suppressMaxRenderedRowRestriction={true}
            onRowDoubleClicked={() => {}}
          />
        </div>
      ) : (
        <div className="ag-grid-placeholder">
          <div className="ag-grid-skeleton">
            <div className="skeleton-header"></div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-row" key={i}>
                <div className="skeleton-cell"></div>
                <div className="skeleton-cell"></div>
                <div className="skeleton-cell"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment — Customer Selection Modal */}
      <Modal
        isOpen={isRecordPaymentOpen && !selectedCustomerForPayment}
        onClose={closeRecordPayment}
        title="Select Customer"
        size="small"
      >
        <div className="customer-selector">
          <div className="search-input-wrapper" style={{ marginBottom: '12px' }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search customers..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
            />
          </div>
          <div className="customer-list">
            {filteredCustomers.length === 0 ? (
              <p className="no-customers-msg">No customers found</p>
            ) : (
              filteredCustomers.map((customer: Customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="customer-select-item"
                  onClick={() => setSelectedCustomerForPayment(customer)}
                >
                  <div className="customer-select-name">{customer.customer_name}</div>
                  <div className="customer-select-code">{customer.customer_code || customer.phone || ''}</div>
                </button>
              ))
            )}
          </div>
          <div className="form-actions" style={{ marginTop: '12px' }}>
            <Button variant="secondary" onClick={closeRecordPayment}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Payment — Payment Form Modal */}
      {selectedCustomerForPayment && (
        <Modal
          isOpen={isRecordPaymentOpen}
          onClose={closeRecordPayment}
          title={`Record Payment — ${selectedCustomerForPayment.customer_name}`}
          size="medium"
        >
          <PaymentModal
            customerId={selectedCustomerForPayment.id}
            customer={selectedCustomerForPayment}
            onClose={closeRecordPayment}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['payments'] });
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setPaymentToDelete(null); }}
        title="Delete Payment"
        size="small"
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete payment <strong>{paymentToDelete?.payment_no}</strong>?</p>
          <p className="delete-warning">This action cannot be undone. Invoice balances will be recalculated.</p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setPaymentToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteMutation.isPending}>
              Delete Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
