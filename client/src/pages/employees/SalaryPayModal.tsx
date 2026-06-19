import { useState } from 'react';
import toast from 'react-hot-toast';

import { useMutation } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import Modal from '../../components/common/Modal';
import type { Employee } from '../../types';
import api from '../../utils/api';
import './SalaryPayModal.css';

interface SalaryPayModalProps {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SalaryPayModal({ employee, onClose, onSuccess }: SalaryPayModalProps) {
  const [amount, setAmount] = useState(String(employee.salary || 0));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/employees/${employee.id}/salary/pay`, {
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_no: referenceNo || undefined,
        notes: notes || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Salary paid to ${employee.first_name} ${employee.last_name}`);
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to process salary payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    mutation.mutate();
  };

  const fullName = `${employee.first_name} ${employee.last_name}`;

  return (
    <Modal isOpen={true} onClose={onClose} title={`Pay Salary — ${fullName}`} size="medium">
      <form onSubmit={handleSubmit} className="salary-pay-form">
        <div className="salary-pay-summary">
          <div className="pay-employee-info">
            <span className="pay-employee-name">{fullName}</span>
            <span className="pay-employee-code">{employee.employee_code}</span>
          </div>
        </div>

        <div className="form-row">
          <FormInput
            label="Amount *"
            name="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <FormInput
            label="Payment Date *"
            name="payment_date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Payment Method"
            name="payment_method"
            type="select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'bank', label: 'Bank Transfer' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
          <FormInput
            label="Reference No"
            name="reference_no"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
          />
        </div>

        <FormInput
          label="Notes"
          name="notes"
          type="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            <DollarSign size={16} />
            Pay Salary
          </Button>
        </div>
      </form>
    </Modal>
  );
}
