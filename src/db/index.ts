import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import ws from 'ws';
import "dotenv/config";

// تنظیم WebSocket برای محیط Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in .env file');
}

// استفاده از Pool برای مدیریت کانکشن‌ها
const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });