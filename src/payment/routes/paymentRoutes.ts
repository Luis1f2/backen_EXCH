import {
  Router,
} from 'express';

import type {
  TokenService,
} from '../../user/application/ports/SecurityPorts.js';

import {
  createAuthenticateMiddleware,
} from '../../http/middlewares/createAuthenticateMiddleware.js';

import type {
  CreateCheckoutController,
} from '../controller/CreateCheckoutController.js';

import type {
  WebhookController,
} from '../controller/WebhookController.js';

import type {
  SubscriptionStatusController,
} from '../controller/SubscriptionStatusController.js';

interface PaymentControllers {
  checkout:
    CreateCheckoutController;

  subscription:
    SubscriptionStatusController;

  webhook:
    WebhookController;
}

export function createPaymentRoutes(
  controllers:
    PaymentControllers,

  tokenService:
    TokenService,
): Router {
  const router =
    Router();

  const authenticate =
    createAuthenticateMiddleware(
      tokenService,
    );

  /*
   * Consulta utilizada por el frontend
   * para saber si debe mostrar Premium.
   */
  router.get(
    '/subscription',
    authenticate,
    controllers
      .subscription
      .execute,
  );

  /*
   * Crea Stripe Checkout.
   */
  router.post(
    '/checkout',
    authenticate,
    controllers.checkout.execute,
  );

  /*
   * No lleva JWT.
   * Stripe autentica mediante
   * stripe-signature.
   */
  router.post(
    '/webhook',
    controllers.webhook.execute,
  );

  return router;
}
