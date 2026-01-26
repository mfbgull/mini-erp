import React from 'react';
import { useInvoiceNavigation } from '../../hooks/useInvoiceNavigation';
import Button from '../common/Button';

/**
 * Example component showing how to use the new invoice navigation system
 * This demonstrates various ways to navigate to invoices with different intents
 */
export default function InvoiceNavigationExamples() {
  const { 
    viewInvoice, 
    editInvoice, 
    printInvoice, 
    downloadInvoice, 
    emailInvoice 
  } = useInvoiceNavigation();

  const invoiceId = "19"; // Example invoice ID

  return (
    <div className="invoice-navigation-examples">
      <h3>Invoice Navigation Examples</h3>
      
      <div className="example-section">
        <h4>Basic Navigation</h4>
        <Button onClick={() => viewInvoice(invoiceId)}>
          View Invoice (Default)
        </Button>
        <Button onClick={() => editInvoice(invoiceId)}>
          Edit Invoice
        </Button>
      </div>

      <div className="example-section">
        <h4>Action-Based Navigation</h4>
        <Button onClick={() => printInvoice(invoiceId)}>
          Print Invoice (Auto-opens print dialog)
        </Button>
        <Button onClick={() => downloadInvoice(invoiceId)}>
          Download PDF (Auto-downloads)
        </Button>
        <Button onClick={() => emailInvoice(invoiceId)}>
          Email Invoice (Auto-opens email)
        </Button>
      </div>

      <div className="example-section">
        <h4>Context-Aware Navigation</h4>
        <Button onClick={() => viewInvoice(invoiceId, '/customers/123')}>
          View from Customer Page
        </Button>
        <Button onClick={() => editInvoice(invoiceId, '/sales')}>
          Edit from Sales List
        </Button>
      </div>

      <div className="url-examples">
        <h4>URL Examples Generated</h4>
        <ul>
          <li><code>/sales/invoice/19</code> - Smart routing based on invoice status</li>
          <li><code>/sales/invoice/19?mode=view</code> - Force view mode</li>
          <li><code>/sales/invoice/19?mode=edit</code> - Force edit mode</li>
          <li><code>/sales/invoice/19?action=print</code> - Auto-print on load</li>
          <li><code>/sales/invoice/19?mode=view&action=download&returnTo=/customers/123</code> - Complex routing</li>
        </ul>
      </div>
    </div>
  );
}