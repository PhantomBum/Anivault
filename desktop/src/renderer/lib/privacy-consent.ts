/**
 * Privacy consent helpers for features that send data off-device.
 * Used by Community, Gallery, and Clips to ensure users understand what leaves the device.
 */

export type PrivacyScope =
  | "local_only"
  | "companion_server"
  | "external_service";

export interface PrivacyInfo {
  scope: PrivacyScope;
  label: string;
  description: string;
}

export const PRIVACY_SCOPES: Record<PrivacyScope, PrivacyInfo> = {
  local_only: {
    scope: "local_only",
    label: "Device only",
    description: "This data stays on your computer. Nothing is sent to any server.",
  },
  companion_server: {
    scope: "companion_server",
    label: "Companion server",
    description:
      "This data is sent to your configured companion server. The server operator controls storage and access.",
  },
  external_service: {
    scope: "external_service",
    label: "External service",
    description:
      "This data is sent to a third-party service outside your control.",
  },
};

export function privacyLabelForFeature(
  feature: "local_threads" | "gallery_upload" | "clip_upload" | "comments" | "ratings" | "reports" | "translation" | "telemetry"
): PrivacyInfo {
  switch (feature) {
    case "local_threads":
      return PRIVACY_SCOPES.local_only;
    case "gallery_upload":
    case "clip_upload":
    case "comments":
    case "ratings":
    case "reports":
      return PRIVACY_SCOPES.companion_server;
    case "translation":
      return PRIVACY_SCOPES.external_service;
    case "telemetry":
      return PRIVACY_SCOPES.external_service;
  }
}

const CONSENT_LS_KEY = "anivault:privacy-consent:v1";

interface ConsentRecord {
  scope: PrivacyScope;
  consentedAt: number;
}

function readConsents(): Record<string, ConsentRecord> {
  try {
    const raw = localStorage.getItem(CONSENT_LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ConsentRecord>;
  } catch {
    return {};
  }
}

export function hasConsented(feature: string): boolean {
  const consents = readConsents();
  return Boolean(consents[feature]);
}

export function recordConsent(feature: string, scope: PrivacyScope): void {
  const consents = readConsents();
  consents[feature] = { scope, consentedAt: Date.now() };
  try {
    localStorage.setItem(CONSENT_LS_KEY, JSON.stringify(consents));
  } catch {
    /* quota */
  }
}

export function revokeConsent(feature: string): void {
  const consents = readConsents();
  delete consents[feature];
  try {
    localStorage.setItem(CONSENT_LS_KEY, JSON.stringify(consents));
  } catch {
    /* quota */
  }
}

export function exportAllConsents(): Record<string, ConsentRecord> {
  return readConsents();
}
