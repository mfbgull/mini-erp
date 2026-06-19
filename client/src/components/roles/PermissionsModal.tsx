import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, Save } from 'lucide-react';

import Button from '../common/Button';
import Modal from '../common/Modal';
import api from '../../utils/api';
import type { Role, Permission } from '../../utils/roleTypes';

interface PermissionsModalProps {
  role: Role;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PermissionsModal({ role, onClose, onSuccess }: PermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: permissionsByModule } = useQuery<Record<string, Permission[]>>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await api.get('/roles/permissions');
      return response.data.data as Record<string, Permission[]>;
    },
  });

  const { data: rolePermissions } = useQuery<Permission[]>({
    queryKey: ['rolePermissions', role.id],
    queryFn: async () => {
      const response = await api.get(`/roles/${role.id}/permissions`);
      const data = response.data.data as Permission[];
      const assigned = data.filter((p) => p.assigned).map((p) => p.id);
      setSelectedPermissions(assigned);
      setLoading(false);
      return data;
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
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to update permissions');
    },
  });

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllInModule = (module: string) => {
    const modulePerms = rolePermissions?.filter((p) => p.module === module).map((p) => p.id) || [];
    const allSelected = modulePerms.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !modulePerms.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePerms])]);
    }
  };

  const isModuleFullySelected = (module: string) => {
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
                  type="button"
                  className="select-all-btn"
                  onClick={() => selectAllInModule(module)}
                >
                  {isModuleFullySelected(module) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="module-permissions">
                {perms.map((perm: Permission) => (
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
