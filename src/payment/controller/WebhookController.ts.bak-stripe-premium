import type { NextFunction, Request, Response } from 'express';
import type { Pool } from 'pg';
import type { StripeService } from '../StripeService.js';

export class WebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly pool: Pool,
  ) {}

  execute = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = request.headers['stripe-signature'] as string;
      const event = this.stripeService.constructWebhookEvent(request.body as Buffer, signature);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: { negocioId?: string } };
        const negocioId = session.metadata?.negocioId;

        if (negocioId) {
          await this.pool.query(
            'UPDATE negocio_turistico SET esta_verificado = true WHERE id = $1',
            [negocioId],
          );
        }
      }

      response.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  };
}
