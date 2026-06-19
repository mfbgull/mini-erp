import { useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, DollarSign, Download, Printer } from 'lucide-react';

import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import './CustomerStatement.css';

interface CustomerInfo {
  customer_name?: string;
  customer_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

interface Transaction {
  transaction_date: string;
  reference_no?: string;
  description?: string;
  debit: number | string;
  credit: number | string;
}

interface StatementData {
  customer: CustomerInfo;
  openingBalance: number;
  closingBalance: number;
  transactions: Transaction[];
}

export default function CustomerStatement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  const { data: customer } = useQuery<CustomerInfo>({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
      return response.data.data;
    }
  });

  const { data: statement, isLoading } = useQuery<StatementData>({
    queryKey: ['customerStatement', id, dateRange.fromDate, dateRange.toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fromDate', dateRange.fromDate);
      params.append('toDate', dateRange.toDate);
      const response = await api.get(`/customers/${id}/statement?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!id
  });

  const handlePrint = () => { window.print(); };

  const handleDownload = () => {
    toast.success('Statement download would start in a real implementation');
  };

  if (isLoading) {
    return <div className="customer-statement-page loading"><div className="spinner"></div></div>;
  }

  if (!statement) {
    return (
      <div className="customer-statement-page error">
        <h2>Statement not available</h2>
        <p>Could not load customer statement data.</p>
        <Button onClick={() => navigate(-1)} type="button">Back</Button>
      </div>
    );
  }

  const { customer: customerInfo, openingBalance, closingBalance, transactions } = statement;

  const totalDebits = transactions.reduce((sum, t) => sum + (parseFloat(String(t.debit || 0))), 0);
  const totalCredits = transactions.reduce((sum, t) => sum + (parseFloat(String(t.credit || 0))), 0);

  return (
    <div className="customer-statement-page">
      <div className="statement-header">
        <div className="header-content">
          <Button variant="secondary" onClick={() => navigate(-1)} className="back-button" type="button">← Back</Button>
          <div className="statement-title">
            <h1>Customer Statement</h1>
            <p>For {customerInfo?.customer_name}</p>
          </div>
          <div className="statement-actions">
            <Button variant="secondary" onClick={handlePrint} type="button"><Printer size={16} /> Print</Button>
            <Button variant="primary" onClick={handleDownload} type="button"><Download size={16} /> Download PDF</Button>
          </div>
        </div>
      </div>

      <div className="statement-filters">
        <div className="date-filters">
          <FormInput label="From Date" type="date" value={dateRange.fromDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))} />
          <FormInput label="To Date" type="date" value={dateRange.toDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))} />
        </div>
      </div>

      <div className="statement-body">
        <div className="statement-info">
          <div className="customer-details">
            <h3>Customer Information</h3>
            <div className="detail-row"><span className="label">Name:</span><span className="value">{customerInfo?.customer_name}</span></div>
            <div className="detail-row"><span className="label">Code:</span><span className="value">{customerInfo?.customer_code}</span></div>
            <div className="detail-row"><span className="label">Contact:</span><span className="value">{customerInfo?.contact_person}</span></div>
            <div className="detail-row"><span className="label">Email:</span><span className="value">{customerInfo?.email}</span></div>
            <div className="detail-row"><span className="label">Phone:</span><span className="value">{customerInfo?.phone}</span></div>
          </div>
          <div className="statement-summary">
            <h3>Statement Summary</h3>
            <div className="summary-row"><span className="label">Opening Balance:</span><span className="value">{formatCurrency(openingBalance || 0)}</span></div>
            <div className="summary-row"><span className="label">Closing Balance:</span><span className="value">{formatCurrency(closingBalance || 0)}</span></div>
            <div className="summary-row"><span className="label">Total Debits:</span><span className="value">{formatCurrency(totalDebits)}</span></div>
            <div className="summary-row"><span className="label">Total Credits:</span><span className="value">{formatCurrency(totalCredits)}</span></div>
          </div>
        </div>

        <div className="transaction-table">
          <h3>Transaction Details</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Reference</th><th>Description</th>
                <th className="amount">Debit</th><th className="amount">Credit</th><th className="amount">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="opening-balance-row">
                <td>{dateRange.fromDate}</td><td>Opening Balance</td><td>Beginning balance</td>
                <td className="amount"></td><td className="amount"></td>
                <td className="amount balance">{formatCurrency(openingBalance || 0)}</td>
              </tr>
              {transactions.map((transaction, index) => {
                let runningBalance = openingBalance;
                for (let i = 0; i <= index; i++) {
                  runningBalance += parseFloat(String(transactions[i].debit || 0)) - parseFloat(String(transactions[i].credit || 0));
                }
                return (
                  <tr key={index} className="transaction-row">
                    <td>{transaction.transaction_date}</td>
                    <td>{transaction.reference_no}</td>
                    <td>{transaction.description}</td>
                    <td className="amount debit">{parseFloat(String(transaction.debit)) > 0 ? formatCurrency(transaction.debit) : ''}</td>
                    <td className="amount credit">{parseFloat(String(transaction.credit)) > 0 ? formatCurrency(transaction.credit) : ''}</td>
                    <td className="amount balance">{formatCurrency(runningBalance)}</td>
                  </tr>
                );
              })}
              <tr className="closing-balance-row">
                <td>{dateRange.toDate}</td><td>Closing Balance</td><td>Ending balance</td>
                <td className="amount"></td><td className="amount"></td>
                <td className="amount balance">{formatCurrency(closingBalance || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
