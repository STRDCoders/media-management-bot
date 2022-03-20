import { MediaWebClient } from "./web-client";
import {
  MediaDownloadQueueItem,
  MediaDownloadQueueItemClientStatus,
  MediaDownloadQueueItemTrackedStatus,
} from "../services/media-service";
import axios from "axios";
import { Constants } from "../utils/constants";
import { Logger } from "winston";
import { LoggerFactory } from "../utils/logger-factory";

const logger: Logger = LoggerFactory.getLogger("radarr-web-client");

export class RadarrWebClient implements MediaWebClient {
  private axiosClient = axios.create({
    baseURL: `${Constants.radarr.host}${Constants.radarr.basePath}`,
    timeout: 3000,
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "Content-Type": "application/json",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: "application/json",
    },
    params: {
      apiKey: Constants.radarr.apiKey,
    },
  });

  async getDownloadQueue(): Promise<MediaDownloadQueueItem[]> {
    logger.debug("Fetching radarr download queue");
    const response = await this.axiosClient.get("queue");
    return response.data.records.map(
      (queueRecord: RadarrQueueRecord) =>
        <MediaDownloadQueueItem>{
          clientStatus: queueRecord.status,
          trackedStatus: queueRecord.trackedDownloadStatus,
          estimatedCompletionTime: queueRecord.timeleft,
          name: queueRecord.title,
        }
    );
  }
}

// Create a type for the "records" property objects from Radarr API request of "/queue"
export interface RadarrQueueRecord {
  title: string;
  timeleft: string;
  status: MediaDownloadQueueItemClientStatus;
  trackedDownloadStatus: MediaDownloadQueueItemTrackedStatus;
}
