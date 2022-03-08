import { MediaDownloadQueueItem } from "../services/media-service";

export interface MediaWebClient {
  getDownloadQueue(): Promise<MediaDownloadQueueItem[]>;
}
