import { Response } from 'express';
import { AuthRequest } from '../types';
import db from '../config/database';
import logger from '../utils/logger';
import DashboardModel from '../models/Dashboard';

function getSummary(req: AuthRequest, res: Response): void {
  try {
    const data = DashboardModel.getSummary(db);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
}

export default { getSummary };
