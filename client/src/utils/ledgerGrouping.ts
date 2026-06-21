import type { LedgerEntry } from '../types';

export interface InvoiceGroup {
  type: 'invoice_group';
  invoice: LedgerEntry;
  children: LedgerEntry[];
  totalPaid: number;
  balance: number;
}

export interface UngroupedEntry {
  type: 'ungrouped';
  entry: LedgerEntry;
}

export type LedgerGroupNode = InvoiceGroup | UngroupedEntry;

function extractInvoiceNo(entry: LedgerEntry): string | null {
  if (entry.transaction_type === 'RETURN') {
    return null;
  }
  if (entry.linked_invoice_no) {
    return entry.linked_invoice_no;
  }
  if (entry.transaction_type === 'INVOICE' || entry.transaction_type === 'CANCELLATION') {
    return entry.reference_no;
  }
  const match = entry.description?.match(/(?:for|against|on)\s+(INV-[\w-]+)/i);
  return match ? match[1] : null;
}

export function groupLedgerByInvoice(ledger: LedgerEntry[]): LedgerGroupNode[] {
  const invoiceEntries = ledger.filter(e => e.transaction_type === 'INVOICE');
  const invoiceMap = new Map<string, InvoiceGroup>();

  for (const inv of invoiceEntries) {
    invoiceMap.set(inv.reference_no, {
      type: 'invoice_group',
      invoice: inv,
      children: [],
      totalPaid: 0,
      balance: inv.debit,
    });
  }

  const ungrouped: UngroupedEntry[] = [];

  for (const entry of ledger) {
    if (entry.transaction_type === 'INVOICE') continue;

    const invoiceNo = extractInvoiceNo(entry);
    const group = invoiceNo ? invoiceMap.get(invoiceNo) : null;

    if (group) {
      group.children.push(entry);
      if (entry.transaction_type === 'PAYMENT') {
        group.totalPaid += entry.credit || 0;
      }
      group.balance = group.invoice.debit - group.totalPaid;
    } else {
      ungrouped.push({ type: 'ungrouped', entry });
    }
  }

  const result: LedgerGroupNode[] = [];

  for (const entry of ledger) {
    if (entry.transaction_type === 'INVOICE') {
      const group = invoiceMap.get(entry.reference_no);
      if (group) result.push(group);
    } else {
      const ug = ungrouped.find(u => u.entry.id === entry.id);
      if (ug) result.push(ug);
    }
  }

  return result;
}
