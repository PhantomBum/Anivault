import React, { useEffect, useState } from "react";

import { Button } from "@/renderer/components/ui/button";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/renderer/components/ui/dialog";

/**
 * Newer GitHub release (manual link) and Squirrel update ready (restart to apply).
 */
export function UpdateAvailableDialog() {
  const [githubOpen, setGithubOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null);

  useEffect(() => {
    void window.app.checkForUpdate().then((result) => {
      if (result.updateAvailable && result.releaseUrl && result.latestVersion) {
        setLatestVersion(result.latestVersion);
        setCurrentVersion(result.currentVersion);
        setReleaseUrl(result.releaseUrl);
        setGithubOpen(true);
      }
    });
  }, []);

  useEffect(() => {
    const unsub = window.app.onUpdateDownloaded(() => {
      setRestartOpen(true);
    });
    return unsub;
  }, []);

  return (
    <>
      <Dialog open={githubOpen} onOpenChange={setGithubOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Update available</DialogTitle>
            <DialogDescription>
              A newer version is available on GitHub
              {latestVersion ? ` (v${latestVersion})` : ""}.
              {currentVersion ? ` You are on v${currentVersion}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Later</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (releaseUrl) void window.urlOpener.openUrl(releaseUrl);
                setGithubOpen(false);
              }}
            >
              View release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restartOpen} onOpenChange={setRestartOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Update downloaded</DialogTitle>
            <DialogDescription>
              Restart {APP_DISPLAY_NAME} to install the new version. Your session will reload after the update.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">Later</Button>
            </DialogClose>
            <Button
              onClick={() => {
                void window.app.quitAndInstall();
              }}
            >
              Restart and update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
