import { Request, Response } from 'express';
import { getDashboardData, generateAllForecasts, getTrendData } from '../services/forecastService';
import logger from '../utils/logger';

function getDashboard(req: Request, res: Response): void {
  try {
    const data = getDashboardData();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Forecast dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch forecast dashboard' });
  }
}

function getDemand(req: Request, res: Response): void {
  try {
    const { category, trend, recommendation } = req.query;
    let forecasts = generateAllForecasts();
    
    if (category) {
      forecasts = forecasts.filter(f => f.category === category);
    }
    if (trend) {
      forecasts = forecasts.filter(f => f.trend === trend);
    }
    if (recommendation) {
      forecasts = forecasts.filter(f => f.recommendation === recommendation);
    }
    
    res.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    logger.error('Forecast demand error:', error);
    res.status(500).json({ error: 'Failed to fetch demand forecasts' });
  }
}

function getTrends(req: Request, res: Response): void {
  try {
    const itemId = req.query.itemId ? Number(req.query.itemId) : undefined;
    const data = getTrendData(itemId);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Forecast trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
}

function generateForecasts(req: Request, res: Response): void {
  try {
    const forecasts = generateAllForecasts();
    res.json({
      success: true,
      message: `Generated forecasts for ${forecasts.length} items`,
      data: { count: forecasts.length }
    });
  } catch (error) {
    logger.error('Generate forecasts error:', error);
    res.status(500).json({ error: 'Failed to generate forecasts' });
  }
}

export default {
  getDashboard,
  getDemand,
  getTrends,
  generateForecasts
};
