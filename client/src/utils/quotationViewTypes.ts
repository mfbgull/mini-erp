export interface QuotationItem {
  item_name?: string | null;
  description?: string | null;
  item_code?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  rate?: number | null;
  tax_rate?: number | null;
  discount_type?: string | null;
  discount_value?: number | null;
  amount?: number | null;
}

export interface QuotationApiItem {
  item_name?: string;
  description?: string;
  item_code?: string;
  quantity?: number;
  unit_price?: number;
  rate?: number;
  tax_rate?: number;
  discount_type?: string;
  discount_value?: number;
  amount?: number;
}

export interface QuotationApiResponse {
  quotation_no?: string;
  status?: string;
  quotation_date?: string;
  expiry_date?: string;
  customer_name?: string;
  customer_address?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  terms?: string | null;
  total_amount?: number;
  subtotal?: number | null;
  tax_amount?: number | null;
  items?: QuotationApiItem[];
}

export interface QuotationViewSettings {
  [key: string]: { value?: string; description?: string } | undefined;
  company_name?: { value?: string; description?: string };
  company_email?: { value?: string; description?: string };
  company_phone?: { value?: string; description?: string };
  company_address?: { value?: string; description?: string };
  company_tax_id?: { value?: string; description?: string };
}
