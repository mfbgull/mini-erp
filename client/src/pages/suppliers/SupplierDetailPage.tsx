import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Edit2, Trash2, Package, FileText, AlertTriangle } from 'lucide-react';

import Button from '../../components/common/Button';
import SummaryCard, { SummaryGrid } from '../../components/common/SummaryCard';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import type { Supplier } from '../../utils/supplierTypes';
import type { POSummary, BalanceData, Transaction } from '../../utils/supplierDetailTypes';

import './SuppliersPage.css';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();

  const { data: supplier, isLoading } = useQuery<Supplier>({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const response = await api.get(`/suppliers/${id}`);
      return response.data.data as Supplier;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always' as const
  });

  const { data: poSummary } = useQuery<POSummary>({
    queryKey: ['supplierPOSummary', id],
    queryFn: async () => {
      const response = await api.get(`/purchase-orders/summary/supplier/${id}`);
      return response.data.data as POSummary;
    },
    enabled: !!supplier
  });

  const { data: balanceData } = useQuery<BalanceData>({
    queryKey: ['supplierBalance', id],
    queryFn: async () => {
      const response = await api.get(`/suppliers/${id}/balance`);
      return response.data.data as BalanceData;
    },
    enabled: !!supplier
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['supplierTransactions', id],
    queryFn: async () => {
      const response = await api.get(`/suppliers/${id}/transactions`);
      return (response.data.data || []) as Transaction[];
    },
    enabled: !!supplier
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/suppliers');
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete supplier');
    }
  });

  const handleDelete = () => {
    const poCount = poSummary?.total_pos || 0;
    if (poCount > 0) {
      toast.error(`Cannot delete supplier with ${poCount} purchase order(s)`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete supplier "${supplier?.supplier_name}"?`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="suppliers-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="suppliers-page">
        <div className="error-message">
          <h2>Supplier not found</h2>
          <Button variant="primary" onClick={() => navigate('/suppliers')}>
            Back to Suppliers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/suppliers')}
          >
            <ArrowLeft size={18} />
            Back to Suppliers
          </button>
          <h1>{supplier.supplier_name}</h1>
          <p className="page-subtitle">Supplier Details</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => navigate(`/purchase-orders?supplier=${supplier.id}`)}>
            <Package size={18} />
            View Orders
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/suppliers/${id}/edit`)}>
            <Edit2 size={18} />
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            <Trash2 size={18} />
            Delete
          </Button>
        </div>
      </div>

      <div className="supplier-detail-container">
        <div className="detail-card">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Supplier Code</label>
              <span className="code">{supplier.supplier_code}</span>
            </div>
            <div className="info-item">
              <label>Supplier Name</label>
              <span>{supplier.supplier_name}</span>
            </div>
            <div className="info-item">
              <label>Contact Person</label>
              <span>{supplier.contact_person || '-'}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{supplier.email || '-'}</span>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <span>{supplier.phone || '-'}</span>
            </div>
            <div className="info-item">
              <label>Payment Terms</label>
              <span>{supplier.payment_terms || 'Net 30'}</span>
            </div>
            <div className="info-item">
              <label>Status</label>
              <span className={`status ${supplier.is_active ? 'status-active' : 'status-inactive'}`}>
                {supplier.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="info-item">
              <label>Created</label>
              <span>{format(new Date(supplier.created_at || ''), 'dd MMM yyyy')}</span>
            </div>
            <div className="info-item full-width">
              <label>Address</label>
              <span>{supplier.address || '-'}</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h3>Purchase Orders Summary</h3>
          {poSummary ? (
            <SummaryGrid columns={6}>
              <SummaryCard icon={Package} label="Total Orders" value={poSummary.total_pos || 0} />
              <SummaryCard icon={FileText} label="Total Value" value={formatCurrency(poSummary.total_value || 0)} variant="info" />
              <SummaryCard icon={FileText} label="Draft" value={poSummary.draft_pos || 0} />
              <SummaryCard icon={Package} label="Submitted" value={poSummary.submitted_pos || 0} variant="success" />
              <SummaryCard icon={Package} label="Partial" value={poSummary.partially_received_pos || 0} variant="warning" />
              <SummaryCard icon={Package} label="Completed" value={poSummary.completed_pos || 0} variant="success" />
            </SummaryGrid>
          ) : (
            <div className="no-data">No purchase orders found</div>
          )}
        </div>

        <div className="detail-card">
          <h3>Balance Information</h3>
          {balanceData ? (
            <div className="balance-info">
              <div className="balance-row">
                <span className="balance-label">Current Balance</span>
                <span className={`balance-value ${balanceData.balance > 0 ? 'balance-outstanding' : ''}`}>
                  {formatCurrency(balanceData.balance || 0)}
                </span>
              </div>
              {balanceData.balance > 0 && (
                <div className="balance-warning">
                  <AlertTriangle size={16} />
                  Outstanding balance requires payment
                </div>
              )}
            </div>
          ) : (
            <div className="no-data">No balance information</div>
          )}
        </div>

        <div className="detail-card">
          <h3>Recent Transactions</h3>
          {transactions && transactions.length > 0 ? (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((txn: Transaction, idx: number) => (
                  <tr key={idx}>
                    <td>{format(new Date(txn.transaction_date), 'dd MMM yyyy')}</td>
                    <td className="txn-type">{txn.transaction_type}</td>
                    <td>{txn.reference_no}</td>
                    <td>{txn.description}</td>
                    <td className={txn.debit > 0 ? 'debit' : ''}>{txn.debit > 0 ? formatCurrency(txn.debit) : '-'}</td>
                    <td className={txn.credit > 0 ? 'credit' : ''}>{txn.credit > 0 ? formatCurrency(txn.credit) : '-'}</td>
                    <td className="balance-cell">{formatCurrency(txn.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">No transactions found</div>
          )}
        </div>
      </div>
    </div>
  );
}
