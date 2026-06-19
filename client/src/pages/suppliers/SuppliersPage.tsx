import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { SupplierCard } from '../../components/common/SupplierCard';
import SupplierForm from '../../components/suppliers/SupplierForm';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import type { Supplier } from '../../utils/supplierTypes';
import './SuppliersPage.css';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'create');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const { t } = useTranslation();

  const queryClient = useQueryClient();

  useKeyboardShortcut('Alt+N', () => {
    navigate('/suppliers?action=create');
  }, { context: 'suppliers', id: 'suppliers-new', label: 'New supplier' });

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return (response.data.data || []) as Supplier[];
    }
  });

  const filteredSuppliers = suppliers.filter((supplier: Supplier) => {
    const matchesSearch = searchTerm === '' ||
      supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' ||
      (activeTab === 'active' && supplier.is_active === 1) ||
      (activeTab === 'inactive' && supplier.is_active === 0);

    return matchesSearch && matchesTab;
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete supplier');
    }
  });

  const handleDelete = (supplier: Supplier) => {
    if (window.confirm(`Are you sure you want to delete supplier "${supplier.supplier_name}"?`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div>
          <h1>{t('suppliers.suppliers')}</h1>
          <p className="page-subtitle">Manage supplier accounts and contact information</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="tab-container">
          <button
            type="button"
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button
            type="button"
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
      ) : filteredSuppliers.length === 0 ? (
        <div className="no-suppliers">
          <p>No suppliers found</p>
        </div>
      ) : (
        <div className="supplier-cards-grid">
          {filteredSuppliers.map((supplier: Supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onView={(s: any) => {}}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedSupplier ? 'Edit Supplier' : 'Add Supplier'}
        size="large"
      >
        <SupplierForm
          supplier={selectedSupplier}
          onClose={handleModalClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            handleModalClose();
          }}
        />
      </Modal>
    </div>
  );
}
