export interface MediaService {
  getDownloadQueue(): Promise<Array<MediaDownloadQueueItem>>;
}

export interface MediaDownloadQueueItem {
  name: string;
  clientStatus: MediaDownloadQueueItemClientStatus;
  trackedStatus: MediaDownloadQueueItemTrackedStatus;
  estimatedCompletionTime: string;
}

export enum MediaDownloadQueueItemClientStatus { // status for radarr
  paused = "Paused",
  downloading = "Downloading",
  completed = "Completed",
}

export enum MediaDownloadQueueItemTrackedStatus { // trackedDownloadStatus for radarr
  warning = "Warning",
  ok = "Ok",
  error = "Error",
}
