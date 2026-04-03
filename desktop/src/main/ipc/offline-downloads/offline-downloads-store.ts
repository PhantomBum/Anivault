import Store from "electron-store";

import type { OfflineDownloadItem } from "@/shared/offline-downloads-types";

type Schema = {
  items: OfflineDownloadItem[];
};

const store = new Store<Schema>({
  name: "offline-downloads-queue",
  defaults: { items: [] },
});

export function getOfflineDownloadItems(): OfflineDownloadItem[] {
  // electron-store typings surface get/set as any in this ESLint config
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
  const raw = store.get("items");
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
  if (!Array.isArray(raw)) return [];
  return raw as OfflineDownloadItem[];
}

function setItems(items: OfflineDownloadItem[]): void {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-call -- electron-store */
  store.set("items", items);
}

export function patchOfflineDownloadItem(
  id: string,
  patch: Partial<OfflineDownloadItem>
): OfflineDownloadItem | null {
  const items = getOfflineDownloadItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const next = { ...items[idx], ...patch, updatedAt: Date.now() };
  const copy = [...items];
  copy[idx] = next;
  setItems(copy);
  return next;
}

export function pushOfflineDownloadItem(item: OfflineDownloadItem): void {
  const items = getOfflineDownloadItems();
  setItems([item, ...items]);
}

export function removeOfflineDownloadItem(id: string): boolean {
  const items = getOfflineDownloadItems();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  setItems(next);
  return true;
}

export function clearCompletedOfflineDownloads(): void {
  const items = getOfflineDownloadItems().filter((i) => i.status !== "complete");
  setItems(items);
}
