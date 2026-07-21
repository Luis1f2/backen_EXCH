const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID ??
  'ee3de697-3022-4731-8d8c-759bfad87fec';

const ONESIGNAL_API_URL =
  'https://api.onesignal.com/notifications';

interface NotificationData {
  [key: string]:
    | string
    | number
    | boolean
    | null;
}

interface SendNotificationOptions {
  title: string;
  body: string;
  data?: NotificationData;
}

interface OneSignalResponse {
  id?: string;
  errors?: unknown;
}

export class OneSignalService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey =
      process.env.ONESIGNAL_REST_API_KEY ?? '';
  }

  /**
   * Notifica una nueva promoción
   * a todos los usuarios suscritos.
   */
  async notifyNewPromotion(
    titulo: string,
    negocioNombre: string | null,
    promotionId?: string,
  ): Promise<void> {
    const body = negocioNombre
      ? `${negocioNombre}: ${titulo}`
      : titulo;

    await this.sendToAll({
      title:
        'Nueva promoción en ExploraChiapas',
      body,
      data: {
        type: 'promotion',
        promotionId:
          promotionId ?? null,
      },
    });
  }

  /**
   * Notifica un nuevo evento
   * a todos los usuarios.
   *
   * Podemos usar este método como fallback
   * cuando el evento no tenga categoría.
   */
  async notifyNewEvent(
    titulo: string,
    eventId?: string,
  ): Promise<void> {
    await this.sendToAll({
      title:
        'Nuevo evento en ExploraChiapas',
      body: titulo,
      data: {
        type: 'event',
        eventId: eventId ?? null,
      },
    });
  }

  /**
   * Envía un evento solamente
   * a usuarios concretos.
   *
   * userIds son UUID de tabla usuario,
   * registrados en móvil mediante:
   *
   * OneSignal.login(usuario.id)
   */
  async notifyEventToUsers(
    userIds: string[],
    titulo: string,
    eventId?: string,
  ): Promise<void> {
    await this.sendToUsers(
      userIds,
      {
        title:
          'Nuevo evento para ti',
        body: titulo,
        data: {
          type: 'event',
          eventId:
            eventId ?? null,
        },
      },
    );
  }

  /**
   * Enviar a todos los usuarios
   * actualmente suscritos.
   */
  async sendToAll(
    options: SendNotificationOptions,
  ): Promise<void> {
    if (!this.apiKey) {
      console.warn(
        'OneSignal deshabilitado: ' +
          'falta ONESIGNAL_REST_API_KEY',
      );

      return;
    }

    await this.send({
      app_id: ONESIGNAL_APP_ID,

      target_channel: 'push',

      included_segments: [
        'Subscribed Users',
      ],

      headings: {
        en: options.title,
        es: options.title,
      },

      contents: {
        en: options.body,
        es: options.body,
      },

      ...(options.data
        ? {
            data: options.data,
          }
        : {}),
    });
  }

  /**
   * Enviar solamente a UUID concretos.
   */
  async sendToUsers(
    userIds: string[],
    options: SendNotificationOptions,
  ): Promise<void> {
    if (!this.apiKey) {
      console.warn(
        'OneSignal deshabilitado: ' +
          'falta ONESIGNAL_REST_API_KEY',
      );

      return;
    }

    const uniqueUserIds = [
      ...new Set(
        userIds
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ];

    if (uniqueUserIds.length === 0) {
      console.warn(
        'OneSignal: no hay destinatarios',
      );

      return;
    }

    await this.send({
      app_id: ONESIGNAL_APP_ID,

      target_channel: 'push',

      include_aliases: {
        external_id: uniqueUserIds,
      },

      headings: {
        en: options.title,
        es: options.title,
      },

      contents: {
        en: options.body,
        es: options.body,
      },

      ...(options.data
        ? {
            data: options.data,
          }
        : {}),
    });
  }

  private async send(
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const response = await fetch(
        ONESIGNAL_API_URL,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Key ${this.apiKey}`,
          },

          body:
            JSON.stringify(payload),
        },
      );

      let result:
        OneSignalResponse = {};

      try {
        result =
          (await response.json()) as OneSignalResponse;
      } catch {
        // Respuesta sin JSON.
      }

      if (!response.ok) {
        console.error(
          'Error enviando OneSignal:',
          response.status,
          result,
        );

        return;
      }

      if (!result.id) {
        console.warn(
          'OneSignal aceptó la solicitud ' +
            'pero no creó notificación:',
          result,
        );

        return;
      }

      console.log(
        'Notificación OneSignal enviada:',
        result.id,
      );
    } catch (error) {
      /*
       * Una falla en OneSignal
       * NO debe tumbar la creación
       * de eventos/promociones.
       */
      console.error(
        'Error de conexión con OneSignal:',
        error,
      );
    }
  }
}