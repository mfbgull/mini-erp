import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';

import Button from '../common/Button';
import FormInput from '../common/FormInput';
import Modal from '../common/Modal';
import api from '../../utils/api';
import type { User, UserFormData, Role } from '../../utils/userTypes';

interface UserFormModalProps {
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserFormModal({ user, onClose, onSuccess }: UserFormModalProps) {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    role_id: user?.role_id || '',
    is_active: user?.is_active !== undefined ? user.is_active : true,
    password: '',
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return (response.data.data || []) as Role[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (isEdit) {
        return api.put(`/users/${user!.id}`, data);
      } else {
        return api.post('/users', data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'User updated successfully' : 'User created successfully');
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} user`);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Record<string, unknown> = { ...formData };
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
          value={String(formData.role_id)}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select Role' },
            ...roles.map((r: Role) => ({ value: String(r.id), label: r.role_name })),
          ]}
          required
        />

        <div className="form-checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_active"
              checked={!!formData.is_active}
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
