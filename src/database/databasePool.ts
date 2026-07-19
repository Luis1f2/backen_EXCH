import { Pool } from "pg";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}`
    );
  }

  return value;
}

function useSslConnection(): boolean {
  return (
    process.env.DB_SSL
      ?.trim()
      .toLowerCase() === "true"
  );
}

export function createDatabasePool(): Pool {
  const useSsl = useSslConnection();

  return new Pool({
    host: requiredEnv("DB_HOST"),
    port: Number(
      process.env.DB_PORT ?? 5432
    ),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    database: requiredEnv("DB_NAME"),

    ssl: useSsl
      ? {
          rejectUnauthorized: false,
        }
      : false,

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export async function verifyDatabaseConnection(
  pool: Pool
): Promise<void> {
  await pool.query("SELECT 1");
}