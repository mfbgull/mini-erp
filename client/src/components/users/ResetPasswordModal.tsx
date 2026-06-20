import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { Shield } from 'lucide-react';

import Button from '../common/Button';
import FormInput from '../common/FormInput';
import Modal from '../common/Modal';
import api from '../../utils/api';
import type { User } from '../../types';

interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordModal({ user, onClose, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      return api.put(`/users/${user.id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
          required
          placeholder="Enter new password"
        />

        <FormInput
          label="Confirm Password *"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
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
