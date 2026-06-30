import type {
  Pool,
  ResultSetHeader,
  RowDataPacket
} from "mysql2/promise";

import type {
  Favorite,
  FavoriteTargetType
} from "../../domain/entities/Favorite.js";

import type {
  CreateFavoriteData,
  FavoriteRepository,
  ListFavoritesFilters
} from "../../domain/repositories/FavoriteRepository.js";

interface FavoriteRow extends RowDataPacket {
  usuario_id: string;
  target_type: FavoriteTargetType;
  target_id: string;
  fecha_agregado: Date;
}

interface ExistsRow extends RowDataPacket {
  total: number;
}

interface FavoriteTableConfig {
  favoriteTable: "favorito_destino" | "favorito_negocio";
  targetColumn: "destino_id" | "negocio_id";
  targetTable: "destino" | "negocio_turistico";
}

export class MySqlFavoriteRepository implements FavoriteRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateFavoriteData): Promise<Favorite> {
    const config = this.getTableConfig(data.targetType);

    await this.databasePool.execute(
      `INSERT INTO ${config.favoriteTable} (
        usuario_id,
        ${config.targetColumn}
      ) VALUES (?, ?)`,
      [
        data.userId,
        data.targetId
      ]
    );

    const favorite = await this.findByUserAndTarget(
      data.userId,
      data.targetType,
      data.targetId
    );

    if (!favorite) {
      throw new Error("No se pudo recuperar el favorito creado");
    }

    return favorite;
  }

  async findByUserAndTarget(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string
  ): Promise<Favorite | null> {
    const config = this.getTableConfig(targetType);

    const [rows] = await this.databasePool.execute<FavoriteRow[]>(
      `SELECT
        usuario_id,
        ? AS target_type,
        ${config.targetColumn} AS target_id,
        fecha_agregado
       FROM ${config.favoriteTable}
       WHERE usuario_id = ?
       AND ${config.targetColumn} = ?
       LIMIT 1`,
      [
        targetType,
        userId,
        targetId
      ]
    );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async listByUser(
    filters: ListFavoritesFilters
  ): Promise<Favorite[]> {
    if (filters.targetType) {
      return this.listByUserAndType(
        filters.userId,
        filters.targetType
      );
    }

    const destinationFavorites = await this.listByUserAndType(
      filters.userId,
      "destination"
    );

    const businessFavorites = await this.listByUserAndType(
      filters.userId,
      "business"
    );

    return [
      ...destinationFavorites,
      ...businessFavorites
    ].sort(
      (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
    );
  }

  async delete(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string
  ): Promise<boolean> {
    const config = this.getTableConfig(targetType);

    const [result] =
      await this.databasePool.execute<ResultSetHeader>(
        `DELETE FROM ${config.favoriteTable}
         WHERE usuario_id = ?
         AND ${config.targetColumn} = ?`,
        [
          userId,
          targetId
        ]
      );

    return result.affectedRows > 0;
  }

  async targetExists(
    targetType: FavoriteTargetType,
    targetId: string
  ): Promise<boolean> {
    const config = this.getTableConfig(targetType);

    const [rows] = await this.databasePool.execute<ExistsRow[]>(
      `SELECT COUNT(*) AS total
       FROM ${config.targetTable}
       WHERE id = ?
       AND activo = 1`,
      [targetId]
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  private async listByUserAndType(
    userId: string,
    targetType: FavoriteTargetType
  ): Promise<Favorite[]> {
    const config = this.getTableConfig(targetType);

    const [rows] = await this.databasePool.execute<FavoriteRow[]>(
      `SELECT
        f.usuario_id,
        ? AS target_type,
        f.${config.targetColumn} AS target_id,
        f.fecha_agregado
       FROM ${config.favoriteTable} f
       INNER JOIN ${config.targetTable} t
        ON t.id = f.${config.targetColumn}
       WHERE f.usuario_id = ?
       AND t.activo = 1
       ORDER BY f.fecha_agregado DESC`,
      [
        targetType,
        userId
      ]
    );

    return rows.map((row) => this.mapToDomain(row));
  }

  private getTableConfig(
    targetType: FavoriteTargetType
  ): FavoriteTableConfig {
    if (targetType === "destination") {
      return {
        favoriteTable: "favorito_destino",
        targetColumn: "destino_id",
        targetTable: "destino"
      };
    }

    return {
      favoriteTable: "favorito_negocio",
      targetColumn: "negocio_id",
      targetTable: "negocio_turistico"
    };
  }

  private mapToDomain(row: FavoriteRow): Favorite {
    return {
      userId: row.usuario_id,
      targetType: row.target_type,
      targetId: row.target_id,
      addedAt: row.fecha_agregado
    };
  }
}