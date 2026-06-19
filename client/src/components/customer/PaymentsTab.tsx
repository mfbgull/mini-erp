/**
 * PaymentsTab — AG-Grid for desktop payment display with edit/delete actions.
 */

import { useMemo, memo } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

import DropdownMenu from '../../components/common/DropdownMenu';
import { createActionColDef } from '../../utils/agGridIntegration';
import { formatAsCurrency, formatDateString } from '../../utils/customerCalculations';
import type { PaymentsTabProps, Payment, PaymentColDef } from '../../utils/customerTypes';
import { registerAgGrid } from '../../utils/registerAgGrid';

registerAgGrid();

function PaymentsTab({ payments, loading, onEditPayment, onDeletePayment }: PaymentsTabProps) {
  const columnDefs = useMemo<PaymentColDef[]>(
    () => [
      {
        headerName: 'Payment No',
        field: 'payment_no',
        filter: true,
        width: 120,
      },
      {
        headerName: 'Date',
        field: 'payment_date',
        filter: true,
        width: 110,
        valueFormatter: (params) => formatDateString(params.value),
      },
      {
        headerName: 'Amount',
        field: 'amount',
        filter: 'agNumberColumnFilter',
        width: 110,
        valueFormatter: (params) => formatAsCurrency(params.value),
      },
      {
        headerName: 'Method',
        field: 'payment_method',
        filter: true,
        width: 110,
      },
      {
        headerName: 'Reference',
        field: 'reference_no',
        filter: true,
        width: 120,
      },
      {
        headerName: 'Notes',
        field: 'notes',
        filter: true,
        flex: 1,
      },
      createActionColDef({
        colId: 'actions',
        cellRenderer: (params) => {
          if (!params.data) return null;
          const payment = params.data;
          return (
            <DropdownMenu
              trigger={
                <button className="action-menu-trigger" title="Actions">
                  <MoreVertical size={16} />
                </button>
              }
              items={[
                {
                  label: 'Edit',
                  icon: <Edit2 size={16} />,
                  onClick: () => onEditPayment(payment),
                },
                {
                  label: 'Delete',
                  icon: <Trash2 size={16} />,
                  onClick: () => onDeletePayment(payment),
                  destructive: true,
                },
              ]}
              align="end"
            />
          );
        },
      }) as PaymentColDef,
    ],
    [onEditPayment, onDeletePayment],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    [],
  );

  return (
    <div className="payments-tab">
      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="ag-theme-quartz" style={{ height: 400, width: '100%' }}>
          <AgGridReact<Payment>
            rowData={payments}
            columnDefs={columnDefs as any}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            rowSelection={{ mode: 'singleRow' }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(PaymentsTab);
