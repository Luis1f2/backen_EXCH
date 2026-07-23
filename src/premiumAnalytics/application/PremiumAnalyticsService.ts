import type {
  Pool,
} from "pg";

import {
  AppError,
} from "../../user/application/errors/AppError.js";


export const ANALYTICS_EVENT_TYPES = [
  "SEARCH",
  "DESTINATION_VIEW",
  "BUSINESS_VIEW",
  "FAVORITE_DESTINATION",
  "FAVORITE_BUSINESS",
  "ROUTE_CREATED",
  "DESTINATION_ADDED_TO_ROUTE",
  "VISIT_INTENT",
  "PROMOTION_VIEW",
  "EVENT_VIEW",
] as const;


export type AnalyticsEventType =
  (typeof ANALYTICS_EVENT_TYPES)[number];


export interface AnalyticsFilters {
  from: Date;

  to: Date;

  municipality?: string;

  categoryId?: string;
}


interface RecordEventInput {
  userId: string | null;

  type: AnalyticsEventType;

  destinationId?: string | null;

  businessId?: string | null;

  categoryId?: string | null;

  searchTerm?: string | null;

  municipality?: string | null;

  metadata?: Record<
    string,
    unknown
  >;
}


interface DestinationContextRow {
  categoria_id: string;

  municipio: string | null;
}


export class PremiumAnalyticsService {
  constructor(
    private readonly pool: Pool,
  ) {}


  /*
   * Registra un evento analítico.
   *
   * Cuando existe destinationId:
   * - la API obtiene categoría y municipio reales;
   * - no confía en los datos enviados por el cliente;
   * - actualiza automáticamente datos_turisticos.
   */
  async recordEvent(
    input: RecordEventInput,
  ): Promise<{
    id: string;

    createdAt: Date;
  }> {
    let categoryId =
      input.categoryId ??
      null;

    let municipality =
      input.municipality
        ?.trim() ||
      null;


    if (
      input.destinationId
    ) {
      const {
        rows,
      } =
        await this.pool.query<
          DestinationContextRow
        >(
          `
            SELECT
              d.categoria_id,
              u.municipio

            FROM destino d

            INNER JOIN ubicacion u
              ON u.id =
                d.ubicacion_id

            WHERE d.id = $1
              AND d.activo = true

            LIMIT 1
          `,
          [
            input.destinationId,
          ],
        );


      const destination =
        rows[0];


      if (!destination) {
        throw new AppError(
          "Destino no encontrado",
          404,
        );
      }


      categoryId =
        destination.categoria_id;

      municipality =
        destination.municipio;
    }


    const client =
      await this.pool.connect();


    try {
      await client.query(
        "BEGIN",
      );


      const {
        rows,
      } =
        await client.query<{
          id: string;

          fecha_creacion: Date;
        }>(
          `
            INSERT INTO evento_analitico (
              usuario_id,
              tipo_evento,
              destino_id,
              negocio_id,
              categoria_id,
              termino_busqueda,
              municipio,
              metadata
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8::jsonb
            )

            RETURNING
              id,
              fecha_creacion
          `,
          [
            input.userId,
            input.type,

            input.destinationId ??
              null,

            input.businessId ??
              null,

            categoryId,

            input.searchTerm
              ?.trim() ||
              null,

            municipality,

            JSON.stringify(
              input.metadata ??
                {},
            ),
          ],
        );


      /*
       * Solo los eventos ligados a un destino
       * afectan datos_turisticos.
       */
      if (
        input.destinationId
      ) {
        const views =
          input.type ===
          "DESTINATION_VIEW"
            ? 1
            : 0;

        const searches =
          input.type ===
          "SEARCH"
            ? 1
            : 0;

        const favorites =
          input.type ===
          "FAVORITE_DESTINATION"
            ? 1
            : 0;

        const visitIntents =
          input.type ===
          "VISIT_INTENT"
            ? 1
            : 0;

        const routes =
          input.type ===
          "DESTINATION_ADDED_TO_ROUTE"
            ? 1
            : 0;


        await client.query(
          `
            INSERT INTO datos_turisticos (
              fecha,
              destino_id,
              categoria_id,
              municipio,
              visualizaciones,
              busquedas,
              favoritos,
              intenciones_visita,
              apariciones_rutas
            )
            VALUES (
              CURRENT_DATE,
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8
            )

            ON CONFLICT (
              fecha,
              destino_id
            )

            DO UPDATE SET
              categoria_id =
                EXCLUDED.categoria_id,

              municipio =
                EXCLUDED.municipio,

              visualizaciones =
                datos_turisticos.visualizaciones +
                EXCLUDED.visualizaciones,

              busquedas =
                datos_turisticos.busquedas +
                EXCLUDED.busquedas,

              favoritos =
                datos_turisticos.favoritos +
                EXCLUDED.favoritos,

              intenciones_visita =
                datos_turisticos.intenciones_visita +
                EXCLUDED.intenciones_visita,

              apariciones_rutas =
                datos_turisticos.apariciones_rutas +
                EXCLUDED.apariciones_rutas,

              fecha_actualizacion =
                now()
          `,
          [
            input.destinationId,
            categoryId,
            municipality,

            views,
            searches,
            favorites,
            visitIntents,
            routes,
          ],
        );
      }


      await client.query(
        "COMMIT",
      );


      return {
        id:
          rows[0].id,

        createdAt:
          rows[0]
            .fecha_creacion,
      };
    } catch (
      error
    ) {
      await client.query(
        "ROLLBACK",
      );

      throw error;
    } finally {
      client.release();
    }
  }


  /*
   * REPORTE GENERAL
   */
  async getReport(
    filters: AnalyticsFilters,
  ) {
    const {
      where,
      params,
    } =
      this.buildFilters(
        filters,
      );


    const [
      summaryResult,
      destinationsResult,
      categoriesResult,
      municipalitiesResult,
    ] =
      await Promise.all([
        this.pool.query(
          `
            SELECT
              COALESCE(
                SUM(
                  dt.busquedas
                ),
                0
              )::int
                AS searches,

              COALESCE(
                SUM(
                  dt.visualizaciones
                ),
                0
              )::int
                AS destination_views,

              COALESCE(
                SUM(
                  dt.intenciones_visita
                ),
                0
              )::int
                AS visit_intents,

              COALESCE(
                SUM(
                  dt.favoritos
                ),
                0
              )::int
                AS favorites,

              COALESCE(
                SUM(
                  dt.apariciones_rutas
                ),
                0
              )::int
                AS route_appearances

            FROM datos_turisticos dt

            WHERE ${where}
          `,
          params,
        ),


        this.pool.query(
          `
            SELECT
              d.id
                AS "destinationId",

              d.nombre
                AS "name",

              dt.municipio
                AS "municipality",

              SUM(
                dt.busquedas
              )::int
                AS "searches",

              SUM(
                dt.visualizaciones
              )::int
                AS "views",

              SUM(
                dt.favoritos
              )::int
                AS "favorites",

              SUM(
                dt.intenciones_visita
              )::int
                AS "visitIntents",

              SUM(
                dt.apariciones_rutas
              )::int
                AS "routeAppearances"

            FROM datos_turisticos dt

            INNER JOIN destino d
              ON d.id =
                dt.destino_id

            WHERE ${where}

            GROUP BY
              d.id,
              d.nombre,
              dt.municipio

            ORDER BY
              (
                SUM(
                  dt.busquedas
                ) +

                SUM(
                  dt.visualizaciones
                ) +

                SUM(
                  dt.intenciones_visita
                )
              ) DESC

            LIMIT 10
          `,
          params,
        ),


        this.pool.query(
          `
            SELECT
              c.id
                AS "categoryId",

              c.nombre
                AS "name",

              SUM(
                dt.busquedas
              )::int
                AS "searches",

              SUM(
                dt.visualizaciones
              )::int
                AS "views",

              SUM(
                dt.intenciones_visita
              )::int
                AS "visitIntents"

            FROM datos_turisticos dt

            INNER JOIN categoria c
              ON c.id =
                dt.categoria_id

            WHERE ${where}

            GROUP BY
              c.id,
              c.nombre

            ORDER BY
              (
                SUM(
                  dt.busquedas
                ) +

                SUM(
                  dt.visualizaciones
                )
              ) DESC
          `,
          params,
        ),


        this.pool.query(
          `
            SELECT
              COALESCE(
                dt.municipio,
                'Sin municipio'
              )
                AS "municipality",

              SUM(
                dt.busquedas
              )::int
                AS "searches",

              SUM(
                dt.visualizaciones
              )::int
                AS "views",

              SUM(
                dt.intenciones_visita
              )::int
                AS "visitIntents",

              SUM(
                dt.favoritos
              )::int
                AS "favorites"

            FROM datos_turisticos dt

            WHERE ${where}

            GROUP BY
              dt.municipio

            ORDER BY
              (
                SUM(
                  dt.visualizaciones
                ) +

                SUM(
                  dt.intenciones_visita
                )
              ) DESC
          `,
          params,
        ),
      ]);


    const summary =
      summaryResult.rows[0];


    return {
      filters: {
        from:
          filters.from,

        to:
          filters.to,

        municipality:
          filters.municipality ??
          null,

        categoryId:
          filters.categoryId ??
          null,
      },


      summary: {
        searches:
          Number(
            summary.searches,
          ),

        destinationViews:
          Number(
            summary.destination_views,
          ),

        visitIntents:
          Number(
            summary.visit_intents,
          ),

        favorites:
          Number(
            summary.favorites,
          ),

        routeAppearances:
          Number(
            summary.route_appearances,
          ),
      },


      topDestinations:
        destinationsResult.rows,

      topCategories:
        categoriesResult.rows,

      municipalities:
        municipalitiesResult.rows,
    };
  }


  /*
   * TENDENCIAS TEMPORALES
   */
  async getTrends(
    filters: AnalyticsFilters,
  ) {
    const {
      where,
      params,
    } =
      this.buildFilters(
        filters,
      );


    const {
      rows,
    } =
      await this.pool.query(
        `
          SELECT
            dt.fecha
              AS "date",

            SUM(
              dt.busquedas
            )::int
              AS "searches",

            SUM(
              dt.visualizaciones
            )::int
              AS "views",

            SUM(
              dt.intenciones_visita
            )::int
              AS "visitIntents",

            SUM(
              dt.favoritos
            )::int
              AS "favorites",

            SUM(
              dt.apariciones_rutas
            )::int
              AS "routeAppearances"

          FROM datos_turisticos dt

          WHERE ${where}

          GROUP BY
            dt.fecha

          ORDER BY
            dt.fecha ASC
        `,
        params,
      );


    return {
      series:
        rows,
    };
  }


  /*
   * RANKING
   */
  async getDestinationRanking(
    filters: AnalyticsFilters,

    metric:
      | "searches"
      | "views"
      | "favorites"
      | "visitIntents"
      | "routes",

    limit: number,
  ) {
    const metricSql = {
      searches:
        "SUM(dt.busquedas)",

      views:
        "SUM(dt.visualizaciones)",

      favorites:
        "SUM(dt.favoritos)",

      visitIntents:
        "SUM(dt.intenciones_visita)",

      routes:
        "SUM(dt.apariciones_rutas)",
    }[metric];


    const {
      conditions,
      params,
    } =
      this.buildFilterParts(
        filters,
      );


    params.push(
      limit,
    );


    const limitParam =
      `$${params.length}`;


    const {
      rows,
    } =
      await this.pool.query(
        `
          SELECT
            d.id
              AS "destinationId",

            d.nombre
              AS "name",

            dt.municipio
              AS "municipality",

            SUM(
              dt.busquedas
            )::int
              AS "searches",

            SUM(
              dt.visualizaciones
            )::int
              AS "views",

            SUM(
              dt.favoritos
            )::int
              AS "favorites",

            SUM(
              dt.intenciones_visita
            )::int
              AS "visitIntents",

            SUM(
              dt.apariciones_rutas
            )::int
              AS "routeAppearances"

          FROM datos_turisticos dt

          INNER JOIN destino d
            ON d.id =
              dt.destino_id

          WHERE ${
            conditions.join(
              " AND ",
            )
          }

          GROUP BY
            d.id,
            d.nombre,
            dt.municipio

          ORDER BY
            ${metricSql}
            DESC

          LIMIT ${limitParam}
        `,
        params,
      );


    return {
      metric,

      ranking:
        rows,
    };
  }


  /*
   * MAPA DE CALOR
   *
   * intensity:
   * 0 - 100
   *
   * Es un índice relativo dentro del periodo seleccionado.
   */
  async getHeatmap(
    filters: AnalyticsFilters,
  ) {
    const {
      where,
      params,
    } =
      this.buildFilters(
        filters,
      );


    const {
      rows,
    } =
      await this.pool.query(
        `
          WITH base AS (
            SELECT
              d.id,
              d.nombre,

              u.latitud,
              u.longitud,

              (
                SUM(
                  dt.busquedas
                ) * 2 +

                SUM(
                  dt.visualizaciones
                ) +

                SUM(
                  dt.favoritos
                ) * 2 +

                SUM(
                  dt.intenciones_visita
                ) * 3
              )::numeric
                AS score

            FROM datos_turisticos dt

            INNER JOIN destino d
              ON d.id =
                dt.destino_id

            INNER JOIN ubicacion u
              ON u.id =
                d.ubicacion_id

            WHERE ${where}

            GROUP BY
              d.id,
              d.nombre,
              u.latitud,
              u.longitud
          ),


          normalized AS (
            SELECT
              *,

              MAX(
                score
              ) OVER ()
                AS max_score

            FROM base
          )


          SELECT
            id
              AS "destinationId",

            nombre
              AS "name",

            latitud
              AS "latitude",

            longitud
              AS "longitude",

            CASE
              WHEN max_score <= 0
                THEN 0

              ELSE ROUND(
                score /
                max_score *
                100
              )::int
            END
              AS "intensity"

          FROM normalized

          ORDER BY
            "intensity"
            DESC
        `,
        params,
      );


    return {
      points:
        rows,
    };
  }



  async saveTravelPreference(
    userId: string,
    input: {
      budgetMin?: number | null;
      budgetMax?: number | null;
      currency?: string;
    },
  ): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO usuario_preferencia_viaje (
          usuario_id,
          presupuesto_min,
          presupuesto_max,
          moneda
        )
        VALUES ($1, $2, $3, $4)

        ON CONFLICT (usuario_id)
        DO UPDATE SET
          presupuesto_min = EXCLUDED.presupuesto_min,
          presupuesto_max = EXCLUDED.presupuesto_max,
          moneda = EXCLUDED.moneda,
          fecha_actualizacion = now()
      `,
      [
        userId,
        input.budgetMin ?? null,
        input.budgetMax ?? null,
        (input.currency ?? "MXN").toUpperCase(),
      ],
    );
  }


  async getOpportunities(
    filters: AnalyticsFilters,
  ) {
    const { where, params } =
      this.buildFilters(filters);

    const { rows } =
      await this.pool.query(
        `
          WITH aggregated AS (
            SELECT
              d.id,
              d.nombre,
              dt.municipio,

              COALESCE(
                dm.calificacion_promedio,
                0
              )::numeric AS rating,

              SUM(
                dt.visualizaciones
              )::numeric AS views,

              (
                SUM(dt.busquedas) +
                SUM(dt.favoritos) * 2 +
                SUM(dt.intenciones_visita) * 3
              )::numeric AS demand

            FROM datos_turisticos dt

            INNER JOIN destino d
              ON d.id = dt.destino_id

            LEFT JOIN destino_metrica dm
              ON dm.destino_id = d.id

            WHERE ${where}

            GROUP BY
              d.id,
              d.nombre,
              dt.municipio,
              dm.calificacion_promedio
          ),

          normalized AS (
            SELECT
              *,
              MAX(views) OVER () AS max_views,
              MAX(demand) OVER () AS max_demand
            FROM aggregated
          )

          SELECT
            id AS "destinationId",
            nombre AS "name",
            municipio AS "municipality",

            ROUND(
              rating,
              2
            )::float AS "rating",

            CASE
              WHEN max_views <= 0 THEN 0
              ELSE ROUND(
                views / max_views * 100
              )::int
            END AS "visibilityScore",

            CASE
              WHEN max_demand <= 0 THEN 0
              ELSE ROUND(
                demand / max_demand * 100
              )::int
            END AS "demandScore",

            LEAST(
              100,
              ROUND(
                rating / 5 * 45 +

                CASE
                  WHEN max_views <= 0 THEN 0
                  ELSE (
                    1 - views / max_views
                  ) * 30
                END +

                CASE
                  WHEN max_demand <= 0 THEN 0
                  ELSE demand / max_demand * 25
                END
              )
            )::int AS "opportunityScore"

          FROM normalized

          WHERE rating >= 3.5

          ORDER BY
            "opportunityScore" DESC,
            rating DESC

          LIMIT 25
        `,
        params,
      );

    return {
      methodology:
        "rating_visibility_observed_demand",

      opportunities:
        rows.map((row) => {
          const visibility =
            Number(row.visibilityScore ?? 0);

          const demand =
            Number(row.demandScore ?? 0);

          let reason =
            "Potencial turístico según actividad observada";

          if (
            visibility < 40 &&
            demand >= 40
          ) {
            reason =
              "Alta valoración, demanda relevante y baja visibilidad";
          } else if (
            visibility < 40
          ) {
            reason =
              "Alta valoración y baja visibilidad";
          } else if (
            demand >= 60
          ) {
            reason =
              "Demanda alta con oportunidad de promoción";
          }

          return {
            ...row,
            reason,
          };
        }),
    };
  }


  async getAudienceTypes(
    filters: AnalyticsFilters,
  ) {
    const params: Array<Date | string> = [
      filters.from,
      filters.to,
    ];

    const conditions = [
      "ea.fecha_creacion::date >= $1::date",
      "ea.fecha_creacion::date <= $2::date",
      "ea.usuario_id IS NOT NULL",
    ];

    if (filters.municipality) {
      params.push(filters.municipality);

      conditions.push(
        `ea.municipio = $${params.length}`,
      );
    }

    if (filters.categoryId) {
      params.push(filters.categoryId);

      conditions.push(
        `ea.categoria_id = $${params.length}`,
      );
    }

    const { rows } =
      await this.pool.query(
        `
          WITH base AS (
            SELECT
              tu.nombre AS type,

              COUNT(
                DISTINCT ea.usuario_id
              )::int AS users

            FROM evento_analitico ea

            INNER JOIN usuario u
              ON u.id = ea.usuario_id

            INNER JOIN tipo_usuario tu
              ON tu.id = u.tipo_usuario_id

            WHERE ${conditions.join(" AND ")}

            GROUP BY tu.nombre
          ),

          total AS (
            SELECT
              COALESCE(
                SUM(users),
                0
              )::numeric AS value

            FROM base
          )

          SELECT
            b.type,
            b.users,

            CASE
              WHEN t.value <= 0 THEN 0
              ELSE ROUND(
                b.users / t.value * 100,
                2
              )::float
            END AS percentage

          FROM base b
          CROSS JOIN total t

          ORDER BY b.users DESC
        `,
        params,
      );

    return {
      source: "observed_activity",
      segments: rows,
    };
  }


  async getAudienceInterests(
    filters: AnalyticsFilters,
  ) {
    const params: Array<Date | string> = [
      filters.from,
      filters.to,
    ];

    const conditions = [
      "ea.fecha_creacion::date >= $1::date",
      "ea.fecha_creacion::date <= $2::date",
      "ea.categoria_id IS NOT NULL",
    ];

    if (filters.municipality) {
      params.push(filters.municipality);

      conditions.push(
        `ea.municipio = $${params.length}`,
      );
    }

    if (filters.categoryId) {
      params.push(filters.categoryId);

      conditions.push(
        `ea.categoria_id = $${params.length}`,
      );
    }

    const { rows } =
      await this.pool.query(
        `
          WITH base AS (
            SELECT
              c.id,
              c.nombre,

              COUNT(*)::int
                AS interactions,

              COUNT(
                DISTINCT ea.usuario_id
              ) FILTER (
                WHERE ea.usuario_id
                  IS NOT NULL
              )::int AS unique_users

            FROM evento_analitico ea

            INNER JOIN categoria c
              ON c.id = ea.categoria_id

            WHERE ${conditions.join(" AND ")}

            GROUP BY
              c.id,
              c.nombre
          ),

          total AS (
            SELECT
              COALESCE(
                SUM(interactions),
                0
              )::numeric AS value

            FROM base
          )

          SELECT
            b.id AS "categoryId",
            b.nombre AS "name",
            b.interactions,
            b.unique_users AS "uniqueUsers",

            CASE
              WHEN t.value <= 0 THEN 0
              ELSE ROUND(
                b.interactions /
                t.value *
                100,
                2
              )::float
            END AS percentage

          FROM base b
          CROSS JOIN total t

          ORDER BY
            b.interactions DESC
        `,
        params,
      );

    return {
      /*
       * Son intereses inferidos de comportamiento
       * agregado, no intereses declarados en perfil.
       */
      source:
        "observed_behavior_by_category",

      interests:
        rows,
    };
  }


  async getAudienceBudget(
    filters: AnalyticsFilters,
  ) {
    const params: Array<Date | string> = [
      filters.from,
      filters.to,
    ];

    const conditions = [
      "ea.fecha_creacion::date >= $1::date",
      "ea.fecha_creacion::date <= $2::date",
      "ea.usuario_id IS NOT NULL",
    ];

    if (filters.municipality) {
      params.push(filters.municipality);

      conditions.push(
        `ea.municipio = $${params.length}`,
      );
    }

    if (filters.categoryId) {
      params.push(filters.categoryId);

      conditions.push(
        `ea.categoria_id = $${params.length}`,
      );
    }

    const { rows } =
      await this.pool.query(
        `
          WITH active_users AS (
            SELECT DISTINCT
              ea.usuario_id

            FROM evento_analitico ea

            WHERE ${conditions.join(" AND ")}
          ),

          base AS (
            SELECT
              CASE
                WHEN upv.presupuesto_max <= 1000
                  THEN '0-1000'

                WHEN upv.presupuesto_max <= 3000
                  THEN '1001-3000'

                WHEN upv.presupuesto_max <= 7000
                  THEN '3001-7000'

                ELSE '7001+'
              END AS range,

              COUNT(*)::int AS users

            FROM active_users au

            INNER JOIN usuario_preferencia_viaje upv
              ON upv.usuario_id =
                au.usuario_id

            WHERE upv.presupuesto_max
              IS NOT NULL

            GROUP BY range
          ),

          total AS (
            SELECT
              COALESCE(
                SUM(users),
                0
              )::numeric AS value

            FROM base
          )

          SELECT
            b.range,
            b.users,

            CASE
              WHEN t.value <= 0 THEN 0
              ELSE ROUND(
                b.users /
                t.value *
                100,
                2
              )::float
            END AS percentage

          FROM base b
          CROSS JOIN total t

          ORDER BY
            CASE b.range
              WHEN '0-1000' THEN 1
              WHEN '1001-3000' THEN 2
              WHEN '3001-7000' THEN 3
              ELSE 4
            END
        `,
        params,
      );

    return {
      currency: "MXN",
      segments: rows,
    };
  }


  async getMunicipalities(
    filters: AnalyticsFilters,
  ) {
    const {
      conditions,
      params,
    } =
      this.buildFilterParts(filters);

    const { rows } =
      await this.pool.query(
        `
          SELECT
            COALESCE(
              dt.municipio,
              'Sin municipio'
            ) AS "name",

            SUM(
              dt.visualizaciones
            )::int AS "views",

            SUM(
              dt.busquedas
            )::int AS "searches",

            SUM(
              dt.intenciones_visita
            )::int AS "visitIntents",

            SUM(
              dt.favoritos
            )::int AS "favorites",

            SUM(
              dt.apariciones_rutas
            )::int AS "routeAppearances",

            COUNT(
              DISTINCT dt.destino_id
            )::int AS "destinations"

          FROM datos_turisticos dt

          WHERE ${conditions.join(" AND ")}

          GROUP BY dt.municipio

          ORDER BY (
            SUM(dt.visualizaciones) +
            SUM(dt.busquedas) +
            SUM(dt.intenciones_visita) * 2
          ) DESC
        `,
        params,
      );

    return {
      /*
       * Esto mide interés observado.
       * No afirmamos que sean visitas físicas.
       */
      methodology:
        "observed_interest_not_confirmed_footfall",

      municipalities:
        rows,
    };
  }



  /*
   * CONFIGURACIÓN DE CAPACIDAD
   *
   * La capacidad debe provenir de una fuente
   * administrativa o institucional.
   */
  async saveDestinationCapacity(
    destinationId: string,

    input: {
      dailyCapacity: number;

      alertThreshold: number;

      source?: string | null;
    },
  ) {
    const {
      rows: destinationRows,
    } =
      await this.pool.query(
        `
          SELECT id

          FROM destino

          WHERE id = $1

          LIMIT 1
        `,
        [
          destinationId,
        ],
      );


    if (
      destinationRows.length ===
      0
    ) {
      throw new AppError(
        "Destino no encontrado",
        404,
      );
    }


    const {
      rows,
    } =
      await this.pool.query(
        `
          INSERT INTO destino_capacidad (
            destino_id,
            capacidad_diaria_estimada,
            umbral_alerta_porcentaje,
            fuente
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )

          ON CONFLICT (
            destino_id
          )

          DO UPDATE SET
            capacidad_diaria_estimada =
              EXCLUDED.capacidad_diaria_estimada,

            umbral_alerta_porcentaje =
              EXCLUDED.umbral_alerta_porcentaje,

            fuente =
              EXCLUDED.fuente,

            fecha_actualizacion =
              now()

          RETURNING
            destino_id
              AS "destinationId",

            capacidad_diaria_estimada
              AS "dailyCapacity",

            umbral_alerta_porcentaje
              AS "alertThreshold",

            fuente
              AS "source",

            fecha_actualizacion
              AS "updatedAt"
        `,
        [
          destinationId,

          input.dailyCapacity,

          input.alertThreshold,

          input.source?.trim() ||
            null,
        ],
      );


    return rows[0];
  }


  /*
   * ALERTAS DE PRESIÓN TURÍSTICA
   *
   * NO representa afluencia física confirmada.
   *
   * Se calcula:
   *
   * intenciones de visita por día
   * -----------------------------
   * capacidad diaria estimada
   *
   * Solo aparecen destinos que tienen
   * capacidad configurada.
   */
  async getSaturationAlerts(
    filters: AnalyticsFilters,
  ) {
    const params:
      Array<
        Date |
        string
      > = [
        filters.from,
        filters.to,
      ];


    const conditions = [
      "dt.fecha >= $1::date",

      "dt.fecha <= $2::date",
    ];


    if (
      filters.municipality
    ) {
      params.push(
        filters.municipality,
      );

      conditions.push(
        `dt.municipio = $${params.length}`,
      );
    }


    if (
      filters.categoryId
    ) {
      params.push(
        filters.categoryId,
      );

      conditions.push(
        `dt.categoria_id = $${params.length}`,
      );
    }


    const {
      rows,
    } =
      await this.pool.query(
        `
          WITH demand AS (
            SELECT
              dt.destino_id,

              SUM(
                dt.intenciones_visita
              )::numeric
                AS total_visit_intents,

              SUM(
                dt.visualizaciones
              )::int
                AS views,

              SUM(
                dt.busquedas
              )::int
                AS searches

            FROM datos_turisticos dt

            WHERE ${
              conditions.join(
                " AND ",
              )
            }

            GROUP BY
              dt.destino_id
          )


          SELECT
            d.id
              AS "destinationId",

            d.nombre
              AS "name",

            u.municipio
              AS "municipality",

            dc.capacidad_diaria_estimada
              AS "dailyCapacity",

            dc.umbral_alerta_porcentaje
              AS "alertThreshold",

            dc.fuente
              AS "capacitySource",

            ROUND(
              COALESCE(
                demand.total_visit_intents,
                0
              ) /

              GREATEST(
                1,

                (
                  $2::date -
                  $1::date +
                  1
                )
              )
            )::int
              AS "estimatedDailyDemand",

            ROUND(
              (
                COALESCE(
                  demand.total_visit_intents,
                  0
                ) /

                GREATEST(
                  1,

                  (
                    $2::date -
                    $1::date +
                    1
                  )
                )
              ) /

              dc.capacidad_diaria_estimada *

              100
            )::int
              AS "pressurePercentage",

            COALESCE(
              demand.views,
              0
            )::int
              AS "views",

            COALESCE(
              demand.searches,
              0
            )::int
              AS "searches",

            CASE
              WHEN
                (
                  COALESCE(
                    demand.total_visit_intents,
                    0
                  ) /

                  GREATEST(
                    1,

                    (
                      $2::date -
                      $1::date +
                      1
                    )
                  )
                ) /

                dc.capacidad_diaria_estimada *

                100 >= 100

                THEN 'critical'


              WHEN
                (
                  COALESCE(
                    demand.total_visit_intents,
                    0
                  ) /

                  GREATEST(
                    1,

                    (
                      $2::date -
                      $1::date +
                      1
                    )
                  )
                ) /

                dc.capacidad_diaria_estimada *

                100 >=

                dc.umbral_alerta_porcentaje

                THEN 'high'


              WHEN
                (
                  COALESCE(
                    demand.total_visit_intents,
                    0
                  ) /

                  GREATEST(
                    1,

                    (
                      $2::date -
                      $1::date +
                      1
                    )
                  )
                ) /

                dc.capacidad_diaria_estimada *

                100 >= 60

                THEN 'medium'


              ELSE 'low'
            END
              AS "level"

          FROM destino_capacidad dc

          INNER JOIN destino d
            ON d.id =
              dc.destino_id

          INNER JOIN ubicacion u
            ON u.id =
              d.ubicacion_id

          LEFT JOIN demand
            ON demand.destino_id =
              d.id

          WHERE d.activo = true

          ORDER BY
            "pressurePercentage"
            DESC
        `,
        params,
      );


    return {
      methodology:
        "estimated_pressure_based_on_visit_intent",

      disclaimer:
        "La presión se estima con intenciones de visita registradas y no representa afluencia física confirmada.",

      alerts:
        rows,
    };
  }


  /*
   * REDISTRIBUCIÓN
   *
   * Busca alternativas:
   * - misma categoría;
   * - activas;
   * - menor presión estimada;
   * - buena calificación;
   * - cercanía geográfica.
   */
  async getRedistribution(
    destinationId: string,

    filters: AnalyticsFilters,
  ) {
    const {
      rows: sourceRows,
    } =
      await this.pool.query<{
        id: string;

        nombre: string;

        categoria_id: string;

        latitud: string;

        longitud: string;
      }>(
        `
          SELECT
            d.id,

            d.nombre,

            d.categoria_id,

            u.latitud,

            u.longitud

          FROM destino d

          INNER JOIN ubicacion u
            ON u.id =
              d.ubicacion_id

          WHERE d.id = $1
            AND d.activo = true

          LIMIT 1
        `,
        [
          destinationId,
        ],
      );


    const source =
      sourceRows[0];


    if (!source) {
      throw new AppError(
        "Destino no encontrado",
        404,
      );
    }


    const {
      rows,
    } =
      await this.pool.query(
        `
          WITH activity AS (
            SELECT
              dt.destino_id,

              SUM(
                dt.intenciones_visita
              )::numeric
                AS total_visit_intents,

              SUM(
                dt.visualizaciones
              )::int
                AS views,

              SUM(
                dt.favoritos
              )::int
                AS favorites

            FROM datos_turisticos dt

            WHERE dt.fecha >=
              $1::date

              AND dt.fecha <=
              $2::date

            GROUP BY
              dt.destino_id
          ),


          candidates AS (
            SELECT
              d.id
                AS destination_id,

              d.nombre
                AS name,

              u.municipio
                AS municipality,

              COALESCE(
                dm.calificacion_promedio,
                0
              )::float
                AS rating,

              COALESCE(
                activity.total_visit_intents,
                0
              )::numeric
                AS visit_intents,

              COALESCE(
                activity.views,
                0
              )::int
                AS views,

              COALESCE(
                activity.favorites,
                0
              )::int
                AS favorites,

              CASE
                WHEN dc.capacidad_diaria_estimada
                  IS NULL

                  THEN NULL

                ELSE ROUND(
                  (
                    COALESCE(
                      activity.total_visit_intents,
                      0
                    ) /

                    GREATEST(
                      1,

                      (
                        $2::date -
                        $1::date +
                        1
                      )
                    )
                  ) /

                  dc.capacidad_diaria_estimada *

                  100
                )::int
              END
                AS pressure_percentage,

              ROUND(
                (
                  6371 *

                  ACOS(
                    LEAST(
                      1,

                      GREATEST(
                        -1,

                        COS(
                          RADIANS(
                            $3::numeric
                          )
                        ) *

                        COS(
                          RADIANS(
                            u.latitud
                          )
                        ) *

                        COS(
                          RADIANS(
                            u.longitud
                          ) -

                          RADIANS(
                            $4::numeric
                          )
                        ) +

                        SIN(
                          RADIANS(
                            $3::numeric
                          )
                        ) *

                        SIN(
                          RADIANS(
                            u.latitud
                          )
                        )
                      )
                    )
                  )
                )::numeric,
                1
              )::float
                AS distance_km

            FROM destino d

            INNER JOIN ubicacion u
              ON u.id =
                d.ubicacion_id

            LEFT JOIN destino_metrica dm
              ON dm.destino_id =
                d.id

            LEFT JOIN activity
              ON activity.destino_id =
                d.id

            LEFT JOIN destino_capacidad dc
              ON dc.destino_id =
                d.id

            WHERE d.activo = true

              AND d.id <> $5

              AND d.categoria_id =
                $6
          )


          SELECT
            destination_id
              AS "destinationId",

            name,

            municipality,

            rating,

            visit_intents::int
              AS "visitIntents",

            views,

            favorites,

            pressure_percentage
              AS "pressurePercentage",

            distance_km
              AS "distanceKm"

          FROM candidates

          ORDER BY
            pressure_percentage
              ASC NULLS LAST,

            visit_intents
              ASC,

            rating
              DESC,

            distance_km
              ASC

          LIMIT 5
        `,
        [
          filters.from,

          filters.to,

          source.latitud,

          source.longitud,

          destinationId,

          source.categoria_id,
        ],
      );


    return {
      source: {
        destinationId:
          source.id,

        name:
          source.nombre,
      },


      methodology:
        "same_category_lower_pressure_distance_rating",


      alternatives:
        rows.map(
          (
            row: Record<
              string,
              unknown
            >,
          ) => {
            const pressure =
              row.pressurePercentage;


            let reason =
              "Experiencia similar de la misma categoría";


            if (
              pressure !== null &&
              pressure !== undefined &&
              Number(
                pressure,
              ) < 60
            ) {
              reason =
                "Experiencia similar con menor presión turística estimada";
            } else if (
              Number(
                row.rating ??
                  0,
              ) >= 4
            ) {
              reason =
                "Experiencia similar con buena calificación";
            }


            return {
              ...row,

              reason,
            };
          },
        ),
    };
  }


  private buildFilters(
    filters:
      AnalyticsFilters,
  ) {
    const {
      conditions,
      params,
    } =
      this.buildFilterParts(
        filters,
      );


    return {
      where:
        conditions.join(
          " AND ",
        ),

      params,
    };
  }


  private buildFilterParts(
    filters:
      AnalyticsFilters,
  ): {
    conditions:
      string[];

    params:
      Array<
        Date |
        string |
        number
      >;
  } {
    const params:
      Array<
        Date |
        string |
        number
      > = [
        filters.from,
        filters.to,
      ];


    const conditions = [
      "dt.fecha >= $1::date",

      "dt.fecha <= $2::date",
    ];


    if (
      filters.municipality
    ) {
      params.push(
        filters.municipality,
      );


      conditions.push(
        `dt.municipio = $${params.length}`,
      );
    }


    if (
      filters.categoryId
    ) {
      params.push(
        filters.categoryId,
      );


      conditions.push(
        `dt.categoria_id = $${params.length}`,
      );
    }


    return {
      conditions,
      params,
    };
  }
}
