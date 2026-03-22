import { Response } from 'express';
import db from '../config/database';
import { AuthRequest, AuthUser } from '../types';
import bcrypt from 'bcrypt';
import { logAuth, ActionType } from '../services/activityLogger';
import logger from '../utils/logger';

interface UserRow {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role_id: number;
  is_active?: boolean;
}

interface UpdateUserDTO {
  username?: string;
  email?: string;
  full_name?: string;
  role_id?: number;
  is_active?: boolean;
}

/**
 * GET /api/users
 * Retrieve all users with optional filters
 */
function getUsers(req: AuthRequest, res: Response): void {
  try {
    const { role, is_active, search } = req.query as { 
      role?: string; 
      is_active?: string;
      search?: string;
    };

    let query = `
      SELECT 
        id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(parseInt(is_active, 10));
    }

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const users = db.prepare(query).all(...params) as UserRow[];

    res.json({
      success: true,
      data: users,
    });
  } catch (error: unknown) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * GET /api/users/:id
 * Retrieve a single user by ID
 */
function getUser(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;

    const user = db.prepare(`
      SELECT 
        id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(id) as UserRow | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * POST /api/users
 * Create a new user
 */
function createUser(req: AuthRequest, res: Response): void {
  try {
    const { username, email, password, full_name, role_id, is_active = true }: CreateUserDTO = req.body;

    // Validation
    if (!username || !email || !password || !full_name || !role_id) {
      res.status(400).json({ error: 'Username, email, password, full name, and role are required' });
      return;
    }

    // Check if role exists
    const roleExists = db.prepare('SELECT id FROM roles WHERE id = ?').get(role_id);
    if (!roleExists) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Check if username already exists
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUsername) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Check if email already exists
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingEmail) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 12);

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, email, passwordHash, full_name, role_id, is_active ? 1 : 0);

    const userId = result.lastInsertRowid as number;

    // Log activity
    logAuth(
      'USER_CREATE' as any,
      req.user!.id as number,
      `User ${username} created by ${req.user!.username}`,
      { username, email, role_id },
      String(req.ip || '')
    );

    // Fetch created user
    const newUser = db.prepare(`
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId) as UserRow;

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error: unknown) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * PUT /api/users/:id
 * Update an existing user
 */
function updateUser(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const userId = parseInt(String(id), 10);
    const { username, email, full_name, role_id, is_active }: UpdateUserDTO = req.body;

    // Check if user exists
    const existingUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent admin from demoting themselves
    if (req.user!.id === userId && role_id) {
      const currentUserRole = db.prepare('SELECT role_id FROM users WHERE id = ?').get(req.user!.id) as { role_id: number };
      const newRole = db.prepare('SELECT role_name FROM roles WHERE id = ?').get(role_id) as { role_name: string };
      if (newRole.role_name !== 'Admin') {
        res.status(400).json({ error: 'Cannot change your own role' });
        return;
      }
    }

    // Check role exists if provided
    if (role_id) {
      const roleExists = db.prepare('SELECT id FROM roles WHERE id = ?').get(role_id);
      if (!roleExists) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }
    }

    // Check username uniqueness if changed
    if (username && username !== existingUser.username) {
      const usernameExists = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
      if (usernameExists) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
    }

    // Check email uniqueness if changed
    if (email && email !== existingUser.email) {
      const emailExists = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
      if (emailExists) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (role_id) {
      updates.push('role_id = ?');
      values.push(role_id);
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
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    // Log activity
    logAuth(
      'USER_UPDATE' as any,
      req.user!.id as number,
      `User ${existingUser.username} updated by ${req.user!.username}`,
      { userId, updates },
      String(req.ip || '')
    );

    // Fetch updated user
    const updatedUser = db.prepare(`
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId) as UserRow;

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error: unknown) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * DELETE /api/users/:id
 * Delete a user (soft delete by deactivating)
 */
function deleteUser(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const userId = parseInt(String(id), 10);

    // Check if user exists
    const existingUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent deleting yourself
    if (req.user!.id === userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    // Prevent deleting the last admin
    if (existingUser.role === 'admin') {
      const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = 1').get('admin') as { count: number };
      if (adminCount.count <= 1) {
        res.status(400).json({ error: 'Cannot delete the last active admin user' });
        return;
      }
    }

    // Soft delete - set is_active to 0
    db.prepare(`
      UPDATE users 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(userId);

    // Log activity
    logAuth(
      'USER_DELETE' as any,
      req.user!.id as number,
      `User ${existingUser.username} deleted by ${req.user!.username}`,
      { userId, username: existingUser.username },
      String(req.ip || '')
    );

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: unknown) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

/**
 * PUT /api/users/:id/reset-password
 * Reset a user's password (admin only)
 */
function resetPassword(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const userId = parseInt(String(id), 10);
    const { newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({ error: 'New password is required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Hash new password
    const passwordHash = bcrypt.hashSync(newPassword, 12);

    // Update password
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(passwordHash, userId);

    // Log activity
    logAuth(
      'PASSWORD_CHANGE' as any,
      req.user!.id as number,
      `Password reset for user ${existingUser.username} by ${req.user!.username}`,
      { userId, username: existingUser.username },
      String(req.ip || '')
    );

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: unknown) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

/**
 * PUT /api/users/:id/activate
 * Activate or deactivate a user
 */
function toggleUserStatus(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const userId = parseInt(String(id), 10);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      res.status(400).json({ error: 'is_active must be a boolean' });
      return;
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent deactivating yourself
    if (req.user!.id === userId) {
      res.status(400).json({ error: 'Cannot deactivate your own account' });
      return;
    }

    // Prevent deactivating the last admin
    if (existingUser.role === 'admin' && !is_active) {
      const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = 1').get('admin') as { count: number };
      if (adminCount.count <= 1) {
        res.status(400).json({ error: 'Cannot deactivate the last active admin user' });
        return;
      }
    }

    // Update status
    db.prepare(`
      UPDATE users 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(is_active ? 1 : 0, userId);

    // Log activity
    logAuth(
      'USER_UPDATE' as any,
      req.user!.id as number,
      `User ${existingUser.username} ${is_active ? 'activated' : 'deactivated'} by ${req.user!.username}`,
      { userId, username: existingUser.username, is_active },
      String(req.ip || '')
    );

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error: unknown) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
}

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  toggleUserStatus,
};
