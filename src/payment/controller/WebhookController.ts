import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import type {
  Pool,
} from 'pg';

import Stripe from 'stripe';

import type {
  StripeService,
} from '../StripeService.js';

export class WebhookController {
  constructor(
    private readonly stripeService:
      StripeService,

    private readonly pool:
      Pool,
  ) {}

  private extractStripeId(
    value: unknown,
  ): string | null {
    if (
      typeof value === 'string'
    ) {
      return value;
    }

    if (
      value &&
      typeof value === 'object' &&
      'id' in value
    ) {
      const id =
        (value as {
          id?: unknown;
        }).id;

      if (
        typeof id === 'string'
      ) {
        return id;
      }
    }

    return null;
  }

  private async syncSubscription(
    subscription:
      Stripe.Subscription,

    fallbackNegocioId?:
      string,
  ): Promise<void> {
    const negocioId =
      subscription.metadata
        ?.negocioId ||
      fallbackNegocioId;

    /*
     * No sincronizamos una suscripción
     * que no pueda relacionarse con
     * un negocio de ExploraChiapas.
     */
    if (!negocioId) {
      console.warn(
        'Stripe subscription sin negocioId:',
        subscription.id,
      );

      return;
    }

    const customerId =
      this.extractStripeId(
        subscription.customer,
      );

    const priceId =
      subscription.items
        .data[0]
        ?.price
        ?.id ??
      null;

    const status =
      subscription.status;

    /*
     * Stripe considera Premium habilitado
     * únicamente en estados utilizables.
     */
    const isPremium =
      status === 'active' ||
      status === 'trialing';

    await this.pool.query(
      `
      INSERT INTO suscripcion_negocio (
        negocio_id,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        estado,
        es_premium,
        fecha_actualizacion
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        NOW()
      )

      ON CONFLICT (negocio_id)
      DO UPDATE SET
        stripe_customer_id =
          EXCLUDED.stripe_customer_id,

        stripe_subscription_id =
          EXCLUDED.stripe_subscription_id,

        stripe_price_id =
          EXCLUDED.stripe_price_id,

        estado =
          EXCLUDED.estado,

        es_premium =
          EXCLUDED.es_premium,

        fecha_actualizacion =
          NOW()
      `,
      [
        negocioId,
        customerId,
        subscription.id,
        priceId,
        status,
        isPremium,
      ],
    );
  }

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const signatureHeader =
        request.headers[
          'stripe-signature'
        ];

      const signature =
        Array.isArray(
          signatureHeader,
        )
          ? signatureHeader[0]
          : signatureHeader;

      if (!signature) {
        response.status(400).json({
          success: false,
          message:
            'Falta la firma de Stripe',
        });

        return;
      }

      const event =
        this.stripeService
          .constructWebhookEvent(
            request.body as Buffer,
            signature,
          );

      /*
       * Primer pago completado.
       */
      if (
        event.type ===
        'checkout.session.completed'
      ) {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        const negocioId =
          session.metadata
            ?.negocioId;

        const subscriptionId =
          this.extractStripeId(
            session.subscription,
          );

        if (
          negocioId &&
          subscriptionId
        ) {
          const subscription =
            await this.stripeService
              .retrieveSubscription(
                subscriptionId,
              );

          await this.syncSubscription(
            subscription,
            negocioId,
          );
        }
      }

      /*
       * Mantiene el estado local sincronizado
       * durante toda la vida de la suscripción.
       */
      if (
        event.type ===
          'customer.subscription.created' ||
        event.type ===
          'customer.subscription.updated' ||
        event.type ===
          'customer.subscription.deleted'
      ) {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        await this.syncSubscription(
          subscription,
        );
      }

      response.status(200).json({
        received: true,
      });
    } catch (error) {
      next(error);
    }
  };
}
