import { Router } from 'express';
import type { TokenService } from '../../user/application/ports/SecurityPorts.js';
import { createAuthenticateMiddleware } from '../../http/middlewares/createAuthenticateMiddleware.js';
import type { CreateCheckoutController } from '../controller/CreateCheckoutController.js';
import type { WebhookController } from '../controller/WebhookController.js';

interface PaymentControllers {
  checkout: CreateCheckoutController;
  webhook: WebhookController;
}

export function createPaymentRoutes(controllers: PaymentControllers, tokenService: TokenService): Router {
  const router = Router();
  const authenticate = createAuthenticateMiddleware(tokenService);

  router.post('/checkout', authenticate, controllers.checkout.execute);
  router.post('/webhook', controllers.webhook.execute);

  return router;
}
