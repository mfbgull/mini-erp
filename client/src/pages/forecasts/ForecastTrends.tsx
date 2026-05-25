import { useState, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import SearchableSelect from '../../components/common/SearchableSelect';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import './ForecastTrends.css';

interface TrendMonth {
  month: string;
  actual: number | null;
  predicted: number | null;
  movingAvg?: number | null;
}

interface BreakdownItem {
  itemName: string;
  totalSold: number;
  trend: 'growing' | 'stable' | 'declining';
}

interface TrendDataResponse {
  historicalTrends: TrendMonth[];
  itemBreakdown: BreakdownItem[];
}

interface InventoryItem {
  id: number;
  item_name: string;
  is_finished_good: number | boolean;
  [key: string]: unknown;
}

function SkeletonCard() {
  return (
    <div className="chart-card skeleton-pulse">
      <div className="skeleton-line medium" style={{ marginBottom: 16 }} />
      <div className="skeleton-chart" />
    </div>
  );
}

export default function ForecastTrends() {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState('');

  const { data: items = [] } = useQuery<InventoryItem[]>({
    queryKey: ['items-all'],
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });

  const finishedGoods = useMemo(() =>
    items.filter(i => i.is_finished_good === 1 || i.is_finished_good === true),
    [items]
  );

  const { data: trendData, isLoading, error, refetch } = useQuery<TrendDataResponse>({
    queryKey: ['forecasts', 'trends', selectedItem],
    queryFn: async () => {
      const params = selectedItem ? `?itemId=${selectedItem}` : '';
      const response = await api.get(`/forecasts/trends${params}`);
      return response.data.data;
    }
  });

  const historicalTrends: TrendMonth[] = trendData?.historicalTrends || [];
  const itemBreakdown: BreakdownItem[] = trendData?.itemBreakdown || [];

  // Colors for the trend lines
  const actualColor = '#3b82f6';
  const movingAvgColor = '#8b5cf6';
  const forecastColor = '#10b981';

  if (error) {
    return (
      <div className="forecast-trends-page">
        <div className="page-header">
          <h1>{t('forecasts.forecastTrends')}</h1>
        </div>
        <div className="error-state">
          <AlertTriangle size={32} />
          <p>{t('forecasts.loadError')}</p>
          <button className="btn-refresh" onClick={() => refetch()}>
            <RefreshCw size={16} /> {t('forecasts.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forecast-trends-page">
      <div className="page-header">
        <h1>{t('forecasts.forecastTrends')}</h1>
        <div className="item-filter">
          <SearchableSelect
            name="itemId"
            value={selectedItem}
            onChange={(e) => setSelectedItem(String(e.target.value))}
            options={finishedGoods.map((i: InventoryItem) => ({ value: String(i.id), label: i.item_name }))}
            placeholder={t('forecasts.selectItem')}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="charts-grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : historicalTrends.length === 0 ? (
        <div className="empty-state">
          <p>{t('forecasts.noTrendData')}</p>
        </div>
      ) : (
        <>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>{t('forecasts.monthlyTrend')}</h3>
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
                      stroke={actualColor}
                      name={t('forecasts.actualSales')}
                      strokeWidth={2}
                      dot={{ fill: actualColor, r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="movingAvg"
                      stroke={movingAvgColor}
                      name={t('forecasts.trendLine')}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke={forecastColor}
                      name={t('forecasts.forecast')}
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={{ fill: forecastColor, r: 6, stroke: forecastColor }}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3>{t('forecasts.topItemsByVolume')}</h3>
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
                      tickFormatter={(val: string) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                    />
                    <Tooltip />
                    <Bar dataKey="totalSold" fill="#3b82f6" name={t('forecasts.totalSold')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="breakdown-table">
            <h3>{t('forecasts.itemBreakdown')}</h3>
            <table>
              <thead>
                <tr>
                  <th>{t('common.item')}</th>
                  <th>{t('forecasts.totalSold12mo')}</th>
                  <th>{t('forecasts.trendLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {itemBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-cell">{t('forecasts.noTrendData')}</td>
                  </tr>
                ) : (
                  itemBreakdown.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.itemName}</td>
                      <td>{item.totalSold.toLocaleString()}</td>
                      <td>
                        <span className={`trend-badge ${item.trend}`}>
                          {item.trend === 'growing' && <><TrendingUp size={14} /> {t('forecasts.growing')}</>}
                          {item.trend === 'declining' && <><TrendingDown size={14} /> {t('forecasts.declining')}</>}
                          {item.trend === 'stable' && <><Minus size={14} /> {t('forecasts.stable')}</>}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
