import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import type {
  Pool,
} from 'pg';

import type {
  AuthenticatedRequest,
} from '../../http/middlewares/AuthenticatedRequest.js';

import type {
  BusinessRepository,
} from '../../business/domain/repositories/BusinessRepository.js';

interface SubscriptionRow {
  estado: string;
  es_premium: boolean;
}

export class SubscriptionStatusController {
  constructor(
    private readonly businessRepository:
      BusinessRepository,

    private readonly pool:
      Pool,
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        (request as AuthenticatedRequest)
          .userId;

      const businesses =
        await this.businessRepository
          .listByAdministratorId(userId);

      const business =
        businesses[0];

      /*
       * Un admin sin negocio simplemente
       * no tiene Premium disponible.
       */
      if (!business) {
        response.status(200).json({
          success: true,
          data: {
            businessId: null,
            isPremium: false,
            status: 'no_business',
            canManage: false,
          },
        });

        return;
      }

      const {
        rows,
      } =
        await this.pool
          .query<SubscriptionRow>(
            `
            SELECT
              estado,
              es_premium
            FROM suscripcion_negocio
            WHERE negocio_id = $1
            LIMIT 1
            `,
            [
              business.id,
            ],
          );

      const subscription =
        rows[0];

      const status =
        subscription?.estado ??
        'inactive';

      const isPremium =
        Boolean(
          subscription?.es_premium,
        ) &&
        (
          status === 'active' ||
          status === 'trialing'
        );

      response.status(200).json({
        success: true,
        data: {
          businessId:
            business.id,

          isPremium,

          status,

          canManage: true,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
