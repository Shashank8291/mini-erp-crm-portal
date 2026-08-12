import { Pool } from 'pg';
import { newDb } from 'pg-mem';
import { env } from './env';
import { seed } from './seed';

const pgPool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  connectionTimeoutMillis: 1500,
});

// Initialize in-memory pool immediately so pool is never null or hanging
const initialMemDb = newDb();
const { Pool: InitialMemPool } = initialMemDb.adapters.createPg();
let activePool: any = new InitialMemPool();
let isInMemory = true;
let isInitialized = false;

// Proxy object implementing pg.Pool query and connect interface
const pool = {
  query: async (...args: any[]) => {
    if (!isInitialized) {
      await initDatabase();
    }
    return activePool.query(...args);
  },
  connect: async () => {
    if (!isInitialized) {
      await initDatabase();
    }
    return activePool.connect();
  },
  on: (...args: any[]) => {
    if (activePool.on) activePool.on(...args);
  },
};

export async function initDatabase() {
  if (isInitialized) return;
  isInitialized = true;

  const isServerless = Boolean(process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT);
  const isLocalhostDb = (!process.env.DB_HOST || process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1');

  // In Netlify / serverless without a remote PostgreSQL host, use pg-mem directly without TCP timeout
  if (isServerless && isLocalhostDb) {
    console.log('⚡ Serverless environment: initializing in-memory database (pg-mem)...');
    try {
      await seed(activePool);
      console.log('✨ In-memory database ready with sample data!');
    } catch (e) {
      console.error('Failed seeding in-memory db:', e);
    }
    return;
  }

  try {
    const client = await pgPool.connect();
    client.release();
    console.log('📦 Connected to PostgreSQL database');
    activePool = pgPool;
    isInMemory = false;
  } catch (err: any) {
    console.warn('⚠️  PostgreSQL server not detected. Using high-performance in-memory database (pg-mem)...');
    try {
      await seed(activePool);
      console.log('✨ In-memory database ready with sample data!');
    } catch (e) {
      console.error('Failed seeding in-memory db:', e);
    }
  }
}

export { isInMemory };
export default pool;
