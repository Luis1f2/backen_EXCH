import Stripe from 'stripe';

export class StripeService {
  private readonly client: Stripe;

  constructor() {
    this.client = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
  }

  async createCheckoutSession(negocioId: string): Promise<string> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const priceId = process.env.STRIPE_PRICE_ID ?? '';

    const session = await this.client.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { negocioId },
      success_url: `${frontendUrl}/negocio/suscripcion/exito`,
      cancel_url: `${frontendUrl}/negocio/suscripcion/cancelado`,
    });

    return session.url!;
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    return this.client.webhooks.constructEvent(payload, signature, secret);
  }
}
