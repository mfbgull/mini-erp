import { format } from 'date-fns';
import { MoreVertical, Trash2 } from 'lucide-react';
import DropdownMenu from '../common/DropdownMenu';
import { createActionColDef } from '../../utils/agGridIntegration';
import type { ProductionStub } from '../../utils/productionTypes';

export function getProductionColumnDefs(
  onDelete: (production: ProductionStub) => void,
) {
  return [
    {
      headerName: 'Production #',
      field: 'production_no',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Date',
      field: 'production_date',
      sortable: true,
      filter: 'agDateColumnFilter',
      flex: 1,
      valueFormatter: (params: { value: string }) =>
        format(new Date(params.value), 'dd MMM yyyy'),
    },
    {
      headerName: 'Output Item',
      field: 'output_item_name',
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      headerName: 'Quantity Produced',
      field: 'output_quantity',
      sortable: true,
      filter: 'agNumberColumnFilter',
      flex: 1.5,
      cellRenderer: (params: { value: string; data: { output_uom: string } }) => (
        <span className="production-output">
          {parseFloat(params.value).toFixed(2)} {params.data.output_uom}
        </span>
      ),
    },
    {
      headerName: 'Warehouse',
      field: 'finished_goods_warehouse_name',
      filter: true,
      flex: 1.5,
    },
    {
      headerName: 'Remarks',
      field: 'remarks',
      filter: true,
      flex: 1.5,
      valueFormatter: (params: { value: string | null }) => params.value || '—',
    },
    createActionColDef({
      cellRenderer: (params: { data: ProductionStub }) => (
        <DropdownMenu
          trigger={
            <button className="action-menu-trigger" title="Actions">
              <MoreVertical size={16} />
            </button>
          }
          items={[
            {
              label: 'Delete',
              icon: <Trash2 size={16} />,
              onClick: () => onDelete(params.data),
              destructive: true,
            },
          ]}
          align="end"
        />
      ),
    }),
  ];
}
