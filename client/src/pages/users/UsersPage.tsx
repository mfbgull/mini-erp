import { useState } from 'react';
import toast from 'react-hot-toast';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, MoreVertical, Shield } from 'lucide-react';

import Button from '../../components/common/Button';
import { CompactUserCardView } from '../../components/common/CompactUserCard';
import DropdownMenu from '../../components/common/DropdownMenu';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import UserFormModal from '../../components/users/UserFormModal';
import ResetPasswordModal from '../../components/users/ResetPasswordModal';
import api from '../../utils/api';
import { createActionColDef } from '../../utils/agGridIntegration';
import { getIsActiveCellClass } from '../../utils/statusCellUtils';
import type { User } from '../../utils/userTypes';

import './UsersPage.css';
import '../../styles/ag-grid-status-cells.css';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function UsersPage() {
  const { isMobile } = useMobileDetection();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('is_active', statusFilter);

      const response = await api.get(`/users?${params}`);
      return (response.data.data || []) as User[];
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean | number }) => {
      return api.put(`/users/${userId}/toggle-status`, { is_active: isActive });
    },
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    },
  });

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user: ${user.username}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleToggleStatus = (user: User) => {
    toggleStatusMutation.mutate({ userId: user.id, isActive: !user.is_active });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUserForReset(user);
    setShowResetPasswordModal(true);
  };

  const columnDefs = [
    {
      headerName: 'Username',
      field: 'username',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: { value: string; data: User }) => (
        <div className="user-cell">
          <div className="user-avatar">
            <Shield size={16} />
          </div>
          <div>
            <div className="user-name">{params.value}</div>
            <div className="user-email">{params.data.email}</div>
          </div>
        </div>
      ),
    },
    {
      headerName: 'Full Name',
      field: 'full_name',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Role',
      field: 'role',
      sortable: true,
      filter: true,
      flex: 0.8,
      cellRenderer: (params: { value: string }) => (
        <span className={`role-badge role-${params.value}`}>
          {params.value}
        </span>
      ),
    },
    {
      headerName: 'Status',
      field: 'is_active',
      sortable: true,
      filter: true,
      flex: 0.8,
      cellRenderer: (params: { value: boolean | number }) => params.value ? 'Active' : 'Inactive',
      cellClass: (params: { value: boolean | number }) => getIsActiveCellClass(params.value),
    },
    {
      headerName: 'Created',
      field: 'created_at',
      sortable: true,
      flex: 0.9,
      valueFormatter: (params: { value: string }) => new Date(params.value).toLocaleDateString(),
    },
    createActionColDef({
      cellRenderer: (params: { data: User }) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: params.data.is_active ? 'Deactivate' : 'Activate', icon: params.data.is_active ? <UserCheck size={16} /> : <UserX size={16} />, onClick: () => handleToggleStatus(params.data) },
            { label: 'Reset Password', icon: <Shield size={16} />, onClick: () => handleResetPassword(params.data) },
            { label: 'Edit', icon: <Edit size={16} />, onClick: () => handleEditUser(params.data) },
            { label: 'Delete', icon: <Trash2 size={16} />, onClick: () => handleDeleteUser(params.data), destructive: true },
          ]}
          align="end"
        />
      ),
    }),
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="page-subtitle">Manage system users, roles, and permissions</p>
        </div>
        <div className="action-right">
          <Button variant="primary" onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
            <Plus size={18} />
            Add User
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={roleFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>

      {isMobile ? (
        <CompactUserCardView
          users={users}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
        />
      ) : (
        <div className="ag-theme-quartz users-grid">
          <AgGridReact
            rowData={users}
            columnDefs={columnDefs as any}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
            }}
            loading={isLoading}
            overlayLoadingTemplate='<div class="ag-overlay-loading-center">Loading users...</div>'
            overlayNoRowsTemplate='<div class="ag-overlay-no-rows-center">No users found</div>'
            onRowDoubleClicked={() => {}}
          />
        </div>
      )}

      {isModalOpen && (
        <UserFormModal
          user={editingUser}
          onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
            setEditingUser(null);
          }}
        />
      )}

      {showResetPasswordModal && selectedUserForReset && (
        <ResetPasswordModal
          user={selectedUserForReset}
          onClose={() => { setShowResetPasswordModal(false); setSelectedUserForReset(null); }}
          onSuccess={() => {
            setShowResetPasswordModal(false);
            setSelectedUserForReset(null);
            toast.success('Password reset successfully');
          }}
        />
      )}
    </div>
  );
}
