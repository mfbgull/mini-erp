/**
 * Email Service (SendGrid Integration)
 * Handles sending emails for invoices, purchase orders, and notifications
 */

import sgMail from '@sendgrid/mail';
import db from '../../config/database';

interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded string
  type: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

class EmailService {
  private apiKey: string | null = null;
  private fromEmail: string | null = null;
  private fromName: string | null = null;
  private enabled: boolean = false;

  constructor() {
    this.loadSettings();
  }

  /**
   * Load SendGrid settings from database
   */
  private loadSettings(): void {
    try {
      const settings = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'sendgrid_%'").all() as any[];

      settings.forEach((setting: any) => {
        switch (setting.key) {
          case 'sendgrid_enabled':
            this.enabled = setting.value === 'true';
            break;
          case 'sendgrid_api_key':
            this.apiKey = setting.value;
            break;
          case 'sendgrid_from_email':
            this.fromEmail = setting.value;
            break;
          case 'sendgrid_from_name':
            this.fromName = setting.value;
            break;
        }
      });

      if (this.enabled && this.apiKey) {
        sgMail.setApiKey(this.apiKey);
      }
    } catch (error) {
      console.error('[EmailService] Failed to load settings:', error);
    }
  }

  /**
   * Reload settings (call after updating settings)
   */
  reloadSettings(): void {
    this.loadSettings();
  }

  /**
   * Check if service is enabled and configured
   */
  isConfigured(): boolean {
    return this.enabled && !!this.apiKey && !!this.fromEmail;
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Email service not configured or disabled'
      };
    }

    try {
      const message = {
        to: options.to,
        from: {
          email: this.fromEmail!,
          name: this.fromName || 'Mini ERP'
        },
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          type: att.type,
          disposition: 'attachment'
        }))
      };

      await sgMail.send(message);

      console.log(`[EmailService] Email sent to: ${options.to}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error);
      return {
        success: false,
        message: error.response?.body?.errors?.[0]?.message || error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoice(
    customerEmail: string,
    customerName: string,
    invoiceNo: string,
    pdfBuffer: Buffer,
    totalAmount: number
  ): Promise<{ success: boolean; message: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice ${invoiceNo}</h2>
        <p>Dear ${customerName},</p>
        <p>Please find attached your invoice ${invoiceNo} for the amount of <strong>$${totalAmount.toFixed(2)}</strong>.</p>
        <p>Thank you for your business!</p>
        <p style="color: #666; font-size: 12px;">This is an automated message from Mini ERP.</p>
      </div>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Invoice ${invoiceNo} from Mini ERP`,
      html,
      attachments: [{
        filename: `Invoice-${invoiceNo}.pdf`,
        content: pdfBuffer.toString('base64'),
        type: 'application/pdf'
      }]
    });
  }

  /**
   * Send purchase order email to supplier
   */
  async sendPurchaseOrder(
    supplierEmail: string,
    supplierName: string,
    purchaseOrderNo: string,
    pdfBuffer: Buffer
  ): Promise<{ success: boolean; message: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Purchase Order ${purchaseOrderNo}</h2>
        <p>Dear ${supplierName},</p>
        <p>Please find attached purchase order ${purchaseOrderNo}.</p>
        <p>Please confirm receipt and process the order at your earliest convenience.</p>
        <p>Thank you!</p>
        <p style="color: #666; font-size: 12px;">This is an automated message from Mini ERP.</p>
      </div>
    `;

    return this.sendEmail({
      to: supplierEmail,
      subject: `Purchase Order ${purchaseOrderNo}`,
      html,
      attachments: [{
        filename: `PO-${purchaseOrderNo}.pdf`,
        content: pdfBuffer.toString('base64'),
        type: 'application/pdf'
      }]
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    customerEmail: string,
    customerName: string,
    paymentNo: string,
    amount: number,
    invoiceNo: string
  ): Promise<{ success: boolean; message: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation</h2>
        <p>Dear ${customerName},</p>
        <p>We have received your payment of <strong>$${amount.toFixed(2)}</strong> for invoice ${invoiceNo}.</p>
        <p>Payment Reference: ${paymentNo}</p>
        <p>Thank you for your prompt payment!</p>
        <p style="color: #666; font-size: 12px;">This is an automated message from Mini ERP.</p>
      </div>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Payment Confirmation - ${paymentNo}`,
      html
    });
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(
    recipients: string[],
    itemName: string,
    currentStock: number,
    reorderLevel: number
  ): Promise<{ success: boolean; message: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">⚠️ Low Stock Alert</h2>
        <p>Item <strong>${itemName}</strong> is running low on stock.</p>
        <ul>
          <li>Current Stock: ${currentStock}</li>
          <li>Reorder Level: ${reorderLevel}</li>
        </ul>
        <p>Please reorder this item soon to avoid stockouts.</p>
        <p style="color: #666; font-size: 12px;">This is an automated message from Mini ERP.</p>
      </div>
    `;

    return this.sendEmail({
      to: recipients,
      subject: `Low Stock Alert - ${itemName}`,
      html
    });
  }
}

// Export singleton instance
const emailService = new EmailService();

export default emailService;
export const sendEmail = (...args: Parameters<typeof emailService.sendEmail>) => emailService.sendEmail(...args);
export const sendInvoice = (...args: Parameters<typeof emailService.sendInvoice>) => emailService.sendInvoice(...args);
export const sendPurchaseOrder = (...args: Parameters<typeof emailService.sendPurchaseOrder>) => emailService.sendPurchaseOrder(...args);
export const sendPaymentConfirmation = (...args: Parameters<typeof emailService.sendPaymentConfirmation>) => emailService.sendPaymentConfirmation(...args);
export const sendLowStockAlert = (...args: Parameters<typeof emailService.sendLowStockAlert>) => emailService.sendLowStockAlert(...args);
