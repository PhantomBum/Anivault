export const SECURITY_GET_STATUS = "security:get-status";
export const SECURITY_UNLOCK = "security:unlock";
export const SECURITY_SET_GATE = "security:set-gate";

export const SECURITY_CHANNELS = {
  GET_STATUS: SECURITY_GET_STATUS,
  UNLOCK: SECURITY_UNLOCK,
  SET_GATE: SECURITY_SET_GATE,
} as const;
