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
    const episodeIds = queueResponse.data.records.map((item: SonarrQueueRecord) => item.episodeId);
    const episodeMetadata: SonarrEpisodeRecord[] = await this.getEpisodesMetadata(episodeIds);
    // convert seriesList from array of objects to object of objects where the key is the id of the series and the value is the object itself
    const seriesMap: { [key: number]: SonarrSeriesRecord } = seriesList.reduce(
      (acc: { [key: number]: SonarrSeriesRecord }, series: SonarrSeriesRecord) => {
        acc[series.id] = series;
        return acc;
      },
      {}
    );
    const episodeMap: { [key: number]: SonarrEpisodeRecord } = episodeMetadata.reduce(
      (acc: { [key: number]: SonarrEpisodeRecord }, episode: SonarrEpisodeRecord) => {
        acc[episode.id] = episode;
        return acc;
      },
      {}
    );
    console.log(seriesMap);
    console.log(episodeMap);

    return queueResponse.data.records.map(
      (queueRecord: SonarrQueueRecord) =>
        <MediaDownloadQueueItem>{
          clientStatus: queueRecord.status,
          trackedStatus: queueRecord.trackedDownloadStatus,
          estimatedCompletionTime: queueRecord.timeleft,
          name: `${seriesMap[queueRecord.seriesId].title} - Season: ${
            episodeMap[queueRecord.episodeId].seasonNumber
          } Episode: ${episodeMap[queueRecord.episodeId].episodeNumber}`,
        }
    );
  }

  async getEpisodesMetadata(episodeIds: number[]): Promise<SonarrEpisodeRecord[]> {
    logger.debug("Fetching sonarr download queue for episodes");
    const [firstEpisodeId, ...restEpisodeIds] = episodeIds;
    const response = await this.axiosClient.get(
      `episode?episodeIds=${firstEpisodeId}${restEpisodeIds.map((id) => `&episodeIds=${id}`).join("")}`
    );
    return response.data;
  }

  async getAllSeries(): Promise<SonarrSeriesRecord[]> {
    logger.debug("Fetching sonarr series list");
    const response = await this.axiosClient.get("series");
    return response.data;
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
  episodeNumber: number;
}

interface SonarrSeriesRecord {
  title: string;
  id: number;
}
