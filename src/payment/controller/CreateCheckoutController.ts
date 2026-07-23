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
  StripeService,
} from '../StripeService.js';

import type {
  BusinessRepository,
} from '../../business/domain/repositories/BusinessRepository.js';

export class CreateCheckoutController {
  constructor(
    private readonly stripeService:
      StripeService,

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

      if (!business) {
        response.status(404).json({
          success: false,
          message:
            'No tienes un negocio registrado',
        });

        return;
      }

      /*
       * Evita crear otra suscripción
       * si el negocio ya tiene Premium activo.
       */
      const existingSubscription =
        await this.pool.query(
          `
          SELECT 1
          FROM suscripcion_negocio
          WHERE negocio_id = $1
            AND es_premium = true
            AND estado IN (
              'active',
              'trialing'
            )
          LIMIT 1
          `,
          [
            business.id,
          ],
        );

      if (
        (existingSubscription.rowCount ?? 0) > 0
      ) {
        response.status(409).json({
          success: false,
          message:
            'Este negocio ya tiene una suscripción Premium activa',
        });

        return;
      }

      const url =
        await this.stripeService
          .createCheckoutSession(
            business.id,
          );

      response.status(200).json({
        success: true,
        url,
      });
    } catch (error) {
      next(error);
    }
  };
}
