import "dotenv/config";
import { databasePool, httpApp } from "./src/app.js";
import { verifyDatabaseConnection } from "./src/database/databasePool.js";

const port = Number(process.env.PORT ?? 3000);

async function bootstrap(): Promise<void> {
  try {
    await verifyDatabaseConnection(databasePool);

    const server = httpApp.listen(port, () => {
      console.log(`API ejecutándose en http://localhost:${port}/v1`);
      console.log(`Health: http://localhost:${port}/v1/api/health`);
      console.log("MariaDB conectada correctamente");
    });

    const shutdown = (): void => {
      console.log("Cerrando aplicación...");

      server.close(async () => {
        await databasePool.end();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Error al iniciar la aplicación:", error);
    await databasePool.end();
    process.exit(1);
  }
}

void bootstrap();