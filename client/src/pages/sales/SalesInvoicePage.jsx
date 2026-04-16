import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Search, ArrowLeft, Printer, Download, Edit2, Mail, Share2, Plus, Trash2, Eye, Send, Hash, DollarSign, CreditCard } from 'lucide-react';

import Button from '../../components/common/Button';
import { CompactItemCard } from '../../components/common/CompactItemCard';
import FormInput from '../../components/common/FormInput';
import Modal from '../../components/common/Modal';
import InvoiceTemplate from '../../components/invoice/InvoiceTemplate';
import { useSettings } from '../../context/SettingsContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import api from '../../utils/api';
import PriceHistoryHint from '../../components/invoice/PriceHistoryHint';
import { invoiceSchema } from '../../schemas';

import './SalesInvoicePage.css';

// Helper: generate empty invoice item row
const createEmptyItemRow = (index) => ({
  id: Date.now() + index,
  item_id: '',
  description: '',
  quantity: 1,
  rate: 0,
  tax: 0,
  discount: { type: 'flat', value: 0 }
});

// Helper: pad items array to minimum 10 rows
const padItemsToMinimum = (items, min = 10) => {
  if (items.length >= min) return items;
  const padded = [...items];
  const now = Date.now();
  for (let i = items.length; i < min; i++) {
    padded.push({
      id: now + i + 1000,
      item_id: '',
      description: '',
      quantity: 0,
      rate: 0,
      tax: 0,
      discount: { type: 'flat', value: 0 }
    });
  }
  return padded;
};

export default function SalesInvoicePage() {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatCurrency, getCurrencySymbol } = useSettings();

  // Customer action functions for mobile
  const editCustomer = (customerId) => {
    navigate(`/sales/invoice/${customerId}/edit`);
  };

  const deleteCustomer = (customerId) => {
    if (window.confirm(`Are you sure you want to delete customer: ${customerId}?`)) {
      // Call delete API
      api.delete(`/sales/customers/${customerId}`)
        .then(() => {
          // Invalidate and refetch queries
          queryClient.invalidateQueries(['sales']);
        })
        .catch((error) => {
          toast.error('Failed to delete customer');
          throw error;
        });
    }
  };

  // Add Customer action functions to window scope for mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.editCustomer = editCustomer;
      window.deleteCustomer = deleteCustomer;
      window.viewCustomer = (customerId) => {
        navigate(`/sales/invoice/${customerId}/view`);
      };
    }
    return () => {
      delete window.editCustomer;
      delete window.deleteCustomer;
      delete window.viewCustomer;
    };
  }, [navigate, queryClient]);

  const [invoice, setInvoice] = useState({
    invoice_no: '',
    status: 'Unpaid',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    discountScope: 'invoice',
    discount: { type: 'flat', value: 0 },
    items: Array.from({ length: 10 }, (_, i) => createEmptyItemRow(i)),
    notes: 'Thank you for your business. Payment is due within 14 days.',
    terms: 'Net 14 days. Late payments subject to 1.5% monthly interest.',
    created_by: null,
    company: {
      name: 'Mini ERP',
      email: 'support@minierp.com',
      phone: '+1 123 456 7890',
      address: '456 Enterprise Ave, BC 12345',
      taxId: 'TAX-123456789',
    },
    payment: {
      record_payment: true, // Default to checked
      payment_date: new Date().toISOString().split('T')[0],
      payment_amount: 0,
      payment_method: 'Cash',
      reference_no: '',
      payment_notes: ''
    },
    paymentMethods: [
      { id: Date.now(), method: 'Cash', amount: 0, reference_no: '' }
    ]
  });

  const { errors, validate, clearErrors } = useFormValidation(invoiceSchema);

  const [editingCell, setEditingCell] = useState(null);
  const lastFocusedCellRef = useRef(null);
  const tableContainerRef = useRef(null);
  const pendingFocusRef = useRef(null);
  const paymentAmountInputRef = useRef(null);
  const [existingPayments, setExistingPayments] = useState([]);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletedPayments, setDeletedPayments] = useState([]);
  const [priceHint, setPriceHint] = useState(null); // { itemId, rowId, history } for showing price hint tooltip
  const [newItemId, setNewItemId] = useState(null); // Track newly added item ID for auto-focus

  // Fetch customers
  const { data: customers = [], error: customersError, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      // Make sure response.data.data is an array
      const customerData = Array.isArray(response.data.data) ? response.data.data : [];
      return customerData;
    },
    onError: (error) => {
      console.error('Error fetching customers:', error);
    }
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    }
  });

  // Fetch company settings
  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });

  // Update company info when settings are loaded
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setInvoice(prev => ({
        ...prev,
        company: {
          name: settings.company_name?.value || 'Mini ERP',
          email: settings.company_email?.value || 'support@minierp.com',
          phone: settings.company_phone?.value || '+1 123 456 7890',
          address: settings.company_address?.value || '456 Enterprise Ave, BC 12345',
          taxId: settings.company_tax_id?.value || 'TAX-123456789',
        }
      }));
    }
  }, [settings]);

  // Update payment amount when invoice total changes and payment is being recorded
  useEffect(() => {
    if (invoice.payment.record_payment && !invoiceId) {
      const total = calculateTotal();
      setInvoice(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          payment_amount: total
        }
      }));
    }
  }, [invoice.items, invoice.discount, invoice.discountScope]);

  // Set initial payment amount for new invoices
  useEffect(() => {
    if (!invoiceId && invoice.payment.record_payment) {
      const total = calculateTotal();
      if (total > 0 && invoice.payment.payment_amount === 0) {
        setInvoice(prev => ({
          ...prev,
          payment: {
            ...prev.payment,
            payment_amount: total
          }
        }));
      }
    }
  }, []); // Run once on mount

  // Function to fetch and show price history when rate cell is clicked
  const fetchPriceHistory = async (productId, customerId, rowId, currentPrice) => {
    if (!productId || !customerId) return;

    try {
      const response = await api.get(`/sales/item-customer-history?item_id=${productId}&customer_id=${customerId}`);

      let history = response.data.data;
      if (history && history.data && !history.lowest_price) {
        history = history.data;
      }

      // Check if there's actual history data
      if (history && history.transaction_count > 0) {
        setPriceHint({ itemId: productId, rowId, currentPrice, history });
        // Note: Tooltip will close when mouse leaves or when user clicks outside
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  // Watch for rate cell being edited and fetch price history
  useEffect(() => {
    if (editingCell && editingCell.endsWith('-rate')) {
      // Extract rowId - it's part before the last '-rate'
      const rowIdStr = editingCell.replace('-rate', '');
      const rowId = parseInt(rowIdStr) || rowIdStr;

      const currentItem = invoice.items.find(item =>
        item.id === rowId || item.id === parseInt(rowId) || String(item.id) === String(rowId)
      );

      // Save currentItem to local variable to capture in closure
      const savedCurrentItem = currentItem;

      // Add delay to ensure DOM has updated with data-rate-cell attribute
      setTimeout(() => {
        if (savedCurrentItem?.item_id && invoice.customer_id) {
          fetchPriceHistory(savedCurrentItem.item_id, invoice.customer_id, savedCurrentItem.id, savedCurrentItem.rate);
        }
      }, 50);
    }
    // Don't clear priceHint here - let it stay visible until auto-hide or user closes it
  }, [editingCell]);

  // Calculate expected status based on payment
  const getExpectedStatus = () => {
    if (!invoiceId) {
      if (invoice.payment.record_payment) {
        const total = calculateTotal();
        const paymentAmount = invoice.payment.payment_amount;
        if (paymentAmount >= total) {
          return 'Paid';
        } else if (paymentAmount > 0) {
          return 'Partially Paid';
        }
      }
      return 'Unpaid';
    }
    return invoice.status || 'Unpaid';
  };

  // If editing existing invoice, fetch it
  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        try {
          const response = await api.get(`/invoices/${invoiceId}`);
          const invoiceData = response.data;

          // Convert item data to match form structure
          const formattedItems = invoiceData.items?.map((item, index) => ({
            id: index + 1,
            item_id: item.item_id,
            description: item.item_name || item.description,
            quantity: item.quantity,
            rate: item.unit_price,
            tax: item.tax_rate || 0,
            discount: {
              type: item.discount_type || 'flat',
              value: item.discount_value || 0
            }
          })) || [];

          // Fetch customer balance information
          let customerBalance = { currentBalance: 0 };
          let customerInfo = {};

          try {
            const balanceResponse = await api.get(`/customers/${invoiceData.customer_id}/balance`);
            customerBalance = balanceResponse.data.data;

            const customerResponse = await api.get(`/customers/${invoiceData.customer_id}`);
            customerInfo = customerResponse.data.data;
          } catch (error) {
            console.error('Error fetching customer info:', error);
          }

          // Fetch existing payments for this invoice
          try {
            const paymentsResponse = await api.get(`/invoices/${invoiceId}/payments`);
            setExistingPayments(paymentsResponse.data.data || []);
          } catch (error) {
            console.error('Error fetching invoice payments:', error);
            setExistingPayments([]);
          }

           setInvoice({
             ...invoiceData,
             items: padItemsToMinimum(formattedItems),
             customer_id: invoiceData.customer_id,
             customer_name: invoiceData.customer_name,
             customer_email: invoiceData.customer_email,
             customer_phone: invoiceData.customer_phone,
             customer_address: invoiceData.customer_address,
             customer_current_balance: customerBalance.currentBalance || 0,
             customer_credit_limit: customerInfo.credit_limit || 0,
             customer_credit_utilization: customerInfo.credit_limit && customerInfo.credit_limit > 0
               ? (customerBalance.currentBalance / customerInfo.credit_limit) * 100
               : 0,
             discountScope: invoiceData.discount_scope || 'item',
             discount: {
               type: invoiceData.discount_type || 'flat',
               value: invoiceData.discount_value || 0
             },
             notes: invoiceData.notes || 'Thank you for your business. Payment is due within 14 days.',
             terms: invoiceData.terms || 'Net 14 days. Late payments subject to 1.5% monthly interest.',
             company: invoice.company,
             // Initialize payment object for new payments on existing invoices
             payment: {
               record_payment: false,
               payment_date: new Date().toISOString().split('T')[0],
               payment_amount: invoiceData.balance_amount || 0,
               payment_method: 'Cash',
               reference_no: '',
               payment_notes: ''
             },
             // Preserve paymentMethods array to avoid undefined error
             paymentMethods: [
               { id: Date.now(), method: 'Cash', amount: 0, reference_no: '' }
             ]
           });
        } catch (error) {
          toast.error('Failed to load invoice');
          navigate('/sales');
        }
      };

      fetchInvoice();
    } else {
      // Generate new invoice number
      const newInvoiceNo = `INV-${new Date().getFullYear()}-${String(Date.now() % 1000000).padStart(6, '0')}`;
      setInvoice(prev => ({
        ...prev,
        invoice_no: newInvoiceNo,
        paymentMethods: prev.paymentMethods // Preserve payment methods array
      }));
      
      // Auto-focus first cell for new invoice after a short delay
      setTimeout(() => {
        const firstCell = document.querySelector('[data-cell-id$="-description"]');
        if (firstCell) {
          firstCell.focus();
        }
      }, 200);
    }
  }, [invoiceId, navigate]);

  // Auto-focus first cell when user clicks on items section (disabled on initial load)
  useEffect(() => {
    if (!invoiceId && invoice.items.length > 0) {
      const timer = setTimeout(() => {
        const firstCell = document.querySelector('[data-cell-id$="-description"]');
        if (firstCell && document.activeElement !== firstCell) {
          // Only focus if user already interacted - don't auto-focus on mount
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [invoice.items.length, invoiceId]);

  // Auto-focus newly added row's description cell
  useEffect(() => {
    if (newItemId) {
      const timer = setTimeout(() => {
        const newCell = document.querySelector(`[data-cell-id="${newItemId}-description"]`);
        if (newCell) {
          setEditingCell(`${newItemId}-description`);
          newCell.focus();
          setTimeout(() => {
            const input = newCell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [newItemId]);

  // Prevent focus loss when items array changes
  useEffect(() => {
    if (pendingFocusRef.current) {
      const itemId = pendingFocusRef.current;
      pendingFocusRef.current = null;
      
      const timer = setTimeout(() => {
        const cell = document.querySelector(`[data-cell-id="${itemId}-description"]`);
        if (cell) {
          setEditingCell(`${itemId}-description`);
          cell.focus();
          setTimeout(() => {
            const input = cell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [invoice.items]);

  // Global keyboard handler for Shift+Enter to focus payment amount field
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        paymentAmountInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (invoiceId) {
        return api.put(`/invoices/${invoiceId}`, data);
      } else {
        return api.post('/invoices', data);
      }
    },
    onSuccess: () => {
      toast.success(invoiceId ? 'Invoice updated successfully!' : 'Invoice created successfully!');
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['customerInvoices', invoice.customer_id]);
      // Navigate to customer detail page
      navigate(`/customers/${invoice.customer_id}`);
    },
    onError: (error) => {
      console.error('=== INVOICE ERROR ===');
      console.error('Status:', error.response?.status);
      console.error('Error message:', error.response?.data?.error);
      console.error('Full error response:', error.response?.data);
      console.error('Error stack:', error.stack);
      toast.error(error.response?.data?.error || `Failed to ${invoiceId ? 'update' : 'create'} invoice`);
    }
  });

  // Mutation for recording payment on existing invoice
  const paymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      return api.post('/payments', paymentData);
    },
    onSuccess: async () => {
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries(['invoices']);
      // Refresh existing payments list
      try {
        const paymentsResponse = await api.get(`/invoices/${invoiceId}/payments`);
        setExistingPayments(paymentsResponse.data.data || []);
        // Refresh invoice data to update balance
        const invoiceResponse = await api.get(`/invoices/${invoiceId}`);
        setInvoice(prev => ({
          ...prev,
          paid_amount: invoiceResponse.data.paid_amount,
          balance_amount: invoiceResponse.data.balance_amount,
          status: invoiceResponse.data.status,
          paymentMethods: prev.paymentMethods, // Preserve payment methods array
          payment: {
            ...prev.payment,
            record_payment: false,
            payment_amount: invoiceResponse.data.balance_amount || 0
          }
        }));
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
      setShowNewPaymentForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    }
  });

  // Add new payment method
  const addPaymentMethod = () => {
    setInvoice(prev => ({
      ...prev,
      paymentMethods: [
        ...prev.paymentMethods,
        { id: Date.now(), method: 'Cash', amount: 0, reference_no: '' }
      ]
    }));
  };

  // Remove payment method
  const removePaymentMethod = (id) => {
    setInvoice(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter(method => method.id !== id)
    }));
  };

  // Update payment method
  const updatePaymentMethod = (id, field, value) => {
    setInvoice(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(method =>
        method.id === id ? { ...method, [field]: value } : method
      )
    }));
  };

  const handleRecordPayment = () => {
    // Calculate total payment amount
    const totalPaymentAmount = invoice.paymentMethods.reduce((sum, method) => sum + parseFloat(method.amount || 0), 0);

    // Validate total payment amount
    if (!totalPaymentAmount || totalPaymentAmount <= 0) {
      toast.error('Total payment amount must be greater than 0');
      return;
    }

    // Calculate remaining balance on the invoice
    const remainingBalance = invoiceId ? invoice.balance_amount : calculateTotal();

    // Check if payment exceeds the invoice amount
    if (totalPaymentAmount > remainingBalance) {
      toast.error(`Payment total (${formatCurrency(totalPaymentAmount)}) exceeds invoice balance (${formatCurrency(remainingBalance)})`);
      return;
    }

    // Prepare payment data - create separate payments for each payment method
    const paymentPromises = invoice.paymentMethods
      .filter(method => method.amount && parseFloat(method.amount) > 0) // Only include payments with amounts
      .map(method => {
        return {
          customer_id: invoice.customer_id,
          payment_date: invoice.payment.payment_date,
          amount: parseFloat(method.amount),
          payment_method: method.method,
          reference_no: method.reference_no || null,
          description: `Payment for ${invoice.invoice_no}`,
          notes: invoice.payment.payment_notes,
          invoice_allocations: [{
            invoice_id: parseInt(invoiceId, 10),
            amount: parseFloat(method.amount)
          }]
        };
      });

    // If there's only one payment method, process as single payment
    if (paymentPromises.length === 1) {
      paymentMutation.mutate(paymentPromises[0]);
    } else if (paymentPromises.length > 1) {
      // Process multiple payments sequentially
      let index = 0;
      const processNextPayment = () => {
        if (index < paymentPromises.length) {
          paymentMutation.mutate(paymentPromises[index++], {
            onSuccess: processNextPayment,  // Process next payment on success
            onError: (error) => {
              toast.error(error.response?.data?.error || `Failed to record payment: ${error.message}`);
            }
          });
        }
      };
      processNextPayment();
    } else {
      toast.error('At least one payment method with an amount is required');
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    // Parse payment date and populate form
    setInvoice(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        payment_date: payment.payment_date.split('T')[0] || payment.payment_date
      },
      paymentMethods: [{
        id: Date.now(),
        method: payment.payment_method,
        amount: payment.amount,
        reference_no: payment.reference_no || ''
      }]
    }));
    // Scroll to payment form
    document.querySelector('.payment-fields')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeletePayment = (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      setDeletedPayments(prev => [...prev, paymentId]);
      setExistingPayments(prev => prev.filter(p => p.id !== paymentId));
      toast.success('Payment marked for deletion. Click Update Invoice to save changes.');
    }
  };

  const calculateItemDiscount = (item) => {
    const subtotal = item.quantity * item.rate;
    if (item.discount.type === 'percentage') {
      return (subtotal * item.discount.value) / 100;
    } else {
      return item.discount.value;
    }
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.rate;
    const discount = invoice.discountScope === 'item' ? calculateItemDiscount(item) : 0;
    const afterDiscount = subtotal - discount;
    const taxAmount = (afterDiscount * item.tax) / 100;
    return afterDiscount + taxAmount;
  };

  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateTax = () => {
    return invoice.items.reduce((sum, item) => {
      const subtotal = item.quantity * item.rate;
      const discount = invoice.discountScope === 'item' ? calculateItemDiscount(item) : 0;
      const afterDiscount = subtotal - discount;
      return sum + (afterDiscount * item.tax / 100);
    }, 0);
  };

  const calculateDiscount = () => {
    if (invoice.discountScope === 'item') {
      return invoice.items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
    } else {
      const subtotal = calculateSubtotal();
      if (invoice.discount.type === 'percentage') {
        return (subtotal * invoice.discount.value) / 100;
      } else {
        return invoice.discount.value;
      }
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount();
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-700',
      'Sent': 'bg-blue-100 text-blue-700',
      'Unpaid': 'bg-gray-100 text-gray-700',
      'Partially Paid': 'bg-yellow-100 text-yellow-700',
      'Paid': 'bg-green-100 text-green-700',
      'Overdue': 'bg-red-100 text-red-700',
      'Cancelled': 'bg-gray-100 text-gray-500',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const addNewItem = () => {
    const newItemId = Date.now();
    const newItem = {
      id: newItemId,
      item_id: '',
      description: '',
      quantity: 1,
      rate: 0,
      tax: 0,
      discount: { type: 'flat', value: 0 }
    };
    setInvoice({
      ...invoice,
      items: [...invoice.items, newItem]
    });
    
    pendingFocusRef.current = newItemId;
    setNewItemId(newItemId);
    
    return newItemId;
  };

  const removeItem = (id) => {
    setInvoice({
      ...invoice,
      items: invoice.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (id, field, value) => {
    setInvoice({
      ...invoice,
      items: invoice.items.map(item => {
        if (item.id === id) {
          if (field === 'itemId') {
            const selectedItem = items.find(i => i.id === Number(value));
            return {
              ...item,
              item_id: Number(value),
              description: selectedItem?.item_name || item.description,
              rate: selectedItem?.standard_selling_price || item.rate
            };
          } else if (field === 'discountType') {
            return { ...item, discount: { ...item.discount, type: value } };
          } else if (field === 'discountValue') {
            return { ...item, discount: { ...item.discount, value: Number(value) || 0 } };
          } else {
            return { ...item, [field]: field === 'description' ? value : Number(value) || 0 };
          }
        }
        return item;
      })
    });
  };

  const getNextField = (currentField) => {
    if (invoice.discountScope === 'item') {
      const fieldOrder = ['description', 'quantity', 'rate', 'discountValue', 'tax'];
      const currentIndex = fieldOrder.indexOf(currentField);
      return fieldOrder[currentIndex + 1];
    } else {
      const fieldOrder = ['description', 'quantity', 'rate', 'tax'];
      const currentIndex = fieldOrder.indexOf(currentField);
      return fieldOrder[currentIndex + 1];
    }
  };

  const isLastField = (field) => {
    return field === 'tax';
  };

  const handleCustomerSelect = async (customer) => {
    try {
      const response = await api.get(`/customers/${customer.id}/balance`);
      const customerBalance = response.data.data;
      setInvoice(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.customer_name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_address: customer.billing_address,
        customer_current_balance: customerBalance.currentBalance,
        customer_credit_limit: customer.credit_limit || 0,
        customer_credit_utilization: customer.credit_limit && customer.credit_limit > 0
          ? (customerBalance.currentBalance / customer.credit_limit) * 100
          : 0
      }));

      // Auto-focus first item cell and enter edit mode after customer is selected
      setTimeout(() => {
        const firstCell = document.querySelector(`[data-cell-id="${invoice.items[0]?.id}-description"]`);
        if (firstCell) {
          setEditingCell(`${invoice.items[0]?.id}-description`);
          firstCell.focus();
          setTimeout(() => {
            const input = firstCell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 100);
    } catch (error) {
      setInvoice(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.customer_name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_address: customer.billing_address
      }));

      // Auto-focus first item cell and enter edit mode after customer is selected
      setTimeout(() => {
        const firstCell = document.querySelector(`[data-cell-id="${invoice.items[0]?.id}-description"]`);
        if (firstCell) {
          setEditingCell(`${invoice.items[0]?.id}-description`);
          firstCell.focus();
          setTimeout(() => {
            const input = firstCell.querySelector('input');
            if (input) {
              input.focus();
              input.select();
            }
          }, 50);
        }
      }, 100);
    }
  };

  // Searchable Select Cell for Description with Stock Info
  const SearchableDescriptionCell = ({ value, itemId, isLastItem }) => {
    const isEditing = editingCell === `${itemId}-description`;
    const [tempValue, setTempValue] = useState(value);
    const [filteredItems, setFilteredItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    // Sync tempValue with value when it changes from outside
    useEffect(() => {
      if (value !== tempValue && !isEditing) {
        setTempValue(value);
      }
    }, [value, isEditing]);

    // Get sellable items (exclude raw materials)
    const getSellableItems = () => {
      return items.filter(item =>
        !item.is_raw_material &&
        (item.is_finished_good === 1 || item.is_purchased === 1)
      ).slice(0, 10);
    };

    const handleInputChange = (e) => {
      const searchValue = e.target.value;
      setTempValue(searchValue);

      // Filter items based on search value
      const sellableItems = getSellableItems();
      
      if (searchValue.trim()) {
        // Filter by name or code (case-insensitive)
        const matches = sellableItems.filter(item =>
          item.item_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredItems(matches);
        setShowDropdown(matches.length > 0);
        setSelectedIndex(matches.length > 0 ? 0 : -1);
      } else {
        // Empty search - show all items
        setFilteredItems(sellableItems);
        setShowDropdown(sellableItems.length > 0);
        setSelectedIndex(sellableItems.length > 0 ? 0 : -1);
      }
    };

    const selectItem = (item, moveNext = true) => {
      // Update invoice state with selected item
      setInvoice(prev => ({
        ...prev,
        items: prev.items.map(invItem => {
          if (invItem.id === itemId) {
            return {
              ...invItem,
              item_id: item.id,
              description: item.item_name,
              rate: item.standard_selling_price || 0
            };
          }
          return invItem;
        })
      }));

      // Update local state
      setTempValue(item.item_name);
      setShowDropdown(false);
      setFilteredItems([]);
      setSelectedIndex(-1);

      // Move to quantity field after selection
      if (moveNext) {
        setTimeout(() => {
          setEditingCell(`${itemId}-quantity`);
        }, 0);
      } else {
        setEditingCell(null);
      }
    };

    const handleSave = () => {
      if (tempValue !== value) {
        updateItem(itemId, 'description', tempValue);
      }
      setShowDropdown(false);
      setFilteredItems([]);
      setEditingCell(null);
    };

    const closeDropdown = () => {
      setShowDropdown(false);
      setFilteredItems([]);
      setSelectedIndex(-1);
    };

    const openDropdown = () => {
      console.log('openDropdown called', { itemsLength: items?.length, value });
      if (!items || items.length === 0) {
        console.log('No items found');
        setFilteredItems([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        return;
      }
      const sellableItems = getSellableItems();
      console.log('sellableItems:', sellableItems.length);
      setFilteredItems(sellableItems);
      setShowDropdown(sellableItems.length > 0);
      setSelectedIndex(sellableItems.length > 0 ? 0 : -1);
    };

    const handleKeyDown = (e) => {
      // When dropdown is open with items, arrow keys navigate the list
      if (showDropdown && filteredItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (selectedIndex === 0) {
            // At first item - close dropdown and stay in edit mode
            closeDropdown();
            return;
          }
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
          return;
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
            selectItem(filteredItems[selectedIndex], true);
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown();
          // Keep focus in the input, don't exit edit mode
          inputRef.current?.focus();
          return;
        } else if (e.key === 'Tab') {
          // Tab with dropdown open - select current item
          if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
            e.preventDefault();
            selectItem(filteredItems[selectedIndex], true);
          }
          return;
        }
      }

      // Dropdown is closed or has no results - handle navigation
      if (e.ctrlKey && e.key === 'ArrowDown') {
        e.preventDefault();
        // Move to next row in description column
        handleSave();
        const currentItemIndex = invoice.items.findIndex(item => item.id === itemId);
        if (currentItemIndex < invoice.items.length - 1) {
          const nextItemId = invoice.items[currentItemIndex + 1].id;
          setTimeout(() => setEditingCell(`${nextItemId}-description`), 0);
        } else if (currentItemIndex === invoice.items.length - 1) {
          // At last row - add new item and navigate to it
          const newItemId = addNewItem();
          setNewItemId(newItemId);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Open dropdown with all items when pressing Down Arrow
        openDropdown();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Move to previous row in description column
        const currentItemIndex = invoice.items.findIndex(item => item.id === itemId);
        if (currentItemIndex > 0) {
          const prevItemId = invoice.items[currentItemIndex - 1].id;
          handleSave();
          setTimeout(() => setEditingCell(`${prevItemId}-description`), 0);
        } else if (currentItemIndex === 0) {
          // Already at first row - just stay in current cell
          handleSave();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Right Arrow - move to next column (Qty)
        setEditingCell(`${itemId}-quantity`);
      } else if (e.key === 'ArrowLeft') {
        // Left Arrow in description column - act as Escape (close dropdown if open)
        if (showDropdown) {
          e.preventDefault();
          closeDropdown();
          inputRef.current?.focus();
        }
        // Don't navigate to previous column from description
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) {
          selectItem(filteredItems[selectedIndex], true);
        } else {
          handleSave();
          // Move to next row or field
          if (isLastField('description') && isLastItem) {
            const newItemId = addNewItem();
            setNewItemId(newItemId);
          } else {
            const nextField = getNextField('description');
            if (nextField) {
              setTimeout(() => setEditingCell(`${itemId}-${nextField}`), 0);
            }
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (showDropdown && selectedIndex >= 0 && filteredItems[selectedIndex]) {
          selectItem(filteredItems[selectedIndex], true);
        } else {
          handleSave();
          const nextField = getNextField('description');
          if (nextField) {
            setTimeout(() => setEditingCell(`${itemId}-${nextField}`), 0);
          } else if (isLastItem) {
            const newItemId = addNewItem();
            setNewItemId(newItemId);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showDropdown) {
          closeDropdown();
          inputRef.current?.focus();
        } else {
          setTempValue(value);
          setEditingCell(null);
        }
      }
    };

    const handleBlur = (e) => {
      // Check if the blur is caused by clicking on a dropdown item
      const isClickingDropdown = e.relatedTarget?.closest('.item-dropdown');

      if (!isClickingDropdown) {
        setTimeout(() => {
          // Only auto-select if user explicitly confirmed with Enter/Tab (not just blur)
          // This prevents unwanted auto-population when user just clicks away
          if (showDropdown && selectedIndex >= 0 && document.querySelector('.item-dropdown-option.selected')) {
            // Auto-select only the highlighted item on blur (if user hovered/selected it)
            selectItem(filteredItems[selectedIndex], false);
          } else {
            // Just clear without selecting - user didn't choose anything
            setShowDropdown(false);
            setFilteredItems([]);
          }
        }, 150);
      }
    };

    if (isEditing) {
      const inputElement = document.querySelector(`[data-cell-id="${itemId}-description"] input`);
      const inputRect = inputElement?.getBoundingClientRect();
      const dropdownStyle = inputRect ? {
        position: 'fixed',
        top: `${inputRect.bottom + 2}px`,
        left: `${inputRect.left}px`,
        minWidth: `${inputRect.width}px`
      } : {};

      return (
        <div className="searchable-cell-container" onMouseDown={() => openDropdown()}>
          <input
            ref={inputRef}
            type="text"
            value={tempValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              e.target.select();
              lastFocusedCellRef.current = `${itemId}-description`;
              // Open dropdown on focus if there's text or show all items
              openDropdown();
            }}
            className="editable-input"
            placeholder="Type to search items..."
          />
          {showDropdown && (
            <div className="item-dropdown" style={dropdownStyle}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`item-dropdown-option ${index === selectedIndex ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur from firing
                      selectItem(item, true);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="item-dropdown-main">
                      <span className="item-dropdown-name">{item.item_name}</span>
                      <span className="item-dropdown-code">{item.item_code}</span>
                    </div>
                    <div className="item-dropdown-details">
                      <span className="item-dropdown-stock">
                        Stock: {item.current_stock || 0}
                      </span>
                      <span className="item-dropdown-price">
                        {formatCurrency(item.standard_selling_price || 0)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                tempValue.trim() && (
                  <div className="item-dropdown-no-results">
                    No products found matching "{tempValue}"
                  </div>
                )
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        onClick={() => {
          setTempValue(value || '');
          setEditingCell(`${itemId}-description`);
          setTimeout(() => openDropdown(), 50);
        }}
        onFocus={() => {
          lastFocusedCellRef.current = `${itemId}-description`;
          setTempValue(value || '');
          setEditingCell(`${itemId}-description`);
          setTimeout(() => openDropdown(), 50);
        }}
        onKeyDown={(e) => {
          const currentItemIndex = invoice.items.findIndex(item => item.id === itemId);
          const isLastItem = currentItemIndex === invoice.items.length - 1;
          
          const focusTargetCell = (targetItemId, targetField) => {
            setTimeout(() => {
              const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
              if (el) el.focus();
            }, 0);
          };

          if (e.key === 'Enter') {
            e.preventDefault();
            setTempValue(value || '');
            setEditingCell(`${itemId}-description`);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentItemIndex < invoice.items.length - 1) {
              const nextItemId = invoice.items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, 'description');
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              const prevItemId = invoice.items[currentItemIndex - 1].id;
              focusTargetCell(prevItemId, 'description');
            }
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextField = getNextField('description');
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (currentItemIndex < invoice.items.length - 1) {
              const nextItemId = invoice.items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, 'description');
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              const prevItemId = invoice.items[currentItemIndex - 1].id;
              focusTargetCell(prevItemId, 'tax');
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            const nextField = getNextField('description');
            if (nextField) {
              focusTargetCell(itemId, nextField);
            } else if (isLastItem) {
              const newItemId = addNewItem();
              setNewItemId(newItemId);
            }
          }
        }}
        className="editable-cell"
        tabIndex={0}
        data-cell-id={`${itemId}-description`}
      >
        {value || <span className="cell-placeholder">Click to add item...</span>}
        <Edit2 className="edit-icon" />
      </div>
    );
  };

  // Regular Editable Cell for other fields
  const EditableCell = ({ value, itemId, field, type = 'text', isLastItem }) => {
    const isEditing = editingCell === `${itemId}-${field}`;
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
      updateItem(itemId, field, tempValue);
      setEditingCell(null);
    };

    const moveToCell = (rowOffset, colOffset) => {
      const currentItemIndex = invoice.items.findIndex(item => item.id === itemId);
      const fieldOrder = invoice.discountScope === 'item'
        ? ['description', 'quantity', 'rate', 'discountValue', 'tax']
        : ['description', 'quantity', 'rate', 'tax'];

      const currentFieldIndex = fieldOrder.indexOf(field);

      // Move vertically (row)
      if (rowOffset !== 0) {
        const newItemIndex = currentItemIndex + rowOffset;
        if (newItemIndex >= 0 && newItemIndex < invoice.items.length) {
          const newItemId = invoice.items[newItemIndex].id;
          handleSave();
          setTimeout(() => setEditingCell(`${newItemId}-${field}`), 0);
        } else if (rowOffset > 0 && newItemIndex >= invoice.items.length) {
          // Add new row when going down past last row
          handleSave();
          const newItemId = addNewItem();
          setNewItemId(newItemId);
        }
      }

      // Move horizontally (column)
      if (colOffset !== 0) {
        const newFieldIndex = currentFieldIndex + colOffset;
        if (newFieldIndex >= 0 && newFieldIndex < fieldOrder.length) {
          handleSave();
          setTimeout(() => setEditingCell(`${itemId}-${fieldOrder[newFieldIndex]}`), 0);
        }
      }
    };

    const handleKeyDown = (e) => {
      // Ctrl+ArrowUp: Increment value
      if (e.ctrlKey && e.key === 'ArrowUp') {
        e.preventDefault();
        if (['quantity', 'rate', 'tax', 'discountValue'].includes(field)) {
          let newValue = (parseFloat(tempValue) || 0) + 1;
          // Tax % should not exceed 100
          if (field === 'tax' && newValue > 100) newValue = 100;
          // Quantity should not go below 0
          if (field === 'quantity' && newValue < 0) newValue = 0;
          setTempValue(newValue);
        }
      }
      // Ctrl+ArrowDown: Decrement value
      else if (e.ctrlKey && e.key === 'ArrowDown') {
        e.preventDefault();
        if (['quantity', 'rate', 'tax', 'discountValue'].includes(field)) {
          const currentVal = parseFloat(tempValue) || 0;
          let newValue = currentVal - 1;
          // Tax % should not go below 0
          if (field === 'tax' && newValue < 0) newValue = 0;
          // Quantity should not go below 0
          if (field === 'quantity' && newValue < 0) newValue = 0;
          // Rate and discount should not go below 0
          if ((field === 'rate' || field === 'discountValue') && newValue < 0) newValue = 0;
          setTempValue(newValue);
        }
      }
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveToCell(-1, 0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveToCell(1, 0);
      } else if (e.key === 'ArrowLeft') {
        // For number fields, always navigate left
        // For text fields, only navigate when cursor is at start
        const shouldNavigate = type === 'number' || e.target.selectionStart === 0;
        if (shouldNavigate) {
          e.preventDefault();
          moveToCell(0, -1);
        }
      } else if (e.key === 'ArrowRight') {
        // For number fields, always navigate right
        // For text fields, only navigate when cursor is at end
        const shouldNavigate = type === 'number' || e.target.selectionStart === e.target.value.length;
        if (shouldNavigate) {
          e.preventDefault();
          moveToCell(0, 1);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Shift+Enter: Focus payment amount field
        if (e.shiftKey) {
          handleSave();
          paymentAmountInputRef.current?.focus();
          return;
        }
        handleSave();
        if (isLastField(field) && isLastItem) {
          const newItemId = addNewItem();
          setNewItemId(newItemId);
        } else {
          moveToCell(1, 0); // Move down on Enter
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSave();
        const nextField = getNextField(field);
        if (nextField) {
          setEditingCell(`${itemId}-${nextField}`);
        } else if (isLastItem) {
          const newItemId = addNewItem();
          setNewItemId(newItemId);
        } else {
          moveToCell(1, 0);
        }
      } else if (e.key === 'Escape') {
        setTempValue(value);
        setEditingCell(null);
      }
    };

    if (isEditing) {
      return (
        <input
          type={type}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          className="editable-input"
        />
      );
    }

    return (
      <div
        onClick={() => {
          setTempValue(value);
          setEditingCell(`${itemId}-${field}`);
        }}
        onFocus={() => {
          lastFocusedCellRef.current = `${itemId}-${field}`;
          // Auto-enter edit mode when focused
          setTempValue(value);
          setEditingCell(`${itemId}-${field}`);
        }}
        onKeyDown={(e) => {
          const fieldOrder = invoice.discountScope === 'item'
            ? ['description', 'quantity', 'rate', 'discountValue', 'tax']
            : ['description', 'quantity', 'rate', 'tax'];
          const currentFieldIndex = fieldOrder.indexOf(field);
          const currentItemIndex = invoice.items.findIndex(item => item.id === itemId);

          const focusTargetCell = (targetItemId, targetField) => {
            setTimeout(() => {
              const el = document.querySelector(`[data-cell-id="${targetItemId}-${targetField}"]`);
              if (el) el.focus();
            }, 0);
          };

          if (e.key === 'Enter') {
            e.preventDefault();
            setTempValue(value);
            setEditingCell(`${itemId}-${field}`);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentItemIndex > 0) {
              const prevItemId = invoice.items[currentItemIndex - 1].id;
              focusTargetCell(prevItemId, field);
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentItemIndex < invoice.items.length - 1) {
              const nextItemId = invoice.items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, field);
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentFieldIndex > 0) {
              focusTargetCell(itemId, fieldOrder[currentFieldIndex - 1]);
            } else if (currentItemIndex > 0) {
              const prevItemId = invoice.items[currentItemIndex - 1].id;
              focusTargetCell(prevItemId, fieldOrder[fieldOrder.length - 1]);
            }
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentFieldIndex < fieldOrder.length - 1) {
              focusTargetCell(itemId, fieldOrder[currentFieldIndex + 1]);
            } else if (currentItemIndex < invoice.items.length - 1) {
              const nextItemId = invoice.items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, fieldOrder[0]);
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            if (currentFieldIndex < fieldOrder.length - 1) {
              focusTargetCell(itemId, fieldOrder[currentFieldIndex + 1]);
            } else if (currentItemIndex < invoice.items.length - 1) {
              const nextItemId = invoice.items[currentItemIndex + 1].id;
              focusTargetCell(nextItemId, 'description');
            } else {
              const newItemId = addNewItem();
              setNewItemId(newItemId);
            }
          }
        }}
        className="editable-cell"
        tabIndex={0}
        data-cell-id={`${itemId}-${field}`}
      >
        {value}
        <Edit2 className="edit-icon" />
      </div>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ensure invoice_no is generated before submission
    const invoiceNo = invoice.invoice_no || `INV-${new Date().getFullYear()}-${String(Date.now() % 1000000).padStart(6, '0')}`;

    // Filter out empty rows (rows with no item_id and no description)
    const filledItems = invoice.items.filter(item => item.item_id || item.description);

    // Prepare validation data
    const validationData = {
      customer_id: invoice.customer_id,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      notes: invoice.notes,
      terms: invoice.terms,
      discount_type: invoice.discount.type,
      discount_value: invoice.discount.value,
      items: filledItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        rate: item.rate,
        description: item.description,
        tax: item.tax,
        discount_type: item.discount.type,
        discount_value: item.discount.value
      }))
    };

    if (!validate(validationData)) return;

    if (!invoice.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    if (filledItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Prepare invoice data for submission
    const invoiceData = {
      // For new invoices, don't send status - backend will determine it
      // For existing invoices, send the status
      ...(invoiceId && { status: invoice.status }),
      invoice_no: invoiceNo,
      customer_id: invoice.customer_id,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      total_amount: calculateTotal(),
      discount_scope: invoice.discountScope,
      discount_type: invoice.discount.type,
      discount_value: invoice.discount.value,
      notes: invoice.notes,
      terms: invoice.terms,
      items: filledItems.map(item => ({
        item_id: item.item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.rate,
        tax_rate: item.tax,
        discount_type: item.discount.type,
        discount_value: item.discount.value
      })),
      // Include payment data if payment is being recorded
      ...(invoice.payment.record_payment && {
        record_payment: true,
        payment: {
          payment_date: invoice.payment.payment_date,
          amount: invoice.payment.payment_amount || 0,
          payment_method: invoice.paymentMethods[0]?.method || 'Cash',
          reference_no: invoice.paymentMethods[0]?.reference_no || '',
          notes: invoice.payment.payment_notes
        }
      }),
      // Include deleted payments if any
      ...(invoiceId && deletedPayments.length > 0 && {
        deleted_payments: deletedPayments
      })
    };

    mutation.mutate(invoiceData);
  };

  return (
    <div className="sales-invoice-page-modern">
      {/* Invoice Document */}
      <div className="invoice-document-modern">
        {/* Invoice Header - Clean Layout */}
        <div className="invoice-header-modern">
          <div className="header-grid-modern">
            {/* Invoice Title & Number */}
            <div className="header-section">
              <h1 className="invoice-title-modern">INVOICE</h1>
              <div className="invoice-number-modern">
                <Hash className="hash-icon" />
                <span>{invoice.invoice_no}</span>
              </div>
            </div>

            {/* Bill To + Dates Row */}
            <div className="header-section customer-section" style={{ display: 'flex', flexDirection: 'row', gap: '0.75rem', alignItems: 'flex-start', flex: 1 }}>
              {/* Customer Field */}
              <div style={{ flex: 1 }}>
                <div className="section-label-modern">BILL TO</div>
                <FormInput
                  name="customer_name"
                  type="searchable-select"
                  value={invoice.customer_name}
                  onChange={(e) => {
                    const customer = Array.isArray(customers) ? customers.find(c => c.customer_name === e.target.value) : null;
                    if (customer) handleCustomerSelect(customer);
                  }}
                  options={Array.isArray(customers)
                    ? customers.map(c => ({
                        value: c.customer_name,
                        label: `${c.customer_name}${c.customer_code ? ` (${c.customer_code})` : ''}`
                      }))
                    : []
                  }
                  placeholder={customersLoading ? "Loading..." : customersError ? "Error" : "Select customer..."}
                  required
                  small
                  disabled={customersLoading || !!customersError}
                />
                {errors.customer_id && (
                  <div className="field-error">{errors.customer_id}</div>
                )}
                {invoice.customer_id && (
                  <div className="customer-balance-inline">
                    Balance: <span className={`balance-amount ${invoice.customer_current_balance > 0 ? 'balance-positive' : 'balance-zero'}`}>{formatCurrency(Math.abs(invoice.customer_current_balance || 0))}</span>
                  </div>
                )}
              </div>

              {/* Dates - Inline with Customer */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div className="date-field">
                  <label className="date-label">Invoice Date</label>
                  <input
                    type="date"
                    className="date-input"
                    value={invoice.invoice_date}
                    onChange={(e) => setInvoice({ ...invoice, invoice_date: e.target.value })}
                  />
                </div>
                <div className="date-field">
                  <label className="date-label">Due Date</label>
                  <input
                    type="date"
                    className="date-input"
                    value={invoice.due_date}
                    onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <Button variant="secondary" onClick={() => navigate('/sales')}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>
              <Send className="action-icon" />
              {invoiceId ? 'Update' : 'Create'} Invoice
            </Button>
          </div>
        </div>

        {/* Two-Column Layout: Items + Payment */}
        <div className="invoice-main-split">
          {/* Left Column - Items and Totals */}
          <div className="invoice-left-column">
            {/* Items Header */}
            <div className="items-header-modern">
              <div className="items-header-left">
                <h3 className="items-title-modern">Line Items</h3>
                <div className="discount-scope-controls-modern">
                  <span className="discount-label-modern">Discount:</span>
                  <label className="discount-scope-option-modern">
                    <input
                      type="radio"
                      name="discountScope"
                      value="invoice"
                      checked={invoice.discountScope === 'invoice'}
                      onChange={(e) => setInvoice({ ...invoice, discountScope: e.target.value })}
                    />
                    <span>Invoice Level</span>
                  </label>
                  <label className="discount-scope-option-modern">
                    <input
                      type="radio"
                      name="discountScope"
                      value="item"
                      checked={invoice.discountScope === 'item'}
                      onChange={(e) => setInvoice({ ...invoice, discountScope: e.target.value })}
                    />
                    <span>Per Item</span>
                  </label>
                </div>
              </div>
              <button
                onClick={() => {
                  const newItemId = addNewItem();
                  setNewItemId(newItemId);
                }}
                className="add-item-btn-modern"
              >
                <Plus className="action-icon" />
                Add Item
              </button>
            </div>
            {errors.items && (
              <div className="field-error items-error">{errors.items}</div>
            )}

            {/* Items Table */}
            <div
              ref={tableContainerRef}
              className="items-table-container-modern"
              onMouseEnter={() => {
                if (lastFocusedCellRef.current) {
                  const el = document.querySelector(`[data-cell-id="${lastFocusedCellRef.current}"]`);
                  if (el) el.focus();
                }
              }}
            >
              <table className="items-table-modern">
                <thead>
                  <tr>
                    <th className="text-center serial-col">#</th>
                    <th className="text-left description-col">Description</th>
                    <th className="text-right quantity-col">Qty</th>
                    <th className="text-right rate-col">Rate</th>
                    {invoice.discountScope === 'item' && (
                      <th className="text-right discount-col">Discount</th>
                    )}
                    <th className="text-right tax-col">Tax %</th>
                    <th className="text-right amount-col">Amount</th>
                    <th className="delete-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center serial-col">{index + 1}</td>
                      <td className="invoice-item-cell">
                        <SearchableDescriptionCell
                          value={item.description}
                          itemId={item.id}
                          isLastItem={index === invoice.items.length - 1}
                        />
                      </td>
                      <td className="text-right invoice-item-cell">
                        <EditableCell
                          value={item.quantity}
                          itemId={item.id}
                          field="quantity"
                          type="number"
                          isLastItem={index === invoice.items.length - 1}
                        />
                      </td>
                      <td className="text-right rate-cell-container invoice-item-cell" data-rate-cell={item.id}>
                        <EditableCell
                          value={item.rate.toFixed(2)}
                          itemId={item.id}
                          field="rate"
                          type="number"
                          isLastItem={index === invoice.items.length - 1}
                        />
                      </td>
                      {invoice.discountScope === 'item' && (
                        <td className="text-right invoice-item-cell">
                          <div className="discount-cell-modern">
                            <select
                              value={item.discount.type}
                              onChange={(e) => updateItem(item.id, 'discountType', e.target.value)}
                              className="discount-type-select-modern"
                            >
                              <option value="percentage">%</option>
                              <option value="flat">{getCurrencySymbol()}</option>
                            </select>
                            <EditableCell
                              value={item.discount.value}
                              itemId={item.id}
                              field="discountValue"
                              type="number"
                              isLastItem={index === invoice.items.length - 1}
                            />
                          </div>
                        </td>
                      )}
                      <td className="text-right invoice-item-cell">
                        <EditableCell
                          value={item.tax}
                          itemId={item.id}
                          field="tax"
                          type="number"
                          isLastItem={index === invoice.items.length - 1}
                        />
                      </td>
                      <td className="text-right amount-cell-modern">
                        {formatCurrency(calculateItemTotal(item))}
                      </td>
                      <td className="text-center invoice-item-cell">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="remove-btn-modern"
                          title="Remove item"
                        >
                          <Trash2 className="trash-icon" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price History Tooltip */}
            {priceHint && priceHint.history && (
              <div className="price-hint-backdrop" onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPriceHint(null);
                }
              }}>
                <div className="price-hint-container" onMouseDown={(e) => {
                  e.preventDefault();
                }}>
                  <PriceHistoryHint
                    history={priceHint.history}
                    currentPrice={priceHint.currentPrice}
                    onClose={() => setPriceHint(null)}
                  />
                </div>
              </div>
            )}

            {/* Totals + Notes & Terms Row */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              {/* Notes & Terms - Left Side */}
              <div className="invoice-footer-modern" style={{ flex: 1, minWidth: 0 }}>
                <div>
                  <label className="footer-label">NOTES</label>
                  <textarea
                    value={invoice.notes}
                    onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                    rows="3"
                    className="footer-textarea"
                    placeholder="Thank you for your business..."
                  />
                </div>
                <div>
                  <label className="footer-label">TERMS & CONDITIONS</label>
                  <textarea
                    value={invoice.terms}
                    onChange={(e) => setInvoice({ ...invoice, terms: e.target.value })}
                    rows="3"
                    className="footer-textarea"
                    placeholder="Payment terms..."
                  />
                </div>
              </div>

              {/* Totals Card - Right Side */}
              <div className="totals-breakdown-modern" style={{ width: '280px', flexShrink: 0 }}>
                <div className="total-row-modern">
                  <span>Subtotal:</span>
                  <span className="total-value">{formatCurrency(calculateSubtotal())}</span>
                </div>

                {/* Discount Section */}
                {invoice.discountScope === 'invoice' ? (
                  <div className="total-row-modern">
                    <div className="discount-input-modern">
                      <span>Discount:</span>
                      <div className="discount-controls">
                        <select
                          value={invoice.discount.type}
                          onChange={(e) => setInvoice({
                            ...invoice,
                            discount: { ...invoice.discount, type: e.target.value }
                          })}
                          className="discount-type-select-modern"
                        >
                          <option value="percentage">%</option>
                          <option value="flat">{getCurrencySymbol()}</option>
                        </select>
                        <input
                          type="number"
                          value={invoice.discount.value}
                          onChange={(e) => setInvoice({
                            ...invoice,
                            discount: { ...invoice.discount, value: Number(e.target.value) || 0 }
                          })}
                          className="discount-value-input"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <span className="discount-amount">
                      -{formatCurrency(calculateDiscount())}
                    </span>
                  </div>
                ) : (
                  <div className="total-row-modern">
                    <span>Discount (Per Item):</span>
                    <span className="discount-amount">
                      -{formatCurrency(calculateDiscount())}
                    </span>
                  </div>
                )}

                <div className="total-row-modern border-top">
                  <span>Tax:</span>
                  <span className="total-value">{formatCurrency(calculateTax())}</span>
                </div>
                <div className="total-row-modern total-final">
                  <span>Total:</span>
                  <span className="total-amount-final">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Section */}
          <div className="invoice-right-column">
            <div className="payment-section-modern">
              <div className="payment-header">
                <h3 className="payment-title">
                  <DollarSign size={20} />
                  Payment
                </h3>
                {!invoiceId ? (
                  <label className="payment-checkbox">
                    <input
                      type="checkbox"
                      checked={invoice.payment.record_payment}
                      onChange={(e) => setInvoice({
                        ...invoice,
                        payment: {
                          ...invoice.payment,
                          record_payment: e.target.checked
                        }
                      })}
                    />
                    <span>Record payment now</span>
                  </label>
                ) : (
                  <div className="payment-summary-header">
                    <span className="payment-summary-item">
                      Total: <strong>{formatCurrency(invoice.total_amount || 0)}</strong>
                    </span>
                    <span className="payment-summary-item">
                      Paid: <strong className="text-green">{formatCurrency(invoice.paid_amount || 0)}</strong>
                    </span>
                    <span className="payment-summary-item">
                      Balance: <strong className={invoice.balance_amount > 0 ? 'text-red' : 'text-green'}>
                        {formatCurrency(invoice.balance_amount || 0)}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Existing Payments */}
              {invoiceId && existingPayments.filter(p => !deletedPayments.includes(p.id)).length > 0 && (
                <div className="existing-payments">
                  <h4 className="existing-payments-title">
                    <CreditCard size={16} />
                    Payment History
                  </h4>
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th className="text-right">Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingPayments.map(payment => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                          <td>{payment.payment_method}</td>
                          <td className="text-right">{formatCurrency(payment.amount)}</td>
                          <td>
                            <div className="payment-actions" style={{ flexDirection: 'row', gap: '0.25rem', borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                              <button
                                className="action-btn-small"
                                onClick={() => handleEditPayment(payment)}
                                title="Edit"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                className="action-btn-small delete"
                                onClick={() => handleDeletePayment(payment.id)}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment Form */}
              {(!invoiceId && invoice.payment.record_payment) || invoiceId ? (
                <div className="payment-fields">
                  <div className="payment-row">
                    <FormInput
                      inputRef={paymentAmountInputRef}
                      label="Amount"
                      name="payment_amount"
                      type="number"
                      step="0.01"
                      value={invoice.payment.payment_amount}
                      onChange={(e) => setInvoice({
                        ...invoice,
                        payment: { ...invoice.payment, payment_amount: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>

                  <div className="payment-row">
                    <FormInput
                      label="Payment Date"
                      name="payment_date"
                      type="date"
                      value={invoice.payment.payment_date}
                      onChange={(e) => setInvoice({
                        ...invoice,
                        payment: { ...invoice.payment, payment_date: e.target.value }
                      })}
                    />
                  </div>

                  {/* Multi Payment Methods */}
                  <div className="multi-payment-section">
                    <div className="multi-payment-header">
                      <h4>Payment Methods</h4>
                      <button type="button" className="add-payment-method-btn" onClick={addPaymentMethod}>
                        + Add Method
                      </button>
                    </div>

                    {(invoice.paymentMethods || []).map((method, index) => (
                      <div key={method.id} className="payment-method-row">
                        <div className="payment-method-grid">
                          <div className="payment-method-field">
                            <label>Method</label>
                            <select
                              value={method.method}
                              onChange={(e) => updatePaymentMethod(method.id, 'method', e.target.value)}
                              className="payment-method-select"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Check">Check</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="Online Payment">Online</option>
                            </select>
                          </div>

                          <div className="payment-method-field">
                            <label>Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={method.amount}
                              onChange={(e) => updatePaymentMethod(method.id, 'amount', e.target.value)}
                              placeholder="0.00"
                              className="payment-method-amount"
                            />
                          </div>

                          <div className="payment-method-field">
                            <label>Reference</label>
                            <input
                              type="text"
                              value={method.reference_no}
                              onChange={(e) => updatePaymentMethod(method.id, 'reference_no', e.target.value)}
                              placeholder="Check #, TXN ID..."
                              className="payment-method-reference"
                            />
                          </div>

                          {(invoice.paymentMethods || []).length > 1 && (
                            <div className="payment-method-field" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="remove-payment-method-btn"
                                onClick={() => removePaymentMethod(method.id)}
                                title="Remove"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Payment Summary */}
                    <div className="payment-summary">
                      <div className="payment-summary-row">
                        <span>Payment Total:</span>
                        <span>
                          {formatCurrency(
                            (invoice.paymentMethods || []).reduce((sum, method) => sum + (parseFloat(method.amount) || 0), 0)
                          )}
                        </span>
                      </div>
                      <div className="payment-summary-row">
                        <span>Invoice Balance:</span>
                        <span>{formatCurrency(invoiceId ? (invoice.balance_amount || 0) : calculateTotal())}</span>
                      </div>
                    </div>
                  </div>

                  {invoiceId && showNewPaymentForm && (
                    <div className="payment-actions">
                      <Button variant="secondary" size="sm" onClick={() => setShowNewPaymentForm(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleRecordPayment} loading={paymentMutation.isPending}>
                        Save Payment
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
