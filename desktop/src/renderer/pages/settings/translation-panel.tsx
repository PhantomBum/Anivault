import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import { translateText } from "@/renderer/lib/translation";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";
import type { i18n as I18nType } from "i18next";
import React, { useState } from "react";

import type { PersistConfig } from "./settings-types";

type Props = {
  cfg: AnivaultStoreSchema;
  persist: PersistConfig;
  i18n: I18nType;
};

export function TranslationSettingsPanel({ cfg, persist, i18n }: Props) {
  const [translateSample, setTranslateSample] = useState<string | null>(null);

  return (
    <>
      <div id="settings-translation-provider" className="space-y-3 scroll-mt-28">
        <span className="text-sm font-medium text-[var(--av-muted)]">Provider</span>
        <Select
          value={cfg.translationProvider}
          onValueChange={(v) =>
            void persist({ translationProvider: v as AnivaultStoreSchema["translationProvider"] })
          }
        >
          <SelectTrigger className="h-12 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="deepl">DeepL (API key)</SelectItem>
            <SelectItem value="google">Google Cloud Translate (API key)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div id="settings-translation-key" className="space-y-3 scroll-mt-28">
        <span className="text-sm font-medium text-[var(--av-muted)]">API key (stored locally)</span>
        <Input
          type="password"
          className="h-11 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] font-mono text-sm"
          placeholder="••••••••"
          value={cfg.translationApiKey}
          onChange={(e) => void persist({ translationApiKey: e.target.value })}
        />
      </div>
      <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
        When using {APP_DISPLAY_NAME} with a signed-in account, server-side translation may use the server&apos;s
        DeepL key if configured. Keys you enter here stay on this device only.
      </p>
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-xl border-[var(--av-border)] px-5 text-sm"
        onClick={() => {
          void (async () => {
            try {
              const out = await translateText(
                `Hello from ${APP_DISPLAY_NAME}`,
                i18n.language || "en-US",
                cfg.translationProvider,
                cfg.translationApiKey
              );
              setTranslateSample(out);
            } catch (e) {
              setTranslateSample(e instanceof Error ? e.message : "Error");
            }
          })();
        }}
      >
        Test translation
      </Button>
      {translateSample ? <p className="text-sm text-[var(--av-muted)]">{translateSample}</p> : null}
    </>
  );
}
