export interface StreamUrlResult {
  url: string;
  referer: string;
}

/** Describes what a stream provider supports so the resolver can route intelligently. */
export interface StreamProviderCapabilities {
  /** Human-readable name for diagnostics and UI. */
  name: string;
  /** Whether this provider can resolve sub tracks. */
  supportsSub: boolean;
  /** Whether this provider can resolve dub tracks. */
  supportsDub: boolean;
  /** Quality tiers this provider is known to offer (e.g. [360, 720, 1080]). Empty = unknown. */
  knownQualities: number[];
  /** When true, this provider is experimental and may fail more often. */
  experimental?: boolean;
}

export type StreamErrorKind =
  | "no_stream"
  | "timeout"
  | "upstream_4xx"
  | "upstream_5xx"
  | "decode_failure"
  | "unknown";

export class StreamResolutionError extends Error {
  readonly kind: StreamErrorKind;
  readonly provider: string;
  readonly retryable: boolean;

  constructor(opts: { kind: StreamErrorKind; provider: string; message: string; retryable?: boolean }) {
    super(opts.message);
    this.name = "StreamResolutionError";
    this.kind = opts.kind;
    this.provider = opts.provider;
    this.retryable = opts.retryable ?? false;
  }
}

export interface StreamProvider {
  readonly capabilities: StreamProviderCapabilities;
  getStreamUrl(showId: string, episode: string, mode: "sub" | "dub"): Promise<StreamUrlResult>;
}
