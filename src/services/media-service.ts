export interface MediaService {
  getDownloadQueue(): Promise<Array<MediaDownloadQueueItem>>;
}

export interface MediaDownloadQueueItem {
  name: string;
  clientStatus: MediaDownloadQueueItemClientStatus;
  trackedStatus: MediaDownloadQueueItemTrackedStatus | undefined;
  estimatedCompletionTime: string;
}

export enum MediaDownloadQueueItemClientStatus { // status for radarr
  paused = "paused",
  downloading = "downloading",
  completed = "completed",
  delay = "delay",
}

export enum MediaDownloadQueueItemTrackedStatus { // trackedDownloadStatus for radarr
  warning = "warning",
  ok = "ok",
  error = "error",
}
