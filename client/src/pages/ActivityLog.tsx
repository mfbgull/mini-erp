import { useState } from 'react';
import { useActivityLogs, useEntityTypes, useActions, useUsers, useActivityStats } from '../context/ActivityLogContext';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import { format } from 'date-fns';
import './ActivityLog.css';

export default function ActivityLog() {
  const [filters, setFilters] = useState({
    user_id: '',
    entity_type: '',
    action: '',
    log_level: '',
    start_date: '',
    end_date: '',
    search: '',
    limit: '50',
    offset: '0'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data: logsData, isLoading, refetch } = useActivityLogs({
    ...filters,
    user_id: filters.user_id ? parseInt(filters.user_id) : undefined,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize
  });

  const { data: entityTypes } = useEntityTypes();
  const { data: actions } = useActions();
  const { data: users } = useUsers();
  const { data: stats } = useActivityStats(filters.start_date, filters.end_date);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: '0' }));
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    window.open(`/api/activity-logs/export?${params.toString()}`, '_blank');
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      sortable: true,
      render: (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss')
    },
    {
      key: 'username',
      label: 'User',
      sortable: true,
      render: (value: string | null, row: any) => value || 'System'
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true
    },
    {
      key: 'entity_type',
      label: 'Entity',
      sortable: true
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false
    },
    {
      key: 'log_level',
      label: 'Level',
      sortable: true,
      render: (value: string) => {
        const levelClass = value?.toLowerCase() || 'info';
        return <span className={`log-level ${levelClass}`}>{value}</span>;
      }
    }
  ];

  const totalPages = logsData ? Math.ceil(logsData.total / pageSize) : 0;

  return (
    <div className="activity-log-page">
      <div className="page-header">
        <h1>Activity Log</h1>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button variant="primary" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <h3>Total Logs</h3>
            <p className="stat-value">{stats.totalLogs}</p>
          </div>
          <div className="stat-card">
            <h3>Top Action</h3>
            <p className="stat-value">{stats.actions[0]?.action || '-'}</p>
            <p className="stat-sub">{stats.actions[0]?.count || 0} occurrences</p>
          </div>
          <div className="stat-card">
            <h3>Most Active User</h3>
            <p className="stat-value">{stats.users[0]?.username || '-'}</p>
            <p className="stat-sub">{stats.users[0]?.count || 0} actions</p>
          </div>
          <div className="stat-card">
            <h3>Actions Today</h3>
            <p className="stat-value">
              {stats.dailyActivity[0]?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSearch} className="filters-form">
        <div className="filters-row">
          <div className="filter-group">
            <label>User</label>
            <select
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
            >
              <option value="">All Users</option>
              {users?.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.full_name})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Entity Type</label>
            <select
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            >
              <option value="">All Entities</option>
              {entityTypes?.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">All Actions</option>
              {actions?.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Log Level</label>
            <select
              value={filters.log_level}
              onChange={(e) => handleFilterChange('log_level', e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>

          <div className="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search descriptions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <Button type="submit" variant="primary">
              Apply Filters
            </Button>
          </div>
        </div>
      </form>

      {/* Data Table */}
      <div className="table-container">
        <DataTable
          columns={columns}
          data={logsData?.data || []}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="page-info">
            Page {currentPage} of {totalPages} ({logsData?.total || 0} total)
          </span>
          <Button
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          Loading activity logs...
        </div>
      )}
    </div>
  );
}
