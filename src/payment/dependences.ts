import type {
  Pool,
} from 'pg';

import {
  JwtTokenService,
} from '../user/infrastructure/security/SecurityAdapters.js';

import {
  StripeService,
} from './StripeService.js';

import {
  CreateCheckoutController,
} from './controller/CreateCheckoutController.js';

import {
  WebhookController,
} from './controller/WebhookController.js';

import {
  SubscriptionStatusController,
} from './controller/SubscriptionStatusController.js';

import {
  MySqlBusinessRepository,
} from '../business/infrastructure/mysql/MySqlBusinessRepository.js';

import {
  createPaymentRoutes,
} from './routes/paymentRoutes.js';

export function createPaymentModule(
  pool: Pool,
  jwtSecret: string,
) {
  const stripeService =
    new StripeService();

  const businessRepository =
    new MySqlBusinessRepository(
      pool,
    );

  const tokenService =
    new JwtTokenService(
      jwtSecret,
    );

  const controllers = {
    checkout:
      new CreateCheckoutController(
        stripeService,
        businessRepository,
        pool,
      ),

    subscription:
      new SubscriptionStatusController(
        businessRepository,
        pool,
      ),

    webhook:
      new WebhookController(
        stripeService,
        pool,
      ),
  };

  return createPaymentRoutes(
    controllers,
    tokenService,
  );
}
