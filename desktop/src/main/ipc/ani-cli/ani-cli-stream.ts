export {
  getStreamUrl,
  normalizeStreamErrorMessage,
  registerStreamProvider,
  getRegisteredProviders,
  getRecentStreamDiagnostics,
  clearStreamDiagnostics,
} from "./stream-resolver";
export type { StreamDiagnostic } from "./stream-resolver";
export type {
  StreamUrlResult,
  StreamProvider,
  StreamProviderCapabilities,
  StreamErrorKind,
} from "./stream-providers/stream-provider";
export { StreamResolutionError } from "./stream-providers/stream-provider";
