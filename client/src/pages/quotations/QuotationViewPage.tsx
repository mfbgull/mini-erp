import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { Printer, Edit2, ArrowLeft } from 'lucide-react';

import Button from '../../components/common/Button';
import QuotationTemplateA4 from '../../components/invoice/QuotationTemplateA4';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import { salesApi } from '../../utils/salesApi';
import type { QuotationApiResponse, QuotationApiItem, QuotationViewSettings, QuotationViewItem } from '../../types';
import './QuotationViewPage.css';

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string | null;
}

interface QuotationDisplay {
  quotation_no: string;
  status: string;
  quotation_date: string;
  expiry_date: string | null;
  customer_name: string;
  customer_address: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  terms: string | null;
  total_amount: number;
  subtotal: number | null;
  tax_amount: number | null;
  items: QuotationViewItem[];
}

export default function QuotationViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isMobile } = useMobileDetection();

  if (!id) {
    navigate('/quotations');
    return null;
  }

  const { data: settings = {} } = useQuery<QuotationViewSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data as QuotationViewSettings;
    }
  });

  const company: CompanyInfo = {
    name: settings.company_name?.value || 'Mini ERP',
    email: settings.company_email?.value || 'support@minierp.com',
    phone: settings.company_phone?.value || '+1 123 456 7890',
    address: settings.company_address?.value || '456 Enterprise Ave, BC 12345',
    taxId: settings.company_tax_id?.value || null
  };

  const { data: quotationData, isLoading } = useQuery<QuotationApiResponse>({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const response = await salesApi.getQuotation(Number(id));
      return (response.data || response) as QuotationApiResponse;
    }
  });

  const quotation: QuotationDisplay | null = quotationData ? {
    quotation_no: quotationData.quotation_no || `QTN-${String(id).padStart(4, '0')}`,
    status: quotationData.status || 'Draft',
    quotation_date: quotationData.quotation_date || '',
    expiry_date: quotationData.expiry_date || null,
    customer_name: quotationData.customer_name || 'N/A',
    customer_address: quotationData.customer_address || null,
    customer_phone: quotationData.customer_phone || null,
    customer_email: quotationData.customer_email || null,
    notes: quotationData.notes || null,
    terms: quotationData.terms || null,
    total_amount: quotationData.total_amount || 0,
    subtotal: quotationData.subtotal ?? null,
    tax_amount: quotationData.tax_amount ?? null,
    items: (quotationData.items || []).map((item: QuotationApiItem) => ({
      item_name: item.item_name || item.description || null,
      description: item.description || item.item_name || null,
      item_code: item.item_code || null,
      quantity: item.quantity ?? null,
      unit_price: item.unit_price ?? null,
      rate: item.rate ?? item.unit_price ?? null,
      tax_rate: item.tax_rate ?? null,
      discount_type: item.discount_type ?? null,
      discount_value: item.discount_value ?? null,
      amount: item.amount ?? null
    }))
  } : null;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useKeyboardShortcut('Alt+P', handlePrint, {
    id: 'print-quotation',
    label: t('shortcuts.printQuotation', 'Print Quotation'),
    enabled: !!quotation
  });

  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('has-bottom-nav');
    }
    return () => {
      document.body.classList.remove('has-bottom-nav');
    };
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="quotation-view-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="quotation-view-page">
        <div className="quotation-view-container">
          <p>{t('messages.noData', 'Quotation not found')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quotation-view-page">
      <div className="quotation-view-toolbar no-print">
        <div className="toolbar-left">
          <Button
            variant="secondary"
            onClick={() => navigate('/quotations')}
          >
            <ArrowLeft size={18} /> {t('actions.back', 'Back')}
          </Button>
          <h2 className="toolbar-title">{quotation.quotation_no}</h2>
        </div>
        <div className="toolbar-right">
          <Button variant="secondary" onClick={() => navigate(`/quotations/${id}/edit`)}>
            <Edit2 size={18} /> {t('actions.edit', 'Edit')}
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer size={18} /> {t('actions.print', 'Print')}
          </Button>
        </div>
      </div>

      <div className="quotation-view-container">
        <div className="quotation-preview-wrapper">
          <QuotationTemplateA4
            quotation={quotation}
            company={company}
          />
        </div>
      </div>

      {isMobile && (
        <div className="mobile-action-bar">
          <Button variant="primary" onClick={handlePrint} className="fab-button">
            <Printer size={18} /> {t('actions.print', 'Print')}
          </Button>
        </div>
      )}
    </div>
  );
}
