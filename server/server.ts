import { Server } from 'http';
import app from './src/app';
import db from './src/config/database';
import settingsController from './src/controllers/settingsController';

const PORT = parseInt(process.env.PORT || '3011', 10);
const HOST = process.env.HOST || '0.0.0.0';

settingsController.initializeDefaults();

const server: Server = app.listen(PORT, HOST, () => {
  console.log('\n=================================');
  console.log('🚀 Mini ERP Server Started');
  console.log('=================================');
  console.log(`📍 Local:    http://localhost:${PORT}`);
  console.log(`📍 Network:  http://${getLocalIP()}:${PORT}`);
  console.log(`🗄️  Database: SQLite (./database/erp.db)`);
  console.log(`👤 Default:  admin / admin123`);
  console.log('=================================\n');
});

function getLocalIP(): string {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '0.0.0.0';
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    db.close();
    process.exit(0);
  });
});
