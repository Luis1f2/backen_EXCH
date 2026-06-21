import mysql, { type Pool } from "mysql2/promise";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

export function createDatabasePool(): Pool {
  return mysql.createPool({
    host: requiredEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    database: requiredEnv("DB_NAME"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

export async function verifyDatabaseConnection(pool: Pool): Promise<void> {
  await pool.query("SELECT 1");
}