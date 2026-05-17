import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { 
  TrendingUp, TrendingDown, Minus, Package, 
  Filter, Download, ShoppingCart 
} from 'lucide-react';

import SearchableSelect from '../../components/common/SearchableSelect';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';
import './DemandForecast.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function DemandForecast() {
  const { formatCurrency } = useSettings();
  const [filters, setFilters] = useState({
    category: '',
    trend: '',
    recommendation: ''
  });
  
  const { data: items = [] } = useQuery({
    queryKey: ['items-all'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });
  
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  
  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ['forecasts', 'demand', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.trend) params.append('trend', filters.trend);
      if (filters.recommendation) params.append('recommendation', filters.recommendation);
      
      const response = await api.get(`/forecasts/demand?${params}`);
      return response.data.data || [];
    }
  });
  
  const TrendCellRenderer = (props) => {
    const { trend, trendPercentage } = props.data;
    if (trend === 'growing') {
      return <span className="trend-cell growing"><TrendingUp size={14} /> ↑ {trendPercentage}%</span>;
    }
    if (trend === 'declining') {
      return <span className="trend-cell declining"><TrendingDown size={14} /> ↓ {trendPercentage}%</span>;
    }
    return <span className="trend-cell stable"><Minus size={14} /> → 0%</span>;
  };
  
  const ConfidenceCellRenderer = (props) => {
    const confidence = props.data.confidence;
    const color = confidence >= 80 ? '#22c55e' : confidence >= 60 ? '#eab308' : '#ef4444';
    return (
      <div className="confidence-cell">
        <div className="confidence-bar">
          <div className="confidence-fill" style={{ width: `${confidence}%`, background: color }} />
        </div>
        <span>{confidence}%</span>
      </div>
    );
  };
  
  const RecommendationCellRenderer = (props) => {
    const { recommendation } = props.data;
    const labels = {
      order_now: { text: '🔴 Order Now', class: 'rec-critical' },
      order_soon: { text: '🟡 Order Soon', class: 'rec-warning' },
      monitor: { text: '🟢 Monitor', class: 'rec-monitor' },
      adequate: { text: '✅ Adequate', class: 'rec-adequate' }
    };
    const label = labels[recommendation] || labels.monitor;
    return <span className={`recommendation-badge ${label.class}`}>{label.text}</span>;
  };
  
  const columns = [
    { field: 'itemCode', headerName: 'Code', width: 100 },
    { field: 'itemName', headerName: 'Item Name', flex: 1, minWidth: 150 },
    { field: 'category', headerName: 'Category', width: 130 },
    { 
      field: 'currentStock', 
      headerName: 'Stock', 
      width: 90,
      cellStyle: (params) => {
        const predicted = params.data?.predictedDemand?.nextMonth || 0;
        if (params.value < predicted * 0.5) return { color: '#dc2626', fontWeight: '600' };
        if (params.value < predicted) return { color: '#d97706' };
        return {};
      }
    },
    { 
      field: 'predictedDemand.nextWeek', 
      headerName: 'Predicted (Week)', 
      width: 130 
    },
    { 
      field: 'predictedDemand.nextMonth', 
      headerName: 'Predicted (Month)', 
      width: 140 
    },
    { 
      field: 'predictedDemand.nextQuarter', 
      headerName: 'Predicted (Quarter)', 
      width: 140 
    },
    { 
      field: 'trend', 
      headerName: 'Trend', 
      width: 120,
      cellRenderer: TrendCellRenderer 
    },
    { 
      field: 'confidence', 
      headerName: 'Confidence', 
      width: 120,
      cellRenderer: ConfidenceCellRenderer 
    },
    { 
      field: 'recommendation', 
      headerName: 'Recommendation', 
      width: 140,
      cellRenderer: RecommendationCellRenderer 
    }
  ];
  
  return (
    <div className="demand-forecast-page">
      <div className="page-header">
        <h1>Demand Forecast</h1>
      </div>
      
      <div className="filters-bar">
        <div className="filter-group">
          <label>Category</label>
          <SearchableSelect
            value={filters.category}
            onChange={(val) => setFilters(f => ({ ...f, category: val }))}
            options={categories.map(c => ({ value: c, label: c }))}
            placeholder="All Categories"
          />
        </div>
        
        <div className="filter-group">
          <label>Trend</label>
          <SearchableSelect
            value={filters.trend}
            onChange={(val) => setFilters(f => ({ ...f, trend: val }))}
            options={[
              { value: 'growing', label: '📈 Growing' },
              { value: 'stable', label: '➡️ Stable' },
              { value: 'declining', label: '📉 Declining' }
            ]}
            placeholder="All Trends"
          />
        </div>
        
        <div className="filter-group">
          <label>Status</label>
          <SearchableSelect
            value={filters.recommendation}
            onChange={(val) => setFilters(f => ({ ...f, recommendation: val }))}
            options={[
              { value: 'order_now', label: '🔴 Order Now' },
              { value: 'order_soon', label: '🟡 Order Soon' },
              { value: 'monitor', label: '🟢 Monitor' },
              { value: 'adequate', label: '✅ Adequate' }
            ]}
            placeholder="All Status"
          />
        </div>
      </div>
      
      <div className="forecast-grid ag-theme-quartz">
        <AgGridReact
          rowData={forecasts}
          columnDefs={columns}
            defaultColDef={{
              theme:"legacy",
              resizable: true,
              sortable: true,
              filter: true
            }}
          pagination={true}
          paginationPageSize={20}
          rowSelection="single"
        />
      </div>
    </div>
  );
}
