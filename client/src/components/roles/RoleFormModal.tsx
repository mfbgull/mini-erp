import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { Shield } from 'lucide-react';

import Button from '../common/Button';
import FormInput from '../common/FormInput';
import Modal from '../common/Modal';
import api from '../../utils/api';
import type { Role, RoleFormData } from '../../types';

interface RoleFormModalProps {
  role?: Role | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleFormModal({ role, onClose, onSuccess }: RoleFormModalProps) {
  const isEdit = !!role;
  const [formData, setFormData] = useState<RoleFormData>({
    role_name: role?.role_name || '',
    description: role?.description || '',
    is_active: role?.is_active !== undefined ? role.is_active : true,
  });

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (isEdit) {
        return api.put(`/roles/${role!.id}`, data);
      }
      return api.post('/roles', data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Role updated' : 'Role created');
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} role`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData as unknown as Record<string, unknown>);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEdit ? 'Edit Role' : 'Create Role'} size="medium">
      <form onSubmit={handleSubmit} className="role-form">
        <FormInput
          label="Role Name *"
          name="role_name"
          type="text"
          value={formData.role_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, role_name: e.target.value })}
          required
          disabled={isEdit && !!(role?.is_system_role)}
          placeholder="e.g., Manager, Accountant"
        />

        <FormInput
          label="Description"
          name="description"
          type="textarea"
          rows={3}
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this role's responsibilities..."
        />

        {!isEdit && (
          <div className="form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!formData.is_active}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_active: e.target.checked })}
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
