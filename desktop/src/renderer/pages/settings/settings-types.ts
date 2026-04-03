import type { TFunction } from "i18next";

import type { AnivaultStoreSchema } from "@/shared/anivault-types";

export type SettingsTranslate = TFunction;

export type PersistConfig = (partial: Partial<AnivaultStoreSchema>) => Promise<void>;
