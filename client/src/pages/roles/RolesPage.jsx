import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import { Plus, Shield, Edit, Trash2, Key, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import CompactRoleCard from '../../components/common/CompactRoleCard';
import { useMobileDetection } from '../../utils/mobileDetection';
import api from '../../utils/api';

import './RolesPage.css';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const queryClient = useQueryClient();
  const { isMobile } = useMobileDetection();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data.data || [];
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId) => api.delete(`/roles/${roleId}`),
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries(['roles']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete role');
    },
  });

  const handleDeleteRole = (role) => {
    if (window.confirm(`Delete role "${role.role_name}"? This cannot be undone.`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleEditPermissions = (role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const columnDefs = [
    { headerName: 'Role Name', field: 'role_name', sortable: true, filter: true, flex: 1 },
    { headerName: 'Description', field: 'description', flex: 2 },
    { 
      headerName: 'Permissions', 
      field: 'permission_count', 
      flex: 0.8,
      cellRenderer: (params) => (
        <span className="permission-count">{params.value} permissions</span>
      ),
    },
    { 
      headerName: 'Type', 
      field: 'is_system_role', 
      flex: 0.6,
      cellRenderer: (params) => (
        <span className={`role-type-badge ${params.value ? 'system' : 'custom'}`}>
          {params.value ? 'System' : 'Custom'}
        </span>
      ),
    },
    { 
      headerName: 'Status', 
      field: 'is_active', 
      flex: 0.6,
      cellRenderer: (params) => (
        <span className={`status-badge ${params.value ? 'active' : 'inactive'}`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1.5,
      cellRenderer: (params) => (
        <div className="table-actions">
          <button className="action-btn" onClick={() => handleEditPermissions(params.data)} title="Edit Permissions">
            <Key size={16} />
          </button>
          {!params.data.is_system_role && (
            <>
              <button className="action-btn" onClick={() => { setEditingRole(params.data); setIsModalOpen(true); }} title="Edit">
                <Edit size={16} />
              </button>
              <button className="action-btn danger" onClick={() => handleDeleteRole(params.data)} title="Delete">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="roles-page">
      <div className="page-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p className="page-subtitle">Manage user roles and access permissions</p>
        </div>
        <div className="action-right">
          <Button variant="primary" onClick={() => { setEditingRole(null); setIsModalOpen(true); }} className="btn-compact">
            <Plus size={18} />
            Create Role
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="no-results">
          <Shield className="no-results-icon" size={48} />
          <h3>No roles found</h3>
          <p>Create your first role to get started.</p>
        </div>
      ) : isMobile ? (
        <>
          <CompactRoleCard
            roles={roles}
            onEdit={(role) => { setEditingRole(role); setIsModalOpen(true); }}
            onDelete={handleDeleteRole}
            onEditPermissions={handleEditPermissions}
          />
          <div className="mobile-action-bar">
            <Button variant="primary" onClick={() => { setEditingRole(null); setIsModalOpen(true); }}>
              + New Role
            </Button>
          </div>
        </>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
          <AgGridReact
            rowData={roles}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true
            }}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            rowSelection={{ mode: 'singleRow' }}
            loading={isLoading}
          />
        </div>
      )}

      {isModalOpen && (
        <RoleFormModal
          role={editingRole}
          onClose={() => { setIsModalOpen(false); setEditingRole(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries(['roles']);
            setIsModalOpen(false);
            setEditingRole(null);
          }}
        />
      )}

      {showPermissionsModal && selectedRole && (
        <PermissionsModal
          role={selectedRole}
          onClose={() => { setShowPermissionsModal(false); setSelectedRole(null); }}
          onSuccess={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
            queryClient.invalidateQueries(['roles']);
          }}
        />
      )}
    </div>
  );
}

function RoleFormModal({ role, onClose, onSuccess }) {
  const isEdit = !!role;
  const [formData, setFormData] = useState({
    role_name: role?.role_name || '',
    description: role?.description || '',
    is_active: role?.is_active !== undefined ? role.is_active : true,
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return api.put(`/roles/${role.id}`, data);
      }
      return api.post('/roles', data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Role updated' : 'Role created');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} role`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEdit ? 'Edit Role' : 'Create Role'} size="medium">
      <form onSubmit={handleSubmit} className="role-form">
        <FormInput
          label="Role Name *"
          name="role_name"
          type="text"
          value={formData.role_name}
          onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
          required
          disabled={isEdit && role?.is_system_role}
          placeholder="e.g., Manager, Accountant"
        />

        <FormInput
          label="Description"
          name="description"
          type="textarea"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this role's responsibilities..."
        />

        {!isEdit && (
          <div className="form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>Active Role</span>
            </label>
          </div>
        )}

        {isEdit && role?.is_system_role && (
          <div className="system-role-warning">
            <Shield size={16} />
            <span>System roles (Admin/User) cannot be modified</span>
          </div>
        )}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {isEdit ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PermissionsModal({ role, onClose, onSuccess }) {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: permissionsByModule } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await api.get('/roles/permissions');
      return response.data.data;
    },
  });

  const { data: rolePermissions } = useQuery({
    queryKey: ['rolePermissions', role.id],
    queryFn: async () => {
      const response = await api.get(`/roles/${role.id}/permissions`);
      const assigned = response.data.data.filter((p) => p.assigned).map((p) => p.id);
      setSelectedPermissions(assigned);
      setLoading(false);
      return response.data.data;
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/roles/${role.id}/permissions`, { permissions: selectedPermissions });
    },
    onSuccess: () => {
      toast.success('Permissions updated');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update permissions');
    },
  });

  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllInModule = (module) => {
    const modulePerms = rolePermissions?.filter((p) => p.module === module).map((p) => p.id) || [];
    const allSelected = modulePerms.every((id) => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !modulePerms.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePerms])]);
    }
  };

  const isModuleFullySelected = (module) => {
    const modulePerms = rolePermissions?.filter((p) => p.module === module).map((p) => p.id) || [];
    return modulePerms.length > 0 && modulePerms.every((id) => selectedPermissions.includes(id));
  };

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title={`Permissions: ${role.role_name}`} size="large">
        <div className="loading-state">Loading permissions...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Permissions: ${role.role_name}`} size="large">
      <div className="permissions-modal">
        <div className="permissions-info">
          <Shield size={24} />
          <div>
            <strong>Manage access for {role.role_name}</strong>
            <p>Select which actions this role can perform in each module</p>
          </div>
        </div>

        <div className="permissions-grid">
          {permissionsByModule && Object.entries(permissionsByModule).map(([module, perms]) => (
            <div key={module} className="permission-module">
              <div className="module-header">
                <h4 className="module-name">{module.charAt(0).toUpperCase() + module.slice(1)}</h4>
                <button
                  className="select-all-btn"
                  onClick={() => selectAllInModule(module)}
                >
                  {isModuleFullySelected(module) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="module-permissions">
                {perms.map((perm) => (
                  <label key={perm.id} className="permission-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#2563eb',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        opacity: 1,
                        visibility: 'visible'
                      }}
                    />
                    <span className="permission-label">
                      <span className="permission-action">{perm.action}</span>
                      {perm.description && (
                        <span className="permission-desc">{perm.description}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            variant="primary"
            loading={updatePermissionsMutation.isPending}
            onClick={() => updatePermissionsMutation.mutate()}
          >
            <Save size={16} /> Save Permissions
          </Button>
        </div>
      </div>
    </Modal>
  );
}
