export interface MediaServerLogin {
  readonly host: string;
  readonly apiKey: string;
  readonly basePath: string;
}

export class Constants {
  static readonly botToken: string = process.env.BOT_TOKEN!!;

  static readonly bot = Object.freeze({
    responses: Object.freeze({
      queue: Object.freeze({
        warning: "⚠️ Please contact admin for further details",
      }),
    }),
  });
  static readonly sonarr: MediaServerLogin = Object.freeze({
    host: process.env.SONARR_HOST!!,
    basePath: "/api/v3",
    apiKey: process.env.SONARR_API_KEY!!,
  });
  static readonly radarr: MediaServerLogin = Object.freeze({
    host: process.env.RADARR_HOST!!,
    basePath: "/api/v3",
    apiKey: process.env.RADARR_API_KEY!!,
  });
  static readonly allowedUsers: string[] = process.env.ALLOWED_USERS?.split(",") || [];
}
