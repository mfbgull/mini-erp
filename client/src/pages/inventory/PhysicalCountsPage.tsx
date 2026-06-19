import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import toast from 'react-hot-toast';
import { Plus, ClipboardCheck, Eye, Trash2, CheckCircle, XCircle, MoreVertical } from 'lucide-react';

import Button from '../../components/common/Button';
import DropdownMenu, { DropdownMenuItem } from '../../components/common/DropdownMenu';
import Modal from '../../components/common/Modal';
import StatCard, { StatsGrid } from '../../components/common/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import './ItemsPage.css';

interface Warehouse {
  id: number;
  warehouse_name: string;
  warehouse_code: string;
}

interface PhysicalCount {
  id: number;
  count_no: string;
  count_date: string;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  status: string;
  notes?: string;
  created_by_name?: string;
  completed_by_name?: string;
  completed_at?: string;
  total_items: number;
  counted_items: number;
  variance_items: number;
}

interface PhysicalCountItem {
  id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  system_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  unit_cost: number | null;
  variance_value: number | null;
  adjustment_posted: boolean;
  notes?: string;
}

export default function PhysicalCountsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState<PhysicalCount | null>(null);
  const [countItems, setCountItems] = useState<PhysicalCountItem[]>([]);
  const [editingItem, setEditingItem] = useState<PhysicalCountItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [countNotes, setCountNotes] = useState('');

  const gridRef = useRef<AgGridReact>(null);

  const { formatCurrency } = useSettings();
  const { isMobile } = useMobileDetection();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data || response.data;
    }
  });

  const { data: counts = [], isLoading } = useQuery<PhysicalCount[]>({
    queryKey: ['physical-counts'],
    queryFn: async () => {
      const response = await api.get('/inventory/physical-counts');
      return response.data.data || response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: { warehouse_id: number; count_date: string; notes?: string }) =>
      api.post('/inventory/physical-counts', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['physical-counts'] });
      toast.success('Physical count created');
      setIsCreateModalOpen(false);
      setSelectedWarehouse(null);
      setCountNotes('');
      setPreviewCount(response.data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create count');
    }
  });

  const recordMutation = useMutation({
    mutationFn: ({ countId, data }: { countId: number; data: { item_id: number; counted_quantity: number; notes?: string } }) =>
      api.post(`/inventory/physical-counts/${countId}/items`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['physical-counts'] });
      if (previewCount) {
        fetchCountDetails(previewCount.id);
      }
      setEditingItem(null);
      setEditValue('');
      setEditNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record count');
    }
  });

  const completeMutation = useMutation({
    mutationFn: (countId: number) =>
      api.post(`/inventory/physical-counts/${countId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-counts'] });
      toast.success('Physical count completed and adjustments posted');
      setPreviewCount(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to complete count');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (countId: number) =>
      api.post(`/inventory/physical-counts/${countId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-counts'] });
      toast.success('Physical count cancelled');
      setPreviewCount(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel count');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (countId: number) =>
      api.delete(`/inventory/physical-counts/${countId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-counts'] });
      toast.success('Physical count deleted');
      setPreviewCount(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete count');
    }
  });

  const fetchCountDetails = async (countId: number) => {
    try {
      const response = await api.get(`/inventory/physical-counts/${countId}`);
      setCountItems(response.data.items || []);
      setPreviewCount(response.data);
    } catch {
      toast.error('Failed to load count details');
    }
  };

  const handleRecordCount = (item: PhysicalCountItem) => {
    setEditingItem(item);
    setEditValue(item.counted_quantity !== null ? String(item.counted_quantity) : '');
    setEditNotes('');
  };

  const submitCount = () => {
    if (!editingItem || !previewCount) return;
    const qty = parseFloat(editValue);
    if (isNaN(qty)) {
      toast.error('Invalid quantity');
      return;
    }
    recordMutation.mutate({
      countId: previewCount.id,
      data: {
        item_id: editingItem.item_id,
        counted_quantity: qty,
        notes: editNotes || undefined
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'In Progress': return 'status-progress';
      case 'Completed': return 'status-completed';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const columnDefs = [
    {
      headerName: 'Count #',
      field: 'count_no',
      minWidth: 110,
      pinned: 'left' as const,
    },
    {
      headerName: 'Date',
      field: 'count_date',
      minWidth: 100,
    },
    {
      headerName: 'Warehouse',
      field: 'warehouse_name',
      minWidth: 130,
    },
    {
      headerName: 'Status',
      field: 'status',
      minWidth: 100,
      cellRenderer: (params: any) => {
        const color = params.value === 'Completed' ? '#10b981' :
          params.value === 'Cancelled' ? '#ef4444' :
          params.value === 'In Progress' ? '#f59e0b' : '#6b7280';
        return <span style={{ color, fontWeight: 500 }}>{params.value}</span>;
      }
    },
    {
      headerName: 'Items',
      field: 'total_items',
      minWidth: 60,
      valueFormatter: (params: any) => `${params.value || 0}`
    },
    {
      headerName: 'Counted',
      field: 'counted_items',
      minWidth: 70,
      valueFormatter: (params: any) => `${params.value || 0}`
    },
    {
      headerName: 'Variances',
      field: 'variance_items',
      minWidth: 80,
      cellRenderer: (params: any) => {
        const val = params.value || 0;
        return <span style={{ color: val > 0 ? '#ef4444' : '#10b981' }}>{val}</span>;
      }
    },
    {
      headerName: 'Created By',
      field: 'created_by_name',
      minWidth: 110,
    },
    {
      headerName: 'Actions',
      minWidth: 60,
      pinned: 'right' as const,
      cellRenderer: (params: any) => {
        const count = params.data as PhysicalCount;
        const items: DropdownMenuItem[] = [
          { label: 'View', icon: <Eye size={16} />, onClick: () => fetchCountDetails(count.id) },
        ];
        if (count.status === 'Draft' || count.status === 'In Progress') {
          if (count.counted_items > 0) {
            items.push({
              label: 'Complete',
              icon: <CheckCircle size={16} />,
              onClick: () => {
                if (confirm('Complete this count and post stock adjustments?')) {
                  completeMutation.mutate(count.id);
                }
              }
            });
          }
          items.push({
            label: 'Cancel',
            icon: <XCircle size={16} />,
            onClick: () => {
              if (confirm('Cancel this physical count?')) {
                cancelMutation.mutate(count.id);
              }
            }
          });
        }
        if (count.status === 'Draft' || count.status === 'Cancelled') {
          items.push({
            label: 'Delete',
            icon: <Trash2 size={16} />,
            onClick: () => {
              if (confirm('Delete this physical count?')) {
                deleteMutation.mutate(count.id);
              }
            },
            destructive: true
          });
        }
        return (
          <DropdownMenu
            trigger={<button className="action-menu-trigger" title="Actions"><MoreVertical size={16} /></button>}
            items={items}
            align="end"
          />
        );
      }
    }
  ];

  const onCellClicked = (params: any) => {
    if (params.colDef?.headerName !== 'Actions') {
      fetchCountDetails(params.data.id);
    }
  };

  const draftCounts = counts.filter(c => c.status === 'Draft');
  const completedCounts = counts.filter(c => c.status === 'Completed');
  const inProgressCounts = counts.filter(c => c.status === 'In Progress');

  const totalVarianceValue = countItems.reduce((sum, item) => sum + (item.variance_value || 0), 0);

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>Physical Counts</h1>
          <p className="page-subtitle" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Count physical inventory and reconcile with system records
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} /> New Count
        </Button>
      </div>

      <StatsGrid>
        <StatCard
          label="Total Counts"
          value={counts.length}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Draft"
          value={draftCounts.length}
          icon={ClipboardCheck}
          style={{ '--stat-value-color': '#6b7280' } as React.CSSProperties}
        />
        <StatCard
          label="In Progress"
          value={inProgressCounts.length}
          icon={ClipboardCheck}
          style={{ '--stat-value-color': '#f59e0b' } as React.CSSProperties}
        />
        <StatCard
          label="Completed"
          value={completedCounts.length}
          icon={CheckCircle}
          style={{ '--stat-value-color': '#10b981' } as React.CSSProperties}
        />
      </StatsGrid>

      <div className="items-grid-container" style={{ height: 'calc(100vh - 320px)' }}>
        <AgGridReact
          columnDefs={columnDefs as any}
          rowData={counts as any[]}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
          autoSizeStrategy={{
            type: 'fitCellContents'
          }}
          onCellClicked={onCellClicked}
          rowSelection={{ mode: 'singleRow' } as const}
          animateRows={true}
          overlayNoRowsTemplate='<span style="padding: 10px;">No physical counts found</span>'
        />
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Physical Count"
        size="small"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Warehouse *
            </label>
            <select
              value={selectedWarehouse || ''}
              onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Select warehouse</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.warehouse_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Count Date
            </label>
            <input
              type="date"
              value={countDate}
              onChange={(e) => setCountDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Notes
            </label>
            <textarea
              value={countNotes}
              onChange={(e) => setCountNotes(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedWarehouse) {
                  toast.error('Please select a warehouse');
                  return;
                }
                createMutation.mutate({
                  warehouse_id: selectedWarehouse,
                  count_date: countDate,
                  notes: countNotes || undefined
                });
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Count'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview/Count Modal */}
      <Modal
        isOpen={!!previewCount}
        onClose={() => setPreviewCount(null)}
        title={previewCount ? `${previewCount.count_no} - ${previewCount.warehouse_name}` : ''}
        size="large"
      >
        {previewCount && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Status</div>
                <div style={{ fontWeight: 600, color: previewCount.status === 'Completed' ? '#10b981' : previewCount.status === 'Cancelled' ? '#ef4444' : '#6b7280' }}>
                  {previewCount.status}
                </div>
              </div>
              <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Items</div>
                <div style={{ fontWeight: 600 }}>{previewCount.total_items}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Counted</div>
                <div style={{ fontWeight: 600 }}>{previewCount.counted_items}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Variances</div>
                <div style={{ fontWeight: 600, color: (previewCount.variance_items || 0) > 0 ? '#ef4444' : '#10b981' }}>
                  {previewCount.variance_items}
                </div>
              </div>
              {previewCount.status === 'Completed' && (
                <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Variance Value</div>
                  <div style={{ fontWeight: 600, color: totalVarianceValue > 0 ? '#ef4444' : '#10b981' }}>
                    {formatCurrency(Math.abs(totalVarianceValue))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Item Code</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Item Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>System Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Counted Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Variance</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Value</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {countItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{item.item_code}</td>
                      <td style={{ padding: '0.75rem' }}>{item.item_name}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.system_quantity}</td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontWeight: item.counted_quantity !== null ? 600 : 400,
                        color: item.counted_quantity !== null ? '#111827' : '#9ca3af'
                      }}>
                        {item.counted_quantity !== null ? item.counted_quantity : '-'}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: (item.variance || 0) > 0 ? '#ef4444' : (item.variance || 0) < 0 ? '#10b981' : '#6b7280'
                      }}>
                        {item.variance !== null ? (item.variance > 0 ? '+' : '') + item.variance : '-'}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        color: (item.variance_value || 0) > 0 ? '#ef4444' : (item.variance_value || 0) < 0 ? '#10b981' : '#6b7280'
                      }}>
                        {item.variance_value ? formatCurrency(Math.abs(item.variance_value)) : '-'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {previewCount.status === 'Draft' && (
                          <Button
                            variant="secondary"
                            onClick={() => handleRecordCount(item)}
                          >
                            Count
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {previewCount.status === 'Draft' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm('Cancel this physical count?')) {
                          cancelMutation.mutate(previewCount.id);
                        }
                      }}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel Count
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm('Delete this physical count?')) {
                          deleteMutation.mutate(previewCount.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" onClick={() => setPreviewCount(null)}>
                  Close
                </Button>
                {previewCount.status === 'Draft' && previewCount.counted_items > 0 && (
                  <Button
                    onClick={() => {
                      if (confirm('Complete this count and post stock adjustments?')) {
                        completeMutation.mutate(previewCount.id);
                      }
                    }}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? 'Processing...' : 'Complete & Post Adjustments'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Count Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Count: ${editingItem?.item_name}`}
        size="small"
      >
        {editingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>System Quantity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingItem.system_quantity} {editingItem.unit_of_measure}</div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Counted Quantity
              </label>
              <input
                type="number"
                step="0.001"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
              {editValue && !isNaN(parseFloat(editValue)) && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  background: parseFloat(editValue) !== editingItem.system_quantity ? '#fef2f2' : '#f0fdf4'
                }}>
                  Variance: <strong style={{
                    color: parseFloat(editValue) > editingItem.system_quantity ? '#ef4444' :
                      parseFloat(editValue) < editingItem.system_quantity ? '#10b981' : '#6b7280'
                  }}>
                    {parseFloat(editValue) > editingItem.system_quantity ? '+' : ''}{parseFloat(editValue) - editingItem.system_quantity}
                  </strong>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Notes (optional)
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g., Damaged, expired"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button onClick={submitCount} disabled={recordMutation.isPending}>
                {recordMutation.isPending ? 'Saving...' : 'Save Count'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
