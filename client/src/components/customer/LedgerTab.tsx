/**
 * LedgerTab — AG-Grid for ledger entries with export toolbar and totals sidebar.
 * Export functions are extracted to utils/ledgerExport.ts.
 */

import { useMemo, memo, useRef, useCallback } from 'react';

import { AgGridReact } from 'ag-grid-react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Image,
  Printer,
} from 'lucide-react';

import { calculateLedgerTotals, formatDateString } from '../../utils/customerCalculations';
import type { LedgerTabProps, LedgerEntry, LedgerColDef } from '../../utils/customerTypes';
import { exportToCSV, exportToPDF, exportToImage, handlePrint } from '../../utils/ledgerExport';
import { registerAgGrid } from '../../utils/registerAgGrid';

registerAgGrid();

function LedgerTab({ ledger, loading, customerName, formatCurrency }: LedgerTabProps) {
  const ledgerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<AgGridReact<LedgerEntry>>(null);

  // Memoized totals
  const totals = useMemo(() => calculateLedgerTotals(ledger), [ledger]);

  // Memoized column definitions
  const columnDefs = useMemo<LedgerColDef[]>(
    () => [
      {
        headerName: 'Date',
        field: 'transaction_date',
        filter: true,
        width: 110,
        valueFormatter: (params) => formatDateString(params.value),
      },
      {
        headerName: 'Type',
        field: 'transaction_type',
        filter: true,
        width: 110,
        cellRenderer: (params) => (
          <span className={`transaction-type ${params.value?.toLowerCase()}`}>
            {params.value}
          </span>
        ),
      },
      {
        headerName: 'Reference',
        field: 'reference_no',
        filter: true,
        width: 130,
      },
      {
        headerName: 'Description',
        field: 'description',
        filter: true,
        flex: 1,
      },
      {
        headerName: 'Debit',
        field: 'debit',
        filter: 'agNumberColumnFilter',
        width: 110,
        valueFormatter: (params) => (params.value ? formatCurrency(params.value) : ''),
      },
      {
        headerName: 'Credit',
        field: 'credit',
        filter: 'agNumberColumnFilter',
        width: 110,
        valueFormatter: (params) => (params.value ? formatCurrency(params.value) : ''),
      },
      {
        headerName: 'Balance',
        field: 'balance',
        filter: 'agNumberColumnFilter',
        width: 120,
        valueFormatter: (params) => formatCurrency(params.value || 0),
      },
    ],
    [formatCurrency],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    [],
  );

  // Memoized export handlers
  const handleCSV = useCallback(() => {
    exportToCSV(ledger, customerName, formatCurrency);
  }, [ledger, customerName, formatCurrency]);

  const handlePDF = useCallback(() => {
    exportToPDF(ledger, customerName, formatCurrency);
  }, [ledger, customerName, formatCurrency]);

  const handleImage = useCallback(() => {
    exportToImage(ledgerRef.current);
  }, []);

  const handlePrintClick = useCallback(() => {
    handlePrint(ledger, customerName, formatCurrency);
  }, [ledger, customerName, formatCurrency]);

  return (
    <div className="ledger-tab">
      {/* Toolbar */}
      <div className="ledger-toolbar">
        <div className="ledger-title">
          <FileText size={18} />
          <span>Account Ledger</span>
        </div>
        <div className="ledger-actions">
          <button className="export-btn" onClick={handleCSV} title="Export to CSV">
            <FileSpreadsheet size={16} />
            <span>CSV</span>
          </button>
          <button className="export-btn" onClick={handlePDF} title="Export to PDF">
            <Download size={16} />
            <span>PDF</span>
          </button>
          <button className="export-btn" onClick={handleImage} title="Export to Image">
            <Image size={16} />
            <span>Image</span>
          </button>
          <button className="export-btn" onClick={handlePrintClick} title="Print">
            <Printer size={16} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <div ref={ledgerRef}>
          <div className="ledger-content">
            <div className="ag-theme-quartz ledger-grid" style={{ height: 350 }}>
              <AgGridReact<LedgerEntry>
                ref={gridRef}
                rowData={ledger}
                columnDefs={columnDefs as any}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 15, 25, 50]}
                rowSelection={{ mode: 'singleRow' }}
              />
            </div>

            {/* Totals Sidebar */}
            <div className="ledger-totals">
              <div className="totals-grid">
                <div className="total-item">
                  <span className="total-label">Total Debit</span>
                  <span className="total-value debit">{totals.debit.toFixed(2)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">Total Credit</span>
                  <span className="total-value credit">{totals.credit.toFixed(2)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">Current Balance</span>
                  <span className={`total-value balance ${totals.balance > 0 ? 'positive' : 'zero'}`}>
                    {totals.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(LedgerTab);
