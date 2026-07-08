import type { Pool } from 'mysql2/promise';
import { JwtTokenService } from '../user/infrastructure/security/SecurityAdapters.js';
import { StripeService } from './StripeService.js';
import { CreateCheckoutController } from './controller/CreateCheckoutController.js';
import { WebhookController } from './controller/WebhookController.js';
import { MySqlBusinessRepository } from '../business/infrastructure/mysql/MySqlBusinessRepository.js';
import { createPaymentRoutes } from './routes/paymentRoutes.js';

export function createPaymentModule(pool: Pool, jwtSecret: string) {
  const stripeService = new StripeService();
  const businessRepository = new MySqlBusinessRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    checkout: new CreateCheckoutController(stripeService, businessRepository),
    webhook: new WebhookController(stripeService, pool),
  };

  return createPaymentRoutes(controllers, tokenService);
}
