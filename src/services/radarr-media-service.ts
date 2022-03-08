import { MediaDownloadQueueItem, MediaService } from "./media-service";
import { RadarrWebClient } from "../web-client/radarr-web-client";

export class RadarrMediaService implements MediaService {
  private radarrWebClient = new RadarrWebClient();

  async getDownloadQueue(): Promise<Array<MediaDownloadQueueItem>> {
    return this.radarrWebClient.getDownloadQueue();
  }
}
