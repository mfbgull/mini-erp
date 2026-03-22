import { useState } from 'react';
import { MoreVertical, Edit, Trash2, UserCheck, UserX, Shield } from 'lucide-react';

import Card from './Card';
import './CompactUserCard.css';

function CompactUserCard({ user, onEdit, onDelete, onToggleStatus, onResetPassword }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleCardClick = (e) => {
    if (e.target.closest('.menu-container')) return;
    // Could expand to show more details
  };

  const handleBackdropClick = () => {
    setShowMenu(false);
  };

  return (
    <Card variant="compact" hoverable onClick={handleCardClick} className="compact-user-card">
      <Card.Row justify="space-between" align="center" className="card-content-clickable">
        <div className="user-info-section">
          <div className="user-header">
            <div className="user-avatar">
              <Shield size={20} />
            </div>
            <div className="user-details">
              <p className="user-username">{user.username}</p>
              <div className="user-meta">
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="user-badges">
            <span className={`role-badge role-${user.role}`}>
              {user.role}
            </span>
            <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
              {user.is_active ? (
                <>
                  <UserCheck size={12} /> Active
                </>
              ) : (
                <>
                  <UserX size={12} /> Inactive
                </>
              )}
            </span>
          </div>
        </div>

        <div className="menu-container" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="menu-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical className="menu-icon" />
          </button>

          {showMenu && (
            <>
              <div className="menu-backdrop" onClick={handleBackdropClick} />
              <div className="dropdown-menu">
                <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onToggleStatus(user); }}>
                  {user.is_active ? <UserX className="dropdown-icon" /> : <UserCheck className="dropdown-icon" />}
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onResetPassword(user); }}>
                  <Shield className="dropdown-icon" />
                  Reset Password
                </button>
                <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onEdit(user); }}>
                  <Edit className="dropdown-icon" />
                  Edit
                </button>
                <button type="button" className="dropdown-item delete" onClick={() => { setShowMenu(false); onDelete(user); }}>
                  <Trash2 className="dropdown-icon" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </Card.Row>

      <Card.Row className="user-footer">
        <div className="user-footer-info">
          <span className="footer-label">Full Name:</span>
          <span className="footer-value">{user.full_name || '-'}</span>
        </div>
        <div className="user-footer-info">
          <span className="footer-label">Created:</span>
          <span className="footer-value">{new Date(user.created_at).toLocaleDateString()}</span>
        </div>
      </Card.Row>
    </Card>
  );
}

export function CompactUserCardView({ users, onEdit, onDelete, onToggleStatus, onResetPassword }) {
  if (!users || users.length === 0) {
    return (
      <div className="compact-empty-state">
        <Shield size={48} />
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="compact-mobile-cards-wrapper">
      <div className="compact-mobile-cards-container">
        {users.map((user) => (
          <CompactUserCard
            key={user.id}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            onResetPassword={onResetPassword}
          />
        ))}
      </div>
    </div>
  );
}

export default CompactUserCardView;
