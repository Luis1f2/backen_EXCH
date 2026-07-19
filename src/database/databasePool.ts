import { Pool } from "pg";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

export function createDatabasePool(): Pool {
  return new Pool({
    host: requiredEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 5432),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    database: requiredEnv("DB_NAME"),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });
}

export async function verifyDatabaseConnection(pool: Pool): Promise<void> {
  await pool.query("SELECT 1");
}
