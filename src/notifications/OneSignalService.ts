const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID ??
  "ee3de697-3022-4731-8d8c-759bfad87fec";

const ONESIGNAL_API_URL =
  "https://api.onesignal.com/notifications";

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

function notificationBody(
  title: string,
  description: string | null,
): string {
  const normalizedDescription =
    description?.replace(/\s+/g, " ").trim() ?? "";

  if (!normalizedDescription) {
    return title;
  }

  const maxDescriptionLength = 140;
  const shortDescription =
    normalizedDescription.length > maxDescriptionLength
      ? `${normalizedDescription.slice(0, maxDescriptionLength - 1).trimEnd()}…`
      : normalizedDescription;

  return `${title} — ${shortDescription}`;
}

export class OneSignalService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey =
      process.env.ONESIGNAL_REST_API_KEY ?? "";
  }

  async notifyNewPromotion(
    title: string,
    description: string | null,
    promotionId: string,
  ): Promise<void> {
    await this.sendToAll({
      title:
        "Nueva promoción en ExploraChiapas",
      body: notificationBody(
        title,
        description,
      ),
      data: {
        type: "promotion",
        promotionId,
      },
    });
  }

  async notifyNewEvent(
    title: string,
    description: string | null,
    eventId: string,
  ): Promise<void> {
    await this.sendToAll({
      title:
        "Nuevo evento en ExploraChiapas",
      body: notificationBody(
        title,
        description,
      ),
      data: {
        type: "event",
        eventId,
      },
    });
  }

  async notifyEventToUsers(
    userIds: string[],
    title: string,
    eventId?: string,
  ): Promise<void> {
    await this.sendToUsers(
      userIds,
      {
        title:
          "Nuevo evento para ti",
        body: title,
        data: {
          type: "event",
          eventId:
            eventId ?? null,
        },
      },
    );
  }

  async sendToAll(
    options: SendNotificationOptions,
  ): Promise<void> {
    if (!this.apiKey) {
      console.warn(
        "OneSignal deshabilitado: " +
          "falta ONESIGNAL_REST_API_KEY",
      );

      return;
    }

    await this.send({
      app_id: ONESIGNAL_APP_ID,
      target_channel: "push",
      included_segments: [
        "Subscribed Users",
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

  async sendToUsers(
    userIds: string[],
    options: SendNotificationOptions,
  ): Promise<void> {
    if (!this.apiKey) {
      console.warn(
        "OneSignal deshabilitado: " +
          "falta ONESIGNAL_REST_API_KEY",
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
        "OneSignal: no hay destinatarios",
      );

      return;
    }

    await this.send({
      app_id: ONESIGNAL_APP_ID,
      target_channel: "push",
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
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Key ${this.apiKey}`,
          },
          body:
            JSON.stringify(payload),
        },
      );

      let result: OneSignalResponse = {};

      try {
        result =
          (await response.json()) as OneSignalResponse;
      } catch {
        // OneSignal puede responder sin JSON.
      }

      if (!response.ok) {
        console.error(
          "Error enviando OneSignal:",
          response.status,
          result,
        );

        return;
      }

      if (!result.id) {
        console.warn(
          "OneSignal aceptó la solicitud " +
            "pero no creó la notificación:",
          result,
        );

        return;
      }

      console.log(
        "Notificación OneSignal enviada:",
        result.id,
      );
    } catch (error) {
      /*
       * Una falla externa no debe revertir
       * el evento o la promoción ya guardados.
       */
      console.error(
        "Error de conexión con OneSignal:",
        error,
      );
    }
  }
}