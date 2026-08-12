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
  connectionTimeoutMillis: 2000,
});

let activePool: any = pgPool;
let isInMemory = false;

// Proxy object implementing pg.Pool query and connect interface
const pool = {
  query: async (...args: any[]) => {
    return activePool.query(...args);
  },
  connect: async () => {
    return activePool.connect();
  },
  on: (...args: any[]) => {
    if (activePool.on) activePool.on(...args);
  },
};

export async function initDatabase() {
  try {
    const client = await pgPool.connect();
    client.release();
    console.log('📦 Connected to PostgreSQL database');
    activePool = pgPool;
  } catch (err: any) {
    console.warn('⚠️  PostgreSQL server not detected at localhost:5432.');
    console.log('⚡ Initializing high-performance in-memory database (pg-mem)...');

    const memDb = newDb();
    const { Pool: MemPool } = memDb.adapters.createPg();
    activePool = new MemPool();
    isInMemory = true;

    // Auto-seed in-memory database
    await seed(activePool);
    console.log('✨ In-memory database ready with sample data!');
  }
}

export { isInMemory };
export default pool;
