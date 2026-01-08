import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { generateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { logAuth, ActionType } from '../services/activityLogger';
import db from '../config/database';

function login(req: Request, res: Response): void {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.get('x-forwarded-for') || req.get('x-real-ip');

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const user = db.prepare(`
      SELECT id, username, email, password_hash, full_name, role, is_active
      FROM users
      WHERE username = ? AND is_active =1
    `).get(username) as any;

    if (!user) {
      // Log failed login attempt
      logAuth(ActionType.LOGIN_FAILED, undefined, `Failed login attempt for user: ${username}`, { username }, ipAddress);
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);

    if (!passwordMatch) {
      // Log failed login attempt
      logAuth(ActionType.LOGIN_FAILED, user.id, `Failed login attempt for user: ${username}`, { username }, ipAddress);
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = generateToken(user);

    // Log successful login using activity logger
    logAuth(ActionType.LOGIN, user.id, `User ${username} logged in successfully`, {
      username,
      email: user.email
    }, ipAddress);

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

function logout(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user?.id;
    const username = req.user?.username;

    // Log logout using activity logger
    logAuth(ActionType.LOGOUT, userId, `User ${username} logged out`);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

function getCurrentUser(req: AuthRequest, res: Response): void {
  try {
    const user = db.prepare(`
      SELECT id, username, email, full_name, role, is_active, created_at
      FROM users
      WHERE id = ?
    `).get(req.user!.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
}

function changePassword(req: AuthRequest, res: Response): void {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    const user = db.prepare(`
      SELECT id, password_hash
      FROM users
      WHERE id = ?
    `).get(req.user!.id) as any;

    const passwordMatch = bcrypt.compareSync(currentPassword, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 8);

    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPasswordHash, req.user!.id);

    // Log password change using activity logger
    logAuth(ActionType.PASSWORD_CHANGE, req.user!.id, 'Password changed successfully');

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

export default {
  login,
  logout,
  getCurrentUser,
  changePassword
};
