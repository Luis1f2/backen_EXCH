import Stripe from 'stripe';

export class StripeService {
  private readonly client: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY no está configurado');
    }

    this.client = new Stripe(secretKey);
  }

  async createCheckoutSession(
    negocioId: string,
  ): Promise<string> {
    const frontendUrl =
      process.env.FRONTEND_URL?.trim() ||
      'http://localhost:5173';

    const priceId =
      process.env.STRIPE_PRICE_ID?.trim();

    if (!priceId) {
      throw new Error(
        'STRIPE_PRICE_ID no está configurado',
      );
    }

    const session =
      await this.client.checkout.sessions.create({
        mode: 'subscription',

        payment_method_types: [
          'card',
        ],

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        /*
         * Permite relacionar el Checkout
         * directamente con el negocio.
         */
        client_reference_id: negocioId,

        /*
         * Metadata de la sesión.
         */
        metadata: {
          negocioId,
        },

        /*
         * MUY IMPORTANTE:
         *
         * También guardamos negocioId dentro
         * de la suscripción.
         *
         * Así los eventos posteriores de Stripe:
         * - subscription.updated
         * - subscription.deleted
         *
         * pueden identificar el negocio.
         */
        subscription_data: {
          metadata: {
            negocioId,
          },
        },

        success_url:
          `${frontendUrl}/negocio/suscripcion/exito` +
          '?session_id={CHECKOUT_SESSION_ID}',

        cancel_url:
          `${frontendUrl}/negocio/suscripcion/cancelado`,
      });

    if (!session.url) {
      throw new Error(
        'Stripe no devolvió una URL de Checkout',
      );
    }

    return session.url;
  }

  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.client.subscriptions.retrieve(
      subscriptionId,
    );
  }

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET?.trim();

    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET no está configurado',
      );
    }

    return this.client.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
