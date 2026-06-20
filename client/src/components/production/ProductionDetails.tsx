import { format } from 'date-fns';
import { useSettings } from '../../context/SettingsContext';
import type { ProductionRecord } from '../../types';

interface Props {
  production: ProductionRecord;
}

export default function ProductionDetails({ production }: Props) {
  const { formatCurrency } = useSettings();

  return (
    <div className="production-details">
      {/* Header Info */}
      <div className="detail-section">
        <h3>Production Summary</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">Production #</span>
            <span className="value">{production.production_no}</span>
          </div>
          <div className="detail-item">
            <span className="label">Date</span>
            <span className="value">{format(new Date(production.production_date), 'dd MMM yyyy')}</span>
          </div>
          <div className="detail-item">
            <span className="label">Output Item</span>
            <span className="value">{production.output_item_name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Quantity Produced</span>
            <span className="value production-output">
              {parseFloat(String(production.output_quantity)).toFixed(2)} {production.output_uom}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Warehouse</span>
            <span className="value">{production.finished_goods_warehouse_name}</span>
          </div>
          {(production.overhead_cost || 0) > 0 && (
            <div className="detail-item">
              <span className="label">Overhead Cost</span>
              <span className="value">{formatCurrency(production.overhead_cost || 0)}</span>
            </div>
          )}
          {production.remarks && (
            <div className="detail-item full-width">
              <span className="label">Remarks</span>
              <span className="value">{production.remarks}</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Materials Table */}
      <div className="detail-section">
        <h3>Raw Materials Consumed</h3>
        {production.inputs && production.inputs.length > 0 ? (
          <table className="details-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {production.inputs.map((input, index) => (
                <tr key={index}>
                  <td>{input.item_name}</td>
                  <td>{parseFloat(String(input.quantity)).toFixed(3)} {input.unit_of_measure}</td>
                  <td>{formatCurrency(input.unit_cost || 0)}</td>
                  <td>{formatCurrency((input.unit_cost || 0) * input.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={3}><strong>Total Material Cost</strong></td>
                <td><strong>{formatCurrency(production.total_material_cost || 0)}</strong></td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="no-materials">No input materials recorded for this production.</p>
        )}
      </div>

      {/* Cost Summary */}
      {((production.total_material_cost || 0) > 0 || (production.overhead_cost || 0) > 0) && (
        <div className="detail-section">
          <h3>Cost Summary</h3>
          <div className="cost-summary">
            <div className="cost-row">
              <span>Material Cost</span>
              <span>{formatCurrency(production.total_material_cost || 0)}</span>
            </div>
            {(production.overhead_cost || 0) > 0 && (
              <div className="cost-row">
                <span>Overhead Cost</span>
                <span>{formatCurrency(production.overhead_cost || 0)}</span>
              </div>
            )}
            <div className="cost-row total-row">
              <span><strong>Total Production Cost</strong></span>
              <span><strong>{formatCurrency((production.total_material_cost || 0) + (production.overhead_cost || 0))}</strong></span>
            </div>
            {production.output_quantity > 0 && (
              <div className="cost-row per-unit-row">
                <span>Cost per Unit</span>
                <span>{formatCurrency(((production.total_material_cost || 0) + (production.overhead_cost || 0)) / production.output_quantity)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
