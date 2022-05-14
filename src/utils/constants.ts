export interface MediaServerLogin {
  readonly host: string;
  readonly apiKey: string;
  readonly basePath: string;
  readonly queuePageSize: number;
}

export class Constants {
  static readonly botToken: string = process.env.BOT_TOKEN!!;

  static readonly bot = Object.freeze({
    responses: Object.freeze({
      error: "An error occurred. Please try again later.",
      queue: Object.freeze({
        noItems: "No items in download queue",
        description: (title: string) => `${title} - `,
        warning: "⚠️ Contact admin",
        downloading: (remainingTime: string) => `📥 Downloading(${remainingTime} remaining)`,
        delay: (remainingTime: string) => `⏳️Waiting for better quality(${remainingTime} remaining)`,
      }),
    }),
  });
  static readonly sonarr: MediaServerLogin = Object.freeze({
    host: process.env.SONARR_HOST!!,
    basePath: "/api/v3",
    apiKey: process.env.SONARR_API_KEY!!,
    queuePageSize: Number.isInteger(parseInt(process.env.SONARR_QUEUE_SIZE!!, 10))
      ? parseInt(process.env.QUEUE_SIZE!!, 10)
      : 100,
  });
  static readonly radarr: MediaServerLogin = Object.freeze({
    host: process.env.RADARR_HOST!!,
    basePath: "/api/v3",
    apiKey: process.env.RADARR_API_KEY!!,
    queuePageSize: Number.isInteger(parseInt(process.env.RADARR_QUEUE_SIZE!!, 10))
      ? parseInt(process.env.QUEUE_SIZE!!, 10)
      : 100,
  });
  static readonly allowedUsers: string[] = process.env.ALLOWED_USERS?.split(",") || [];
}
