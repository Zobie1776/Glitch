import http from 'http';
import app from './app.js';
import config from '../../config/default.js';
import { connectDatabase } from '../../config/database.js';

async function bootstrap() {
  try {
    await connectDatabase();
  } catch (error) {
    console.warn('[database] connection skipped or failed:', error.message);
  }

  const server = http.createServer(app);
  server.listen(config.server.port, () => {
    console.log(`API running on ${config.server.baseUrl}`);
  });
}

bootstrap();
