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

const logger: Logger = LoggerFactory.getLogger("sonarr-web-client");

export class SonarrWebClient implements MediaWebClient {
  private axiosClient = axios.create({
    baseURL: `${Constants.sonarr.host}${Constants.sonarr.basePath}`,
    timeout: 3000,
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "Content-Type": "application/json",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: "application/json",
    },
    params: {
      apiKey: Constants.sonarr.apiKey,
    },
  });

  async getDownloadQueue(): Promise<MediaDownloadQueueItem[]> {
    logger.debug("Fetching sonarr download queue");

    const seriesList: SonarrSeriesRecord[] = await this.getAllSeries();
    const queueResponse = await this.axiosClient.get(`queue?pageSize=${Constants.radarr.queuePageSize}`);
    const episodeMetadata: SonarrEpisodeRecord[] = await this.getEpisodesMetadata(
      queueResponse.data.records.map((item: SonarrQueueRecord) => item.episodeId)
    );

    const seriesDict = Object.assign({}, ...seriesList.map((x) => ({ [x.id]: x })));
    const episodeDict = Object.assign({}, ...episodeMetadata.map((x) => ({ [x.id]: x })));

    return queueResponse.data.records.map(
      (queueRecord: SonarrQueueRecord) =>
        <MediaDownloadQueueItem>{
          clientStatus: queueRecord.status,
          trackedStatus: queueRecord.trackedDownloadStatus,
          estimatedCompletionTime: queueRecord.timeleft,
          name: `${seriesDict[queueRecord.seriesId].title} - Season: ${
            episodeDict[queueRecord.episodeId].seasonNumber
          } Episode: ${episodeDict[queueRecord.episodeId].episodeNumber}`,
        }
    );
  }

  async getEpisodesMetadata(episodeIds: number[]): Promise<SonarrEpisodeRecord[]> {
    logger.debug("Fetching sonarr download queue");
    const [firstEpisodeId, ...restEpisodeIds] = episodeIds;
    return await this.axiosClient.get(
      `episode?episodeIds=${firstEpisodeId}${restEpisodeIds.map((id) => `&${id}`).join("")}`
    );
  }

  async getAllSeries(): Promise<SonarrSeriesRecord[]> {
    logger.debug("Fetching sonarr series list");
    return await this.axiosClient.get("series");
  }
}

// Create a type for the "records" property objects from Radarr API request of "/queue"
interface SonarrQueueRecord {
  episodeId: number;
  seriesId: number;
  timeleft: string;
  status: MediaDownloadQueueItemClientStatus;
  trackedDownloadStatus: MediaDownloadQueueItemTrackedStatus;
}

interface SonarrEpisodeRecord {
  id: number;
  seasonNumber: number;
  sceneEpisodeNumber: number;
}

interface SonarrSeriesRecord {
  title: string;
  id: number;
}
