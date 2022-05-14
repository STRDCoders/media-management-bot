import { MediaDownloadQueueItem, MediaService } from "./media-service";
import { SonarrWebClient } from "../web-client/sonarr-web-client";

export class SonarrMediaService implements MediaService {
  private sonarrWebClient = new SonarrWebClient();

  async getDownloadQueue(): Promise<Array<MediaDownloadQueueItem>> {
    return this.sonarrWebClient.getDownloadQueue();
  }
}
