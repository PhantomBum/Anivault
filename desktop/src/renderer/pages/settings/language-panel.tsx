import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import type { i18n as I18nType } from "i18next";
import React from "react";

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "pt-BR", label: "Português (BR)" },
];

type Props = {
  i18n: I18nType;
};

export function LanguageSettingsPanel({ i18n }: Props) {
  return (
    <div id="settings-language" className="space-y-3 scroll-mt-28">
      <span className="text-sm font-medium text-[var(--av-muted)]">App language</span>
      <Select
        value={i18n.language}
        onValueChange={(lng) => {
          void i18n.changeLanguage(lng);
          localStorage.setItem("i18nLng", lng);
        }}
      >
        <SelectTrigger className="h-12 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((l) => (
            <SelectItem key={l.value} value={l.value}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
