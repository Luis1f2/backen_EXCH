import { createDatabasePool } from "./database/databasePool.js";
import { createHttpApp } from "./http/createHttpApp.js";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Falta JWT_SECRET");
}

export const databasePool = createDatabasePool();
export const httpApp = createHttpApp(databasePool, jwtSecret);