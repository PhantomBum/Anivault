/** Human-readable suffix for HTMLMediaElement.error (video/audio). */
export function describeMediaErrorSuffix(el: HTMLVideoElement | HTMLAudioElement | null): string {
  const err = el?.error;
  if (!err) return "";
  switch (err.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return " (playback aborted)";
    case MediaError.MEDIA_ERR_NETWORK:
      return " (network error while loading media)";
    case MediaError.MEDIA_ERR_DECODE:
      return " (decode error — stream may be corrupt or unsupported)";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return " (format not supported or unreadable URL)";
    default:
      return ` (media error ${err.code})`;
  }
}
