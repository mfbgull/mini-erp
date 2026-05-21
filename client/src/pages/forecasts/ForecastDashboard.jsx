import { Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Package, AlertTriangle, CheckCircle,
  ArrowRight, RefreshCw, BarChart3
} from 'lucide-react';

import StatCard, { StatsGrid } from '../../components/common/StatCard';
import api from '../../utils/api';
import './ForecastDashboard.css';

function AlertCard({ alert }) {
  const levelColors = {
    critical: 'alert-critical',
    warning: 'alert-warning',
    monitor: 'alert-monitor',
    adequate: 'alert-adequate'
  };
  
  return (
    <div className={`forecast-alert-card ${levelColors[alert.alertLevel]}`}>
      <div className="alert-info">
        <span className="alert-item-name">{alert.itemName}</span>
        <span className="alert-stock">
          Stock: {alert.currentStock} | Predicted: {alert.predictedDemand}
        </span>
      </div>
      <span className={`alert-badge ${alert.alertLevel}`}>
        {alert.alertLevel === 'critical' ? '🔴 Critical' : 
         alert.alertLevel === 'warning' ? '🟡 Warning' : '🟢 OK'}
      </span>
    </div>
  );
}

export default function ForecastDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['forecasts', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/forecasts/dashboard');
      return response.data.data;
    }
  });
  
  if (isLoading) {
    return <div className="forecast-loading">Loading forecast data...</div>;
  }
  
  const { summary, alerts, topGrowing, topDeclining } = data || {
    summary: { totalItems: 0, itemsNeedingRestock: 0, avgConfidence: 0, criticalAlerts: 0 },
    alerts: [],
    topGrowing: [],
    topDeclining: []
  };
  
  return (
    <div className="forecast-dashboard">
      <div className="forecast-header">
        <h1>Demand Forecast</h1>
        <button 
          className="btn-refresh" 
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={16} className={isFetching ? 'spinning' : ''} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <StatsGrid>
        <StatCard icon={Package} label="Tracked Items" value={summary.totalItems} />
        <StatCard icon={AlertTriangle} label="Need Restock" value={summary.itemsNeedingRestock} alert={summary.itemsNeedingRestock > 0} />
        <StatCard icon={BarChart3} label="Avg Confidence" value={`${summary.avgConfidence}%`} />
        <StatCard icon={CheckCircle} label="Critical Alerts" value={summary.criticalAlerts} alert={summary.criticalAlerts > 0} />
      </StatsGrid>
      
      <div className="forecast-section">
        <div className="section-header">
          <h2>⚠️ Alerts</h2>
          <Link to="/forecasts/demand" className="view-all">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        
        {alerts.length === 0 ? (
          <div className="empty-state">No alerts - all items adequately stocked</div>
        ) : (
          <div className="forecast-alerts-list">
            {alerts.slice(0, 10).map(alert => (
              <AlertCard key={alert.itemId} alert={alert} />
            ))}
          </div>
        )}
      </div>
      
      <div className="forecast-section">
        <div className="section-header">
          <h2>📈 Top Growing Items</h2>
          <Link to="/forecasts/trends" className="view-all">
            View Trends <ArrowRight size={16} />
          </Link>
        </div>
        
        {topGrowing.length === 0 ? (
          <div className="empty-state">No trending data available</div>
        ) : (
          <div className="trend-list">
            {topGrowing.map(item => (
              <div key={item.itemId} className="trend-item growing">
                <span className="trend-name">{item.itemName}</span>
                <span className="trend-badge growing">↑ {item.trendPercentage}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
