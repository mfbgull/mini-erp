import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, MoreVertical, Shield, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import DropdownMenu from '../../components/common/DropdownMenu';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { CompactUserCardView } from '../../components/common/CompactUserCard';
import api from '../../utils/api';

import './UsersPage.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function UsersPage() {
  const { isMobile } = useMobileDetection();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('is_active', statusFilter);
      
      const response = await api.get(`/users?${params}`);
      return response.data.data || [];
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      return api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries(['users']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }) => {
      return api.put(`/users/${userId}/toggle-status`, { is_active: isActive });
    },
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries(['users']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    },
  });

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete user: ${user.username}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleToggleStatus = (user) => {
    toggleStatusMutation.mutate({ userId: user.id, isActive: !user.is_active });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleResetPassword = (user) => {
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
      cellRenderer: (params) => (
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
      cellRenderer: (params) => (
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
      cellRenderer: (params) => (
        <span className={`status-badge ${params.value ? 'status-active' : 'status-inactive'}`}>
          {params.value ? (
            <>
              <UserCheck size={14} /> Active
            </>
          ) : (
            <>
              <UserX size={14} /> Inactive
            </>
          )}
        </span>
      ),
    },
    {
      headerName: 'Created',
      field: 'created_at',
      sortable: true,
      flex: 0.9,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 70,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
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
    },
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
          <AgGridReact theme="legacy"
            rowData={users}
            columnDefs={columnDefs}
            defaultColDef={{
              theme:"legacy",
              resizable: true,
              sortable: true,
              filter: true,
            }}
            loading={isLoading}
            overlayLoadingTemplate='<div class="ag-overlay-loading-center">Loading users...</div>'
            overlayNoRowsTemplate='<div class="ag-overlay-no-rows-center">No users found</div>'
          />
        </div>
      )}

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <UserFormModal
          user={editingUser}
          onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries(['users']);
            setIsModalOpen(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Reset Password Modal */}
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

// User Form Modal Component
function UserFormModal({ user, onClose, onSuccess }) {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    role_id: user?.role_id || '',
    is_active: user?.is_active !== undefined ? user.is_active : true,
    password: '',
  });

  // Fetch roles for dropdown
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return api.put(`/users/${user.id}`, data);
      } else {
        return api.post('/users', data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'User updated successfully' : 'User created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} user`);
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = { ...formData };
    if (isEdit && !data.password) {
      delete data.password;
    }
    
    mutation.mutate(data);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Add New User'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="user-form">
        <FormInput
          label="Username *"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="Enter username"
        />

        <FormInput
          label="Email *"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter email address"
        />

        <FormInput
          label="Full Name *"
          name="full_name"
          type="text"
          value={formData.full_name}
          onChange={handleChange}
          required
          placeholder="Enter full name"
        />

        {!isEdit && (
          <div className="form-input-group">
            <div className="form-label-container">
              <label htmlFor="password-create" className="form-label">Password *</label>
            </div>
            <div className="password-input-wrapper">
              <input
                id="password-create"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEdit}
                placeholder="Enter password"
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        {isEdit && (
          <div className="form-input-group">
            <div className="form-label-container">
              <label htmlFor="password-edit" className="form-label">New Password (leave blank to keep current)</label>
            </div>
            <div className="password-input-wrapper">
              <input
                id="password-edit"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        <FormInput
          label="Role *"
          name="role_id"
          type="select"
          value={formData.role_id}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select Role' },
            ...roles.map((r) => ({ value: r.id, label: r.role_name })),
          ]}
          required
        />

        <div className="form-checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span>Active User</span>
          </label>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {isEdit ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Reset Password Modal Component
function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      return api.put(`/users/${user.id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    mutation.mutate();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Reset Password: ${user.username}`}
      size="small"
    >
      <form onSubmit={handleSubmit} className="reset-password-form">
        <div className="password-reset-info">
          <Shield size={48} className="info-icon" />
          <p>You are resetting the password for <strong>{user.username}</strong></p>
          <p className="warning">This action cannot be undone.</p>
        </div>

        <FormInput
          label="New Password *"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          placeholder="Enter new password"
        />

        <FormInput
          label="Confirm Password *"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Confirm new password"
        />

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            Reset Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
