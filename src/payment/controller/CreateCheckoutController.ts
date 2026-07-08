import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../http/middlewares/AuthenticatedRequest.js';
import type { StripeService } from '../StripeService.js';
import type { BusinessRepository } from '../../business/domain/repositories/BusinessRepository.js';

export class CreateCheckoutController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly businessRepository: BusinessRepository,
  ) {}

  execute = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      const businesses = await this.businessRepository.listByAdministratorId(userId);

      if (businesses.length === 0) {
        response.status(404).json({ success: false, message: 'No tienes un negocio registrado' });
        return;
      }

      const url = await this.stripeService.createCheckoutSession(businesses[0].id);
      response.status(200).json({ success: true, url });
    } catch (error) {
      next(error);
    }
  };
}
