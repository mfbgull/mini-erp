/**
 * Notification Service (Twilio Integration)
 * Handles SMS notifications for alerts and notifications
 */

import twilio from 'twilio';
import db from '../../config/database';

interface NotificationOptions {
  to: string;
  message: string;
}

class NotificationService {
  private accountSid: string | null = null;
  private authToken: string | null = null;
  private phoneNumber: string | null = null;
  private enabled: boolean = false;
  private client: any = null;

  constructor() {
    this.loadSettings();
  }

  /**
   * Load Twilio settings from database
   */
  private loadSettings(): void {
    try {
      const settings = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'twilio_%'").all() as any[];

      settings.forEach((setting: any) => {
        switch (setting.key) {
          case 'twilio_enabled':
            this.enabled = setting.value === 'true';
            break;
          case 'twilio_account_sid':
            this.accountSid = setting.value;
            break;
          case 'twilio_auth_token':
            this.authToken = setting.value;
            break;
          case 'twilio_phone_number':
            this.phoneNumber = setting.value;
            break;
        }
      });

      if (this.enabled && this.accountSid && this.authToken) {
        this.client = twilio(this.accountSid, this.authToken);
      }
    } catch (error) {
      console.error('[NotificationService] Failed to load settings:', error);
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
    return this.enabled && !!this.accountSid && !!this.authToken && !!this.phoneNumber;
  }

  /**
   * Send SMS notification
   */
  async sendSMS(options: NotificationOptions): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Notification service not configured or disabled'
      };
    }

    try {
      const message = await this.client.messages.create({
        body: options.message,
        from: this.phoneNumber,
        to: options.to
      });

      console.log(`[NotificationService] SMS sent to: ${options.to}, SID: ${message.sid}`);
      return { success: true, message: 'SMS sent successfully' };
    } catch (error: any) {
      console.error('[NotificationService] Failed to send SMS:', error);
      return {
        success: false,
        message: error.message || 'Failed to send SMS'
      };
    }
  }

  /**
   * Send low stock alert via SMS
   */
  async sendLowStockAlert(
    phoneNumber: string,
    itemName: string,
    currentStock: number,
    reorderLevel: number
  ): Promise<{ success: boolean; message: string }> {
    const message = `⚠️ LOW STOCK ALERT\nItem: ${itemName}\nCurrent: ${currentStock}\nReorder at: ${reorderLevel}\nPlease reorder soon.`;

    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send payment received notification via SMS
   */
  async sendPaymentNotification(
    phoneNumber: string,
    customerName: string,
    amount: number,
    invoiceNo: string
  ): Promise<{ success: boolean; message: string }> {
    const message = `💰 PAYMENT RECEIVED\nCustomer: ${customerName}\nAmount: $${amount.toFixed(2)}\nInvoice: ${invoiceNo}\nThank you for payment!`;

    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send new order notification via SMS
   */
  async sendNewOrderAlert(
    phoneNumber: string,
    orderType: 'Sales' | 'Purchase',
    orderNo: string,
    customerOrSupplier: string
  ): Promise<{ success: boolean; message: string }> {
    const message = `📦 NEW ${orderType.toUpperCase()} ORDER\nOrder No: ${orderNo}\n${orderType === 'Sales' ? 'Customer' : 'Supplier'}: ${customerOrSupplier}\nAction required.`;

    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send delivery delay notification via SMS
   */
  async sendDeliveryDelayAlert(
    phoneNumber: string,
    orderNo: string,
    customerName: string,
    newDate: string
  ): Promise<{ success: boolean; message: string }> {
    const message = `🚚 DELIVERY DELAY\nOrder: ${orderNo}\nCustomer: ${customerName}\nNew Delivery Date: ${newDate}\nPlease inform customer.`;

    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }
}

// Export singleton instance
const notificationService = new NotificationService();

export default notificationService;
export const sendSMS = (...args: Parameters<typeof notificationService.sendSMS>) => notificationService.sendSMS(...args);
export const sendLowStockAlertSMS = (...args: Parameters<typeof notificationService.sendLowStockAlert>) => notificationService.sendLowStockAlert(...args);
export const sendPaymentNotificationSMS = (...args: Parameters<typeof notificationService.sendPaymentNotification>) => notificationService.sendPaymentNotification(...args);
export const sendNewOrderAlertSMS = (...args: Parameters<typeof notificationService.sendNewOrderAlert>) => notificationService.sendNewOrderAlert(...args);
export const sendDeliveryDelayAlertSMS = (...args: Parameters<typeof notificationService.sendDeliveryDelayAlert>) => notificationService.sendDeliveryDelayAlert(...args);
