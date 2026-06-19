import { useState } from 'react';

import { MoreVertical, Edit, Trash2, Shield, Key } from 'lucide-react';

import Card from './Card';
import './CompactRoleCard.css';

function CompactRoleCard({ role, onEdit, onDelete, onEditPermissions }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleBackdropClick = () => {
    setShowMenu(false);
  };

  return (
    <Card variant="compact" hoverable className="compact-role-card">
      <Card.Row justify="space-between" align="start" className="card-content-clickable">
        <div className="role-info-section">
          <div className="role-header">
            <div className="role-avatar">
              <Shield size={20} />
            </div>
            <div className="role-details">
              <p className="role-name">{role.role_name}</p>
              {role.description && (
                <p className="role-description">{role.description}</p>
              )}
            </div>
          </div>

          <div className="role-badges">
            <span className={`role-type-badge ${role.is_system_role ? 'system' : 'custom'}`}>
              {role.is_system_role ? 'System' : 'Custom'}
            </span>
            <span className={`status-badge ${role.is_active ? 'active' : 'inactive'}`}>
              {role.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="permission-count">
              {role.permission_count} permissions
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
                <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onEditPermissions(role); }}>
                  <Key className="dropdown-icon" />
                  Permissions
                </button>
                {!role.is_system_role && (
                  <>
                    <button type="button" className="dropdown-item" onClick={() => { setShowMenu(false); onEdit(role); }}>
                      <Edit className="dropdown-icon" />
                      Edit
                    </button>
                    <button type="button" className="dropdown-item danger" onClick={() => { setShowMenu(false); onDelete(role); }}>
                      <Trash2 className="dropdown-icon" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </Card.Row>
    </Card>
  );
}

export default CompactRoleCard;
