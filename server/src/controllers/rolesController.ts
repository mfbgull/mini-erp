import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

interface RoleRow {
  id: number;
  role_name: string;
  description: string;
  is_system_role: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface PermissionRow {
  id: number;
  permission_name: string;
  module: string;
  action: string;
  description: string;
}

/**
 * GET /api/roles
 * Get all roles with their permissions
 */
function getRoles(req: AuthRequest, res: Response): void {
  try {
    const roles = db.prepare(`
      SELECT 
        r.id, r.role_name, r.description, r.is_system_role, r.is_active,
        r.created_at, r.updated_at,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.role_name
    `).all() as (RoleRow & { permission_count: number })[];

    res.json({
      success: true,
      data: roles,
    });
  } catch (error: unknown) {
    logger.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
}

/**
 * GET /api/roles/:id/permissions
 * Get permissions for a specific role
 */
function getRolePermissions(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const roleId = parseInt(String(id), 10);

    const permissions = db.prepare(`
      SELECT 
        p.id, p.permission_name, p.module, p.action, p.description,
        CASE WHEN rp.role_id IS NOT NULL THEN 1 ELSE 0 END as assigned
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = ?
      ORDER BY p.module, p.action
    `).all(roleId) as (PermissionRow & { assigned: number })[];

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error: unknown) {
    logger.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
}

/**
 * POST /api/roles
 * Create a new role
 */
function createRole(req: AuthRequest, res: Response): void {
  try {
    const { role_name, description, permissions } = req.body as {
      role_name: string;
      description?: string;
      permissions?: number[];
    };

    if (!role_name) {
      res.status(400).json({ error: 'Role name is required' });
      return;
    }

    // Check if role name already exists
    const existing = db.prepare('SELECT id FROM roles WHERE role_name = ?').get(role_name);
    if (existing) {
      res.status(409).json({ error: 'Role name already exists' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO roles (role_name, description, is_system_role, is_active)
      VALUES (?, ?, 0, 1)
    `).run(role_name, description || null);

    const roleId = result.lastInsertRowid as number;

    // Assign permissions if provided
    if (permissions && permissions.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
      `);
      
      const insertMany = db.transaction((roleId: number, permissionIds: number[]) => {
        for (const permId of permissionIds) {
          stmt.run(roleId, permId);
        }
      });
      
      insertMany(roleId, permissions);
    }

    const newRole = db.prepare(`
      SELECT id, role_name, description, is_system_role, is_active, created_at, updated_at
      FROM roles
      WHERE id = ?
    `).get(roleId) as RoleRow;

    res.status(201).json({
      success: true,
      data: newRole,
    });
  } catch (error: unknown) {
    logger.error('Create role error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
}

/**
 * PUT /api/roles/:id
 * Update a role
 */
function updateRole(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const roleId = parseInt(String(id), 10);
    const { role_name, description, is_active } = req.body as {
      role_name?: string;
      description?: string;
      is_active?: boolean;
    };

    // Check if role exists
    const existingRole = db.prepare('SELECT id, is_system_role FROM roles WHERE id = ?').get(roleId) as RoleRow | undefined;
    if (!existingRole) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // Prevent modifying system roles
    if (existingRole.is_system_role) {
      res.status(400).json({ error: 'Cannot modify system roles (Admin/User)' });
      return;
    }

    // Check role name uniqueness if changed
    if (role_name && role_name !== existingRole.role_name) {
      const nameExists = db.prepare('SELECT id FROM roles WHERE role_name = ? AND id != ?').get(role_name, roleId);
      if (nameExists) {
        res.status(409).json({ error: 'Role name already exists' });
        return;
      }
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (role_name) {
      updates.push('role_name = ?');
      values.push(role_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(roleId);

    const query = `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    const updatedRole = db.prepare(`
      SELECT id, role_name, description, is_system_role, is_active, created_at, updated_at
      FROM roles
      WHERE id = ?
    `).get(roleId) as RoleRow;

    res.json({
      success: true,
      data: updatedRole,
    });
  } catch (error: unknown) {
    logger.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
}

/**
 * PUT /api/roles/:id/permissions
 * Update permissions for a role
 */
function updateRolePermissions(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const roleId = parseInt(String(id), 10);
    const { permissions }: { permissions: number[] } = req.body;

    // Check if role exists
    const existingRole = db.prepare('SELECT id, is_system_role FROM roles WHERE id = ?').get(roleId) as RoleRow | undefined;
    if (!existingRole) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // For system roles, allow permission changes but not role deletion
    const transaction = db.transaction(() => {
      // Delete existing permissions
      db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);
      
      // Insert new permissions
      if (permissions && permissions.length > 0) {
        const stmt = db.prepare(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `);
        
        for (const permId of permissions) {
          stmt.run(roleId, permId);
        }
      }
    });

    transaction();

    res.json({
      success: true,
      message: 'Permissions updated successfully',
    });
  } catch (error: unknown) {
    logger.error('Update role permissions error:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
}

/**
 * DELETE /api/roles/:id
 * Delete a role (not system roles)
 */
function deleteRole(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const roleId = parseInt(String(id), 10);

    // Check if role exists
    const existingRole = db.prepare('SELECT id, role_name, is_system_role FROM roles WHERE id = ?').get(roleId) as RoleRow | undefined;
    if (!existingRole) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // Prevent deleting system roles
    if (existingRole.is_system_role) {
      res.status(400).json({ error: 'Cannot delete system roles (Admin/User)' });
      return;
    }

    // Check if any users have this role
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ?').get(roleId) as { count: number };
    if (userCount.count > 0) {
      res.status(400).json({ 
        error: `Cannot delete role: ${userCount.count} user(s) have this role. Reassign users first.` 
      });
      return;
    }

    db.prepare('DELETE FROM roles WHERE id = ?').run(roleId);

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error: unknown) {
    logger.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
}

/**
 * GET /api/permissions
 * Get all permissions grouped by module
 */
function getPermissions(req: AuthRequest, res: Response): void {
  try {
    const permissions = db.prepare(`
      SELECT id, permission_name, module, action, description
      FROM permissions
      ORDER BY module, action
    `).all() as PermissionRow[];

    // Group by module
    const grouped: Record<string, PermissionRow[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error: unknown) {
    logger.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

export default {
  getRoles,
  getRolePermissions,
  createRole,
  updateRole,
  updateRolePermissions,
  deleteRole,
  getPermissions,
};
