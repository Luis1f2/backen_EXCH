import type { Pool } from "pg";

import { AppError } from "../errors/AppError.js";

interface UserOnboardingRow {
  onboarding_completado: boolean;
}

interface InterestRow {
  id: string;
  nombre: string;
  icono: string | null;
}

export interface UserInterest {
  id: string;
  name: string;
  icon: string | null;
}

export interface UserInterestsResult {
  onboardingCompleted: boolean;
  interests: UserInterest[];
}

export class GetUserInterests {
  constructor(
    private readonly pool: Pool
  ) {}

  async execute(
    userId: string
  ): Promise<UserInterestsResult> {
    /*
     * Primero verificamos que el usuario exista
     * y obtenemos el estado real del onboarding
     * desde PostgreSQL.
     */
    const { rows: userRows } =
      await this.pool.query<UserOnboardingRow>(
        `
          SELECT onboarding_completado
          FROM usuario
          WHERE id = $1
            AND activo = true
          LIMIT 1
        `,
        [userId]
      );

    const user = userRows[0];

    if (!user) {
      throw new AppError(
        "Usuario no encontrado",
        404
      );
    }

    /*
     * Recuperamos los intereses guardados
     * en usuario_interes.
     */
    const { rows: interestRows } =
      await this.pool.query<InterestRow>(
        `
          SELECT
            c.id,
            c.nombre,
            c.icono
          FROM usuario_interes ui
          INNER JOIN categoria c
            ON c.id = ui.categoria_id
          WHERE ui.usuario_id = $1
          ORDER BY c.nombre ASC
        `,
        [userId]
      );

    return {
      onboardingCompleted:
        Boolean(user.onboarding_completado),

      interests: interestRows.map(
        (interest) => ({
          id: interest.id,
          name: interest.nombre,
          icon: interest.icono,
        })
      ),
    };
  }
}