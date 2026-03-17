import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

import SearchableSelect from '../../components/common/SearchableSelect';
import api from '../../utils/api';
import './ForecastTrends.css';

export default function ForecastTrends() {
  const [selectedItem, setSelectedItem] = useState('');
  
  const { data: items = [] } = useQuery({
    queryKey: ['items-all'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });
  
  const finishedGoods = items.filter(i => i.is_finished_good === 1 || i.is_finished_good === true);
  
  const { data: trendData, isLoading } = useQuery({
    queryKey: ['forecasts', 'trends', selectedItem],
    queryFn: async () => {
      const params = selectedItem ? `?itemId=${selectedItem}` : '';
      const response = await api.get(`/forecasts/trends${params}`);
      return response.data.data;
    }
  });
  
  const { historicalTrends = [], itemBreakdown = [] } = trendData || {};
  
  return (
    <div className="forecast-trends-page">
      <div className="page-header">
        <h1>Forecast Trends</h1>
        
        <div className="item-filter">
          <SearchableSelect
            value={selectedItem}
            onChange={setSelectedItem}
            options={finishedGoods.map(i => ({ value: i.id, label: i.item_name }))}
            placeholder="Select Item (or all)"
          />
        </div>
      </div>
      
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Sales vs Predicted</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  name="Actual Sales"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#10b981" 
                  name="Predicted"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Top Items by Volume</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={itemBreakdown.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="itemName" 
                  fontSize={11} 
                  width={120}
                  tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                />
                <Tooltip />
                <Bar dataKey="totalSold" fill="#3b82f6" name="Total Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="breakdown-table">
        <h3>Item Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Total Sold (12mo)</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {itemBreakdown.map((item, idx) => (
              <tr key={idx}>
                <td>{item.itemName}</td>
                <td>{item.totalSold.toLocaleString()}</td>
                <td>
                  <span className={`trend-badge ${item.trend}`}>
                    {item.trend === 'growing' && <><TrendingUp size={14} /> Growing</>}
                    {item.trend === 'declining' && <><TrendingDown size={14} /> Declining</>}
                    {item.trend === 'stable' && <><Minus size={14} /> Stable</>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
