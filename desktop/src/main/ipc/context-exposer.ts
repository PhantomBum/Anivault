import { exposeAnivaultContext } from "./anivault/anivault-context";
import { exposeSecurityContext } from "./security/security-context";
import { exposeAniCliContext } from "./ani-cli/ani-cli-context";
import { exposeAppContext } from "./app/app-context";
import { exposeExternalContext } from "./external/external-context";
import { exposeRecentlyWatchedContext } from "./recently-watched/recently-watched-context";
import { exposeWatchProgressContext } from "./watch-progress/watch-progress-context";
import { exposeThemeContext } from "./theme/theme-context";
import { exposeOfflineDownloadsContext } from "./offline-downloads/offline-downloads-context";
import { exposeWindowControls } from "./window/window-context";

export default function exposeContexts() {
  exposeThemeContext();
  exposeSecurityContext();
  exposeAnivaultContext();
  exposeAniCliContext();
  exposeRecentlyWatchedContext();
  exposeWatchProgressContext();
  exposeOfflineDownloadsContext();
  exposeExternalContext();
  exposeAppContext();
  exposeWindowControls();
}
