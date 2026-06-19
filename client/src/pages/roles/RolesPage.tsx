import { useState } from 'react';
import toast from 'react-hot-toast';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Plus, Shield, Edit, Trash2, Key, MoreVertical } from 'lucide-react';

import Button from '../../components/common/Button';
import CompactRoleCard from '../../components/common/CompactRoleCard';
import DropdownMenu from '../../components/common/DropdownMenu';
import RoleFormModal from '../../components/roles/RoleFormModal';
import PermissionsModal from '../../components/roles/PermissionsModal';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import api from '../../utils/api';
import { createActionColDef } from '../../utils/agGridIntegration';
import { getIsActiveCellClass, getRoleTypeCellClass } from '../../utils/statusCellUtils';
import type { Role } from '../../utils/roleTypes';

import './RolesPage.css';
import '../../styles/ag-grid-status-cells.css';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const queryClient = useQueryClient();
  const { isMobile } = useMobileDetection();

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return (response.data.data || []) as Role[];
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => api.delete(`/roles/${roleId}`),
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete role');
    },
  });

  const handleDeleteRole = (role: Role) => {
    if (window.confirm(`Delete role "${role.role_name}"? This cannot be undone.`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleEditPermissions = (role: Role) => {
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
      cellRenderer: (params: { value: number }) => (
        <span className="permission-count">{params.value} permissions</span>
      ),
    },
    {
      headerName: 'Type',
      field: 'is_system_role',
      flex: 0.6,
      cellRenderer: (params: { value: boolean | number }) => (
        params.value ? 'System' : 'Custom'
      ),
      cellClass: (params: { value: boolean | number }) => getRoleTypeCellClass(params.value),
    },
    {
      headerName: 'Status',
      field: 'is_active',
      flex: 0.6,
      cellRenderer: (params: { value: boolean | number }) => params.value ? 'Active' : 'Inactive',
      cellClass: (params: { value: boolean | number }) => getIsActiveCellClass(params.value),
    },
    createActionColDef({
      cellRenderer: (params: { data: Role }) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            { label: 'Edit Permissions', icon: <Key size={16} />, onClick: () => handleEditPermissions(params.data) },
            ...(!params.data.is_system_role
              ? [
                  { label: 'Edit', icon: <Edit size={16} />, onClick: () => { setEditingRole(params.data); setIsModalOpen(true); } },
                  { label: 'Delete', icon: <Trash2 size={16} />, onClick: () => handleDeleteRole(params.data), destructive: true },
                ]
              : [])
          ]}
          align="end"
        />
      ),
    }),
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
          {roles.map((role: Role) => (
            <CompactRoleCard
              key={role.id}
              role={role}
              onEdit={(r: Role) => { setEditingRole(r); setIsModalOpen(true); }}
              onDelete={handleDeleteRole}
              onEditPermissions={handleEditPermissions}
            />
          ))}
          <div className="mobile-action-bar">
            <Button variant="primary" onClick={() => { setEditingRole(null); setIsModalOpen(true); }}>
              + New Role
            </Button>
          </div>
        </>
      ) : (
        <div className="ag-theme-quartz grid-fill">
          <AgGridReact
            rowData={roles}
            columnDefs={columnDefs as any}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true
            }}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            rowSelection={{ mode: 'singleRow' } as const}
            loading={isLoading}
            onRowDoubleClicked={(params: { data: Role }) => handleEditPermissions(params.data)}
          />
        </div>
      )}

      {isModalOpen && (
        <RoleFormModal
          role={editingRole}
          onClose={() => { setIsModalOpen(false); setEditingRole(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
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
            queryClient.invalidateQueries({ queryKey: ['roles'] });
          }}
        />
      )}
    </div>
  );
}
