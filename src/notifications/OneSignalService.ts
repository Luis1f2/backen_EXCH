const ONESIGNAL_APP_ID = 'ee3de697-3022-4731-8d8c-759bfad87fec';
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

export class OneSignalService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.ONESIGNAL_REST_API_KEY ?? '';
  }

  async notifyNewPromotion(titulo: string, negocioNombre: string | null): Promise<void> {
    if (!this.apiKey) return;

    const body = negocioNombre ? `${negocioNombre}: ${titulo}` : titulo;

    await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${this.apiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { es: 'Nueva Promoción en ExploraChiapas' },
        contents: { es: body },
      }),
    }).catch(() => {});
  }
}
