import { Logger } from "winston";
import { LoggerFactory } from "../utils/logger-factory";
import { Constants } from "../utils/constants";
import { Bot, BotError, Context, session, SessionFlavor } from "grammy";
import { RadarrMediaService } from "./radarr-media-service";
import { MediaDownloadQueueItemTrackedStatus } from "./media-service";
import { SonarrMediaService } from "./sonarr-media-service";

const logger: Logger = LoggerFactory.getLogger("bot-service");

export type BasicContext = Context & SessionFlavor<SessionData>;

export enum Routes {
  queue = "/queue",
}

export enum SessionStateType {
  none = "none",
}

export interface SessionData {
  currentState: SessionStateType;
}

function initial(): SessionData {
  return { currentState: SessionStateType.none };
}

export class TelegramBotService {
  constructor(
    private radarrMediaService: RadarrMediaService,
    private sonarrMediaService: SonarrMediaService,
    private bot: Bot<BasicContext> = new Bot(Constants.botToken)
  ) {
    this.initBotMiddleware();
    this.initBotCommands();
    this.bot.api.setMyCommands([
      {
        command: Routes.queue,
        description: "Download queue",
      },
    ]);
    this.bot.start();
  }

  private static async handleDebugLogging(ctx: BasicContext, next: Function) {
    logger.debug(`Received message from: '${ctx.chat!!.id}', with state: '${ctx.session.currentState}'`);
    return await next();
  }

  private static async handleGuard(ctx: BasicContext, next: Function) {
    if (ctx.chat && ctx.chat.id) {
      if (Constants.allowedUsers.includes(ctx.chat.id.toString(10))) {
        return await next();
      }
    }
    logger.error(`User ${ctx.from?.id} is not authorized`);
  }

  private initBotMiddleware() {
    // Initial global middleware for bot
    this.bot.use(session({ initial }));
    this.bot.catch(async (errorHandler) => await this.handleError(errorHandler));
    this.bot.use(async (ctx: BasicContext, next: Function) => await TelegramBotService.handleDebugLogging(ctx, next));
    this.bot.use(async (ctx: BasicContext, next: Function) => await TelegramBotService.handleGuard(ctx, next));
  }

  private initBotCommands() {
    this.bot.hears(
      Routes.queue,
      async (ctx: BasicContext, next: Function) => await this.handleRequests(Routes.queue, ctx, next)
    );
  }

  private handleError = async (errorHandler: BotError<BasicContext>) => {
    logger.error(`Error occurred: ${errorHandler.error}`);
    await errorHandler.ctx.reply(Constants.bot.responses.error);
  };

  private async handleRequests(route: Routes, ctx: BasicContext, next: Function) {
    // This method is called for every command, more for testing purposes of security
    switch (route) {
      case Routes.queue:
        return await this.handleQueueRequest(ctx, next);
    }
  }

  private async handleQueueRequest(ctx: BasicContext, next: Function) {
    logger.info(`User ${ctx.chat!!.id} requested the download queue`);
    const radarrQueue = await this.radarrMediaService.getDownloadQueue();
    const sonarrQueue = await this.sonarrMediaService.getDownloadQueue();
    const combinedQueue = radarrQueue.concat(sonarrQueue);

    if (combinedQueue.length > 0) {
      const messages: string[] = [];
      for (const item of combinedQueue) {
        const message: string = `${Constants.bot.responses.queue.description(item.name)}${
          item.trackedStatus !== MediaDownloadQueueItemTrackedStatus.ok
            ? Constants.bot.responses.queue.warning
            : Constants.bot.responses.queue.downloading(item.estimatedCompletionTime)
        }`;
        messages.push(message);
      }
      await ctx.reply(messages.join("\n"));
    } else {
      await ctx.reply(Constants.bot.responses.queue.noItems);
    }
    return await next();
  }
}
