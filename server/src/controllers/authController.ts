import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { generateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { logAuth, ActionType } from '../services/activityLogger';
import db from '../config/database';
import logger from '../utils/logger';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendNotFound, sendInternalError } from '../utils/apiResponse';

function login(req: Request, res: Response): void {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.get('x-forwarded-for') || req.get('x-real-ip');

    if (!username || !password) {
      sendBadRequest(res, 'Username and password required');
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
      sendUnauthorized(res, 'Invalid username or password');
      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);

    if (!passwordMatch) {
      // Log failed login attempt
      logAuth(ActionType.LOGIN_FAILED, user.id, `Failed login attempt for user: ${username}`, { username }, ipAddress);
      sendUnauthorized(res, 'Invalid username or password');
      return;
    }

    const token = generateToken(user);

    // Log successful login using activity logger
    logAuth(ActionType.LOGIN, user.id, `User ${username} logged in successfully`, {
      username,
      email: user.email
    }, ipAddress);

    const { password_hash, ...userWithoutPassword } = user;

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    sendSuccess(res, { user: userWithoutPassword });
  } catch (error) {
    logger.error('Login error:', error);
    sendInternalError(res, 'Login failed');
  }
}

function logout(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user?.id;
    const username = req.user?.username;

    // Log logout using activity logger
    logAuth(ActionType.LOGOUT, userId, `User ${username} logged out`);

    res.clearCookie('token');
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    sendInternalError(res, 'Logout failed');
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
      sendNotFound(res, 'User');
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    logger.error('Get current user error:', error);
    sendInternalError(res, 'Failed to get user info');
  }
}

function changePassword(req: AuthRequest, res: Response): void {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      sendBadRequest(res, 'Current and new password required');
      return;
    }

    if (newPassword.length < 6) {
      sendBadRequest(res, 'New password must be at least 6 characters');
      return;
    }

    const user = db.prepare(`
      SELECT id, password_hash
      FROM users
      WHERE id = ?
    `).get(req.user!.id) as any;

    const passwordMatch = bcrypt.compareSync(currentPassword, user.password_hash);

    if (!passwordMatch) {
      sendUnauthorized(res, 'Current password is incorrect');
      return;
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 12);

    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPasswordHash, req.user!.id);

    // Log password change using activity logger
    logAuth(ActionType.PASSWORD_CHANGE, req.user!.id, 'Password changed successfully');

    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    sendInternalError(res, 'Failed to change password');
  }
}

export default {
  login,
  logout,
  getCurrentUser,
  changePassword
};
